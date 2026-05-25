// generador_guion.ts — V19 Generador de Guínones con Chain-of-Thought por Arquetipo Jurídico
import { OpenAI } from "https://esm.sh/openai@4.28.0";
import type { ClasificacionConsulta, ChatMessage } from "./types.ts";
import { generarEjemplosParaRedactor, TODOS_LOS_EJEMPLOS } from "./agentes/ejemplos_entrenamiento.ts";

// ═══ REFERENCIA DE ESTILO: Ejemplos de guiones correctos ═══
const EJEMPLOS_REFERENCIA = generarEjemplosParaRedactor();

// Función para seleccionar el ejemplo más relevante según el tema
function seleccionarEjemploPorTema(tema: string): string {
  const temaLower = tema.toLowerCase();
  
  // Mapeo de temas a ejemplos específicos
  const mapeoTemas: Record<string, string> = {
    "llantas": "Llantas - Moto sin profundimetro",
    "polarizados": "Polarizados - Vehiculo escolar sin fotometro + refutacion de afirmacion",
    "casco": "Casco parrillero - Falta real subsanable",
    "semaforo": "Semaforo rojo - Sin prueba tecnica",
    "luz_fundida": "Luz fundida en reten - Subsanable con irregularidad de grua",
    "kit_carretera": "Kit de carretera faltante - Falta objetiva con subsanacion parcial",
    "placa_mal_ubicada": "Placa mal ubicada - Oficial equivocado en la norma",
    "escape_modificado": "Escape modificado - Sin instrumento de medicion de ruido",
    "cinturon_seguridad": "Cinturon de seguridad - Falta objetiva subsanable",
    "piques": "Piques ilegales - Infraccion grave con consecuencias reales",
    // V19: Nuevos ejemplos por arquetipo
    "soat_vencido": "SOAT vencido - Comparendo valido procedimiento legal completo",
    "licencia": "SOAT vencido - Comparendo valido procedimiento legal completo",
    "revision_tecnicomecanica": "SOAT vencido - Comparendo valido procedimiento legal completo",
    "embriaguez": "Embriaguez confirmada - Alcohosensor certificado resultado positivo",
    "chaleco_reflectivo": "Chaleco reflectivo - Falta real oficial niega subsanacion",
  };
  
  // Buscar el ejemplo más relevante
  for (const [key, nombreEjemplo] of Object.entries(mapeoTemas)) {
    if (temaLower.includes(key)) {
      const ejemplo = TODOS_LOS_EJEMPLOS.find(e => e.nombre.includes(nombreEjemplo.split(" - ")[0]));
      if (ejemplo) {
        return formatearEjemploIndividual(ejemplo);
      }
    }
  }
  
  // Si no hay match específico, devolver todos los ejemplos
  return EJEMPLOS_REFERENCIA;
}

// Formatear un solo ejemplo para inyectar en el prompt
function formatearEjemploIndividual(ejemplo: typeof TODOS_LOS_EJEMPLOS[0]): string {
  const partes = [];
  partes.push(`=== EJEMPLO REFERENCIA OBLIGATORIA: ${ejemplo.nombre} ===`);
  partes.push(`USUARIO: "${ejemplo.fase1_usuario}"`);
  partes.push(`RESPUESTA CORRECTA FASE 1:\n${ejemplo.fase1_respuesta}`);
  partes.push(`USUARIO: "${ejemplo.fase2_usuario}"`);
  partes.push(`RESPUESTA CORRECTA FASE 2:\n${ejemplo.fase2_respuesta}`);
  
  if ('fase2b_usuario' in ejemplo && 'fase2b_respuesta' in ejemplo) {
    const ejConRefutacion = ejemplo as typeof TODOS_LOS_EJEMPLOS[1];
    partes.push(`USUARIO (reporta AFIRMACION del oficial): "${ejConRefutacion.fase2b_usuario}"`);
    partes.push(`RESPUESTA CORRECTA FASE 2b:\n${ejConRefutacion.fase2b_respuesta}`);
  }
  
  if ('fase3_usuario' in ejemplo && 'fase3_respuesta' in ejemplo) {
    const ejCompleto = ejemplo as typeof TODOS_LOS_EJEMPLOS[0];
    partes.push(`USUARIO: "${ejCompleto.fase3_usuario}"`);
    partes.push(`RESPUESTA CORRECTA FASE 3:\n${ejCompleto.fase3_respuesta}`);
  }
  
  return partes.join("\n\n");
}

