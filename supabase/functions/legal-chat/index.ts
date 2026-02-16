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
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // TEMPORAL: Verificación de suscripción desactivada para pruebas
    // const { data: hasSubscription } = await supabaseClient.rpc("has_active_subscription", {
    //   _user_id: userId,
    // });
    // if (!hasSubscription) {
    //   return new Response(JSON.stringify({ error: "Active subscription required" }), {
    //     status: 403,
    //     headers: { ...corsHeaders, "Content-Type": "application/json" },
    //   });
    // }

    const { message } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "No message provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Search for relevant documents based on the user's message keywords
    const keywords = message.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3).slice(0, 5);
    
    const docsResponse = await fetch(`${supabaseUrl}/rest/v1/knowledge_documents?select=title,content`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    const documents = await docsResponse.json();
    
    // Score and rank documents by relevance to the query
    const scoredDocs = documents.map((doc: any) => {
      const text = `${doc.title} ${doc.content}`.toLowerCase();
      const score = keywords.reduce((acc: number, kw: string) => acc + (text.includes(kw) ? 1 : 0), 0);
      return { ...doc, score };
    });
    
    // Take top relevant documents, limiting total size to ~80k chars
    const sortedDocs = scoredDocs.sort((a: any, b: any) => b.score - a.score);
    let totalChars = 0;
    const maxChars = 80000;
    const selectedDocs: any[] = [];
    for (const doc of sortedDocs) {
      if (doc.score === 0 && selectedDocs.length > 0) break;
      if (totalChars + doc.content.length > maxChars) break;
      selectedDocs.push(doc);
      totalChars += doc.content.length;
    }
    
    const knowledgeBase = selectedDocs
      .map((doc: any) => `## ${doc.title}\n${doc.content}`)
      .join("\n\n---\n\n");

    // Call Google Gemini API
    const GOOGLE_GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GOOGLE_GEMINI_API_KEY) {
      throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
    }

    const systemInstruction = `Actúa como un Asistente Legal IA especializado en Tránsito en Colombia. Tu única fuente de verdad y conocimiento es la base de conocimientos proporcionada a continuación.

REGLAS CRÍTICAS DE RESPUESTA:

1. PROHIBICIÓN DE BÚSQUEDA EXTERNA: No utilices tu entrenamiento general ni busques en internet. Si la respuesta no está en la base de conocimientos, debes responder exactamente: "Lo siento, como asistente especializado, solo puedo responder basándome en la base de conocimientos oficial. No encuentro información sobre ese caso específico en mis registros."
2. ESTRICTAMENTE COLOMBIA: Ignora cualquier normativa que no sea la colombiana mencionada en la base de conocimientos.
3. NO INVENTAR: Tienes prohibido inferir o suponer soluciones legales que no estén explícitamente escritas en la base de conocimientos.
4. FORMATO: Responde de manera clara, profesional y concisa, citando siempre que sea posible el artículo o sección donde encontraste la información.
5. IDENTIDAD: Recuerda que eres un asesor informativo de la plataforma, no un abogado defensor en juicio.
6. Responde SIEMPRE en español.

FLUJO DE TRABAJO:
- Paso 1: Lee la consulta del usuario.
- Paso 2: Escanea la base de conocimientos proporcionada.
- Paso 3: Si la información existe, entrégala citando la fuente. De lo contrario, admite que no está en la base de datos.

BASE DE CONOCIMIENTO LEGAL:
${knowledgeBase}`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: message }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2000,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errText);
      throw new Error(`Gemini API call failed: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const response = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "No pude generar una respuesta.";

    return new Response(JSON.stringify({ response }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in legal-chat:", error);
    return new Response(
      JSON.stringify({ error: "Error procesando la consulta" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
