import OpenAI from "https://deno.land/x/openai@v4.69.0/mod.ts";
import type { AnalisisClasificacion, ChatMessage } from "../types.ts";
import { ARBOL_LEGAL } from "./arbol_logico.ts";

export function getPromptAnalista(): string {
  // Construir catálogo de preguntas de triaje oficiales
  const catalogoPreguntas = Object.entries(ARBOL_LEGAL)
    .filter(([id, nodo]) => id.endsWith("_inicio") && nodo.preguntasTriaje.length > 0)
    .map(([id, nodo]) => `Tema '${id.replace("_inicio", "")}':\n` + nodo.preguntasTriaje.map(p => `  - "${p}"`).join("\n"))
    .join("\n\n");

  return `Eres el NODO 1: NAVEGADOR DE NODOS (HIVE-LAW V18).
Tu misión es identificar el estado actual de la conversación y situar al usuario en el NODO exacto del Grafo Legal.

### PROTOCOLO DE NAVEGACIÓN (V18):
1. IDENTIFICAR TEMA: Determina si es llantas, casco, polarizados, semaforo, luces, choque o 'otro'.
2. IDENTIFICAR NODO: Mira el historial y decide qué nodo del grafo corresponde.

### REGLA DE FIDELIDAD DE HECHOS (CRÍTICA - V18.11):
Antes de asignar cualquier valor a memoriaVariables, clasifica cada dato según su origen real en el objeto estadoHechos:
- CONFIRMADO: el usuario lo dijo explícitamente ("voy en moto", "usó una tarjeta", "soy de Bogotá").
- DESCONOCIDO: el usuario dijo que no sabe ("no sé si estaba en rojo", "no sé qué infracción").
- HIPOTETICO: el usuario lo presentó como suposición ("supongamos que...", "si fuera...").
- NEGADO / CORREGIDO: el usuario lo negó explícitamente ("el vidrio es de fábrica").
REGLA ABSOLUTA: Si un dato NO aparece confirmado explícitamente, su valor debe ser null. NO lo infieras de contexto.
REGLA ANTI-INFERENCIA: "moto" confirma tipo_vehiculo=motocicleta. Pero NO confirma servicio, autoridad, ni metodo_medicion.
REGLA DE CORRECCIONES: Si el usuario corrige un dato ("no tiene película"), pon null en el campo anterior y actualiza estadoHechos a NEGADO/CORREGIDO.

### PREGUNTAS OFICIALES DE TRIAJE POR TEMA:
A continuación se listan las preguntas exactas que el sistema debe hacer para cada tema.
Tu objetivo es analizar el historial y determinar cuáles de estas preguntas YA FUERON RESPONDIDAS (o si el usuario ya dio la información por su cuenta).
Las preguntas que AÚN FALTAN por responder deben colocarse EXACTAMENTE como están escritas aquí en el arreglo 'informacionFaltante'.
Si el tema es 'otro', la información faltante deben ser preguntas dinámicas que tú mismo generes para aclarar el caso (máximo 3).
REGLA DE ORO: Si 'informacionFaltante' NO está vacío, DEBES clasificar el nodoActual como '{tema}_inicio' para que el sistema las pregunte. Solo avanza a '_defensa' o '_subsanacion' cuando 'informacionFaltante' esté vacío.

REGLA DE RESPUESTA EN LISTA: Los usuarios frecuentemente responden múltiples preguntas en una sola línea separadas por comas (ej: "bogota, no lo tenemos, no" responde en orden: ciudad=bogota, tiene_casco=no dispone de ninguno, restriccion=no). En estos casos, considera TODAS las preguntas respondidas y pon 'informacionFaltante' como [].

REGLA ANTI-LOOP: Si en el historial ya existe un mensaje del ABOGADO con las preguntas de triaje Y el USUARIO respondió algo en el siguiente turno (aunque sea corto), considera que ese turno contiene las respuestas. NO repitas las mismas preguntas. Extrae los datos de la respuesta y avanza al siguiente nodo.

CATÁLOGO:
${catalogoPreguntas}

### SALIDA JSON ÚNICAMENTE:
{
  "tema": "llantas" | "polarizados" | "casco" | "semaforo" | "luces" | "choque" | "otro" | "fuera_de_dominio",
  "nodoActual": string,
  "fase": 1 | 2 | 3 | 4 | 5,
  "clase": "automovil" | "motocicleta" | "camioneta" | "campero" | "bus" | "camion" | "tractocamion" | "otro" | null,
  "servicio": "particular" | "publico" | "oficial" | "diplomatico" | null,
  "tipoInfraccion": string | null,
  "memoriaVariables": {
    "tipo_vehiculo": string | null,
    "autoridad": string | null,
    "metodo_medicion": string | null,
    "ciudad": string | null,
    "estadoHechos": {
      "tipo_vehiculo": "CONFIRMADO" | "DESCONOCIDO" | "HIPOTETICO" | "NEGADO" | "CORREGIDO" | null,
      "autoridad": "CONFIRMADO" | "DESCONOCIDO" | "HIPOTETICO" | "NEGADO" | "CORREGIDO" | null,
      "metodo_medicion": "CONFIRMADO" | "DESCONOCIDO" | "HIPOTETICO" | "NEGADO" | "CORREGIDO" | null,
      "ciudad": "CONFIRMADO" | "DESCONOCIDO" | "HIPOTETICO" | "NEGADO" | "CORREGIDO" | null,
      "hipotetico": string | null
    }
  },
  "insistenciaOficial": boolean,
  "quiereMinuta": boolean,
  "objetivoAlcanzado": boolean,
  "informacionFaltante": string[]
}
`;
}