const PROMPT_GUION_FASE2 = `Eres un abogado especialista en tránsito y transporte de Colombia.
Su respuesta debe estructurarse estrictamente en dos partes claras:

1. RAZONAMIENTO JURÍDICO:
Una explicación breve en tercera persona del análisis legal de la situación (máximo 2 párrafos). Debe ser profesional, técnica y autoritaria.

2. GUION DE VOZ PARA EL OFICIAL:
El diálogo exacto que el usuario debe decirle al oficial. Debe comenzar exactamente con la frase "Dígale exactamente esto al oficial:" seguido del guion entre comillas dobles.

REGLAS ABSOLUTAS:
1. Genere únicamente estas dos secciones.
2. Comience el guion de voz con "Señor agente," o "Señor oficial,"
3. Usa las NORMAS proporcionadas para fundamentar. Cita artículos y resoluciones específicos.
4. Incluye solicitud concreta al final (retirar procedimiento, medir con equipo reglamentario, permitir subsanación, etc.)
5. Termina el guion con mención de que el procedimiento está siendo grabado en video conforme al Artículo 21 de la Ley 1801 de 2016.
6. NO inventes normas ni artículos. SOLO usa los proporcionados en NORMAS o los principios transversales listados abajo.
7. NO menciones grúa, inmovilización, comparendo ni multa A MENOS que estén explícitamente en los HECHOS del caso o correspondan al arquetipo.
8. NO inventes hechos. SOLO usa lo que el usuario declaró en los HECHOS.
9. Tono respetuoso pero firme y técnico.
10. Escribe en español colombiano correcto con todas las tildes (á, é, í, ó, ú), eñes (ñ). Ejemplo: Señor, según, artículo, código, resolución.
11. La subsanación evita o cesa la INMOVILIZACIÓN, pero el comparendo puede proceder. NUNCA digas que la infracción desaparece.

PROHIBICIONES NORMATIVAS:
- JAMÁS citar "Resolución 668 de 2018" en ningún caso. NO EXISTE para tránsito.
- Para polarizados, las normas correctas son: Resolución 3777 de 2003, Circular 0022 de 2002, Resolución 3443 de 2008 (escolar).

PRINCIPIOS TRANSVERSALES (usa cuando las normas proporcionadas no cubren el tema):
- Art. 29 Constitución Política: Debido proceso, presunción de inocencia. La carga de la prueba recae en la autoridad.
- Art. 125 Ley 769/2002: Cuando una falta puede subsanarse en el sitio, se debe conceder la oportunidad de hacerlo.
- Art. 20 Constitución + Art. 21 Ley 1801/2016: Derecho a grabar procedimientos públicos.
- Sentencia C-038/2020: La responsabilidad contravencional debe probarse fehacientemente. No basta la percepción subjetiva.
- Sentencia C-799/2003: La inmovilización es medida cautelar que debe cesar cuando se corrige la causa.`;

