// memoria_casos.ts - Sistema de aprendizaje continuo de casos exitosos

export interface CasoExitoso {
  id?: string;
  created_at?: string;
  tema: string;
  arquetipo: "ABUSO" | "FALTA_INMOVILIZACION_ILEGAL" | "OFICIAL_CORRECTO";
  fase1_usuario: string;
  fase1_respuesta: string;
  fase2_usuario: string;
  fase2_respuesta: string;
  fase2b_usuario?: string;
  fase2b_respuesta?: string;
  fase3_usuario?: string;
  fase3_respuesta?: string;
  argumento_decisivo: string;
  resultado: string;
  fase_resolucion: number | string;
  aprobado: boolean;
  usos: number;
}

/**
 * Detecta si el usuario está reportando éxito en su mensaje
 */
export function detectarExito(mensaje: string): boolean {
  const patronesExito = [
    /se (fue|retir[oó]|retiro)/i,
    /(oficial|agente|polic[ií]a) (cedi[oó]|cedio|dej[oó] ir|dejo ir|se retir[oó])/i,
    /me dej[oó] (ir|pasar|seguir)/i,
    /no (puso|hizo) (comparendo|multa|infracci[oó]n)/i,
    /retir[oó] (el procedimiento|todo|la detenci[oó]n)/i,
    /funcion[oó]|sirvi[oó]|result[oó]/i,
    /gracias.*(funcion[oó]|sirvi[oó]|ayud[oó])/i,
    /excelente|perfecto|muy bien/i,
  ];

  return patronesExito.some(patron => patron.test(mensaje));
}

/**
 * Extrae el resultado del mensaje del usuario
 */
export function extraerResultado(mensaje: string): string {
  // Buscar patrones de resultado
  const patrones = [
    /se (fue|retir[oó]).*$/i,
    /(oficial|agente).*?(cedi[oó]|dej[oó] ir|se retir[oó]).*$/i,
    /me dej[oó] (ir|pasar).*$/i,
    /no (puso|hizo) (comparendo|multa).*$/i,
  ];

  for (const patron of patrones) {
    const match = mensaje.match(patron);
    if (match) return match[0];
  }

  return "Caso resuelto favorablemente";
}

/**
 * Construye un nuevo ejemplo de entrenamiento desde el historial
 */
export function construirCasoDesdeHistorial(
  tema: string,
  arquetipo: CasoExitoso["arquetipo"],
  historial: { role: string; content: string }[],
  faseResolucion: number | string
): Omit<CasoExitoso, "id" | "created_at" | "aprobado" | "usos"> | null {
  if (historial.length < 4) return null;

  const mensajesUsuario = historial.filter(m => m.role === "user");
  const mensajesAsistente = historial.filter(m => m.role === "assistant");

  if (mensajesUsuario.length < 2 || mensajesAsistente.length < 2) return null;

  // Extraer fases
  const fase1Usuario = mensajesUsuario[0]?.content || "";
  const fase1Respuesta = mensajesAsistente[0]?.content || "";
  const fase2Usuario = mensajesUsuario[1]?.content || "";
  const fase2Respuesta = mensajesAsistente[1]?.content || "";

  // Buscar fase 2b (refutación)
  let fase2bUsuario = "";
  let fase2bRespuesta = "";
  for (let i = 2; i < mensajesUsuario.length; i++) {
    const msg = mensajesUsuario[i]?.content || "";
    if (msg.includes("dice que") || msg.includes("me dijo") || msg.includes("afirma")) {
      fase2bUsuario = msg;
      fase2bRespuesta = mensajesAsistente[i]?.content || "";
      break;
    }
  }

  // Buscar fase 3 (contingencia)
  let fase3Usuario = "";
  let fase3Respuesta = "";
  for (let i = mensajesAsistente.length - 1; i >= 0; i--) {
    const msg = mensajesAsistente[i]?.content || "";
    if (msg.includes("Abuso de Autoridad") || msg.includes("Firma Bajo Protesta")) {
      fase3Usuario = mensajesUsuario[i]?.content || "";
      fase3Respuesta = msg;
      break;
    }
  }

  // Extraer argumento decisivo (guion entre comillas de la última fase)
  const ultimaRespuesta = mensajesAsistente[mensajesAsistente.length - 1]?.content || "";
  const matchGuion = ultimaRespuesta.match(/"([^"]+)"/);
  const argumentoDecisivo = matchGuion ? matchGuion[1] : "";

  return {
    tema,
    arquetipo,
    fase1_usuario: fase1Usuario,
    fase1_respuesta: fase1Respuesta,
    fase2_usuario: fase2Usuario,
    fase2_respuesta: fase2Respuesta,
    fase2b_usuario: fase2bUsuario || undefined,
    fase2b_respuesta: fase2bRespuesta || undefined,
    fase3_usuario: fase3Usuario || undefined,
    fase3_respuesta: fase3Respuesta || undefined,
    argumento_decisivo: argumentoDecisivo,
    resultado: extraerResultado(mensajesUsuario[mensajesUsuario.length - 1]?.content || ""),
    fase_resolucion: faseResolucion,
  };
}

/**
 * Formatea casos exitosos para inyectar en el prompt
 */
export function formatearCasosParaPrompt(casos: CasoExitoso[]): string {
  if (casos.length === 0) return "";

  return `
=== CASOS EXITOSOS SIMILARES APRENDIDOS ===
${casos.map((caso, i) => `
CASO ${i + 1}: ${caso.tema} - ${caso.arquetipo}
Fase 1 Usuario: "${caso.fase1_usuario.substring(0, 100)}..."
Fase 1 Respuesta: "${caso.fase1_respuesta.substring(0, 150)}..."
Fase 2 Usuario: "${caso.fase2_usuario.substring(0, 100)}..."
Fase 2 Respuesta: "${caso.fase2_respuesta.substring(0, 150)}..."
${caso.fase2b_respuesta ? `Fase 2b (Refutación): "${caso.fase2b_respuesta.substring(0, 150)}..."` : ''}
Argumento decisivo: "${caso.argumento_decisivo.substring(0, 200)}"
Resultado: ${caso.resultado}
`).join("\n---\n")}
=== FIN CASOS APRENDIDOS ===
`;
}
