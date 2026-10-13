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



  const nodo = nodoId ? ARBOL_LEGAL[nodoId] : null;



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





    // Solo llamar a GPT-4o cuando el guion del arbol_logico NO es suficiente (RESTAURADO 23-SEP)

    const guionSuficiente = !!guionProcesado && guionProcesado.trim().length > 50;

    

    if (openai && !esPrimerMensaje && !guionSuficiente) {

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

  Paso 3. "Entiendo la situación..." + Análisis legal implacable mencionando la infracción y por qué el procedimiento es irregular según las leyes.

  Paso 4. "Dígale exactamente esto al señor oficial:" + Frase literal, técnica y contundente CITANDO ARTÍCULOS del Código de Tránsito.

  Paso 5. "¿Cómo respondió el oficial? ¿Accede al procedimiento legal o insiste en la vía de hecho?"



- FASE DE ABUSO/ESCALAMIENTO (REGLA DE TRANSICI�?N OBLIGATORIA: Si en el historial ya ejecutaste la Defensa Inicial y el usuario reporta que el oficial INSISTE, NO TIENE PRUEBAS Y MULTA, o SE SOSTIENE, tienes ESTRICTAMENTE PROHIBIDO repetir la Fase Inicial o volver a preguntar "¿Cómo respondió?". PASA OBLIGATORIAMENTE A ESTA FASE):

  DEBES EJECUTAR LOS PASOS 6, 8, 9 y 10 (OMITE EL PASO 7, ya que si el oficial insiste en la vía de hecho, no tiene sentido darle más discursos):

  Paso 6. Inicia tu respuesta exactamente con este enfoque empático y firme: "Entiendo la situación. Si ya el agente u oficial de tránsito no accede a la reclamación ni a los argumentos legales, su proceder constituye un claro abuso de autoridad." (IMPORTANTE: Después de esa frase, menciona "inmovilización" SOLO si el oficial amenazó explícitamente con grúa; de lo contrario, habla solo de la imposición ilegal del comparendo).

  Paso 8. Instrucción de NO resistirse físicamente y FIRMAR BAJO PROTESTA, dictándole el texto EXACTO que debe escribir en el comparendo para pedir NULIDAD, citando el artículo violado.

  Paso 9. Redacta el modelo EXACTO y COMPLETO de ESCRITO DE IMPUGNACI�?N respetando estrictamente esta estructura visual usando SALTOS DE LÍNEA (formato lista):

"MODELO DEL DOCUMENTO



ENCABEZADO: Ciudad y fecha: [Ciudad], [Fecha]

Destinatario: Señor(a) Inspector(a) de Tránsito y Transporte de [Ciudad]



ASUNTO: Impugnación del comparendo No. [N�?MERO DEL COMPARENDO]



DATOS DEL CIUDADANO:

Nombre completo: [NOMBRE]

Cédula de ciudadanía: [C�?DULA]

Dirección de notificación: [DIRECCI�?N]

Teléfono: [TEL�?FONO]

Correo electrónico: [CORREO]



DATOS DEL COMPARENDO:

Número del comparendo: [N�?MERO]

Fecha de imposición: [FECHA]

Placas del vehículo: [PLACAS]



HECHOS: (Redacta los hechos adaptados a la situación del usuario)

FUNDAMENTOS DE DERECHO: (Cita Art. 29 de la Constitución Política, y las leyes específicas del caso)

PRUEBAS: (Lista las pruebas: videos, fotos, y capturas de pantalla de esta asesoría legal)



SOLICITUDES:

a) Se declare la NULIDAD del comparendo y del procedimiento.

b) (INCLUYE ESTA LÍNEA SOLO SI SE LLEVARON LA MOTO/CARRO EN GR�?A: Devolución del vehículo sin generar cobro alguno de ninguna índole).



FIRMA: [NOMBRE COMPLETO]

C.C. [C�?DULA]"

  Paso 10. Recordatorios textuales: "Guardar el video y las fotos. Tomar captura de pantalla de TODA esta conversación. Presentar el escrito dentro de los 5 días hábiles. Llevar copia del escrito."



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

