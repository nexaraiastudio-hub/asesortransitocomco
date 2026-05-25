import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "https://esm.sh/openai@4.28.0";
import { BASE_NORMATIVA, NormativaTema } from "./base_normativa.ts";
import { validarNormasPostGeneracion } from "./validadores.ts";
import { detectarExitoConRegex, detectarAbusoEnMensaje, detectarSolicitudImpugnacion, detectarAfirmacionOficial } from "./detectores.ts";
import { ChatMessage, ClasificacionConsulta, FaseOrquestador } from "./types.ts";
import { clasificarConsulta } from "./clasificador.ts";
import { TODOS_LOS_EJEMPLOS } from "./agentes/ejemplos_entrenamiento.ts";
import { 
  detectarExito, 
  extraerResultado, 
  construirCasoDesdeHistorial, 
  formatearCasosParaPrompt 
} from "./memoria_casos.ts";
import { recuperarNormativa } from "./agentes/agente_leyes.ts";
import { generarPromptDefensa } from "./agentes/agente_defensa.ts";
import { generarPromptCumplimiento } from "./agentes/agente_cumplimiento.ts";

// CONFIGURACION Y CONSTANTES

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!OPENAI_API_KEY) {
  console.error("[CONFIG] ERROR: OPENAI_API_KEY no esta configurada");
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY || "sk-fake-key-for-testing" });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// BLOQUES FIJOS DEL SKILL V15.2

const BLOQUE_SALUDO_PROTOCOL = `((Saludos. Soy tu Abogado Asesor Élite en Tránsito y Transporte. Estoy listo para proteger tus derechos de movilidad. PROTOCOLO DE SEGURIDAD: Inicie registro en video y fotografías inmediatamente. Bajo el Artículo 20 de la Constitución Política de Colombia y el Artículo 21 de la Ley 1801 de 2016 (Código Nacional de Seguridad y Convivencia Ciudadana), usted tiene el derecho legítimo de grabar procedimientos públicos. Toma fotos, videos, placas, nombres y señalización. Es su prueba reina.))`;

const PREGUNTA_CONTROL_TRIAJE = `((Pregunta de Control: Con esta información puedo armar tu estrategia legal. Necesito que me confirmes los datos solicitados. Responde y activo tu defensa.))`;

const PREGUNTA_CIERRE_FASE2 = `((¿Cómo respondió el oficial a tu solicitud? ¿Accede al procedimiento legal o insiste en realizar el comparendo e inmovilización?))`;

const PREGUNTA_CIERRE_CONTINGENCIA = `((¿Deseas que redacte el modelo de impugnación para este caso?))`;

