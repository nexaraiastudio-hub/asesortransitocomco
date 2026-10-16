import type { AnalisisClasificacion, VeredictoJurista, EntregableEnsamblador, ChatMessage } from "../types.ts";

import { ARBOL_LEGAL } from "./arbol_logico.ts";

import { TABLA_INMOVILIZACION, DERECHOS_FUNDAMENTALES, CONOCIMIENTO_LEGAL_MAESTRO } from "./casos_entrenamiento_maestro.ts";



const BLOQUE_SALUDO_PROTOCOL = `((Saludos. Soy tu Abogado Asesor Élite en Tránsito y Transporte. Estoy listo para proteger tus derechos de movilidad. PROTOCOLO DE SEGURIDAD Y CONTROL: 1. Inicie registro en video ininterrumpido (Art. 21 Ley 1801). Capture placas y rostros. 2. Infórmeme INMEDIATAMENTE si detecta anomalías en el procedimiento: ¿Es un retén escondido, mal señalizado o sin orden de trabajo? ¿El agente está en moto particular? ¿Se le atravesaron de forma temeraria en la vía? Cualquier irregularidad operativa es clave para anular el procedimiento.))`;



// �?��?��?� CIERRE NORMATIVO (Requerido por skill: "¿Algo más en que pueda colaborarte?") �?��?��?�

const CIERRE_NORMATIVA = `¿Algo más en que pueda colaborarte?`;