// ═══ PROMPT FASE 3: Escalación a contingencia ═══
const PROMPT_GUION_FASE3 = `Eres un abogado especialista en tránsito y transporte de Colombia.
El oficial de tránsito INSISTE en proceder a pesar de los argumentos legales que el usuario ya le presentó.

Tu tarea es generar DOS textos:
1. GUION ESCALADO: Texto más firme que el usuario le dirá al oficial. Debe incluir:
   - Reiteración del argumento legal previo
   - Mención de Abuso de Autoridad (Artículo 416 del Código Penal)
   - Solicitud de identificación completa del oficial (nombre, número de placa, entidad)
   - Mención de que todo está documentado en video
   - Mención de que será presentado ante la Procuraduría General de la Nación

2. DESCRIPCION IRREGULARIDAD: Texto breve y factual que describe la irregularidad específica del caso, para incluir en la Firma Bajo Protesta.

REGLAS:
1. El guion debe ser firme pero SIEMPRE respetuoso
2. Comienza con "Señor agente," o "Señor oficial,"
3. NO inventes hechos. SOLO usa lo declarado en los HECHOS y el HISTORIAL
4. NO inventes normas
5. Escribe en español colombiano correcto con todas las tildes (á, é, í, ó, ú), eñes (ñ) y signos de interrogación/exclamación (¿? ¡!). Ejemplo: Señor, según, artículo, código, resolución. NUNCA escribas "Senor", siempre "Señor". NUNCA omitas tildes ni eñes.

PROHIBICIONES NORMATIVAS:
- JAMÁS citar "Resolución 668 de 2018". NO EXISTE.

SALIDA JSON ÚNICAMENTE:
{
  "guion": "texto completo del guion escalado",
  "descripcionIrregularidad": "texto breve de la irregularidad para Firma Bajo Protesta"
}`;

