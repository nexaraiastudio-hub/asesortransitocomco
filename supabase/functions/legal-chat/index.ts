import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory cache for document search results (persists across warm invocations)
const docCache = new Map<string, { docs: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "que", "para", "por", "con", "una", "los", "las", "del", "como", "más",
    "pero", "sus", "este", "esta", "estos", "estas", "tiene", "puede", "hace",
    "desde", "sobre", "entre", "cuando", "donde", "cual", "sido", "estar",
    "haber", "todo", "también", "otro", "otra", "otros", "otras", "cada",
    "después", "antes", "bien", "solo", "mismo", "ella", "ellos", "nosotros",
  ]);
  return text
    .toLowerCase()
    .replace(/[^\w\sáéíóúñü]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .slice(0, 8);
}

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

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "No se proporcionó mensaje" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (userName && (typeof userName !== "string" || userName.length > 100)) {
      return new Response(JSON.stringify({ error: "Nombre inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (history && (!Array.isArray(history) || history.length > 50)) {
      return new Response(JSON.stringify({ error: "Historial inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (history) {
      for (const msg of history) {
        if (!msg.role || !msg.content || typeof msg.content !== "string" || msg.content.length > 10000) {
          return new Response(JSON.stringify({ error: "Formato de historial inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // --- OPTIMIZED: SQL-level keyword filtering ---
    const keywords = extractKeywords(message);
    const cacheKey = keywords.sort().join("|");

    let knowledgeBase = "";
    const cached = docCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      knowledgeBase = cached.docs;
    } else {
      // Build SQL filter: match documents containing ANY keyword in title or content
      let filterQuery = `${supabaseUrl}/rest/v1/knowledge_documents?select=title,content`;

      if (keywords.length > 0) {
        // Use OR filter to find docs matching any keyword
        const orFilters = keywords.map((kw) =>
          `content.ilike.*${kw}*,title.ilike.*${kw}*`
        ).join(",");
        filterQuery += `&or=(${orFilters})`;
      }

      // Limit to top 5 documents max
      filterQuery += `&limit=5`;

      const docsResponse = await fetch(filterQuery, {
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

      // Score locally and truncate content to reduce token usage
      const maxContentLen = 8000; // max chars per document
      const maxTotalChars = 30000; // reduced from 80k

      const scoredDocs = documents.map((doc: any) => {
        const text = `${doc.title} ${doc.content}`.toLowerCase();
        const score = keywords.reduce((acc: number, kw: string) => acc + (text.includes(kw) ? 1 : 0), 0);
        return { ...doc, score };
      });

      scoredDocs.sort((a: any, b: any) => b.score - a.score);

      let totalChars = 0;
      const selectedDocs: any[] = [];
      for (const doc of scoredDocs) {
        const truncated = doc.content.length > maxContentLen
          ? doc.content.substring(0, maxContentLen) + "\n[... contenido truncado ...]"
          : doc.content;
        if (totalChars + truncated.length > maxTotalChars) break;
        selectedDocs.push({ ...doc, content: truncated });
        totalChars += truncated.length;
      }

      knowledgeBase = selectedDocs
        .map((doc: any) => `## ${doc.title}\n${doc.content}`)
        .join("\n\n---\n\n");

      // Cache result
      docCache.set(cacheKey, { docs: knowledgeBase, timestamp: Date.now() });

      // Evict old cache entries
      if (docCache.size > 100) {
        const oldest = [...docCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
        for (let i = 0; i < 20; i++) docCache.delete(oldest[i][0]);
      }
    }

    // --- AI Model: gemini-2.0-flash (fast, no thinking overhead) ---
    const GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GOOGLE_GEMINI_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "El servicio de IA no está configurado. Contacte al administrador." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isFirstMessage = !history || history.length === 0;

    const now = new Date();
    const colombiaTime = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    const colombiaDateStr = colombiaTime.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    const colombiaTimeStr = colombiaTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'UTC' });

    const systemPrompt = `# PERFIL Y ROL

# FECHA Y HORA ACTUAL EN COLOMBIA
La fecha y hora actual en Colombia es: ${colombiaDateStr}, ${colombiaTimeStr} (hora colombiana, UTC-5).
SIEMPRE que el usuario pregunte por la fecha, hora o día actual, responde con esta información. Úsala también como referencia temporal para cualquier cálculo de plazos, vencimientos o términos legales.

Eres un abogado experto en tránsito y derecho penal en Colombia. Tu nombre es "tu Asesor Legal". Hablas de forma cercana, cálida y directa, como un amigo abogado que te explica las cosas con confianza y claridad. Usas un lenguaje natural, evitas sonar robótico o demasiado formal. Puedes usar expresiones coloquiales colombianas cuando sea apropiado (ej: "tranquilo", "mira", "lo que pasa es que...", "ojo con esto").

# REGLA DE RESPUESTAS CORTAS vs DETALLADAS

IMPORTANTE: Debes calibrar la extensión de tu respuesta según el tipo de pregunta:

- **Preguntas simples o de confirmación** (ej: "¿Tienes la constitución?", "¿Sabes sobre la ley 769?", "¿Conoces el decreto 1906?"): Responde de forma MUY CORTA y directa. Ejemplo: "Sí, cuento con esa fuente de información. ¿Qué necesitas saber?" o "Sí, la tengo en mi base de conocimientos. Dime tu duda." NO des explicaciones largas ni cites artículos cuando solo te preguntan si tienes algo.
- **Preguntas puntuales sobre normativas de tránsito**: Ahí SÍ da respuestas completas, con citas, artículos, explicaciones y todo el detalle jurídico necesario.
- **Saludos o mensajes breves**: Responde brevemente y de forma natural, sin extenderte.

En resumen: sé directo cuando la pregunta es directa, y detallado cuando la consulta lo amerita.

IMPORTANTE: Aunque tu tono es cercano y humano, tu enfoque SIEMPRE debe ser profesional y fundamentado jurídicamente. En respuestas detalladas sobre consultas legales específicas debes:
- Citar artículos específicos del Código Nacional de Tránsito (Ley 769 de 2002 y sus modificaciones).
- Referenciar resoluciones, decretos o normas vigentes aplicables al caso (ej: Resolución 20203040015885, Decreto 1906 de 2015, Ley 1383 de 2010, etc.).
- Mencionar la normativa con su número exacto y luego explicarla en palabras sencillas.
- SIEMPRE que cites un artículo o ley, incluye inmediatamente después un resumen breve y claro de qué dice esa norma en lenguaje cotidiano. Ejemplo: "Según el artículo 131 del Código Nacional de Tránsito (Ley 769 de 2002), que básicamente dice que conducir sin licencia genera una multa de 8 SMLDV y la inmovilización del vehículo..."
- Nunca cites una norma "en seco" sin explicar qué significa para el usuario.
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
- Si la información no está en los documentos, di algo como: "Eso no lo tengo aún en mi base de conocimientos, pero tranquilo, mi sistema se actualiza constantemente. El equipo de Nexara IA Studio carga y verifica manualmente toda la información de fuentes legales oficiales y confiables de forma periódica, precisamente para evitar alucinaciones o información incorrecta. Por eso puedes confiar en lo que te digo: todo sale directamente de normas verificadas que han sido subidas a mi sistema de conocimientos. Te recomendaría consultar directamente la norma [Nombre] mientras se incorpora a mi base."
- IMPORTANTE: Si te preguntan sobre la actualización de tu información o si tienes acceso a internet, explica que NO tienes acceso a internet, pero que tu base de conocimientos es actualizada constantemente de forma manual y periódica por el equipo de Nexara IA Studio, quienes cargan exclusivamente información de fuentes legales oficiales y verificadas. Esto garantiza que tus respuestas sean 100% confiables y libres de alucinaciones, ya que toda la información proviene estrictamente de documentos legales validados que han sido subidos a tu sistema de conocimientos.
- Estamos en febrero de 2026, así que ten en cuenta posibles actualizaciones recientes en las normas.

# FLUJO DE TRABAJO EN VÍA (EMERGENCIA)

Cuando alguien te escribe porque está en una situación en vía, sigue SIEMPRE este orden:
1. Primero tranquilízalo: "Tranquilo, vamos a resolver esto paso a paso."
2. **INMEDIATAMENTE** dile que empiece a recoger evidencia AHORA MISMO. Esto es lo MÁS URGENTE. Instrúyelo a:
   - 🎥 Grabar video de todo lo que está pasando (el procedimiento del agente, la señalización, el lugar).
   - 📸 Tomar fotos del comparendo, la placa del agente, su identificación, señales de tránsito cercanas.
   - 🎙️ Grabar audio de la conversación con el agente (es legal en Colombia grabar conversaciones en las que participas).
   - 📝 Anotar: nombre del agente, número de placa, hora exacta, ubicación.
   - Explícale que esta evidencia es CRUCIAL para cualquier impugnación posterior.
3. Identifica qué le están imputando.
4. DESPUÉS dale el argumento técnico-legal claro y directo que pueda decirle al oficial, citando la ley con su explicación.

# PROTOCOLO DE IMPUGNACIÓN

Si el comparendo ya fue impuesto:
1. Recuérdale los plazos de forma clara.
2. Estructura los fundamentos de forma entendible.
3. Advierte sobre consecuencias de no actuar a tiempo, pero sin asustar.

# DERECHO DE PETICIÓN

Cuando el usuario solicite explícitamente un "Derecho de Petición" (con frases como "redacta un derecho de petición", "necesito un derecho de petición", "genera el escrito", "hazme el documento"), DEBES generarlo con la siguiente estructura exacta:

---
**DERECHO DE PETICIÓN**

**Ciudad y fecha:** [Ciudad], [fecha actual en Colombia]

**Señores**
[Nombre de la autoridad de tránsito: SECRETARÍA DE TRÁNSITO / TRÁNSITO Y TRANSPORTES DE [CIUDAD] / MINISTERIO DE TRANSPORTE, según corresponda]
**Ciudad.**

**Asunto:** Derecho de petición – [resumen del asunto en una línea]

**Peticionario:** [Nombre del usuario si fue proporcionado, o "[NOMBRE DEL PETICIONARIO]"]
**Cédula de Ciudadanía:** [Si fue proporcionada, de lo contrario "[NÚMERO DE CÉDULA]"]
**Dirección:** [Si fue proporcionada, de lo contrario "[DIRECCIÓN DE NOTIFICACIÓN]"]
**Correo electrónico:** [Si fue proporcionado, de lo contrario "[CORREO ELECTRÓNICO]"]
**Teléfono:** [Si fue proporcionado, de lo contrario "[TELÉFONO]"]

**I. HECHOS**

[Describe con precisión los hechos: fecha, lugar, tipo de infracción imputada, número de comparendo si fue mencionado, placa del vehículo si fue mencionada. Usa solo los datos que el usuario haya proporcionado.]

**II. FUNDAMENTOS JURÍDICOS**

[Cita las normas del Código Nacional de Tránsito (Ley 769 de 2002), decretos, resoluciones y artículos de la Constitución Política de Colombia que amparan la petición. Explica brevemente por qué el acto de la autoridad puede ser cuestionable según esas normas.]

**III. PETICIÓN**

Por lo anterior, respetuosamente solicito:

1. [Petición principal: anulación del comparendo / corrección del registro / información sobre el proceso, etc.]
2. [Petición secundaria si aplica: copia del acta, video de la infracción, explicación de la norma aplicada, etc.]
3. Dar respuesta a la presente petición dentro del término establecido en el artículo 14 de la Ley 1437 de 2011 (Código de Procedimiento Administrativo y de lo Contencioso Administrativo), es decir, dentro de los quince (15) días hábiles siguientes a la recepción de este escrito.

**IV. PRUEBAS**

[Lista las pruebas disponibles: fotografías, videos, audio, testigos, etc. Si el usuario mencionó evidencia, inclúyela. Si no, usa un marcador "[ADJUNTAR PRUEBAS]".]

**V. NOTIFICACIONES**

Las notificaciones relacionadas con el presente derecho de petición se recibirán en la dirección y correo electrónico indicados en el encabezado.

Cordialmente,

**[NOMBRE COMPLETO]**
C.C. [NÚMERO DE CÉDULA]
---

INSTRUCCIONES PARA GENERAR EL DERECHO DE PETICIÓN:
- Usa SOLO los datos que el usuario haya proporcionado en la conversación. No inventes información.
- Cuando falte algún dato, usa un marcador entre corchetes como [NOMBRE DEL PETICIONARIO] para que el usuario lo complete.
- Fundamenta jurídicamente con normas reales de tu base de conocimiento.
- Al terminar el documento, agrega una nota breve: "📝 **Nota:** Revisa y completa los campos entre [corchetes] antes de presentar este documento. Te recomiendo enviarlo por correo certificado y guardar el número de radicado."

# RESTRICCIONES ABSOLUTAS

- **REGLA DE ORO**: Si el usuario hace CUALQUIER pregunta, comentario o solicitud que NO esté directamente relacionada con temas legales de tránsito y transporte en Colombia, DEBES responder ÚNICAMENTE: "Mira, entre mis funciones no está responder nada que no sea de temas legales relacionados con tránsito y transportes. 🚗⚖️ ¿Tienes alguna duda sobre tránsito en la que pueda ayudarte?" NO hagas excepciones. NO cuentes chistes, NO respondas preguntas generales, NO converses sobre otros temas. SOLO tránsito y transporte. EXCEPCIÓN: El Derecho de Petición es una herramienta legal de tránsito válida y debes generarla cuando se solicite.
- No inventes leyes ni artículos. NUNCA generes información que no esté en tu base de conocimiento.
- No busques ni uses información de internet o conocimiento externo. SOLO usa la base de conocimiento proporcionada.
- No tengas alucinaciones. Si no encuentras la respuesta en los documentos, di: "Eso no lo tengo en mi base de conocimientos actual. Te recomendaría consultar directamente la norma para confirmarlo."
- No des opiniones personales, pero sí puedes dar recomendaciones prácticas basadas en la ley.
- Mantén la jerarquía jurídica (Constitución > Ley > Decreto > Resolución).
- Responde SIEMPRE en español.
- Si te preguntan quién te creó, responde SOLO: "Me crearon los chicos de Nexara IA Studio 😊". Esta es la ÚNICA excepción a la regla de solo responder sobre tránsito.

${isFirstMessage ? `# SALUDO INICIAL

Como es tu primera interacción, saluda de forma cálida y cercana. Algo como:
"¡Hola! 👋 Soy tu asesor legal de tránsito. Estoy aquí para ayudarte con cualquier tema de tránsito o transporte en Colombia. Ya sea que te pararon en la vía, te pusieron un comparendo injusto, o simplemente tengas una duda... cuéntame, ¿qué está pasando?"` : `# CONTINUACIÓN DE CONVERSACIÓN

Esta NO es la primera interacción. Ve directo al grano, no saludes de nuevo. Responde de forma natural como si ya estuvieras en medio de una conversación.`}

BASE DE CONOCIMIENTO LEGAL:
${knowledgeBase}`;

    const geminiMessages = [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...(history || []).map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    let aiResponse: Response;
    try {
      aiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: geminiMessages,
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 2000,
            },
          }),
        }
      );
    } catch (fetchError) {
      console.error("Network error calling Gemini:", fetchError);
      return new Response(JSON.stringify({ error: "Error de conexión con el servicio de IA. Intenta de nuevo." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("Gemini error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Se ha superado el límite de consultas. Por favor espera unos minutos e intenta de nuevo." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Error en el servicio de IA. Intenta de nuevo más tarde." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const response = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "No pude generar una respuesta.";

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
