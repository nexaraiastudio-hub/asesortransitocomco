// esqueletos.ts — V16 Esqueleto Conversacional Natural (4 Fases)
import type { AnalisisClasificacion, VeredictoJurista } from "./types.ts";

// ═══ BLOQUE FIJO DE SALUDO (Se reproduce EXACTO en primera interaccion) ═══

export const BLOQUE_SALUDO_PROTOCOL = `((Saludos. Soy tu Abogado Asesor Élite en Tránsito y Transporte. Estoy listo para proteger tus derechos de movilidad. PROTOCOLO DE SEGURIDAD: Inicie registro en video y fotografías inmediatamente. Bajo el Artículo 20 de la Constitución Política de Colombia y el Artículo 21 de la Ley 1801 de 2016 (Código Nacional de Seguridad y Convivencia Ciudadana), usted tiene el derecho legítimo de grabar procedimientos públicos. Capture placas, nombres y señalización. Es su prueba reina.))`;

// ═══ FASE 1: TRIAJE ═══
// Saludo (primer mensaje) + preguntas adaptativas especificas al tema detectado. SIN "Pregunta de Control".
// El nodo1_analista genera preguntasAdaptativas[] segun el tema (kit_carretera, polarizados, piques, escape_modificado, etc.)
// El nodo5_redactor usa esas preguntas tecnicas especificas en lugar de preguntas genericas.
export const ESQUELETO_TRIAJE = `{{SALUDO_PROTOCOL}}

{{PREGUNTAS_ADAPTATIVAS_POR_TEMA}}`;

// ═══ FASE 2: ANALISIS + GUION DE VOZ (MODO A - Defensa Agresiva) ═══
// Parrafos naturales de razonamiento -> Guion de voz entre comillas -> Pregunta de cierre natural
export const ESQUELETO_ANALISIS_MODO_A = `{{RAZONAMIENTO_NATURAL}}

Dígale exactamente esto al oficial:

"{{GUION_VOZ}}"

{{INFORMACION_ADICIONAL}}

(({{PREGUNTA_CIERRE_NATURAL}}))`;

// ═══ FASE 2: ANALISIS + GUION DE VOZ (MODO B - Asesoria Honesta) ═══
// Reconoce la falta -> Busca mejor salida -> Guion de solicitud -> Pregunta de cierre
export const ESQUELETO_ANALISIS_MODO_B = `{{RAZONAMIENTO_NATURAL}}

Dígale exactamente esto al oficial:

"{{GUION_VOZ}}"

{{INFORMACION_ADICIONAL}}

(({{PREGUNTA_CIERRE_NATURAL}}))`;

// ═══ FASE 3: CONTINGENCIA ═══
export const ESQUELETO_CONTINGENCIA = `Dígale exactamente esto al señor oficial:

"{{GUION_ESCALADO}}"

Firma Bajo Protesta: Firme el comparendo escribiendo la palabra BAJO PROTESTA junto a su firma, y en el espacio de observaciones escriba exactamente:

"Firmo BAJO PROTESTA. {{DESCRIPCION_IRREGULARIDAD}}. Procedimiento grabado en video. Me reservo el derecho de impugnación dentro de los términos legales. {{HORA_EXACTA}}. {{NOMBRE_OFICIAL}}."

Instrucciones prácticas:
1. Tome foto del comparendo completo (ambas caras).
2. Tome foto de la placa del vehículo oficial y del agente.
3. Tome foto del entorno (señalización, estado de la vía).
4. Guarde el número del comparendo.
5. Anote la hora exacta y el lugar del procedimiento.
{{INSTRUCCION_INMOVILIZACION}}

((¿Deseas que redacte el modelo de impugnación para este caso?))`;