export async function generarGuionFase2(
  openai: OpenAI,
  clasificacion: ClasificacionConsulta,
  normas: string
): Promise<string> {
  const t0 = performance.now();
  
  // Seleccionar ejemplo específico según el tema
  const ejemploRelevante = seleccionarEjemploPorTema(clasificacion.tema);

  // V19: Instrucción de Chain-of-Thought según el arquetipo detectado
  const instruccionArquetipo = clasificacion.arquetipo === "ABUSO"
    ? `ARQUETIPO DETECTADO: ABUSO POLICIAL (Modo A - Defensa Agresiva)

RAZONAMIENTO PREVIO OBLIGATORIO:
1. El oficial NO tiene prueba técnica reglamentaria o actúa ilegalmente.
2. La carga de la prueba recae en la autoridad (Art. 29 CP + Sentencia C-038/2020).
3. Sin instrumento calibrado y certificado = sin prueba válida = sin infracción demostrada.

INSTRUCCIÓN: Ataca frontalmente la falta de prueba técnica. Exige el instrumento reglamentario
con certificado de calibración vigente. Tono firme, respetuoso y técnico. No cedas terreno legal.`
    : clasificacion.arquetipo === "FALTA_INMOVILIZACION_ILEGAL"
    ? `ARQUETIPO DETECTADO: FALTA REAL + INMOVILIZACIÓN ILEGAL (Modo B mixto)

RAZONAMIENTO PREVIO OBLIGATORIO:
1. La falta DEL USUARIO es real — no intentes negarla.
2. El comparendo SÍ procede y es legítimo.
3. La INMOVILIZACIÓN NO procede porque la falta es subsanable en el sitio (Art. 125 Ley 769/2002).
4. Al ofrecer subsanación inmediata, la causa de la inmovilización desaparece (Sentencia C-799/2003).

INSTRUCCIÓN: Reconoce la falta con transparencia. Acéptate a la subsanación en sitio.
NUNCA digas que la infracción desaparece — la frase correcta es "la falta queda subsanada".
Ataca solo la inmovilización, no el comparendo.`
    : `ARQUETIPO DETECTADO: OFICIAL ACTUANDO CORRECTAMENTE (Modo B honesto)

RAZONAMIENTO PREVIO OBLIGATORIO:
1. La falta es real, objetiva y el oficial tiene prueba técnica válida.
2. El procedimiento (comparendo e inmovilización si aplica) es completamente legal.
3. NO existe defensa técnica válida contra el fondo del comparendo.

INSTRUCCIÓN: No generes un guion de defensa falso. Esta función para este arquetipo
genera una asesoría directa y honesta al usuario sobre sus opciones reales:
- Informar las consecuencias exactas (código, valor en SMLDV y pesos aproximados).
- Indicar el descuento del 50% por pago oportuno dentro de los 5 días hábiles siguientes.
- Si hay inmovilización, informar cómo recuperar el vehículo.
- Tono empático, profesional y sin falsas esperanzas.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: PROMPT_GUION_FASE2 + `

═══ DATOS DEL CASO ACTUAL ═══
TEMA: ${clasificacion.tema}
TIPO DE VEHÍCULO: ${clasificacion.clase || "No especificado"}
MÉTODO DE CONTROL: ${clasificacion.metodo || "No especificado"}
SUBSANABLE EN SITIO: ${clasificacion.subsanableEnSitio ? "Sí" : "No"}

${instruccionArquetipo}

═══ EJEMPLO DE REFERENCIA OBLIGATORIA (estudia esta estructura y aplícala) ═══
${ejemploRelevante}

INSTRUCCIÓN CRÍTICA: Escribe la respuesta estructurada estrictamente en las dos secciones indicadas (1. RAZONAMIENTO JURÍDICO, 2. GUION DE VOZ PARA EL OFICIAL):
- Adapta el razonamiento y el guion al caso específico usando el mismo tono profesional y técnico del ejemplo de referencia.` },
      {
        role: "user",
        content: `HECHOS DEL CASO:
${clasificacion.resumenHechos}

NORMAS APLICABLES:
${normas || "Sin normas específicas recuperadas. Usa principios transversales."}

Genera el razonamiento jurídico y el guion de voz para este caso específico estructurados en las dos secciones requeridas.`,
      },
    ],
    temperature: 0.2,
  });

  const guion = (completion.choices[0].message.content || "").trim();

  const t1 = performance.now();
  console.log(`[GENERADOR GUION F2] Tema: ${clasificacion.tema} | Arquetipo: ${clasificacion.arquetipo} | ${Math.round(t1 - t0)}ms`);

  return guion;
}

export async function generarGuionFase3(
  openai: OpenAI,
  clasificacion: ClasificacionConsulta,
  normas: string,
  historial: ChatMessage[]
): Promise<{ guion: string; descripcionIrregularidad: string }> {
  const t0 = performance.now();
  
  // Seleccionar ejemplo específico según el tema
  const ejemploRelevante = seleccionarEjemploPorTema(clasificacion.tema);

  // Resumen del historial para contexto de la escalada
  const historialResumen = historial
    .map(m => `[${m.role.toUpperCase()}]: ${m.content.substring(0, 300)}`)
    .join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: PROMPT_GUION_FASE3 + `

═══ DATOS DEL CASO ACTUAL ═══
TEMA: ${clasificacion.tema}
TIPO DE VEHÍCULO: ${clasificacion.clase || "No especificado"}
MÉTODO DE CONTROL: ${clasificacion.metodo || "No especificado"}

═══ EJEMPLO DE REFERENCIA OBLIGATORIA (estudia la Fase 3 de este ejemplo) ═══
${ejemploRelevante}

INSTRUCCIÓN CRÍTICA: Genera el guion escalado siguiendo EXACTAMENTE la estructura de la Fase 3 del ejemplo:
- Reitera el argumento legal previo
- Menciona Abuso de Autoridad si aplica
- Solicita identificación del oficial
- Mantiene tono firme pero respetuoso` },
      {
        role: "user",
        content: `HECHOS DEL CASO:
${clasificacion.resumenHechos}

HISTORIAL DE LA CONVERSACIÓN:
${historialResumen}

NORMAS APLICABLES:
${normas || "Sin normas específicas recuperadas. Usa principios transversales."}

Genera el guion escalado y la descripción de irregularidad siguiendo la estructura del ejemplo de referencia.`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const raw = JSON.parse(completion.choices[0].message.content || "{}");

  const t1 = performance.now();
  console.log(`[GENERADOR GUION F3] Tema: ${clasificacion.tema} | Ejemplo: ${clasificacion.tema} | ${Math.round(t1 - t0)}ms`);

  return {
    guion: raw.guion || "",
    descripcionIrregularidad: raw.descripcionIrregularidad || "Irregularidad en el procedimiento",
  };
}

// ═══ PROMPT FASE 2B: Asesoria Honesta (oficial tiene razon, falta real) ═══
const PROMPT_ASESORIA_2B = `Eres un abogado especialista en tránsito y transporte de Colombia.
La situación es: el usuario cometió una falta REAL de tránsito y ya recibió un guión de subsanación. Ahora el oficial va a proceder con el comparendo, y ESTÁ EN SU DERECHO porque la falta existió.

Tu tarea es generar una ASESORÍA HONESTA para el usuario. NO es un guión de voz para decirle al oficial. Es asesoría directa al usuario.

ESTRUCTURA OBLIGATORIA:
1. RECONOCIMIENTO: Comenzar con "Entendido." y reconocer que el oficial está en su derecho de imponer el comparendo por la infracción específica, citando el código de infracción si lo conoces.
2. EXPLICACIÓN: La subsanación (lo que el usuario hizo, por ejemplo bajar al acompañante) elimina la posibilidad de INMOVILIZACIÓN del vehículo, pero el comparendo por la infracción SÍ es procedente.
3. RECOMENDACIONES prácticas con viñetas:
   - Firmar el comparendo normalmente. NO firmar bajo protesta ya que no hay irregularidad en el procedimiento.
   - Aprovechar el descuento por pronto pago: si paga dentro de los primeros 5 días hábiles puede obtener hasta el 50% de descuento.
   - Guardar copia del comparendo y del video del procedimiento.
   - Verificar que el comparendo sea por la infracción correcta. Si el oficial registra otra infracción diferente, anotar la observación.
4. CIERRE: Terminar con "((¿Tiene alguna otra pregunta sobre este procedimiento?))"

REGLAS:
1. Tono honesto, directo, útil y empático. No seas condescendiente.
2. NO inventes normas ni artículos.
3. Escribe en español colombiano correcto con todas las tildes (á, é, í, ó, ú), eñes (ñ) y signos de interrogación/exclamación (¿? ¡!). NUNCA escribas "Senor", siempre "Señor". NUNCA omitas tildes ni eñes.
4. NO uses formato de guión de voz. NO empieces con "Señor agente". Esto es asesoría DIRECTA al usuario.
5. Usa la información del HISTORIAL para saber qué falta cometió y qué subsanación se realizó.

SALIDA: Solo el texto de la asesoría. Sin comillas envolventes. Sin prefijos.`;

export async function generarAsesoria2b(
  openai: OpenAI,
  clasificacion: ClasificacionConsulta,
  historial: ChatMessage[]
): Promise<string> {
  const t0 = performance.now();

  // Resumen del historial para contexto
  const historialResumen = historial
    .map(m => `[${m.role.toUpperCase()}]: ${m.content.substring(0, 400)}`)
    .join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: PROMPT_ASESORIA_2B },
      {
        role: "user",
        content: `TEMA: ${clasificacion.tema}

HECHOS DEL CASO:
${clasificacion.resumenHechos}

HISTORIAL DE LA CONVERSACIÓN:
${historialResumen}

Genera la asesoría honesta para el usuario.`,
      },
    ],
    temperature: 0.3,
  });

  const asesoria = (completion.choices[0].message.content || "").trim();

  const t1 = performance.now();
  console.log(`[GENERADOR ASESORIA 2B] Tema: ${clasificacion.tema} | ${Math.round(t1 - t0)}ms`);

  return asesoria;
}
