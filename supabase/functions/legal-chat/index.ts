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

    const systemInstruction = `# PERFIL Y ROL

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

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
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