// ═══ FASE 4: IMPUGNACION ═══
export const ESQUELETO_IMPUGNACION = `A continuación le presento el modelo de impugnación. Complete los datos marcados entre corchetes con su información personal.

---

Ciudad y fecha: [Ciudad], [Fecha]

Señor(a)
Inspector(a) de Tránsito y Transporte de [Ciudad]
[Dirección de la Secretaría de Tránsito si se conoce]

**ASUNTO: Impugnación del comparendo No. [NÚMERO DEL COMPARENDO] - {{TIPO_NULIDAD}}**

Respetado(a) Inspector(a):

Yo, **[NOMBRE COMPLETO]**, identificado(a) con cédula de ciudadanía No. **[CÉDULA]**, domiciliado(a) en **[DIRECCIÓN]**, teléfono **[TELÉFONO]**, correo electrónico **[CORREO]**, me dirijo a su despacho dentro del término legal para IMPUGNAR el comparendo que a continuación relaciono:

**I. DATOS DEL COMPARENDO**
- Número del comparendo: [NÚMERO]
- Fecha del comparendo: [FECHA]
- Hora: [HORA]
- Lugar: [LUGAR]
- Placas del vehículo: [PLACAS]
- Código de infracción impuesta: [CÓDIGO]
- Agente que impuso el comparendo: [NOMBRE/PLACA DEL AGENTE]

**II. HECHOS**

{{HECHOS_DINAMICOS}}

**III. FUNDAMENTOS DE DERECHO**

{{FUNDAMENTOS_DINAMICOS}}

**IV. PRUEBAS**

Solicito se tengan como pruebas:
1. Video del procedimiento grabado en el lugar de los hechos.
2. Fotografías del vehículo, comparendo y agente.
3. Copia del comparendo con la anotación BAJO PROTESTA.
4. {{PRUEBAS_ADICIONALES}}
5. Captura de pantalla de esta conversación de asesoría legal.

**V. SOLICITUDES**

Con fundamento en los hechos y normas expuestos, solicito:
a) Se declare la NULIDAD del comparendo No. [NÚMERO] por {{CAUSA_NULIDAD}}.
b) Se ordene la exoneración de los costos de grúa y parqueadero generados por la inmovilización ilegal (si aplica).
c) Se inicie investigación disciplinaria contra el agente [NOMBRE/PLACA] por las irregularidades documentadas (si aplica).
d) Se archive el proceso contravencional.

**VI. NOTIFICACIONES**

Recibo notificaciones en: [DIRECCIÓN], teléfono [TELÉFONO], correo [CORREO].

Cordialmente,

**[NOMBRE COMPLETO]**
C.C. [CÉDULA]
[Ciudad], [Fecha]

---

**Recordatorios Post-Impugnación:**
1. Tiene **5 días hábiles** desde la notificación del comparendo para presentar la impugnación ante la Secretaría de Tránsito correspondiente.
2. Guarde el video completo del procedimiento en al menos 2 dispositivos.
3. Guarde captura de pantalla de esta conversación como soporte de asesoría.
4. Lleve copia física y digital de la impugnación.
5. Solicite radicado o sello de recibido al momento de entregar la impugnación.`;

