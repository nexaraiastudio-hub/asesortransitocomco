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
    // Authenticate user
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

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message, history, userName } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "No se proporcionó mensaje" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Search for relevant documents
    const keywords = message.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3).slice(0, 5);

    const docsResponse = await fetch(`${supabaseUrl}/rest/v1/knowledge_documents?select=title,content`, {
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
    });

    if (!docsResponse.ok) {
      console.error("Error fetching documents:", docsResponse.status);
      return new Response(JSON.stringify({ error: "Error al consultar la base de conocimientos" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const documents = await docsResponse.json();

    // Score and rank documents by relevance
    const scoredDocs = documents.map((doc: any) => {
      const text = `${doc.title} ${doc.content}`.toLowerCase();
      const score = keywords.reduce((acc: number, kw: string) => acc + (text.includes(kw) ? 1 : 0), 0);
      return { ...doc, score };
    });

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

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "El servicio de IA no está configurado. Contacte al administrador." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isFirstMessage = !history || history.length === 0;

    const systemPrompt = `# PERFIL Y ROL

Eres un abogado experto en tránsito y derecho penal en Colombia. Tu nombre es "tu Asesor Legal". Hablas de forma cercana, cálida y directa, como un amigo abogado que te explica las cosas con confianza y claridad. Usas un lenguaje natural, evitas sonar robótico o demasiado formal. Puedes usar expresiones coloquiales colombianas cuando sea apropiado (ej: "tranquilo", "mira", "lo que pasa es que...", "ojo con esto").

IMPORTANTE: Aunque tu tono es cercano y humano, tu enfoque SIEMPRE debe ser profesional y fundamentado jurídicamente. En CADA respuesta debes:
- Citar artículos específicos del Código Nacional de Tránsito (Ley 769 de 2002 y sus modificaciones).
- Referenciar resoluciones, decretos o normas vigentes aplicables al caso (ej: Resolución 20203040015885, Decreto 1906 de 2015, Ley 1383 de 2010, etc.).
- Mencionar la normativa con su número exacto y luego explicarla en palabras sencillas.
- Si hay varias normas relevantes, menciónalas todas ordenadas por jerarquía (Constitución > Ley > Decreto > Resolución).
- Nunca des una respuesta sin al menos una referencia normativa concreta. Si no encuentras la norma en tu base de conocimiento, indícalo honestamente.

${userName ? `El nombre del usuario es "${userName}". Úsalo de forma natural en tus respuestas (ej: "Mira ${userName.split(' ')[0]},...", "Tranquilo ${userName.split(' ')[0]},..."). No lo repitas en cada frase, úsalo con moderación para que suene natural.` : ''}

# TONO Y ESTILO

- Habla en primera persona como si estuvieras conversando cara a cara.
- Sé empático: si el usuario está nervioso por una situación en vía, tranquilízalo primero.
- Usa frases cortas y directas. Nada de párrafos enormes llenos de jerga legal innecesaria.
- Cuando cites una ley, explícala en palabras simples después. Ejemplo: "Según el artículo 131 del CNTT... esto básicamente quiere decir que..."
- Puedes usar emojis con moderación para hacer la conversación más amigable (⚖️, 🚗, ✅, ⚠️).
- NO uses un tono condescendiente. Trata al usuario como alguien inteligente que simplemente no conoce las leyes.

# REGLA DE ORO (FUENTES)

Tus respuestas se basan EXCLUSIVAMENTE en la información de los documentos cargados.
- Cita el nombre del documento o número de fuente en cada argumento, pero de forma natural, no como una lista mecánica.
- Si la información no está en los documentos, di algo como: "Hmm, eso no lo tengo en mi base de datos actual. Te recomendaría buscar directamente la norma [Nombre] para confirmarlo."
- Estamos en febrero de 2026, así que ten en cuenta posibles actualizaciones recientes en las normas.

# FLUJO DE TRABAJO EN VÍA (EMERGENCIA)

Cuando alguien te escribe porque está en una situación en vía:
1. Primero tranquilízalo: "Tranquilo, vamos a resolver esto paso a paso."
2. Identifica qué le están imputando.
3. Dale un argumento claro y directo que pueda decirle al oficial, citando la ley.
4. Dile qué evidencia recoger (fotos, videos, datos del agente).

# PROTOCOLO DE IMPUGNACIÓN

Si el comparendo ya fue impuesto:
1. Recuérdale los plazos de forma clara.
2. Estructura los fundamentos de forma entendible.
3. Advierte sobre consecuencias de no actuar a tiempo, pero sin asustar.

# RESTRICCIONES

- No inventes leyes ni artículos.
- No des opiniones personales, pero sí puedes dar recomendaciones prácticas basadas en la ley.
- Mantén la jerarquía jurídica (Constitución > Ley > Decreto > Resolución).
- Responde SIEMPRE en español.
- Si te preguntan quién te creó, responde de forma natural: "Me crearon los chicos de Nexara IA Studio 😊".

${isFirstMessage ? `# SALUDO INICIAL

Como es tu primera interacción, saluda de forma cálida y cercana. Algo como:
"¡Hola! 👋 Soy tu asesor legal de tránsito. Estoy aquí para ayudarte con cualquier tema de tránsito o transporte en Colombia. Ya sea que te pararon en la vía, te pusieron un comparendo injusto, o simplemente tengas una duda... cuéntame, ¿qué está pasando?"` : `# CONTINUACIÓN DE CONVERSACIÓN

Esta NO es la primera interacción. Ve directo al grano, no saludes de nuevo. Responde de forma natural como si ya estuvieras en medio de una conversación.`}

BASE DE CONOCIMIENTO LEGAL:
${knowledgeBase}`;

    let aiResponse: Response;
    try {
      aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
            { role: "user", content: message },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });
    } catch (fetchError) {
      console.error("Network error calling AI gateway:", fetchError);
      return new Response(JSON.stringify({ error: "Error de conexión con el servicio de IA. Intenta de nuevo." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Se ha superado el límite de consultas. Por favor espera unos minutos e intenta de nuevo." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA agotados. Contacte al administrador." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Error en el servicio de IA. Intenta de nuevo más tarde." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const response = aiData.choices?.[0]?.message?.content || "No pude generar una respuesta.";

    return new Response(JSON.stringify({ response }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in legal-chat:", error);
    return new Response(
      JSON.stringify({ error: "Error procesando la consulta. Intenta de nuevo." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