export async function nodo1_Analista(
  openai: OpenAI,
  mensaje: string,
  historial: ChatMessage[]
): Promise<AnalisisClasificacion> {
  const t0 = performance.now();
  const historialTexto = historial.length > 0
    ? `\n\nHISTORIAL DE DIÁLOGO:\n${historial.map((m) => `[${m.role.toUpperCase()}]: ${m.content}`).join("\n")}`
    : "";

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: getPromptAnalista() },
      { role: "user", content: `MENSAJE ACTUAL: "${mensaje}"${historialTexto}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.0,
  });

  console.log(`[METRICS - NODO 1] Entrada: ${completion.usage?.prompt_tokens} | Salida: ${completion.usage?.completion_tokens}`);

  const analisis = JSON.parse(completion.choices[0].message.content || "{}") as AnalisisClasificacion;
  
  if (!Array.isArray(analisis.informacionFaltante)) {
    analisis.informacionFaltante = [];
  }

  // REGLAS POST-PROCESAMIENTO DE NAVEGACION
  const ultimoMensajeBot = historial.slice().reverse().find((m) => m.role === "assistant")?.content || "";
  const mensajeNormalizado = mensaje.toLowerCase().trim();
  const esAfirmativo = ["si", "sí", "ya", "si ya", "listo", "redáctalo", "redactalo", "por favor", "claro", "adelante", "ok"].some(
    (kw) => mensajeNormalizado === kw || mensajeNormalizado.startsWith(kw)
  );

  const tieneComparendo = /\bcomparendo\b|\bmulta\b|\bsanción\b/i.test(mensajeNormalizado);
  const tieneInmovilizacion = /inmovil|\binmovilizar\b|\binmovilización\b|\bgrúa\b|\bremolque\b/i.test(mensajeNormalizado);
  const detectaInsistenciaTexto = /\bno acepta\b|\binsiste\b|\bquiere hacer\b|\bva a hacer\b|\bno quiere\b|\bse niega\b|\brechaz/i.test(mensajeNormalizado);
  if (detectaInsistenciaTexto) {
    analisis.insistenciaOficial = true;
  }
  const ofrecioComparendo = tieneComparendo && !tieneInmovilizacion;
  const ofrecioInmovilizacion = tieneInmovilizacion && !tieneComparendo;
  const ofrecioNinguno = !tieneComparendo && !tieneInmovilizacion;

  const ofrecioConciliacion = ultimoMensajeBot.includes("Acta de Conciliación");
  const ofrecioSoloMulta = ultimoMensajeBot.includes("solicitar la nulidad de esta multa") || ultimoMensajeBot.includes("sin inmovilización");
  const ofrecioImpugnacion = ultimoMensajeBot.includes("impugnación") || ultimoMensajeBot.includes("impugnacion") || ultimoMensajeBot.includes("apelación") || ultimoMensajeBot.includes("apelacion") || ultimoMensajeBot.includes("documento");

  const oficialAceptoOVictoria = /acept[oó]|me deja ir|va a dejar ir|solo el comparendo|solo comparendo|no se lleva la moto|no se lleva el carro|no va a inmovilizar|no me va a inmovilizar|solo va a hacer el comparendo|solo va a imponer el comparendo|acepta subsanar|deja ir/i.test(mensajeNormalizado);

  if (oficialAceptoOVictoria) {
    analisis.nodoActual = analisis.tema + '_exito';
    analisis.fase = 5;
    analisis.insistenciaOficial = false;
    analisis.informacionFaltante = [];
    analisis.objetivoAlcanzado = true;
  } else if (analisis.tema === "choque" && ofrecioComparendo) {
    analisis.nodoActual = "choque_solo_comparendo";
  } else if (analisis.tema === "choque" && ofrecioInmovilizacion) {
    analisis.nodoActual = "choque_solo_inmovilizacion";
  } else if (esAfirmativo && ofrecioConciliacion) {
    analisis.nodoActual = "choque_acta_conciliacion";
  } else if (esAfirmativo && ofrecioSoloMulta) {
    analisis.nodoActual = "choque_finalizacion_solo_multa";
  } else if (ofrecioImpugnacion && (esAfirmativo || tieneComparendo || tieneInmovilizacion || mensajeNormalizado.includes("redacta") || mensajeNormalizado.includes("modelo") || mensajeNormalizado.includes("escrito") || mensajeNormalizado.includes("impugnar") || mensajeNormalizado.includes("apelar"))) {
    // REGLA DE FINALIZACIÓN / FASE 4: El bot ofreció el documento de impugnación/apelación y el usuario lo aceptó o pidió
    analisis.nodoActual = analisis.tema + '_finalizacion';
    analisis.fase = 4;
  } else if (analisis.insistenciaOficial && !analisis.nodoActual?.endsWith('_inicio')) {
    // REGLA DE ESCALAMIENTO: Si el oficial insiste y ya pasamos triaje, escalar SIEMPRE a Fase 3
    analisis.nodoActual = analisis.tema + '_escalamiento';
    analisis.fase = 3;
  } else if (analisis.tema === "llantas" && historial.length > 0 && tieneComparendo && !tieneInmovilizacion && (mensajeNormalizado.includes("subsan") || mensajeNormalizado.includes("cambiar") || mensajeNormalizado.includes("repuesto") || mensajeNormalizado.includes("deja") || mensajeNormalizado.includes("permite"))) {
    analisis.nodoActual = "llantas_solo_comparendo";
    analisis.fase = 3;
  } else if (analisis.informacionFaltante.length > 0) {
    // REGLA ANTI-LOOP: Si el bot ya hizo las preguntas de triaje en el turno anterior
    // y el usuario respondió algo en este turno, no retener en _inicio.
    const botYaPregunto = ultimoMensajeBot.includes('¿En qué') || 
                          ultimoMensajeBot.includes('¿El acompañante') ||
                          ultimoMensajeBot.includes('¿A qué autoridad') ||
                          ultimoMensajeBot.includes('¿Qué tipo de vehículo') ||
                          ultimoMensajeBot.includes('¿El agente utilizó') ||
                          ultimoMensajeBot.includes('¿Existe alguna restricción') ||
                          ultimoMensajeBot.includes('¿Cuál es la');
    const usuarioYaRespondio = mensaje.trim().length > 2 && !mensaje.includes('?');
    if (botYaPregunto && usuarioYaRespondio) {
      // Forzar avance: el usuario respondió, aunque GPT no detectó las respuestas
      analisis.informacionFaltante = [];
      if (analisis.nodoActual?.endsWith('_inicio')) {
        if (analisis.tema === 'casco') analisis.nodoActual = 'casco_subsanacion';
        else if (analisis.tema === 'choque') analisis.nodoActual = 'choque_defensa';
        else analisis.nodoActual = analisis.tema + '_defensa';
        analisis.fase = 2;
      }
      console.log(`[NODO 1 - ANTI-LOOP] Bot ya preguntó y usuario respondió. Avanzando a: ${analisis.nodoActual}`);
    } else {
      // REGLA SUPREMA: Si realmente faltan datos, retener en inicio.
      analisis.nodoActual = analisis.tema + '_inicio';
    }
  } else if (analisis.nodoActual && analisis.nodoActual.endsWith('_inicio')) {
    // Si no falta información pero sigue en inicio, avanzarlo a defensa/subsanacion
    if (analisis.tema === 'casco') analisis.nodoActual = 'casco_subsanacion';
    else if (analisis.tema === 'choque') analisis.nodoActual = 'choque_defensa';
    else analisis.nodoActual = analisis.tema + '_defensa';
  }

  const t1 = performance.now();
  console.log(`[NODO 1 - V18.11] Nodo final: ${analisis.nodoActual} | Tema: ${analisis.tema} | Faltan: ${analisis.informacionFaltante.length} | Tiempo: ${Math.round(t1 - t0)}ms`);
  
  return analisis;
}