// ═══ MAP DE PREGUNTAS ADAPTATIVAS HARDCODEADAS (V17) ═══
// Respaldo en código para cuando el AI falla en generarlas.
// Garantiza preguntas técnicas específicas para los temas más comunes.
export const PREGUNTAS_ADAPTATIVAS_MAP: Record<string, string[]> = {
  "llantas": [
    "¿El oficial midió la profundidad del labrado con un profundímetro calibrado, o lo determinó visualmente (con tarjeta, moneda u otro método)?",
    "¿Si usó profundímetro, qué lectura exacta obtuvo en milímetros y le mostró el certificado de calibración vigente del equipo?",
    "¿Qué tipo de vehículo conduce y a qué autoridad pertenece el oficial?",
  ],
  "polarizados": [
    "¿Qué tipo de vehículo conduce? (automóvil particular, camioneta, moto, bus o vehículo escolar — este último cambia completamente la defensa)",
    "¿A qué autoridad pertenece el oficial? (Policía de Tránsito, Agente Civil de Tránsito, Policía Nacional)",
    "¿El oficial utilizó un fotómetro o luxómetro calibrado para medir el porcentaje de transmisión de luz de los vidrios, o lo determinó visualmente?",
  ],
  "kit_carretera": [
    "¿Qué tipo de vehículo conduce? (automóvil, camioneta, moto, bus, camión)",
    "¿Qué elemento específico del kit dice el oficial que le falta? (triángulos de seguridad, extintor, botiquín, chaleco reflectivo, linterna)",
    "¿Tiene la posibilidad de conseguir el elemento faltante en este momento o en un tiempo razonable cercano?",
  ],
  "escape_modificado": [
    "¿El oficial utilizó algún instrumento electrónico como sonómetro o decibelímetro certificado para medir el nivel de ruido del escape, o lo determinó de forma auditiva?",
    "¿Si usó sonómetro, qué lectura en decibeles obtuvo y le mostró el certificado de calibración del equipo?",
  ],
  "ruido_contaminacion_sonora": [
    "¿El oficial utilizó un sonómetro certificado para medir el nivel de ruido del vehículo, o lo determinó de forma auditiva?",
    "¿Si usó sonómetro, qué lectura en decibeles obtuvo y le mostró el certificado de calibración del equipo?",
  ],
  "placa_mal_ubicada": [
    "¿La placa está en su posición original pero sucia u opaca, o está físicamente reubicada en un lugar diferente al original de fábrica?",
    "¿El vehículo tiene placa delantera y trasera originales visibles, o falta alguna de ellas?",
    "¿Qué específicamente dice el oficial que está mal de la placa? (posición, iluminación, obstrucción, soporte, tamaño)",
  ],
  "exceso_velocidad": [
    "¿El oficial usó radar o cinemómetro para medir su velocidad, o fue por criterio visual?",
    "¿Si usó equipo, le mostró la pantalla con la lectura exacta de su velocidad y el certificado de calibración vigente del instrumento?",
    "¿Qué señal de velocidad máxima estaba visible en el tramo donde ocurrió la detención?",
  ],
  "embriaguez": [
    "¿El oficial realizó la prueba con alcohosensor u otro instrumento homologado, o lo está determinando por síntomas físicos o criterio subjetivo?",
    "¿Si usó alcohosensor, qué resultado exacto obtuvo y le mostró el certificado de calibración del equipo?",
  ],
  "alcoholemia_sangre": [
    "¿El oficial realizó la prueba con alcohosensor homologado, o lo está determinando por síntomas físicos?",
    "¿Si usó alcohosensor, qué resultado exacto obtuvo y le mostró el certificado de calibración del equipo?",
  ],
  "drogado_conduciendo": [
    "¿El oficial realizó alguna prueba técnica para determinar el consumo de sustancias, o lo está determinando por síntomas físicos o criterio subjetivo?",
    "¿Qué tipo de prueba realizó y con qué instrumento específico?",
  ],
  "piques": [
    "¿Dónde ocurrió la detención: en vía pública, en parqueadero privado o en pista privada?",
    "¿Qué prueba dice el oficial que tiene: video de cámara de seguridad, radar, testigos presenciales, o simplemente dice que lo observó?",
  ],
  "carrera_ilegal": [
    "¿Dónde ocurrió la detención: en vía pública, en parqueadero privado o en pista privada?",
    "¿Qué prueba dice el oficial que tiene: video de cámara de seguridad, radar, testigos presenciales, o simplemente dice que lo observó?",
  ],
  "casco": [
    "¿Quién no lleva el casco: usted como conductor, el parrillero, o ambos?",
    "¿Tiene algún casco disponible en este momento o definitivamente no cuenta con uno?",
    "¿Existe alguna restricción de parrillero vigente en su ciudad en este horario?",
  ],
  "soat_vencido": [
    "¿El oficial verificó la vigencia del SOAT en el sistema RUNT, o lo determinó por la fecha impresa en el documento físico?",
    "¿Tiene a mano el documento del SOAT o puede verificar la vigencia directamente en el aplicativo del RUNT en este momento?",
  ],
  "licencia": [
    "¿La licencia está vencida, la olvidó en casa, o el oficial dice que la categoría no corresponde al tipo de vehículo que conduce?",
    "¿Puede verificar la vigencia de su licencia en el sistema RUNT en este momento?",
  ],
  "revision_tecnicomecanica": [
    "¿La revisión técnico-mecánica está vencida o nunca se realizó?",
    "¿El oficial verificó la vigencia en el sistema RUNT, o lo determinó únicamente por el sticker físico adherido al parabrisas?",
  ],
  "semaforo": [
    "¿El oficial tiene alguna prueba técnica de la infracción? (cámara de fotomulta, video, fotografía) ¿O dice que lo vio directamente?",
    "¿En qué fase se encontraba el semáforo cuando usted cruzó la intersección? (rojo firme, cambiando de amarillo a rojo, intermitente)",
    "¿Qué tipo de vehículo conduce y en qué ciudad ocurrió?",
  ],
  "luz_fundida": [
    "¿Qué luz específicamente tiene fundida? (faro principal, direccional delantera o trasera, luz de posición, luz de freno)",
    "¿Tiene la posibilidad de conseguir y cambiar el bombillo en este momento o en el corto plazo?",
  ],
  "cinturon_seguridad": [
    "¿En el momento de la detención, el cinturón estaba completamente desabrochado o simplemente mal posicionado?",
    "¿El agente tiene alguna prueba de la infracción? (fotografía, video, cámara de fotomulta) ¿O lo determinó por observación directa?",
  ],
  "parqueo_prohibido": [
    "¿Había señalización visible que prohibiera estacionar en ese lugar? ¿De qué tipo? (señal vertical, demarcación amarilla en el pavimento, zona de parada prohibida)",
    "¿El vehículo fue inmovilizado con cepo o grúa, o solo le están haciendo comparendo?",
  ],
  "chaleco_reflectivo": [
    "¿El chaleco reflectivo no está en el vehículo, o lo tiene pero el oficial dice que no cumple con los requisitos técnicos?",
    "¿Tiene la posibilidad de conseguir un chaleco reflectivo en este momento?",
  ],
  "consulta_general_transito": [
    "¿Qué tipo de vehículo conduce? (automóvil, camioneta, moto, bus, camión)",
    "¿A qué autoridad pertenece el oficial que lo detuvo? (Policía de Tránsito, Agente Civil de Tránsito, Policía Nacional)",
    "¿Qué infracción específica le menciona el oficial y qué prueba dice tener?",
  ],
  // === V18: Entradas adicionales del MAP (aliases y temas nuevos) ===
  "casco_parrillero": [
    "¿En qué ciudad se encuentra?",
    "¿El acompañante tiene casco disponible o definitivamente no cuenta con uno?",
    "¿El oficial le dio oportunidad de subsanar la situación?",
  ],
  "emisiones": [
    "¿Qué tipo de vehículo conduce? (automóvil, camioneta, moto, bus, camión)",
    "¿A qué autoridad pertenece el oficial? (Policía de Tránsito, Agente Civil de Tránsito, Policía Nacional)",
    "¿El oficial utilizó analizador de gases calibrado para medir las emisiones, o lo determinó de otra forma?",
  ],
  "rtm": [
    "¿Qué tipo de vehículo conduce?",
    "¿A qué autoridad pertenece el oficial?",
    "¿La revisión técnico-mecánica está vencida o simplemente no la porta en este momento?",
  ],
  "velocidad": [
    "¿Qué tipo de vehículo conduce?",
    "¿A qué autoridad pertenece el oficial?",
    "¿El oficial utilizó radar calibrado para medir su velocidad? ¿Le mostró el resultado y el certificado de calibración?",
  ],
  "carga": [
    "¿Qué tipo de vehículo conduce? (camión, tractomula, camioneta, otro)",
    "¿A qué autoridad pertenece el oficial?",
    "¿El oficial midió la carga con equipo técnico calibrado (báscula, cinta métrica certificada)?",
  ],
  "transporte_escolar": [
    "¿Qué tipo de servicio presta exactamente?",
    "¿A qué autoridad pertenece el oficial?",
    "¿Qué falta específica le están señalando?",
  ],
};