// SERVIDOR PRINCIPAL

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    console.log("[ORQUESTADOR] Body recibido:", bodyText);
    
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (parseError) {
      console.error("[ORQUESTADOR] Error parseando JSON:", parseError);
      throw new Error(`JSON invalido: ${parseError.message}`);
    }
    
    // Soportar ambos formatos: { messages } o { message, history }
    let historial: ChatMessage[];
    let ultimoMensaje: string;
    
    if (body.messages && Array.isArray(body.messages)) {
      historial = body.messages;
      ultimoMensaje = historial[historial.length - 1]?.content || "";
    } else if (body.message && body.history) {
      historial = [...body.history, { role: "user", content: body.message }];
      ultimoMensaje = body.message;
    } else {
      throw new Error("Formato invalido: se espera 'messages' o 'message' + 'history'");
    }

    console.log(`[ORQUESTADOR] Mensaje: "${ultimoMensaje.substring(0, 50)}..."`);
    console.log(`[ORQUESTADOR] Historial: ${historial.length} mensajes`);

    // CLASIFICACION INTELIGENTE (necesaria para detección de éxito y guardado)
    const clasificacion = await clasificarConsulta(openai, ultimoMensaje, historial);
    console.log(`[ORQUESTADOR] Tema: ${clasificacion.tema}, Modo: ${clasificacion.modo || "A"}`);

    // 1. DETECCION DE EXITO (Fase Cierre)
    if (detectarExito(ultimoMensaje) && historial.length > 2) {
      console.log("[ORQUESTADOR] FASE CIERRE - EXITO DETECTADO");
      
      // Guardar caso exitoso para aprendizaje
      try {
        const caso = construirCasoDesdeHistorial(
          clasificacion.tema || "general",
          clasificacion.modo === "B" ? "FALTA_INMOVILIZACION_ILEGAL" : "ABUSO",
          historial,
          "cierre"
        );
        
        if (caso && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
          const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
          const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
          
          const { error } = await supabaseAdmin
            .from("casos_exitosos")
            .insert({
              ...caso,
              resultado: extraerResultado(ultimoMensaje),
              aprobado: false,
              usos: 0,
            });
          
          if (error) {
            console.error("[MEMORIA] Error guardando caso:", error);
          } else {
            console.log("[MEMORIA] Caso exitoso guardado para revisión");
          }
        }
      } catch (err) {
        console.error("[MEMORIA] Error en guardado:", err);
      }
      
      const respuestaCierre = generarRespuestaCierre();
      return new Response(
        JSON.stringify({ response: respuestaCierre, fase: "cierre" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. EXTRACCION DE MARCO LEGAL (A travs del Agente de Leyes)
    const normativaTema = recuperarNormativa(clasificacion.tema || "general");
    
    // BÚSQUEDA DINÁMICA EN BASE DE DATOS (RAG)
    let contextoDB = "";
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && OPENAI_API_KEY && OPENAI_API_KEY !== "sk-fake-key-for-testing") {
      try {
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        const embeddingRes = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: ultimoMensaje,
        });
        const embedding = embeddingRes.data[0].embedding;
        
        const { data: resultadosDB, error: errDB } = await supabaseAdmin.rpc("buscar_conocimiento", {
          query_embedding: embedding,
          match_threshold: 0.3,
          match_count: 3
        });
        
        if (!errDB && resultadosDB && resultadosDB.length > 0) {
          contextoDB = resultadosDB.map((r: any) => `## ${r.titulo} (${r.anclaje_legal || ''})\n${r.contenido}`).join("\n\n");
          console.log(`[ORQUESTADOR] Contexto DB recuperado: ${resultadosDB.length} normas`);
        }
      } catch (err) {
        console.error("[ORQUESTADOR] Error en búsqueda RAG:", err);
      }
    }
    
    // 3. DETERMINACION DE FASE
    const fase = determinarFase(historial, clasificacion, ultimoMensaje);
    console.log(`[ORQUESTADOR] FASE ${fase}`);

    // 5. GENERACION DE RESPUESTA SEGUN SKILL V15.2
    let respuestaFinal = await generarRespuestaPorFase(
      historial,
      fase,
      normativaTema,
      clasificacion,
      contextoDB
    );

    // 6. VALIDACION POST-GENERACION
    respuestaFinal = validarNormasPostGeneracion(respuestaFinal, normativaTema);

    return new Response(
      JSON.stringify({ 
        response: respuestaFinal, 
        fase,
        tema: clasificacion.tema,
        modo: clasificacion.modo,
        arquetipo: (clasificacion as any).arquetipo,
        clase: clasificacion.clase,
        autoridad: clasificacion.autoridad
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[ERROR]", error);
    return new Response(
      JSON.stringify({ error: "Error procesando la consulta", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// FUNCIONES DE CLASIFICACION (Eliminadas, ahora se importan desde clasificador.ts)

function determinarFase(historial: ChatMessage[], clasificacion: ClasificacionConsulta, ultimoMensaje: string): FaseOrquestador {
  const cantidadMensajes = historial.length;
  const mensajesUsuario = historial.filter(m => m.role === "user").length;
  
  // Fase 4: Impugnacion solicitada explicitamente
  if (detectarSolicitudImpugnacion(ultimoMensaje, historial)) {
    return 4;
  }
  
  // Fase 3: Contingencia - oficial persiste (solo si ya hubo defensa previa)
  const hayDefensaPrevia = historial.some(m => 
    m.role === "assistant" && 
    (m.content.includes('"') || m.content.includes("Dígale exactamente"))
  );
  
  if (detectarAbusoEnMensaje(historial) && hayDefensaPrevia) {
    return 3;
  }
  
  // Fase 2b: Refutacion - oficial dice algo incorrecto (NO es insistencia)
  if (detectarAfirmacionOficial(ultimoMensaje) && hayDefensaPrevia) {
    return "2b";
  }
  
  // Fase 2: Defensa - tenemos datos suficientes
  // V19: Avanzar a Fase 2 en la segunda interaccion para evitar deadlocks 
  // cuando el clasificador no extrae clase/autoridad del historial.
  const esSegundaInteraccion = mensajesUsuario >= 2;
  
  if (esSegundaInteraccion) {
    return 2;
  }
  
  // Fase 1: Triaje - primera interaccion o faltan datos
  return 1;
}

// GENERACION DE RESPUESTAS POR FASE - SIGUIENDO SKILL V15.2

async function generarRespuestaPorFase(
  historial: ChatMessage[], 
  fase: FaseOrquestador, 
  norma: NormativaTema | null, 
  analisis: ClasificacionConsulta,
  contextoDB: string = ""
): Promise<string> {
  
  // Seleccionar ejemplos relevantes para el contexto
  const ejemplosRelevantes = TODOS_LOS_EJEMPLOS.filter(ej => 
    ej.nombre.toLowerCase().includes(analisis.tema) || 
    analisis.tema.includes(ej.nombre.toLowerCase().split(" ")[0])
  ).slice(0, 3);
  
  const ejemplosTexto = ejemplosRelevantes.length > 0 
    ? ejemplosRelevantes.map(ej => `
=== EJEMPLO: ${ej.nombre} ===
FASE 1 - Usuario: "${ej.fase1_usuario}"
FASE 1 - Respuesta:\n${ej.fase1_respuesta}

FASE 2 - Usuario: "${ej.fase2_usuario}"
FASE 2 - Respuesta:\n${ej.fase2_respuesta}
${'fase2b_usuario' in ej ? `
FASE 2b - Usuario: "${(ej as any).fase2b_usuario}"
FASE 2b - Respuesta:\n${(ej as any).fase2b_respuesta}
` : ''}
${'fase3_usuario' in ej ? `
FASE 3 - Usuario: "${(ej as any).fase3_usuario}"
FASE 3 - Respuesta:\n${(ej as any).fase3_respuesta}
` : ''}
`).join("\n---\n")
    : "No hay ejemplos específicos para este tema. Usa el formato estándar del SKILL.";

  const basePrompt = `Eres HIVE-LAW, un Abogado Asesor Élite en Tránsito y Transporte de Colombia.

REGLAS FUNDAMENTALES:
1. TONO: Profesional, autoritario, técnico. Sin muletillas de asistente virtual.
2. FORMATO: Sigue EXACTAMENTE la estructura de los ejemplos proporcionados.
3. BLOQUES FIJOS: Los textos entre (( )) son literales. Reprodúcelos exactamente.
4. NO INVENTES LEYES: Solo cita normas que estén en la base de datos proporcionada.
5. DOBLE MODO:
   - Modo A (Defensa Agresiva): Oficial sin razón, falta equipo técnico, vicio en procedimiento.
   - Modo B (Asesoría Honesta): Falta real, subsanable, o indefendible.

EJEMPLOS DE REFERENCIA (IMITA ESTE ESTILO EXACTO):
${ejemplosTexto}

MARCO LEGAL DEL CASO ACTUAL:
- Tema: ${analisis.tema}
- Normas aplicables predefinidas: ${norma?.normas.join(", ") || "Consultar base legal"}
- Método legal requerido: ${norma?.metodo_legal || "No especificado"}
- Método inválido: ${norma?.metodo_invalido || "No especificado"}
- Código de infracción: ${norma?.codigo_infraccion || "N/A"}
- Subsanable: ${norma?.subsanable ? "Sí" : "No"}

${contextoDB ? `MARCO LEGAL ADICIONAL (EXTRAÍDO DE LA BASE DE DATOS PARA ESTE CASO ESPECÍFICO):
${contextoDB}

**INSTRUCCIÓN:** Utiliza estas normas adicionales extraídas de la base de datos si el tema no está completamente cubierto por las normas predefinidas, pero MANTÉN SIEMPRE el tono, el nivel de asertividad y el esqueleto de respuesta de los ejemplos.` : ""}

DATOS DEL CASO:
- Vehículo: ${analisis.clase || "No especificado"} (${analisis.servicio || "servicio no especificado"})
- Autoridad: ${analisis.autoridad || "No especificada"}
- Método usado por oficial: ${analisis.metodo || "No especificado"}
- Modo detectado: ${analisis.modo || "Por determinar"}
`;

  let promptEspecifico = "";
  
  switch (fase) {
    case 1:
      promptEspecifico = construirPromptFase1(basePrompt, norma, analisis);
      break;
    case 2:
    case "2b":
    case 3:
      if (analisis.modo === "B") {
        promptEspecifico = generarPromptCumplimiento(basePrompt, norma || { descripcion: "", normas: [], sancion: "", subsanable: false, preguntas_fase1: [] }, analisis, historial, fase);
      } else {
        promptEspecifico = generarPromptDefensa(basePrompt, norma || { descripcion: "", normas: [], sancion: "", subsanable: false, preguntas_fase1: [] }, analisis, historial, fase);
      }
      break;
    case 4:
      promptEspecifico = construirPromptFase4(basePrompt, norma, analisis, historial);
      break;
    default:
      promptEspecifico = construirPromptFase1(basePrompt, norma, analisis);
  }

  try {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === "sk-fake-key-for-testing") {
      return generarRespuestaFallback(fase, norma, analisis);
    }

    // LOGGING: Verificar qué norma se está usando
    console.log("[GENERADOR] Fase:", fase);
    console.log("[GENERADOR] Norma:", norma ? JSON.stringify(norma.normas) : "NULL");
    console.log("[GENERADOR] Tema:", analisis.tema);
    
    // LOGGING: Ver prompt completo
    console.log("[GENERADOR] Prompt enviado a OpenAI (primeros 1000 chars):", promptEspecifico.substring(0, 1000));

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: promptEspecifico },
        ...historial.slice(-4)
      ],
      temperature: 0.2,
    });

    let respuesta = completion.choices[0].message.content || "Error generando respuesta";
    
    // LOGGING: Ver respuesta de OpenAI
    console.log("[GENERADOR] Respuesta OpenAI (primeros 500 chars):", respuesta.substring(0, 500));
    
    // Aplicar bloques fijos según la fase
    respuesta = aplicarBloquesFijos(respuesta, fase);
    
    return respuesta;
  } catch (error) {
    console.error("[GENERADOR] Error:", error);
    return generarRespuestaFallback(fase, norma, analisis);
  }
}

function construirPromptFase1(basePrompt: string, norma: NormativaTema | null, analisis: ClasificacionConsulta): string {
  const preguntas = norma?.preguntas_fase1 || [
    "¿En qué ciudad o municipio de Colombia ocurrió la detención? (Fundamental para aplicar normativas locales como las de Bogotá)",
    "¿Qué tipo de vehículo conduce? (moto, carro, camioneta, bus, camión)",
    "¿A qué autoridad pertenece el oficial que lo detuvo? (Policía de Tránsito, Agente Civil de Tránsito, Policía Nacional)",
    "¿Qué método utilizó el oficial para determinar la presunta infracción?"
  ];

  // Si la pregunta de ciudad no está (porque vino de BASE_NORMATIVA), la inyectamos al principio
  if (!preguntas[0].toLowerCase().includes("ciudad")) {
    preguntas.unshift("¿En qué ciudad o municipio de Colombia ocurrió la detención? (Fundamental para aplicar normativas locales como las de Bogotá)");
  }

  return `${basePrompt}

FASE 1: TRIAJE - INSTRUCCIONES

ESTRUCTURA DE RESPUESTA:
1. Texto conversacional natural explicando que necesitas información para armar la defensa (demuestra que leíste lo que te dijo el usuario).
2. De la siguiente lista de verificación, haz ÚNICAMENTE las preguntas cuya respuesta AÚN NO CONOCES:
${preguntas.map(p => `   ${p}`).join("\n")}

REGLAS CRÍTICAS DE INTELIGENCIA:
- NO SEAS ROBÓTICO. Si el usuario ya te dijo el vehículo (ej. moto), NO le preguntes qué vehículo conduce. Si ya te dijo quién lo detuvo (ej. agente de tránsito), NO se lo preguntes de nuevo.
- Solo haz las preguntas de la lista que falten por responder. Si solo falta la ciudad, pregunta solo la ciudad.
- NO incluyas el saludo inicial ((Saludos...)) - eso se agrega automáticamente.
- NO uses bullets ni numeración para las preguntas.
- NO generes el guion de defensa todavía.
- NO agregues la "Pregunta de Control" al final - eso se agrega automáticamente.
- Sé conversacional, racional y directo.`;
}

// FUNCIONES DE AGENTES MOVIDAS A AGENTES/ (agente_defensa.ts, agente_cumplimiento.ts)

function construirPromptFase4(basePrompt: string, norma: NormativaTema | null, analisis: ClasificacionConsulta, historial: ChatMessage[]): string {
  return `${basePrompt}

FASE 4: IMPUGNACION - INSTRUCCIONES

Genera el documento formal de impugnación con esta estructura EXACTA:

---

Ciudad y fecha: [Ciudad], [Fecha]

Señor(a)
Inspector(a) de Tránsito y Transporte de [Ciudad]
[Dirección de la Secretaría de Tránsito si se conoce]

**ASUNTO: Impugnación del comparendo No. [NÚMERO] - ${analisis.metodo === "visual" || analisis.metodo === null ? "Nulidad por ausencia de prueba técnica" : "Nulidad por violación al debido proceso"}**

Respetado(a) Inspector(a):

Yo, **[NOMBRE COMPLETO]**, identificado(a) con cédula de ciudadanía No. **[CÉDULA]**, domiciliado(a) en **[DIRECCIÓN]**, teléfono **[TELÉFONO]**, correo electrónico **[CORREO]**, me dirijo a su despacho dentro del término legal para IMPUGNAR el comparendo que a continuación relaciono:

**I. DATOS DEL COMPARENDO**
- Número del comparendo: [NÚMERO]
- Fecha del comparendo: [FECHA]
- Hora: [HORA]
- Lugar: [LUGAR]
- Placas del vehículo: [PLACAS]
- Código de infracción impuesta: ${norma?.codigo_infraccion || "[CÓDIGO]"}
- Agente que impuso el comparendo: [NOMBRE/PLACA DEL AGENTE]

**II. HECHOS**

[Narrativa cronológica adaptada al caso:
1. Circunstancias de la detención.
2. Qué informó el oficial y qué solicitó el usuario.
3. ${analisis.metodo === "visual" ? "Se determinó la infracción por apreciación visual sin instrumento técnico calibrado." : "Método utilizado por el oficial."}
4. Si se solicitó subsanación y fue negada.
5. Irregularidades documentadas.]

**III. FUNDAMENTOS DE DERECHO**

- **Artículo 29 de la Constitución Política de Colombia:** Debido proceso y presunción de inocencia.
${norma?.normas[0] ? `- **${norma.normas[0]}**: Requisitos técnicos para el procedimiento.` : ""}
- **Sentencia C-038 de 2020 (Corte Constitucional):** La responsabilidad contravencional debe probarse fehacientemente.
${norma?.subsanable ? `- **Artículo 125 de la Ley 769 de 2002:** Derecho a subsanar en sitio.` : ""}

**IV. PRUEBAS**

Solicito se tengan como pruebas:
1. Video del procedimiento grabado en el lugar de los hechos.
2. Fotografías del vehículo, comparendo y agente.
3. Copia del comparendo con la anotación BAJO PROTESTA.
4. Captura de pantalla de esta conversación de asesoría legal.

**V. SOLICITUDES**

Con fundamento en los hechos y normas expuestos, solicito:
a) Se declare la NULIDAD del comparendo por ${analisis.metodo === "visual" ? "ausencia de prueba técnica" : "violación al debido proceso"}.
b) Se ordene la exoneración de los costos de grúa y parqueadero (si aplica).
c) Se archive el proceso contravencional.

**VI. NOTIFICACIONES**

Recibo notificaciones en: [DIRECCIÓN], teléfono [TELÉFONO], correo [CORREO].

Cordialmente,

**[NOMBRE COMPLETO]**
C.C. [CÉDULA]
[Ciudad], [Fecha]

---

**Recordatorios Post-Impugnación:**
1. Tiene **5 días hábiles** desde la notificación del comparendo para presentar la impugnación.
2. Guarde el video completo en al menos 2 dispositivos.
3. Guarde captura de pantalla de esta conversación como soporte.
4. Lleve copia física y digital de la impugnación.
5. Solicite radicado o sello de recibido al momento de entregar.`;
}

function aplicarBloquesFijos(respuesta: string, fase: FaseOrquestador): string {
  // Limpiar cualquier saludo que la IA haya generado (para evitar duplicados)
  let respuestaLimpia = respuesta;
  
  // Patrones de saludo a eliminar (case-insensitive)
  const patronesSaludo = [
    /\(\(\s*Saludos\.?\s*Soy tu Abogado Asesor[^)]*\)\)/i,
    /^\s*Saludos\.?\s*Soy tu Abogado Asesor.*$/im,
  ];
  
  for (const patron of patronesSaludo) {
    respuestaLimpia = respuestaLimpia.replace(patron, "").trim();
  }
  
  // Limpiar líneas vacías al inicio
  respuestaLimpia = respuestaLimpia.replace(/^\s*\n+/, "");
  
  // Limpiar pregunta de control duplicada si la IA la generó
  const tienePreguntaControl = respuestaLimpia.includes("Pregunta de Control") || 
                                respuestaLimpia.includes("((Pregunta de Control");

  switch (fase) {
    case 1:
      // FASE 1: Saludo fijo + respuesta limpia + Pregunta de Control
      if (tienePreguntaControl) {
        // La IA ya generó la pregunta de control, no duplicar
        return `${BLOQUE_SALUDO_PROTOCOL}\n\n${respuestaLimpia}`;
      }
      return `${BLOQUE_SALUDO_PROTOCOL}\n\n${respuestaLimpia}\n\n${PREGUNTA_CONTROL_TRIAJE}`;
    
    case 2:
    case "2b":
      // FASE 2 y 2b: Solo respuesta (sin saludo, ya se envió en Fase 1)
      return respuestaLimpia;
    
    case 3:
      // FASE 3: Respuesta (sin saludo)
      return respuestaLimpia;
    
    case 4:
      // FASE 4: Documento de impugnación (sin saludo)
      return respuestaLimpia;
    
    case "cierre":
      return respuestaLimpia;
    
    default:
      return respuestaLimpia;
  }
}

function generarRespuestaFallback(fase: FaseOrquestador, norma: NormativaTema | null, analisis: ClasificacionConsulta): string {
  const tema = norma ? Object.keys(BASE_NORMATIVA).find(k => BASE_NORMATIVA[k] === norma) || "general" : "general";
  
  switch (fase) {
    case 1:
      return `${BLOQUE_SALUDO_PROTOCOL}

Para poder asesorarte adecuadamente sobre tu caso de ${tema}, necesito que me proporciones algunos datos:

1. ¿En qué ciudad o municipio de Colombia ocurrió la detención?
${norma ? norma.preguntas_fase1.map((p, i) => `${i + 2}. ${p}`).join("\n") : "2. ¿Qué tipo de vehículo conduce?\n3. ¿Qué método usó el oficial?"}

${PREGUNTA_CONTROL_TRIAJE}`;

    case 2:
      return `Dígale exactamente esto al oficial:

"Señor agente, solicito que se me informe el método técnico utilizado para determinar la presunta infracción. Según ${norma?.normas[0] || "la normativa"}, el procedimiento requiere ${norma?.metodo_legal || "equipo calibrado"}. Solicito ver el certificado de calibración del dispositivo. Todo está siendo grabado en video conforme al Artículo 21 de la Ley 1801 de 2016."

${PREGUNTA_CIERRE_FASE2}`;

    case 3:
      return `Dígale exactamente esto al señor oficial:

"Señor agente, reitero mi solicitud conforme a la normativa vigente. Su insistencia en proceder sin ${norma?.metodo_legal || "prueba técnica"} podría configurar Abuso de Autoridad conforme al Artículo 416 del Código Penal. Solicito su identificación completa: nombre, placa y entidad. Todo está siendo documentado en video."

Firme el comparendo escribiendo BAJO PROTESTA junto a su firma, y en observaciones escriba: "Firmo BAJO PROTESTA. No se utilizó ${norma?.metodo_legal || "equipo calibrado"}. Procedimiento grabado en video."

${PREGUNTA_CIERRE_CONTINGENCIA}`;

    case 4:
      return `Documento de impugnación generado. Complete los datos entre corchetes y presente ante la Secretaría de Tránsito dentro de los 5 días hábiles.`;

    default:
      return "Error generando respuesta. Por favor, intenta de nuevo.";
  }
}

function generarRespuestaCierre(): string {
  return `((Saludos. Soy tu Abogado Asesor Elite en Transito y Transporte.))

✅ PROCEDIMIENTO RESUELTO FAVORABLEMENTE

¡Excelente noticia! El oficial ha reconocido la falta de fundamentación técnica y ha decidido no continuar con el procedimiento. Sus derechos fueron protegidos exitosamente.

Resumen de lo logrado:
• Se exigió el uso del equipo técnico reglamentario.
• Se citó la normativa vigente correctamente.
• El oficial reconoció que la apreciación visual no es válida.
• Se evitó el comparendo y la inmovilización.

Recomendaciones finales:
1. Verifique sus documentos: licencia, SOAT, tarjeta de propiedad.
2. Conducción Preventiva: cumpla con la normativa técnica para evitar futuras detenciones.
3. Guarde el video: es su prueba reina. Guárdelo en al menos 2 dispositivos.

((¿Necesita asesoría en otro tema de tránsito o transporte?))`;
}
