import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SPREADSHEET_ID = "1Fp-40HjLoKKu5_rpxkA5BjbIU4NMI3VWZO7loTvTILg";
const SHEET_NAME = "Usuarios";

// Generate JWT for Google API auth using service account
async function getGoogleAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key
  const pemContents = serviceAccount.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const jwt = `${unsignedToken}.${sigB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

async function getSheetData(accessToken: string): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  return data.values || [];
}

async function updateSheet(accessToken: string, range: string, values: string[][]) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sheets API error: ${err}`);
  }
}

async function appendToSheet(accessToken: string, values: string[][]) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sheets append error: ${err}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check - only admins can trigger sync
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
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

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Google service account credentials from individual secrets
    const clientEmail = Deno.env.get("GOOGLE_SA_CLIENT_EMAIL");
    const privateKey = Deno.env.get("GOOGLE_SA_PRIVATE_KEY");
    if (!clientEmail || !privateKey) {
      throw new Error("GOOGLE_SA_CLIENT_EMAIL or GOOGLE_SA_PRIVATE_KEY not configured");
    }
    console.log("Client email length:", clientEmail.length);
    console.log("Private key length:", privateKey.length);
    
    // Build service account object from individual secrets
    const serviceAccount = {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, "\n"),
    };

    // Get access token
    const accessToken = await getGoogleAccessToken(serviceAccount);

    // Fetch all users with subscriptions from DB
    const { data: users, error: usersError } = await supabaseAdmin.rpc("admin_get_all_users");
    if (usersError) throw usersError;

    // Prepare headers
    const headers = [
      "Nombre", "Correo", "Fecha Registro", "Rol",
      "Estado Suscripción", "Fecha Fin Suscripción", "Valor Pagado"
    ];

    // Get existing sheet data
    const existingData = await getSheetData(accessToken);

    // If sheet is empty, add headers first
    if (existingData.length === 0) {
      await appendToSheet(accessToken, [headers]);
    }

    // Build email-to-row map from existing sheet (skip header)
    const emailRowMap = new Map<string, number>();
    for (let i = 1; i < existingData.length; i++) {
      const email = existingData[i]?.[1];
      if (email) emailRowMap.set(email, i + 1); // 1-indexed for Sheets
    }

    // Process each user
    const newRows: string[][] = [];

    for (const u of users || []) {
      const row = [
        u.full_name || "",
        u.email || "",
        u.created_at ? new Date(u.created_at).toLocaleDateString("es-CO") : "",
        u.role || "user",
        u.subscription_status === "active" ? "Activa" : u.subscription_status === "none" ? "Sin suscripción" : u.subscription_status || "",
        u.subscription_end ? new Date(u.subscription_end).toLocaleDateString("es-CO") : "",
        u.subscription_status === "active" ? "$49.900" : "",
      ];

      const existingRow = emailRowMap.get(u.email);
      if (existingRow) {
        // Update existing row
        await updateSheet(accessToken, `${SHEET_NAME}!A${existingRow}:G${existingRow}`, [row]);
      } else {
        newRows.push(row);
      }
    }

    // Append new rows
    if (newRows.length > 0) {
      await appendToSheet(accessToken, newRows);
    }

    return new Response(
      JSON.stringify({ success: true, synced: (users || []).length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