/**
 * Retorna las preguntas adaptativas hardcodeadas para un tema dado.
 * Primero busca coincidencia exacta, luego coincidencia parcial.
 * Fallback: preguntas genéricas de consulta_general_transito.
 */
export function getPreguntasAdaptativasHardcoded(tema: string): string[] {
  const temaNorm = tema.toLowerCase().trim();
  if (PREGUNTAS_ADAPTATIVAS_MAP[temaNorm]) {
    return PREGUNTAS_ADAPTATIVAS_MAP[temaNorm];
  }
  for (const key of Object.keys(PREGUNTAS_ADAPTATIVAS_MAP)) {
    if (temaNorm.includes(key) || key.includes(temaNorm)) {
      return PREGUNTAS_ADAPTATIVAS_MAP[key];
    }
  }
  return PREGUNTAS_ADAPTATIVAS_MAP["consulta_general_transito"];
}

// ═══ SELECCION DE ESQUELETO V16 ═══
// hayDefensaPrevia: true si el usuario ya recibio al menos una respuesta de defensa (Fase 2+) en el historial
export function seleccionarEsqueleto(analisis: AnalisisClasificacion, veredicto: VeredictoJurista | null, hayDefensaPrevia: boolean = false): string {
  // Fase 4: Impugnacion
  if (analisis.quiereImpugnacion || analisis.fase === 4) {
    return ESQUELETO_IMPUGNACION;
  }

  // Fase 3: Contingencia — SOLO si hay insistencia real Y el usuario ya recibio al menos una defensa previa
  // Si no hay defensa previa, no se puede escalar: el usuario necesita primero un guion de refutacion (Fase 2)
  if ((analisis.insistenciaOficial || analisis.fase === 3) && hayDefensaPrevia) {
    return ESQUELETO_CONTINGENCIA;
  }

  // GUARDIA: Si el analista clasifico fase 3 pero no hay defensa previa, forzar a Fase 2
  // El usuario necesita primero un guion de defensa antes de poder escalar
  if ((analisis.insistenciaOficial || analisis.fase === 3) && !hayDefensaPrevia) {
    console.log("[ESQUELETOS] GUARDIA: Fase 3 solicitada pero sin defensa previa. Forzando Fase 2.");
  }

  // Fase 1: Triaje (faltan datos)
  if (analisis.fase === 1 || analisis.informacionFaltante.length > 0) {
    return ESQUELETO_TRIAJE;
  }

  // Fase 2: Analisis + Guion de Voz
  const modo = veredicto?.modo || analisis.modo || "A";
  if (modo === "B") {
    return ESQUELETO_ANALISIS_MODO_B;
  }
  return ESQUELETO_ANALISIS_MODO_A;
}
