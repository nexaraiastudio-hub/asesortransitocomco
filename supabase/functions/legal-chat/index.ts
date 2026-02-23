import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const docCache = new Map<string, { docs: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "que", "para", "por", "con", "una", "los", "las", "del", "como", "más",
    "pero", "sus", "este", "esta", "estos", "estas", "tiene", "puede", "hace",
    "desde", "sobre", "entre", "cuando", "donde", "cual", "sido", "estar",
    "haber", "todo", "también", "otro", "otra", "otros", "otras", "cada",
    "después", "antes", "bien", "solo", "mismo", "ella", "ellos", "nosotros",
    "hola", "dime", "quiero", "saber", "puedo", "hacer", "tengo", "necesito",
  ]);
  return text
    .toLowerCase()
    .replace(/[^\w\sáéíóúñü]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .slice(0, 12);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // --- Smart keyword-based document retrieval with generous excerpts ---
    const keywords = extractKeywords(message);
    const cacheKey = keywords.sort().join("|");

    let knowledgeBase = "";
    const cached = docCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      knowledgeBase = cached.docs;
    } else {
      let filterQuery = `${supabaseUrl}/rest/v1/knowledge_documents?select=title,content`;

      if (keywords.length > 0) {
        const orFilters = keywords.map((kw) =>
          `content.ilike.*${kw}*,title.ilike.*${kw}*`
        ).join(",");
        filterQuery += `&or=(${orFilters})`;
      }

      filterQuery += `&limit=15`;

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

      // Extract generous excerpts around keyword matches
      const excerptRadius = 3000; // 3000 chars before and after each match
      const maxTotalChars = 800000; // ~200k tokens, well within 1M limit

      const allExcerpts: { title: string; excerpt: string; score: number }[] = [];

      for (const doc of documents) {
        const contentLower = doc.content.toLowerCase();
        const matchPositions: number[] = [];

        for (const kw of keywords) {
          let pos = 0;
          while ((pos = contentLower.indexOf(kw, pos)) !== -1) {
            matchPositions.push(pos);
            pos += kw.length;
          }
        }

        if (matchPositions.length === 0) {
          // Title match only - include generous beginning
          allExcerpts.push({
            title: doc.title,
            excerpt: doc.content.substring(0, 10000),
            score: 0.5,
          });
          continue;
        }

        // Merge overlapping regions
        matchPositions.sort((a, b) => a - b);
        const regions: { start: number; end: number }[] = [];
        for (const pos of matchPositions) {
          const start = Math.max(0, pos - excerptRadius);
          const end = Math.min(doc.content.length, pos + excerptRadius);
          if (regions.length > 0 && start <= regions[regions.length - 1].end) {
            regions[regions.length - 1].end = Math.max(regions[regions.length - 1].end, end);
          } else {
            regions.push({ start, end });
          }
        }

        // For highly relevant docs (many matches), include more content
        const maxRegions = matchPositions.length > 5 ? 10 : 5;
        const excerptParts = regions.slice(0, maxRegions).map((r) => {
          const prefix = r.start > 0 ? "..." : "";
          const suffix = r.end < doc.content.length ? "..." : "";
          return prefix + doc.content.substring(r.start, r.end) + suffix;
        });

        allExcerpts.push({
          title: doc.title,
          excerpt: excerptParts.join("\n\n"),
          score: matchPositions.length,
        });
      }

      // Sort by relevance
      allExcerpts.sort((a, b) => b.score - a.score);

      let totalChars = 0;
      const selectedExcerpts: string[] = [];
      for (const item of allExcerpts) {
        if (totalChars + item.excerpt.length > maxTotalChars) break;
        selectedExcerpts.push(`## ${item.title}\n${item.excerpt}`);
        totalChars += item.excerpt.length;
      }

      knowledgeBase = selectedExcerpts.join("\n\n---\n\n");

      docCache.set(cacheKey, { docs: knowledgeBase, timestamp: Date.now() });

      if (docCache.size > 100) {
        const oldest = [...docCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
        for (let i = 0; i < 20; i++) docCache.delete(oldest[i][0]);
      }
    }

    console.log(`Knowledge base size: ${knowledgeBase.length} chars for keywords: [${keywords.join(", ")}]`);

    // --- AI via Lovable AI Gateway ---
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
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
- SIEMPRE que cites un artículo o ley, incluye inmediatamente después un resumen breve y claro de qué dice esa norma en lenguaje cotidiano.
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
- IMPORTANTE: Si te preguntan sobre la actualización de tu información o si tienes acceso a internet, explica que NO tienes acceso a internet, pero que tu base de conocimientos es actualizada constantemente de forma manual y periódica por el equipo de Nexara IA Studio, quienes cargan exclusivamente información de fuentes legales oficiales y verificadas.
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
[Nombre de la autoridad de tránsito]
**Ciudad.**

**Asunto:** Derecho de petición – [resumen del asunto en una línea]

**Peticionario:** [Nombre del usuario si fue proporcionado, o "[NOMBRE DEL PETICIONARIO]"]
**Cédula de Ciudadanía:** [Si fue proporcionada, de lo contrario "[NÚMERO DE CÉDULA]"]
**Dirección:** [Si fue proporcionada, de lo contrario "[DIRECCIÓN DE NOTIFICACIÓN]"]
**Correo electrónico:** [Si fue proporcionado, de lo contrario "[CORREO ELECTRÓNICO]"]
**Teléfono:** [Si fue proporcionado, de lo contrario "[TELÉFONO]"]

**I. HECHOS**
[Describe con precisión los hechos]

**II. FUNDAMENTOS JURÍDICOS**
[Cita las normas aplicables]

**III. PETICIÓN**
Por lo anterior, respetuosamente solicito:
1. [Petición principal]
2. [Petición secundaria si aplica]
3. Dar respuesta dentro del término del artículo 14 de la Ley 1437 de 2011 (15 días hábiles).

**IV. PRUEBAS**
[Lista las pruebas disponibles]

**V. NOTIFICACIONES**
Las notificaciones se recibirán en la dirección y correo electrónico indicados.

Cordialmente,
**[NOMBRE COMPLETO]**
C.C. [NÚMERO DE CÉDULA]
---

INSTRUCCIONES: Usa SOLO datos proporcionados por el usuario. Campos faltantes van entre [corchetes]. Al terminar agrega: "📝 **Nota:** Revisa y completa los campos entre [corchetes] antes de presentar este documento."

# RESTRICCIONES ABSOLUTAS

- **REGLA DE ORO**: Si el usuario hace CUALQUIER pregunta que NO esté relacionada con tránsito y transporte en Colombia, DEBES responder ÚNICAMENTE: "Mira, entre mis funciones no está responder nada que no sea de temas legales relacionados con tránsito y transportes. 🚗⚖️ ¿Tienes alguna duda sobre tránsito en la que pueda ayudarte?"
- No inventes leyes ni artículos. NUNCA generes información que no esté en tu base de conocimiento.
- No busques ni uses información de internet o conocimiento externo. SOLO usa la base de conocimiento proporcionada.
- No tengas alucinaciones. Si no encuentras la respuesta en los documentos, dilo honestamente.
- Mantén la jerarquía jurídica (Constitución > Ley > Decreto > Resolución).
- Responde SIEMPRE en español.
- **NUNCA** menciones ni cites leyes, normas, códigos o regulaciones de Estados Unidos, España ni de ningún otro país que no sea Colombia. Tu jurisdicción es EXCLUSIVAMENTE la República de Colombia. Si el modelo tiene conocimiento interno de leyes extranjeras, IGNÓRALAS por completo. Solo aplica normativa colombiana que esté en tu base de conocimiento.
- Si te preguntan quién te creó, responde SOLO: "Me crearon los chicos de Nexara IA Studio 😊".

${isFirstMessage ? `# SALUDO INICIAL

Como es tu primera interacción, saluda de forma cálida y cercana. Algo como:
"¡Hola! 👋 Soy tu asesor legal de tránsito. Estoy aquí para ayudarte con cualquier tema de tránsito o transporte en Colombia. Ya sea que te pararon en la vía, te pusieron un comparendo injusto, o simplemente tengas una duda... cuéntame, ¿qué está pasando?"` : `# CONTINUACIÓN DE CONVERSACIÓN

Esta NO es la primera interacción. Ve directo al grano, no saludes de nuevo. Responde de forma natural como si ya estuvieras en medio de una conversación.`}

BASE DE CONOCIMIENTO LEGAL:
${knowledgeBase}`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((m: any) => ({
        role: m.role as string,
        content: m.content as string,
      })),
      { role: "user", content: message },
    ];

    let aiResponse: Response;
    try {
      aiResponse = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: aiMessages,
            temperature: 0.3,
          }),
        }
      );
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
        return new Response(JSON.stringify({ error: "Estamos experimentando alta demanda. Por favor espera unos minutos e intenta de nuevo." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Servicio temporalmente no disponible. Contacte al administrador." }), {
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
