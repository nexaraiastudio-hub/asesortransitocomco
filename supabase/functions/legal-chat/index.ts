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
    const { message } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "No message provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get knowledge documents from database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const docsResponse = await fetch(`${supabaseUrl}/rest/v1/knowledge_documents?select=title,content`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    const documents = await docsResponse.json();
    const knowledgeBase = documents
      .map((doc: any) => `## ${doc.title}\n${doc.content}`)
      .join("\n\n---\n\n");

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Eres un abogado experto en tránsito y transporte en Colombia. REGLAS ESTRICTAS:

1. SOLO puedes responder usando la información de la base de conocimiento proporcionada a continuación.
2. Si la pregunta NO se puede responder con la información proporcionada, responde: "No tengo información sobre ese tema en mi base de datos legal. Te recomiendo consultar directamente con un abogado especializado."
3. Cita los artículos y leyes específicas cuando sea posible.
4. Sé profesional, claro y conciso.
5. Responde SIEMPRE en español.
6. NO inventes información que no esté en la base de conocimiento.

BASE DE CONOCIMIENTO LEGAL:
${knowledgeBase}`,
          },
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API call failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const response = aiData.choices?.[0]?.message?.content || "No pude generar una respuesta.";

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
