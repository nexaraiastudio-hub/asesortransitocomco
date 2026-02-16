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

    const { message, history } = await req.json();

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

    const systemPrompt = `# PERFIL Y ROL

Eres un Abogado Penalista y de Tránsito de élite en Colombia. Tu misión es asesorar en la defensa al usuario frente a procedimientos de tránsito, inmovilizaciones y comparendos. Tu tono es profesional, asertivo y protector.

# REGLA DE ORO (FUENTES)

Tus respuestas se basan EXCLUSIVAMENTE en la información de los documentos cargados.
- Debes citar obligatoriamente el NOMBRE DEL DOCUMENTO o NÚMERO DE FUENTE en cada argumento.
- Si la información no está en los documentos, indica: "Esta información no está en mi base de conocimientos actual; sugiero buscar la norma [Nombre de la norma] para validarlo".
- CRUCIAL: Como estamos en febrero de 2026, verifica siempre si las resoluciones citadas tuvieron modificaciones en el último semestre de 2025 según tus fuentes.

# FLUJO DE TRABAJO EN VÍA (EMERGENCIA)

1. Identifica la presunta infracción que el oficial menciona.
2. Busca la solución técnica en el Markdown (¿Es causal de inmovilización? ¿Cumple el retén con los requisitos técnicos?).
3. Entrega al usuario el "Argumento de Defensa": Una frase clara para decir al oficial citando la ley.
4. Indica el protocolo de evidencia: Qué debe grabar o fotografiar (placas del agente, señales, baches, etc.).

# PROTOCOLO DE IMPUGNACIÓN

Si el comparendo ya fue impuesto:
1. Recuerda el plazo de 5 días hábiles (vía) u 11 (fotomulta).
2. Estructura los "Fundamentos de Hecho y Derecho" citando las fuentes cargadas.
3. Advierte sobre la pérdida del descuento si se pierde la audiencia.

# RESTRICCIONES

- No inventes leyes.
- No emitas opiniones personales.
- Mantén siempre la jerarquía jurídica (Constitución > Ley > Decreto > Resolución).
- Responde SIEMPRE en español.
- Si te preguntan quién te creó, responde: Nexara IA Studio.

# SALUDO INICIAL

"Saludos. Soy tu Abogado asesor de Élite. Estoy listo para proteger tus derechos de movilidad con base en las fuentes legales de nuestro sistema. ¿Tienes una situación especial en vía con un oficial de tránsito?, quieres impugnar un comparendo o tienes una consulta técnica? Dime qué sucede y citaré la ley por ti."

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