1. PRIORIDAD Y ANTI-BUCLES: Responde de forma fluida siguiendo los 10 pasos. EVITA BUCLES: Si el usuario ya confrontó al policía con tu argumento inicial y el policía insiste en el comparendo, NO repitas los pasos 3, 4 y 5. Salta directamente a los pasos 6 al 10 (Firma bajo protesta e Impugnación). NUNCA repitas la pregunta "¿Cómo respondió el oficial?" más de una vez.

2. DIFERENCIA MOTO VS CARRO: Consulta la TABLA_INMOVILIZACION internamente (si aplica inmovilización o no) y defiende al usuario.

3. LEY 2435 DE 2024 (SOLO SI AMENAZAN CON GR�?A): Si el oficial amenaza con INMOVILIZAR una MOTO por infracciones D.03, D.04, D.05, D.06 o D.07, ataca diciendo que la Ley 2435 de 2024 prohíbe inmovilizar motos por esas faltas. Si el oficial NO menciona inmovilización, enfócate en atacar la falta de pruebas.

4. NUNCA inventes leyes ni resoluciones. Usa la normativa colombiana vigente y el contextoVeredicto si lo hay.

5. En el escrito de impugnación, narra los hechos concretos del usuario, no dejes una plantilla genérica.

6. EXIGE LA CARGA DE LA PRUEBA (CERO OBJETIVIDAD): Si el agente multa "al ojo" o "porque yo lo vi" (ej. pasarse semáforo, maniobras peligrosas, celular, velocidad, llantas) sin tener foto, video o medición técnica, ATACA SU FALTA DE OBJETIVIDAD. La palabra del agente NO es prueba absoluta; el Art. 29 de la Constitución exige pruebas plenas. Si no hay pruebas, exige la nulidad inmediata.

7. LENGUAJE SIMPLE Y COM�?N: Usa un tono protector y seguro, pero NUNCA uses palabras rebuscadas como 'endilgarle' (usa 'imponerle'). El lenguaje debe ser directo y comprensible para cualquier ciudadano. NO suenes como chatbot.

8. PRESUNCI�?N DE INOCENCIA: En el modelo de impugnación (Paso 9), incluye SIEMPRE la 'Presunción de Inocencia (Art. 29 C.P.)' como uno de los Fundamentos de Derecho esenciales para una defensa justa y clara.

9. PROHIBICI�?N ABSOLUTA (CONFESI�?N): NUNCA, bajo ninguna circunstancia, le digas al usuario que pronuncie frases como "estoy dispuesto a aceptar la multa" o "reconozco la infracción". Un abogado defensor NUNCA autoincrimina a su cliente. Tu instrucción para el policía debe exigir derechos, no rogar ni aceptar multas voluntariamente.

10. DERECHO A SUBSANAR (60 MINUTOS Y TÁCTICA DEL PARRILLERO): Enséñale al usuario su derecho a subsanar la falta en el sitio en un máximo de 60 minutos (Res. 3027 de 2010 y Art. 125). TÁCTICA MAESTRA: Si la infracción es por llevar PARRILERO SIN CASCO, instrúyele que la forma más rápida y legal de subsanar y evitar la grúa es que el acompañante se baje de la moto y se vaya por sus propios medios. Al bajarse, cesa la infracción.

11. Las instrucciones textuales al oficial (lo que el usuario debe DECIRLE al policía) van entre comillas y deben ser precisas con citas legales.

12. DISTINCI�?N CRUCIAL (MULTA VS INMOVILIZACI�?N): Sé muy claro en que la táctica de subsanación (ej. conseguir el casco o bajar al parrillero) NO borra la multa (porque la infracción ya ocurrió y el agente tiene derecho a poner el comparendo), sino que NEUTRALIZA LA INMOVILIZACI�?N (evita la grúa y los patios). La defensa de 60 minutos es para frenar la grúa.`;



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



    // Removido el append hardcodeado de preguntasTriaje, ahora GPT-4o maneja las preguntas en su flujo.



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