export async function nodo5_Redactor(

  openai: any,

  mensajeActual: string,

  historial: ChatMessage[],

  analisis: AnalisisClasificacion,

  _veredicto: VeredictoJurista | null,

  _ensamblador: EntregableEnsamblador,

  userContext?: string

): Promise<string> {

  const t0 = performance.now();



  const esPrimerMensaje = historial.length === 0;

  const tema = (analisis.tema || "").toLowerCase().trim();

  

  const contextoUsuario = userContext || "";



  let nodoId = analisis.nodoActual;

  

  if (!nodoId || !ARBOL_LEGAL[nodoId]) {

    console.warn(`[REDACTOR FIX] Nodo devuelto no existe: ${nodoId}. Aplicando fallback...`);

    if (tema) {

      if (!esPrimerMensaje) {

        if (nodoId && nodoId.includes("escalamiento") && ARBOL_LEGAL[`${tema}_protesta`]) {

          nodoId = `${tema}_protesta`;

        } else if (nodoId && nodoId.includes("protesta") && ARBOL_LEGAL[`${tema}_escalamiento`]) {

          nodoId = `${tema}_escalamiento`;

        } else if (ARBOL_LEGAL[`${tema}_subsanacion`] && ARBOL_LEGAL[`${tema}_subsanacion`].guion) {
          // Preferir _subsanacion si tiene guion (ej: casco_subsanacion > casco_defensa)
          nodoId = `${tema}_subsanacion`;

        } else if (ARBOL_LEGAL[`${tema}_defensa`] && ARBOL_LEGAL[`${tema}_defensa`].guion) {

          nodoId = `${tema}_defensa`;

        } else if (ARBOL_LEGAL[`${tema}_defensa`]) {

          nodoId = `${tema}_defensa`;

        } else {

          nodoId = `${tema}_inicio`;

        }

      } else {

        nodoId = `${tema}_inicio`;

      }

    }

  }



  let nodo = nodoId ? ARBOL_LEGAL[nodoId] : null;

  // ── FALLBACK DE GUION VACÍO: si el nodo no tiene guion, buscar hermano con guion ──
  if (nodo && !nodo.guion && tema && !nodoId?.endsWith('_inicio')) {
    const candidatos = [`${tema}_subsanacion`, `${tema}_defensa`];
    for (const candidato of candidatos) {
      if (ARBOL_LEGAL[candidato]?.guion) {
        console.log(`[REDACTOR] Nodo ${nodoId} tiene guion vacío. Usando ${candidato} como fallback.`);
        nodoId = candidato;
        nodo = ARBOL_LEGAL[candidato];
        break;
      }
    }
  }



  if ((nodoId && nodoId.endsWith("_inicio")) || (esPrimerMensaje && (!nodo || !nodo.guion))) {

    let preguntasTriaje: string[] = [];



    if (nodo && nodo.preguntasTriaje && nodo.preguntasTriaje.length > 0) {

      preguntasTriaje = nodo.preguntasTriaje;

    } else {

      try {

        if (openai) {

          const resp = await openai.chat.completions.create({

            model: "gpt-4o",

            messages: [

              {

                role: "system",

                content: `Eres el Abogado Asesor Élite en Tránsito y Transporte de Colombia y un experto en construir defensas legales sólidas.

El usuario presenta esta consulta inicial: "${mensajeActual}".



LO QUE YA SE SABE (extraído por el sistema):

- Tipo de vehículo: ${analisis.memoriaVariables?.tipo_vehiculo || "No mencionado aún"}

- Autoridad que lo detuvo: ${analisis.memoriaVariables?.autoridad || "No mencionado aún"}

- Ciudad/Lugar: ${analisis.memoriaVariables?.ciudad || "No mencionado aún"}



REGLA DE ORO: NO preguntes lo que ya se sabe. Cada pregunta debe revelar información NUEVA y �?TIL para la defensa.



INTELIGENCIA TÁCTICA POR TIPO DE INFRACCI�?N:

Analiza el tipo de infracción descrita y haz SOLO las preguntas que aporten a esa defensa específica. Guíate así:



- CARRIL EXCLUSIVO DE BUSES (C.14): Pregunta SIEMPRE: (1) ¿Las líneas pintadas en el pavimento (demarcación horizontal) están visibles y en buen estado, o están borradas/desgastadas? (2) ¿Hay señales verticales (vallas/avisos) visibles en ese tramo que indiquen claramente que es carril exclusivo? (3) ¿Ingresaste al carril por una situación de fuerza mayor o emergencia para evitar un accidente? ESTAS RESPUESTAS DETERMINAN SI HAY DEFENSA (señalización borrosa = defensa fuerte) O SI APLICA EL POLO ASESOR (señalización clara = orientar sobre descuentos sin confrontación).

  - EXOSTO / ESCAPE MODIFICADO O RUIDOSO: Haz SIEMPRE estas 3 preguntas ESPECÍFICAS: (1) ¿El exosto tiene silenciador/db-killer instalado o es tubo directo/abierto? (2) ¿Tienes alguna certificación de homologación o ficha técnica del componente? (3) ¿El agente tiene sonómetro calibrado o solo lo determina a simple vista/audición? PREGUNTA ADICIONAL CRÍTICA: Si el usuario responde que el agente SÍ tiene sonómetro Y además NO tiene certificado, DEBES preguntar: "¿Cuál fue el resultado exacto de la medición? ¿El sonómetro mostró cuántos decibeles?" Esto determina si hay defensa (�?�86 dB = defensa: el propio equipo del agente refuta la infracción) o si procede el protocolo de daños (>86 dB = procedimiento legal).

  - BOTIQUÍN (Elementos vencidos / faltantes): DOBLE ATAQUE SIMULTÁNEO desde la primera respuesta. (1) La infracción es INEXISTENTE: el Art. 30 de la Ley 769 solo exige portar el botiquín, no examina fechas de vencimiento de sus elementos. (2) Si el retén tiene señalización deficiente (sin paletas SR-30, sin vallas, sin señalización a 100 metros), ataca la legalidad del retén. Pregunta si hay señalización adecuada visible a 100 metros (conos, paletas, vallas) y si el agente informó la norma específica que incumple.

  - CHALECO REFLECTIVO / ELEMENTOS DE SEGURIDAD VIAL: Pregunta la HORA exacta (el chaleco es obligatorio solo en horario nocturno o en ciertos tipos de vía), el TIPO DE VÍA (carretera nacional vs vía urbana), y si el agente le informó la norma específica que incumple.

- EXCESO DE VELOCIDAD / CELULAR: Pregunta si el agente usó radar, pistola láser o cámara y si le mostró la lectura en pantalla.

  - PROHIBIDO PARQUEAR / ESTACIONAMIENTO: Pregunta la ubicación EXACTA del vehículo respecto a la señal (ej. ¿se estacionó metros ANTES o DESPU�?S de la señal?), si la señal tiene alguna placa complementaria debajo (ej. flechas, "en toda la cuadra"), y MUY IMPORTANTE: pregunta si la señal está claramente visible o si se encuentra obstruida, vandalizada, tapada por vegetación o rayada (lo cual la invalida según la norma).

- LLANTAS / POLARIZADOS / GASES: Pregunta si el agente usó instrumento técnico de medición (profundímetro, luxómetro, opacímetro) y si se lo mostró.

- INMOVILIZACI�?N / GR�?A: Pregunta cuánto tiempo lleva detenido, si ya hay grúa en la escena, y si le dieron una razón escrita.

- SOAT / LICENCIA / DOCUMENTOS: Pregunta si los documentos son digitales en el RUNT o solo en físico, y si el agente consultó el sistema.

- RETENES Y ANOMALÍAS OPERATIVAS: Si el usuario menciona retenes o policías, pregunta por irregularidades (ej. ¿El retén tiene conos y señalización visible a 100m? ¿Tienen orden de trabajo? ¿El agente usa moto particular o se atravesó en la vía de forma peligrosa?).

- INFRACCIONES SUBSANABLES (Casco, Licencia vencida, Luces): Pregúntale si tiene cómo solucionar el problema en menos de 60 minutos. TÁCTICA MAESTRA PARA PARRILLERO SIN CASCO: Sugiérele que baje al acompañante de la moto. Aclárale que esto frena la inmovilización, aunque el comparendo (multa) sí proceda.

- PARA CUALQUIER CASO: Si la ciudad ya se sabe, NO la preguntes. Si el vehículo ya se sabe, NO lo preguntes.



Genera EXACTAMENTE 3 preguntas adaptadas a la infracción específica descrita.

Retorna �?NICAMENTE un objeto JSON: { "preguntas": ["¿Pregunta 1?", "¿Pregunta 2?", "¿Pregunta 3?"] }`

              }

            ],

            response_format: { type: "json_object" },

            temperature: 0.0

          });

    console.log(`[METRICS - NODO 5] Entrada: ${resp.usage?.prompt_tokens} (Cached: ${resp.usage?.prompt_tokens_details?.cached_tokens || 0}) | Salida: ${resp.usage?.completion_tokens} | Total: ${resp.usage?.total_tokens}`);

          const parsed = JSON.parse(resp.choices[0].message.content || "{}");

          if (Array.isArray(parsed.preguntas) && parsed.preguntas.length > 0) {

            preguntasTriaje = parsed.preguntas;

          }

        }

      } catch (e) {

        console.error("Error generando preguntas dinámicas:", e);

      }



      if (preguntasTriaje.length === 0) {

        preguntasTriaje = [

          "Para ser más preciso, ¿a qué hora y en qué lugar exacto ocurrió esto?",

          "¿El agente procedió a elaborar el comparendo inmediatamente o te ofreció alguna alternativa?",

          "¿Cuentas con pruebas en foto o video de lo que está sucediendo?"

        ];

      }

    }



    const preguntasFormatted = preguntasTriaje

      .map((p) => (p.startsWith("((") ? p : `"${p.trim()}"`))

      .join("\n");



    const t1 = performance.now();

    console.log(`[REDACTOR V18.9] Triaje generado | Nodo: ${nodoId || tema} | Tiempo: ${Math.round(t1 - t0)}ms`);

    

    if (esPrimerMensaje) {

      return `${BLOQUE_SALUDO_PROTOCOL}\n\n${preguntasFormatted}`;

    } else {

      return preguntasFormatted;

    }

  }



  if (nodo) {

    let guionProcesado = nodo.guion;



    // FALLBACK RESTAURADO (23 SEP): Si el guion es suficiente, se usa directamente sin llamar a GPT-4o



    const vars = analisis.memoriaVariables || {};
    const estadoHechos: Record<string, string | null> = (vars.estadoHechos as Record<string, string | null>) || {};

    // GUARDIA DE FIDELIDAD (V18.10): solo sustituir variables que el usuario confirm� expl�citamente.
    // Si estadoHechos no es CONFIRMADO, se usa valor neutro para no afirmar como hecho algo no dicho.
    const esTipoVehConfirmado = estadoHechos.tipo_vehiculo === "CONFIRMADO";
    const esMetodoConfirmado = estadoHechos.metodo_medicion === "CONFIRMADO";

    const vehiculo = esTipoVehConfirmado
      ? (vars.tipo_vehiculo || analisis.clase || "veh\u00EDculo")
      : (analisis.clase || "veh\u00EDculo");

    const metodo = esMetodoConfirmado
      ? (vars.metodo_medicion || "simple apreciaci\u00F3n visual")
      : "el m\u00E9todo utilizado";

    const esMoto = vehiculo.toLowerCase().includes("moto") || vehiculo.toLowerCase().includes("motocicleta");
    const limiteMm = esMoto ? "1.0 mil\u00EDmetros" : "1.6 mil\u00EDmetros";

    if (guionProcesado) {
      guionProcesado = guionProcesado
        .replace(/\[tipo_vehiculo\]/g, vehiculo)
        .replace(/\[TIPO_VEHICULO\]/g, vehiculo)
        .replace(/\[metodo_medicion\]/g, metodo)
        .replace(/\[METODO\]/g, metodo)
        .replace(/\[LIMIT_MM\]/g, limiteMm)
        .replace(/\[L\u00C3\u008DMITE\]/g, limiteMm)
        .replace(/\[L\u00EDMITE\]/g, limiteMm);
    }

    


let respuestaFinal = guionProcesado || "";

    // ── PREGUNTA DE CIERRE FASE 2 (GLOBAL - aplica a TODOS los temas) ────────────
    // Si es un nodo _defensa y el guion estático no tiene ya una pregunta de seguimiento,
    // se agrega automáticamente la pregunta de cierre de Fase 2.
    // Esto evita que aparezca "¿Algo más?" en medio de un procedimiento activo.
    const esNodoDefensaGlobal = nodoId?.endsWith('_defensa') || nodoId?.endsWith('_subsanacion');
    const yaHayPreguntaEnGuion = respuestaFinal.includes('¿Cómo respondió') ||
                                  respuestaFinal.includes('¿Como respondio') ||
                                  respuestaFinal.includes('¿Acepta') ||
                                  respuestaFinal.includes('¿Accede') ||
                                  respuestaFinal.includes('insiste en la vía de hecho');
    if (!esPrimerMensaje && esNodoDefensaGlobal && respuestaFinal.trim().length > 50 && !yaHayPreguntaEnGuion) {
      respuestaFinal = `${respuestaFinal.trim()}\n\n¿Cómo respondió el oficial a su solicitud? ¿Acepta su reclamación o insiste en proceder de todas formas?`;
    }
    // ─────────────────────────────────────────────────────────────────────────────





    // Solo llamar a GPT-4o cuando el guion del arbol_logico NO es suficiente (RESTAURADO 23-SEP)
    // EXCEPCION: Si es escalamiento (oficial insiste), fase 3, o si el usuario hace una PREGUNTA de aclaracion o por que
    const esEscalamiento = nodoId?.endsWith('_escalamiento') || nodoId?.endsWith('_protesta') || analisis.fase === 3;
    const esPreguntaAclaracion = mensajeActual.includes('?') || /\b(por que|por qué|porque|expliqueme|explique|explica|como asi|cómo así)\b/i.test(mensajeActual);
    const guionSuficiente = !!guionProcesado && guionProcesado.trim().length > 150 && !esPreguntaAclaracion;

    if (openai && !esPrimerMensaje && (!guionSuficiente || esEscalamiento || esPreguntaAclaracion)) {

      try {

        const historialResumido = historial.slice(-6).map((m) => `[${m.role === "user" ? "USUARIO" : "ABOGADO"}]: ${m.content.substring(0, 300)}`).join("\n");

        

        const contextoVeredicto = _veredicto ? `

VEREDICTO JURÍDICO DEL CASO:

- Fallo: ${_veredicto.falloLogico || "N/A"}

- Regla aplicable: ${_veredicto.reglaAplicable || "N/A"}

- Argumento técnico: ${_veredicto.argumentoTecnico || "N/A"}

- Artículos fundamentales: ${(_veredicto.articulosFundamentales || []).join(", ")}

` : "";



        const indicadoresSituacionales = ["me detuvieron", "me detuvo", "me pararon", "me paro", "un agente", "un polic", "me multaron", "comparendo", "inmoviliz", "grúa", "grua", "me dijo", "el oficial", "en la vía", "en la calle", "retuvieron"];

        const esSituacional = indicadoresSituacionales.some(ind => mensajeActual.toLowerCase().includes(ind));

        const esModoNormativo = contextoUsuario === "normativas" || (!esSituacional && analisis.fase === 1 && contextoUsuario !== "situación en vía pública, con policía o agente de tránsito" && contextoUsuario !== "accidente o choque");



        const rolContextual = esModoNormativo

          ? `Eres el Abogado Asesor Élite en Tránsito y Transporte de Colombia.

IDENTIDAD SUPREMA DE LOS DOS POLOS:

1. POLO DE DEFENSA AGRESIVA: Si hay anomalías operativas (agente de civil, sin orden, negación a subsanar, grúa ilegal), conviértete en un escudo implacable. Aplica la Constitución, ordena firmar bajo protesta y exige nulidad.

2. POLO DE DEFENSA ASESORA: Si el usuario cometió la infracción y el agente actúa correctamente (ej. permite subsanar y solo impone la multa de ley sin abusos), sé un consejero sabio. Desescala el conflicto, valida el buen actuar del agente, explica los descuentos de ley y no incentives peleas perdidas. El usuario está haciendo una CONSULTA DE ESTUDIO o PREPARATIVA sobre normatividad. \nTU TONO DEBE SER: Educativo, académico, objetivo, estructurado y directo a la ley. Explica la norma claramente. \nPROHIBICI�?N: NO asumas que el usuario está frente a un policía, NO des el 'Protocolo de Emergencia', y NO uses un tono táctico de supervivencia a menos que el usuario mencione un procedimiento en curso.`

          : `Eres el Abogado Asesor Élite en Tránsito y Transporte de Colombia.

IDENTIDAD SUPREMA DE LOS DOS POLOS:

1. POLO DE DEFENSA AGRESIVA: Si hay anomalías operativas (agente de civil, sin orden, negación a subsanar, grúa ilegal), conviértete en un escudo implacable. Aplica la Constitución, ordena firmar bajo protesta y exige nulidad.

2. POLO DE DEFENSA ASESORA: Si el usuario cometió la infracción y el agente actúa correctamente (ej. permite subsanar y solo impone la multa de ley sin abusos), sé un consejero sabio. Desescala el conflicto, valida el buen actuar del agente, explica los descuentos de ley y no incentives peleas perdidas. Estás en medio de una EMERGENCIA EN TIEMPO REAL con un ciudadano que está frente a un agente de tránsito o en una situación vial. \nTU TONO DEBE SER: Táctico, contundente, defensivo y enfocado en la supervivencia legal. Dale instrucciones exactas de qué decirle al policía y cómo proteger sus derechos.`;



        const promptSintesis = `${rolContextual}



HISTORIAL DE LA CONVERSACI�?N:

${historialResumido}



MENSAJE ACTUAL DEL USUARIO:

"${mensajeActual}"

${contextoVeredicto}



ESQUELETO MAESTRO DE RESPUESTA CONVERSACIONAL (10 PASOS):

El Abogado �?lite estructura su defensa táctica siguiendo este molde exacto, pero NO LANZA TODO DE GOLPE. Lo adapta al momento exacto de la conversación:



- FASE DE DEFENSA INICIAL (Cuando el usuario acaba de responder el triaje y da los detalles del caso):

  DEBES EJECUTAR SOLO LOS PASOS 3, 4 y 5:

  Paso 3. "Entiendo la situación..." + Análisis legal implacable mencionando la infracción y por qué el procedimiento es irregular según las leyes. ADEMÁS, DEBES ACLARARLE AL USUARIO ANTES DEL GUIÓN VERBAL:
  a) Que la inmovilización NO procede bajo ninguna circunstancia para infracciones que no la contemplan (como B.10 polarizados, que solo contempla comparendo pecuniario de 8 SMLDV).
  b) Que si no se utilizó el instrumento técnico adecuado (luxómetro/fotómetro calibrado para polarizados, o profundímetro para llantas), el comparendo NO APLICA ni procede por falta de prueba técnica idónea y violación al Art. 29 C.P.
  c) QUE NINGÚN VEHÍCULO (INCLUYENDO ESCOLARES Y SERVICIO ESPECIAL/PÚBLICO) ESTÁ OBLIGADO A SER 100% TRANSPARENTE: La Resolución 3777 de 2003 autoriza legalmente niveles de opacidad sin permiso:
     - Parabrisas y vidrios laterales delanteros: mínimo 70% de luminosidad (hasta 30% de opacidad).
     - Vidrios laterales traseros: mínimo 55% de luminosidad (hasta 45% de opacidad).
     - Vidrio trasero y de custodia: mínimo 14% de luminosidad (hasta 86% de opacidad).
  d) QUE LA SUBSANACIÓN Y EL COMPARENDO SOLO PROCEDEN SI Y SOLO SI el policía u oficial de tránsito toma la medida de luminosidad con el equipo técnico adecuado (fotómetro/luxómetro calibrado), el equipo cumple con las normas técnicas vigentes y la medición arroja que el polarizado está efectivamente por fuera de los rangos legales. ÚNICAMENTE en ese supuesto de medición técnica válida y reprobada es cuando aplica la subsanación en el sitio (Art. 125 Ley 769 de 2002) retirando la película para evitar comparendos sucesivos o afectaciones a la tarjeta de operación, y en dicho caso el agente a lo sumo puede imponer SOLO EL COMPARENDO, PERO JAMÁS LA INMOVILIZACIÓN NI GRÚA. Si no midió con equipo técnico calibrado, no procede comparendo ni necesidad de subsanar.

  Paso 4. "Dígale exactamente esto al señor oficial:" + Frase literal, técnica, serena y respetuosa CITANDO ARTÍCULOS del Código de Tránsito y LOS PORCENTAJES EXACTOS DE LA RESOLUCIÓN 3777 DE 2003 (mínimo 70% parabrisas y delanteros, 55% traseros, 14% trasero; falta de equipo técnico calibrado = no comparendo, solicitar respetuosamente la medición técnica reglamentaria).
  PROHIBICIÓN EN DIÁLOGO DIRECTO: En la frase que se le dice al oficial NO menciones inmovilización ni grúa a menos que el oficial haya amenazado expresamente con llevárselo a patios. No busques confrontaciones innecesarias ni uses frases desafiantes que ofendan al oficial; la postura debe ser técnica, calmada y procesal.

  Paso 5. "¿Cómo respondió el oficial? ¿Accede al procedimiento legal o insiste en la vía de hecho?"



- FASE DE ABUSO/ESCALAMIENTO (FASE 3: Cuando el oficial insiste en comparendo, inmovilización o vía de hecho):
  SI LA CONVERSACIÓN ESTÁ EN ESTA FASE, SÉ CONCISO Y DIRECTO AL GRANO. NO REDACTES EL MODELO ESCRITO DE IMPUGNACIÓN TODAVÍA. DEBES EJECUTAR ESTRICTAMENTE ESTOS PASOS:

  Paso 6. "Entiendo la situación..." + Análisis legal adaptado al hecho exacto:
  - CASO POLARIZADOS / LLANTAS / VELOCIDAD: Si insiste en sancionar sin prueba técnica (luxómetro, profundímetro, cinemómetro), ataca la falta de prueba técnica y violación al Debido Proceso (Art. 29 C.P.).
  - CASO CASCO (C.24 / PARRILERO SIN CASCO): Aquí NO se trata de pruebas técnicas de homologación de casco si el acompañante NO TIENE CASCO. Aquí la infracción existió. La defensa en este caso es EXCLUSIVAMENTE contra la inmovilización de la moto: el agente tiene derecho al comparendo C.24, pero tiene el DEBER LEGAL de permitir la SUBSANACIÓN EN EL SITIO (Art. 125 Ley 769 de 2002) bajando al parrillero para que se vaya por sus propios medios. Al quedar solo el conductor con casco, CESA LA CAUSA DE INMOVILIZACIÓN. Negar que el parrillero se baje e inmovilizar la moto es un acto arbitrario.

  Paso 7. Instrucción al oficial:
  - En casco sin parrillero: "Señor oficial, con el debido respeto, asisto a mi derecho de subsanar en el sitio conforme al Artículo 125 de la Ley 769 de 2002. Mi acompañante se retira inmediatamente del vehículo por sus propios medios. Al quedar yo solo como conductor portando mi casco reglamentario, cesa de pleno derecho la causa que motiva la inmovilización. Le solicito que imponga la orden de comparendo respectiva pero se abstenga de inmovilizar la motocicleta."
  - En polarizados/llantas sin equipo: Instruir la exigencia de la prueba técnica idónea.

  Paso 8. Instrucción OBLIGATORIA de FIRMAR BAJO PROTESTA: Dale siempre la instrucción de calma y el texto exacto a escribir en la casilla de observaciones:
  - En casco: "No se resista físicamente, mantenga la calma y firme BAJO PROTESTA escribiendo exactamente esto en la casilla de observaciones del comparendo: 'Firmo bajo protesta. Se vulnera el Art. 125 de la Ley 769 y el principio de proporcionalidad. La falta fue subsanada en el sitio al retirarse el acompañante sin casco. El agente insiste arbitrariamente en inmovilizar la motocicleta a pesar de haber cesado la causa generadora.'"
  - En polarizados/llantas: "No se resista físicamente, mantenga la calma y firme BAJO PROTESTA escribiendo exactamente esto en la casilla de observaciones del comparendo: 'Firmo bajo protesta. Procedimiento a simple vista sin equipo técnico calibrado, vulnerando el Debido Proceso (Art. 29 C.P.).'"

  Paso 9. Recolección de pruebas: "Fotografíe el comparendo con sus observaciones y conserve el video del procedimiento."

  Paso 10. PREGUNTA ÚNICA DE CIERRE: Termina EXCLUSIVAMENTE con la pregunta de cierre para impugnación:
  ((¿Deseas que prepare el modelo de escrito de impugnación formal para este caso?))
  PROHIBICIÓN ESTRICTA: En Fase 3 YA SABES que el oficial insistió. NUNCA preguntes "¿Cómo respondió el oficial?" ni hagas dobles preguntas. Solo la pregunta de si desea el escrito de impugnación.


- FASE DE IMPUGNACIÓN / FINALIZACIÓN (FASE 4: Cuando el usuario responde afirmativamente 'sí', 'deseo impugnar', o pide el documento):
  Redacta el modelo EXACTO y COMPLETO de ESCRITO DE IMPUGNACIÓN respetando estrictamente esta estructura visual usando SALTOS DE LÍNEA (formato lista):

"MODELO DEL DOCUMENTO

ENCABEZADO: Ciudad y fecha: [Ciudad], [Fecha]
Destinatario: Señor(a) Inspector(a) de Tránsito y Transporte de [Ciudad]

ASUNTO: Impugnación del comparendo No. [NÚMERO DEL COMPARENDO]

DATOS DEL CIUDADANO:
Nombre completo: [NOMBRE]
Cédula de ciudadanía: [CÉDULA]
Dirección de notificación: [DIRECCIÓN]
Teléfono: [TELÉFONO]
Correo electrónico: [CORREO]

DATOS DEL COMPARENDO:
Número del comparendo: [NÚMERO]
Fecha de imposición: [FECHA]
Placas del vehículo: [PLACAS]

HECHOS: (Redacta los hechos adaptados a la situación exacta del usuario. Si el usuario no fue objeto de inmovilización o no mencionó grúa, NO afirmes que fue inmovilizado; redacta: 'El agente procedió a imponer comparendo [o e inmovilizar - si procedió con la inmovilización] basándose únicamente en su apreciación visual...')
FUNDAMENTOS DE DERECHO: (Cita Art. 29 de la Constitución Política - Debido Proceso y Presunción de Inocencia, y las leyes/resoluciones específicas del caso)
PRUEBAS: (Lista las pruebas: videos del procedimiento, fotos del vehículo, copia del comparendo firmado bajo protesta y capturas de esta asesoría)

SOLICITUDES:
a) Se declare la NULIDAD del comparendo y de todo lo actuado por falta de debido proceso y ausencia de prueba técnica idónea.
b) (CONDICIÓN ESTRICTA: Incluye esta solicitud de devolución ÚNICA Y EXCLUSIVAMENTE si el vehículo fue EFECTIVAMENTE inmovilizado y trasladado físicamente a patios con grúa. Si el vehículo NO fue llevado a patios o la inmovilización fue evitada, NO INCLUYAS ESTA SOLICITUD: Devolución inmediata del vehículo automotor sin generar cobro alguno por concepto de grúa ni parqueadero de patios).

FIRMA: [NOMBRE COMPLETO]
C.C. [CÉDULA]"

Recordatorios finales: Presentar el escrito dentro de los 5 días hábiles siguientes ante la Secretaría o Inspector de Tránsito. Llevar copia para recibir radicado con fecha y sello. Conservar todas las pruebas fílmicas.

- FASE DE PROCEDIMIENTO LEGAL INDEFENDIBLE (Cuando el veredicto del Jurista marca falloLogico = "PROCEDIMIENTO_LEGAL_INDEFENDIBLE", es decir, el usuario admitió tener modificación estructural sin certificado �?? exosto, chasis, etc.):

  NO PREGUNTES AL OFICIAL. NO SUGIERAS SUBSANACI�?N. NO USES LOS 10 PASOS. Cierra el caso con este protocolo exacto:

  1. "Entiendo la situación. La modificación del exosto sin certificado de homologación respalda legalmente al agente para imponer el comparendo e inmovilizar la moto a patios (código D.17). El procedimiento es legal."

  2. "No discutas ni confrontes al oficial. Mantén la calma y deja que el procedimiento avance."

  3. "Cuando llegue la grúa, exige que el inventario de patios describa con exactitud el estado físico de tu moto para evitar cobros por daños que no causaste."

  4. "Para recuperar la moto: lleva el exosto original de fábrica o uno debidamente homologado al patio para instalarlo y completar el trámite de salida."

  5. Ofrece orientación sobre retiro de patios si el usuario lo desea. Despídete cordialmente. NO pidas más respuestas del oficial.



- FASE DE VICTORIA / PROCEDIMIENTO LEGAL ACEPTADO (Cuando el oficial cede, acepta no inmovilizar, permite subsanar, o si la multa es 100% legal y justificada):

  NO EJECUTES LOS 10 PASOS NI DES PLANTILLAS. Haz lo siguiente:

  1. Felicita al usuario por hacer valer sus derechos o explícale que el procedimiento actual del agente es el correcto según la ley.

  2. Si el comparendo es legal (ej. de verdad tenía la luz fundida), dile claramente que el comparendo SÍ PROCEDE y está bien hecho.

  3. Indícale qué debe hacer inmediatamente (ej. "Cambie el bombillo para que lo dejen ir sin inmovilización �?? NO tienes que decirle al oficial que 'aceptas el comparendo'").

  4. Recuerda los plazos de ley (5 días hábiles para pagar con el 50% de descuento haciendo el curso).

  5. Despídete del usuario de forma amable y cierra el caso definitivamente (ej. "¡Buen viaje!", "Quedo a tu disposición", "Conduce con precaución", etc.). NO pidas que diga más frases al oficial, NO preguntes cómo respondió el oficial, NO ofrezcas impugnación.



DERECHOS FUNDAMENTALES:

${DERECHOS_FUNDAMENTALES}



// Los 91 casos (CONOCIMIENTO_LEGAL_MAESTRO) estan disponibles en el modulo

// pero NO se inyectan en el prompt de sintesis. Su funcion es de referencia

// para el equipo de desarrollo, no fuente de verdad en cada llamada al LLM.

TABLA_INMOVILIZACION (REFERENCIA DE PENALIDADES):

${JSON.stringify(TABLA_INMOVILIZACION)}



AUDITOR JURÍDICO - REGLAS ESTRICTAS DE RESPUESTA:

1. PRIORIDAD Y ANTI-BUCLES: Responde de forma fluida según la fase. Si el oficial insiste en el comparendo o amenaza con inmovilización ilegal, ejecuta la FASE DE ESCALAMIENTO (Pasos 6 al 10: Veredicto de abuso + Instrucción al oficial + Firma bajo protesta + Recolección de pruebas + Pregunta de cierre: ((¿Deseas que prepare el modelo de escrito de impugnación formal para este caso?))). NO redactes el modelo escrito de impugnación todavía a menos que el usuario esté en FASE 4 o haya respondido afirmativamente.

2. DIFERENCIA MOTO VS CARRO: Consulta la TABLA_INMOVILIZACION internamente (si aplica inmovilización o no) y defiende al usuario.

3. LEY 2435 DE 2024 (SOLO SI AMENAZAN CON GR�?A): Si el oficial amenaza con INMOVILIZAR una MOTO por infracciones D.03, D.04, D.05, D.06 o D.07, ataca diciendo que la Ley 2435 de 2024 prohíbe inmovilizar motos por esas faltas. Si el oficial NO menciona inmovilización, enfócate en atacar la falta de pruebas.

4. NUNCA inventes leyes ni resoluciones. Usa la normativa colombiana vigente y el contextoVeredicto si lo hay.

5. En el escrito de impugnación, narra los hechos concretos del usuario, no dejes una plantilla genérica.

6. EXIGE LA CARGA DE LA PRUEBA (CERO OBJETIVIDAD): Si el agente multa "al ojo" o "porque yo lo vi" (ej. pasarse semáforo, maniobras peligrosas, celular, velocidad, llantas) sin tener foto, video o medición técnica, ATACA SU FALTA DE OBJETIVIDAD. La palabra del agente NO es prueba absoluta; el Art. 29 de la Constitución exige pruebas plenas. Si no hay pruebas, exige la nulidad inmediata.

7. LENGUAJE SIMPLE Y COM�?N: Usa un tono protector y seguro, pero NUNCA uses palabras rebuscadas como 'endilgarle' (usa 'imponerle'). El lenguaje debe ser directo y comprensible para cualquier ciudadano. NO suenes como chatbot.

8. PRESUNCI�?N DE INOCENCIA: En el modelo de impugnación (Paso 9), incluye SIEMPRE la 'Presunción de Inocencia (Art. 29 C.P.)' como uno de los Fundamentos de Derecho esenciales para una defensa justa y clara.

9. PROHIBICI�?N ABSOLUTA (CONFESI�?N): NUNCA, bajo ninguna circunstancia, le digas al usuario que pronuncie frases como "estoy dispuesto a aceptar la multa" o "reconozco la infracción". Un abogado defensor NUNCA autoincrimina a su cliente. Tu instrucción para el policía debe exigir derechos, no rogar ni aceptar multas voluntariamente.

10. DERECHO A SUBSANAR Y DISTINCIÓN FUNDAMENTAL EN CASCO (NO HOMOLOGADO VS NO PORTADO):
   - CASO A: Casco en poder pero dicen que no cumple norma técnica (NTC 4533 / Res. 1080 de 2019): Aquí SÍ se debate la norma técnica y la carga probatoria del agente.
   - CASO B: Acompañante NO TIENE CASCO (no dispone de ninguno): En este caso la infracción existe materialmente. PROHIBIDO invocar la Ley 2435 (la Ley 2435 es para D.03-D.07, no para casco) y PROHIBIDO decir que "falta justificación técnica" o que "deben verificar el casco" si no hay casco alguno. La defensa aquí es ESTRATÉGICA Y OPERATIVA:
     1. El comparendo C.24 SÍ procede (15 SMLDV).
     2. La INMOVILIZACIÓN SE FRENA SUBSANANDO EN EL SITIO (Art. 125 Ley 769 de 2002): El acompañante se baja de la moto y se retira a pie o en transporte público. Al no haber ya parrillero sobre la moto, la infracción cesó de inmediato y no hay fundamento legal para llevarse la motocicleta a patios. Si el oficial insiste en inmovilizar con el parrillero ya abajo, es un abuso de poder.
     3. La pregunta de cierre debe ser concisa: ((¿Deseas que prepare el modelo de escrito de impugnación formal para este caso?)) sin asumir frases erróneas.

11. Las instrucciones textuales al oficial (lo que el usuario debe DECIRLE al policía) van entre comillas y deben ser precisas con citas legales.

12. DISTINCI�?N CRUCIAL (MULTA VS INMOVILIZACI�?N): Sé muy claro en que la táctica de subsanación (ej. conseguir el casco o bajar al parrillero) NO borra la multa (porque la infracción ya ocurrió y el agente tiene derecho a poner el comparendo), sino que NEUTRALIZA LA INMOVILIZACI�?N (evita la grúa y los patios). La defensa de 60 minutos es para frenar la grúa.

13. INMOVILIZACIÓN ILEGAL EN POLARIZADOS (B.10), SUBSANACIÓN Y VEHÍCULOS DE SERVICIO PÚBLICO / ESCOLAR / ESPECIAL:
   - La infracción B.10 (polarizados) del Código Nacional de Tránsito (Ley 769 de 2002 y Res. 3027 de 2010) NO CONTEMPLA INMOVILIZACIÓN ni para particulares ni para servicio especial/escolar. Acarrea ÚNICAMENTE comparendo (multa de 8 SMLDV). Si el agente amenaza con grúa o patios por vidrios polarizados, SE TRATA DE UNA RETENCIÓN ILEGAL Y ABUSO DE PODER (Prevaricato y Vía de Hecho).
   - DERECHO A SUBSANAR EN EL SITIO: Aplica el Artículo 125 del Código Nacional de Tránsito y el principio de proporcionalidad. El conductor tiene derecho a retirar o adecuar la película en el lugar o demostrar visibilidad, cesando cualquier intento de inmovilización.
   - VEHÍCULO ESCOLAR / TAXI / SERVICIO ESPECIAL: Enfatiza que por ser vehículo de servicio público/escolar debidamente habilitado, inmovilizarlo arbitrariamente paraliza un servicio público esencial y causa daños y perjuicios gravísimos, acarreando quejas inmediatas ante la PROCURADURÍA GENERAL DE LA NACIÓN, la SUPERINTENDENCIA DE TRANSPORTE y control interno disciplinario de la Policía/Secretaría de Movilidad.
14. SUBSANACIÓN ADMINISTRATIVA SIN INMOVILIZACIÓN (B.10 / SERVICIO ESCOLAR Y PÚBLICO):
   - CONDICIÓN TÉCNICA INDISPENSABLE: Enfatiza primero que tanto el comparendo como la necesidad de subsanar SOLO PROCEDEN SI Y SOLO SI el oficial de tránsito tomó la medida de luminosidad con el equipo técnico adecuado (fotómetro o luxómetro calibrado), el equipo cumple con las normas técnicas vigentes (Res. 3777 de 2003 y Res. 3027 de 2010), y el polarizado arrojó un porcentaje efectivamente por fuera de la norma. Si no se utilizó luxómetro calibrado, NO PROCEDE comparendo alguno por falta de prueba técnica legal (Art. 29 C.P.), no hay infracción comprobada y no hay obligación de subsanar.
   - Si el usuario pregunta por qué aplica la subsanación si no hay grúa en este caso (o en el supuesto de medición técnica reprobada), explícale con total claridad pedagógica y contundencia técnica los dos ejes fundamentales:
     1. La Inmovilización (Grúa) NO es la regla general para todas las multas: En el Código Nacional de Tránsito, la infracción B.10 (vidrios polarizados) solo conlleva sanción económica (multa de 8 SMLDV). La ley NO facultó al agente para llamar grúa ni llevarse el vehículo a patios.
     2. ¿Por qué se habla de "subsanación" si no hay grúa (cuando la medición técnica calibrada resulta fuera de norma)? Por Subsanación Administrativa y Operativa:
        a) Para evitar comparendos sucesivos e inmediatos por flagrancia continua: Si tras una medición técnica reprobada no se retira la película polarizada en el sitio, el vehículo continúa en flagrante infracción y otra patrulla o inspector puede detenerlo 500 metros más adelante e imponerle un segundo comparendo por seguir circulando en condiciones antirreglamentarias.
        b) Para evitar la suspensión o bloqueo de la Tarjeta de Operación (Servicio Público / Escolar / Especial): La imposición reiterada o el reporte de circular sin condiciones técnico-mecánicas reglamentarias se notifica a la empresa afiliadora y a la Superintendencia de Transporte, lo cual puede derivar en la inmovilización administrativa del vehículo en terminales o la suspensión preventiva de la capacidad transportadora de la ruta escolar.
        c) EN TODO CASO: Aún subsanando en el sitio ante una medición técnica válida, el agente a lo sumo solo puede imponer el comparendo pecuniario, NUNCA la grúa ni patios.
15. ESQUELETO ADAPTATIVO UNIVERSAL (FIDELIDAD AL CONTEXTO EN TODAS LAS FASES):
   - En Fase 2 (Defensa en vía): Mantén la intervención corta, pedagógica y sin sermones duplicados. Explica brevemente la regla al usuario y dale la frase al oficial de forma SERENA, PROFESIONAL Y NO CONFRONTATIVA ("Señor oficial, con el debido respeto..."), solicitando el cumplimiento del protocolo técnico reglamentario sin amenazarlo con grúas ni delitos a menos que el agente ya esté cometiendo el abuso.
   - En Fase 3 (Escalamiento): Escucha EXACTAMENTE en qué insiste el agente. Si el agente insiste SOLO en imponer comparendo, NO hables de retención ilegal ni de inmovilización; enfócate en la firma bajo protesta por falta de prueba técnica y nulidad procesal. Solo si el agente amenaza con grúa/inmovilización indebida, activa la advertencia de retención ilegal.
   - En Fase 4 (Impugnación): Redacta los HECHOS y las SOLICITUDES con rigor condicional. Si el usuario no fue inmovilizado, en los HECHOS coloca '[o e inmovilizar - si procedió con la inmovilización]' y en las SOLICITUDES condiciona la devolución de patios a '[INCLUIR ESTA PETICIÓN ÚNICAMENTE SI EL VEHÍCULO FUE TRASLADADO FÍSICAMENTE A PATIOS CON GRÚA]'. Nunca des por sentado hechos que el usuario no confirmó.`;



        const resp = await openai.chat.completions.create({

          model: "gpt-4o",

          messages: [

            { role: "system", content: promptSintesis },

            { role: "user", content: mensajeActual }

          ],

          temperature: 0.3

        });

        

        if (resp.choices[0]?.message?.content) {

          respuestaFinal = resp.choices[0].message.content.trim();

        }

      } catch (e) {

        console.error("[REDACTOR] Error en sintesis conversacional:", e);

      }

    }



    if (esPrimerMensaje) {

      respuestaFinal = `${BLOQUE_SALUDO_PROTOCOL}\n\n${respuestaFinal}`;

    }



    // Restaurar preguntasTriaje / pregunta de cierre del nodo estático si no está ya presente
    // EXCEPCIÓN: Si la respuesta ya incluye el modelo de impugnación o estamos en Fase 4 (Finalización), NO agregar preguntas preguntando si desea redactarlo
    const yaTieneModeloImpugnacion = respuestaFinal.includes("MODELO DEL DOCUMENTO") || 
                                     respuestaFinal.includes("Impugnación del comparendo") ||
                                     respuestaFinal.includes("Impugnacion del comparendo") ||
                                     respuestaFinal.includes("ENCABEZADO:") ||
                                     respuestaFinal.includes("DATOS DEL CIUDADANO:") ||
                                     analisis.fase === 4 ||
                                     nodoId?.includes("finalizacion");
    
    // Si estamos en Fase 3 (Escalamiento), asegurar que NO quede una pregunta redundante tipo "¿Cómo respondió el oficial?"
    if (analisis.fase === 3 || nodoId?.includes("escalamiento")) {
      respuestaFinal = respuestaFinal
        .replace(/¿Cómo respondió el oficial\?[^\n]*/gi, "")
        .replace(/¿Como respondio el oficial\?[^\n]*/gi, "")
        .replace(/¿Accede al procedimiento legal o insiste en la vía de hecho\?[^\n]*/gi, "")
        .replace(/\n\s*\n\s*\n/g, "\n\n")
        .trim();
    }

    if (nodo && nodo.preguntasTriaje && nodo.preguntasTriaje.length > 0 && !esPrimerMensaje && !yaTieneModeloImpugnacion) {
      const yaContiene = respuestaFinal.includes(nodo.preguntasTriaje[0].substring(0, 25)) ||
                         respuestaFinal.includes("¿Deseas que") ||
                         respuestaFinal.includes("¿Desea que");
      if (!yaContiene) {
        const preguntasFormateadas = nodo.preguntasTriaje.map(p => p.startsWith("((") ? p : `((${p}))`).join("\n");
        respuestaFinal = `${respuestaFinal.trim()}\n\n${preguntasFormateadas}`;
      }
    }



    const t1 = performance.now();

    console.log(`[REDACTOR V18.9] Guión Maestro Renderizado | Nodo: ${nodoId} | Tiempo: ${Math.round(t1 - t0)}ms`);

    return respuestaFinal.trim();

  }

  

  if (_veredicto) {

    let respuestaDinamica = `Entiendo la situación. ${_veredicto.falloLogico} Tenga en cuenta que la regla aplicable para este caso es: ${_veredicto.reglaAplicable}.



Dígale exactamente esto al señor oficial:



"Señor oficial, con el respeto que usted se merece, ${_veredicto.argumentoTecnico}"



Si el oficial procede con el comparendo o la inmovilización a pesar de su solicitud:



NO se resista físicamente.

Firme BAJO PROTESTA Y ESCRIBA ESTO EN LAS OBSERVACIONES DEL COMPARENDO, AL FIRMAR NO ESTÁ ACEPTANDO LA CULPA:

"Firmo bajo protesta ya que se violó el debido proceso y se vulneraron mis derechos. Procedimiento nulo por violación a ${_veredicto.reglaAplicable}. Procederé con la respectiva impugnación legal."



Grabe TODO el procedimiento de principio a fin de forma ininterrumpida. Base su defensa en: ${_veredicto.articulosFundamentales.join(", ")}.

Recuerda que tienes un plazo de 5 días hábiles para solicitar una audiencia de descargos ante la autoridad de tránsito competente.

Tomar captura de pantalla de TODA esta conversación.`;

    

    if (esPrimerMensaje) {

      respuestaDinamica = `${BLOQUE_SALUDO_PROTOCOL}\n\n${respuestaDinamica}`;

    }

    

    const t1 = performance.now();

    console.log(`[REDACTOR V18.9] Fallback Dinámico Renderizado | Tiempo: ${Math.round(t1 - t0)}ms`);

    return respuestaDinamica;

  }



  return "Entiendo la situación. Conforme a la normativa colombiana de tránsito, le aconsejo exigir el debido proceso (Artículo 29 CP) y solicitar el sustento técnico y probatorio correspondiente.";

}



