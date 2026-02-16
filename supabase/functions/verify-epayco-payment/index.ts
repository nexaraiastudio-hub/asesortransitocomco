import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ref_payco, user_id } = await req.json();

    if (!ref_payco || !user_id) {
      return new Response(JSON.stringify({ success: false, error: "Missing parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify payment with ePayco API
    const verifyResponse = await fetch(
      `https://secure.epayco.co/validation/v1/reference/${ref_payco}`
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

    // Activate subscription in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Calculate period end (30 days from now)
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    // Check if subscription exists
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${user_id}&select=id`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const existing = await checkResponse.json();

    if (existing.length > 0) {
      // Update existing subscription
      await fetch(`${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${user_id}`, {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
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
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          user_id,
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
