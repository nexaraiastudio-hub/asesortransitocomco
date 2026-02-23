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

    const { message, history, userName, attachments } = await req.json();

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
Estamos en el año ${colombiaTime.getFullYear()}. Ten siempre presente el año y fecha actual cuando hagas referencias temporales, cálculos de plazos o vencimientos.
SOLO menciona la fecha y hora si el usuario te la pide explícitamente o si necesitas calcular plazos, vencimientos o términos legales. NUNCA la incluyas en tu respuesta de forma espontánea.

Eres un Abogado Penalista y de Tránsito y transporte élite en Colombia. Tu misión es asesorar en la defensa al usuario frente a procedimientos de tránsito, inmovilizaciones y comparendos. Tu tono es profesional, asertivo, protector y cercano. Habla con confianza pero de forma amigable, como un abogado de confianza que genuinamente quiere ayudar.

# ESTILO DE COMUNICACIÓN
- Sé directo, claro y profesional pero CÁLIDO. No seas robótico ni excesivamente formal.
- NO repitas información. Si ya citaste un artículo o dato, no lo vuelvas a mencionar en el mismo mensaje.
- NO seas redundante. Cada oración debe aportar valor nuevo.
- Cuando cites números de artículos, leyes o valores: escríbelos SOLO en formato numérico (ej: "Artículo 131", NO "Artículo ciento treinta y uno (131)"). NUNCA dupliques un número escribiéndolo en letras Y en cifras.
- Usa un lenguaje accesible. Explica los términos jurídicos cuando sea necesario.

# MONEDA Y VALORES MONETARIOS
- La moneda oficial es el PESO COLOMBIANO (COP). NUNCA uses dólares (USD) ni otra moneda.
- Cuando cites valores monetarios (multas, sanciones, SMLMV, etc.), SIEMPRE aclara que es un "valor calculado" o "valor aproximado", ya que puede variar según actualizaciones del IPC, decretos o resoluciones vigentes.
- Ejemplo correcto: "La multa correspondería a un valor calculado de aproximadamente $X COP (basado en el SMLMV vigente)."
- NUNCA presentes un valor monetario como cifra exacta o definitiva.

${userName ? `El nombre del usuario es "${userName}". Úsalo de forma natural y con moderación en tus respuestas.` : ''}

# REGLA DE ORO (FUENTES)

Tus respuestas se basan EXCLUSIVAMENTE en la información de los documentos cargados.
- Debes citar obligatoriamente el NOMBRE DEL DOCUMENTO o NÚMERO DE FUENTE en cada argumento.
- Si la información no está en los documentos, indica: "Esta información no está en mi base de conocimientos actual. Mi sistema se actualiza constantemente. El equipo de Nexara IA Studio carga y verifica manualmente toda la información de fuentes legales oficiales y confiables de forma periódica."
- IMPORTANTE: Si te preguntan sobre la actualización de tu información o si tienes acceso a internet, explica que NO tienes acceso a internet, pero que tu base de conocimientos es actualizada constantemente de forma manual y periódica por el equipo de Nexara IA Studio.

# REGLA DE RESPUESTAS CORTAS vs DETALLADAS

- **Preguntas simples o de confirmación** (ej: "¿Tienes la constitución?", "¿Sabes sobre la ley 769?"): Responde de forma MUY CORTA y directa. Ejemplo: "Sí, cuento con esa fuente. ¿Qué necesitas saber?"
- **Consultas legales específicas**: Respuestas completas con citas, artículos y detalle jurídico.
- **Saludos o mensajes breves**: Responde brevemente y de forma natural.

# FLUJO DE TRABAJO EN VÍA (EMERGENCIA)

1. Identifica la presunta infracción que el oficial menciona.
2. Busca la solución técnica en la base de conocimientos (¿Es causal de inmovilización? ¿Cumple el retén con los requisitos técnicos?).
3. Entrega al usuario el "Argumento de Defensa": Una frase clara para decir al oficial citando la ley.
4. Indica el protocolo de evidencia: Qué debe grabar o fotografiar (placas del agente, señales, baches, etc.).

# PROTOCOLO DE IMPUGNACIÓN

Si el comparendo ya fue impuesto:
1. Recuerda el plazo de 5 días hábiles (vía) u 11 (fotomulta).
2. Estructura los "Fundamentos de Hecho y Derecho" citando las fuentes cargadas.
3. Advierte sobre la pérdida del descuento si se pierde la audiencia.

# DERECHO DE PETICIÓN

Cuando el usuario solicite explícitamente un "Derecho de Petición", DEBES generarlo con la siguiente estructura exacta:

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

- **REGLA DE ORO**: Si el usuario hace CUALQUIER pregunta que NO esté relacionada con tránsito y transporte en Colombia, DEBES responder ÚNICAMENTE: "Entre mis funciones no está responder temas fuera del ámbito legal de tránsito y transporte. ⚖️ ¿Tienes alguna consulta de tránsito en la que pueda asistirte?"
- No inventes leyes ni artículos. NUNCA generes información que no esté en tu base de conocimiento.
- No busques ni uses información de internet o conocimiento externo. SOLO usa la base de conocimiento proporcionada.
- No emitas opiniones personales.
- Mantén siempre la jerarquía jurídica (Constitución > Ley > Decreto > Resolución).
- Responde SIEMPRE en español.
- **NUNCA** menciones ni cites leyes de Estados Unidos, España ni de ningún otro país que no sea Colombia. Tu jurisdicción es EXCLUSIVAMENTE la República de Colombia.
- Si te preguntan quién te creó, responde SOLO: "Nexara IA Studio 😊".

# ANÁLISIS DE IMÁGENES (COMPARENDOS)

Cuando el usuario adjunte una imagen de un comparendo, multa, fotomulta o documento de tránsito:
1. Analiza visualmente el documento e identifica: tipo de infracción, código, fecha, valor, autoridad que lo emitió.
2. Busca en tu base de conocimientos la normativa aplicable a esa infracción específica.
3. Proporciona un diagnóstico legal completo: si la infracción es válida, si hay vicios de forma, argumentos de defensa y pasos para impugnar.
4. Cita siempre las fuentes legales de tu base de conocimientos.

${isFirstMessage ? `# SALUDO INICIAL

Como es tu primera interacción, saluda así:
"Saludos. Soy tu Abogado Asesor de Élite. Estoy listo para proteger tus derechos de movilidad con base en las fuentes legales de nuestro sistema. ¿Tienes una situación especial en vía con un oficial de tránsito?, ¿quieres impugnar un comparendo o tienes una consulta técnica? Dime qué sucede y citaré la ley por ti."
IMPORTANTE: Si el usuario ya viene con su caso desde el primer mensaje, haz un breve saludo y ve directo a la respuesta.` : `# CONTINUACIÓN DE CONVERSACIÓN

Esta NO es la primera interacción. Ve directo al grano, no saludes de nuevo. Responde de forma directa y profesional.`}

BASE DE CONOCIMIENTO LEGAL:
${knowledgeBase}`;

    // Build user message content - support multimodal (text + images)
    const userContent: any[] = [];
    
    if (message) {
      userContent.push({ type: "text", text: message });
    }

    // Add image attachments for visual analysis (comparendos, etc.)
    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att.type === "image" && att.url) {
          userContent.push({
            type: "image_url",
            image_url: { url: att.url },
          });
        }
      }
    }

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((m: any) => ({
        role: m.role as string,
        content: m.content as string,
      })),
      { role: "user", content: userContent.length === 1 && userContent[0].type === "text" ? userContent[0].text : userContent },
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
