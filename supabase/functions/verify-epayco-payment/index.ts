import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // 2. Parse and validate input
    const { ref_payco } = await req.json();

    if (!ref_payco || typeof ref_payco !== "string") {
      return new Response(JSON.stringify({ success: false, error: "Missing parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate ref_payco format: alphanumeric, dashes, underscores, max 100 chars
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(ref_payco)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid reference format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Verify payment with ePayco API
    const verifyResponse = await fetch(
      `https://secure.epayco.co/validation/v1/reference/${encodeURIComponent(ref_payco)}`,
      { signal: AbortSignal.timeout(10000) }
    );

    const paymentData = await verifyResponse.json();

    if (!paymentData.success || !paymentData.data) {
      return new Response(JSON.stringify({ success: false, error: "Payment verification failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const txStatus = paymentData.data.x_cod_transaction_state;
    // 1 = Aceptada, 2 = Rechazada, 3 = Pendiente, 4 = Fallida
    if (txStatus !== "1") {
      return new Response(JSON.stringify({ success: false, error: "Payment not approved" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Activate subscription using service role key (for DB writes)
    // Calculate period end: same day next calendar month, at 23:59:59 Colombia time (UTC-5).
    // Colombia is UTC-5, so 23:59:59 local = next day 04:59:59 UTC.
    const now = new Date();
    const periodEnd = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() + 1,   // advance one calendar month (JS handles overflow: Jan 31 → Feb 28/29)
        now.getUTCDate(),
        4, 59, 59, 999           // 04:59:59 UTC = 23:59:59 Colombia (UTC-5)
      )
    );

    // Check if subscription exists
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${userId}&select=id`,
      {
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
      }
    );

    const existing = await checkResponse.json();

    if (existing.length > 0) {
      // Update existing subscription
      await fetch(`${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${userId}`, {
        method: "PATCH",
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          status: "active",
          current_period_end: periodEnd.toISOString(),
        }),
      });
    } else {
      // Create new subscription
      await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
        method: "POST",
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          user_id: userId,
          status: "active",
          current_period_end: periodEnd.toISOString(),
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
