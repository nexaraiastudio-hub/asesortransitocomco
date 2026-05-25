// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── 1. Autenticación ──────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verificar usuario mediante JWT (usar getUser, no getClaims)
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ success: false, error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // ── 2. Calcular fecha de expiración de la suscripción ─────────────────
    // Mismo día del mes siguiente a las 23:59:59 hora Colombia (UTC-5 = 04:59:59 UTC).
    const now = new Date();
    const periodEnd = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() + 1, // JS maneja desbordamiento automáticamente
        now.getUTCDate(),
        4, 59, 59, 999          // 04:59:59 UTC = 23:59:59 Colombia (UTC-5)
      )
    );

    // ── 3. Insertar o actualizar suscripción ──────────────────────────────
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: existing, error: checkError } = await serviceClient
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (checkError) {
      console.error("[grant-premium] Error chequeando suscripción:", checkError);
      return new Response(JSON.stringify({ success: false, error: "Error interno" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (existing) {
      const { error: updateError } = await serviceClient
        .from("subscriptions")
        .update({
          status: "active",
          current_period_end: periodEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("[grant-premium] Error actualizando suscripción:", updateError);
        return new Response(JSON.stringify({ success: false, error: "Error al actualizar suscripción" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      const { error: insertError } = await serviceClient
        .from("subscriptions")
        .insert({
          user_id: userId,
          status: "active",
          current_period_end: periodEnd.toISOString(),
        });

      if (insertError) {
        console.error("[grant-premium] Error insertando suscripción:", insertError);
        return new Response(JSON.stringify({ success: false, error: "Error al crear suscripción" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.log(`[grant-premium] Suscripción activada para usuario ${userId} hasta ${periodEnd.toISOString()}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[grant-premium] Error inesperado:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
