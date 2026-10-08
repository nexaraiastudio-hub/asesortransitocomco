import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

const REVENUECAT_WEBHOOK_AUTH = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");

function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!REVENUECAT_WEBHOOK_AUTH || !authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "").trim();
  if (!secureCompare(token, REVENUECAT_WEBHOOK_AUTH)) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
  }

  let payload;
  try {
    payload = await req.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: "JSON inválido" }), { status: 400 });
  }

  const event = payload.event;
  if (!event || !event.id || !event.app_user_id || !event.type || !event.event_timestamp_ms) {
    return new Response(JSON.stringify({ error: "Payload incompleto" }), { status: 400 });
  }

  const eventId = event.id;
  const userId = event.app_user_id;
  const eventType = event.type;
  const eventTimestampMs = parseInt(event.event_timestamp_ms, 10);
  const expirationMs = event.expiration_at_ms ? parseInt(event.expiration_at_ms, 10) : null;
  const expirationDate = expirationMs ? new Date(expirationMs).toISOString() : null;

  // OBJETIVO 6 y 7: Semántica de Estados
  let newStatus = 'inactive';
  if (["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION", "NON_RENEWING_PURCHASE"].includes(eventType)) {
    newStatus = 'active';
  } else if (eventType === "CANCELLATION") {
    newStatus = 'active'; // Vigencia se delega a current_period_end
  } else if (eventType === "EXPIRATION") {
    newStatus = 'expired';
  } else if (eventType === "BILLING_ISSUE") {
    newStatus = 'past_due'; // Vigencia se delega a current_period_end
  } else if (eventType === "SUBSCRIPTION_PAUSED") {
    newStatus = 'paused';
  } else {
    return new Response(JSON.stringify({ success: true, message: "Evento ignorado" }), { status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // OBJETIVO 1, 2, 4: Llamada atómica al RPC
    const { data, error: rpcError } = await supabase.rpc("process_revenuecat_event", {
      p_event_id: eventId,
      p_type: eventType,
      p_app_user_id: userId,
      p_event_timestamp_ms: eventTimestampMs,
      p_expiration_date: expirationDate,
      p_new_status: newStatus
    });

    // OBJETIVO 3: Rollback. 
    // Si la DB tira error (por ejemplo, app_user_id no existe), el RPC hizo rollback internamente
    // y lanzará una excepción aquí que devolverá status 500 para permitir retries desde RevenueCat.
    if (rpcError) throw rpcError;

    // data es el JSONB retornado: {"success": true, "message": "..."}
    console.log("[RevenueCat] Resultado:", data);
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error("[RevenueCat] Error procesando evento atómico:", error);
    return new Response(JSON.stringify({ error: "Error de procesamiento" }), { status: 500 });
  }
});
