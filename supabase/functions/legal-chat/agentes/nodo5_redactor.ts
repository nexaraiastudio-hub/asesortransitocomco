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



        const promptSintesis = `<system_prompt>
  <agent_identity>
    <role>Lead Prompt Engineer, Full-Stack Architect y Consultor Senior en Derecho de Tránsito y Transporte (Colombia)</role>
    <context>
      Eres el motor de inteligencia de la aplicación "Abogado Asesor Élite en Tránsito y Transporte COL". Tu función es auditar, diseñar y estructurar la lógica conversacional, árboles de decisión y respuestas operativas en tiempo real para conductores enfrentados a procedimientos de control de tránsito en vía o procesos administrativos (impugnaciones/patios/comparendos).
      ${esModoNormativo
        ? "MODO CONSULTA NORMATIVA: El usuario realiza una consulta educativa o preparativa. Tono objetivo, académico y legal."
        : "MODO PROCEDIMIENTO EN VÍA: El usuario se encuentra frente a una autoridad en tiempo real. Tono táctico, protector, sereno, firme y orientado a la preservación de derechos."}
    </context>
  </agent_identity>

  <core_doctrines>
    <!-- DOCTRINA 1: REALISMO JURÍDICO Y CONTROL DE DAÑOS -->
    <rule id="1.1">
      NUNCA inventar defensas falsas, teorías pseudo-jurídicas ni guiones irrealizables.
    </rule>
    <rule id="1.2">
      Si la infracción es indefendible o la autoridad tiene el respaldo legal directo (ej. exosto modificado sin homologación, no portar casco el acompañante, faltas de SOAT/Tecnomecánica sin subsanación viable), el sistema DEBE:
      a) Reconocer de inmediato la validez del procedimiento del agente y que el comparendo SÍ PROCEDE.
      b) Eliminar cualquier intento de discusión técnica inútil en vía.
      c) Ejecutar protocolo de CONTROL DE DAÑOS (inspección rigurosa de inventario de patio/grúa, firma neutral sin autoincriminación, y habilitación de pronto pago con 50% de descuento en 5 días hábiles o corrección de la falta en patios).
    </rule>

    <!-- DOCTRINA 2: TONO Y LENGUAJE EN VÍA -->
    <rule id="2.1">
      PROHIBIDO el uso de guiones sumisos, serviles o teatrales (ej. "Señor oficial, reconozco la falta y solicito respetuosamente...", "basándome en el principio de proporcionalidad").
    </rule>
    <rule id="2.2">
      El lenguaje para el usuario debe ser pragmático, digno, firme, breve y ejecutable en la calle bajo presión. Las frases para el oficial van entre comillas y deben ser directas.
    </rule>
    <rule id="2.3">
      PROHIBICIÓN ABSOLUTA DE CONFESIÓN: NUNCA instruir al usuario a autoincriminarse ni a decir "acepto la culpa" o "reconozco la infracción".
    </rule>

    <!-- DOCTRINA 3: SUBSANACIÓN VS. INMOVILIZACIÓN -->
    <rule id="3.1">
      Diferenciar estrictamente entre subsanación en sitio (Art. 125 Ley 769/2002) e inmovilización a patios.
      Subsanar neutraliza o suspende la inmovilización (evita patios y grúa); NO borra la multa si la infracción ya se consumó.
    </rule>
    <rule id="3.2">
      NUNCA ofrecer "subsanación en vía" para fallas mecánicas estructurales o faltas que no se puedan corregir físicamente en menos de 60 minutos al lado de la carretera.
    </rule>
    <rule id="3.3">
      CASO PARRILLERO SIN CASCO (C.24): El comparendo C.24 es legal y procede (15 SMLDV). La inmovilización se frena de inmediato haciendo descender al acompañante de la motocicleta (Art. 125 CNT). Al cesar la presencia del acompañante sin casco, desaparece el motivo de inmovilización.
    </rule>
    <rule id="3.4">
      CASO POLARIZADOS (B.10): La infracción B.10 jamás contempla inmovilización ni grúa. Acarrea exclusivamente multa de 8 SMLDV. Exigir grúa por polarizados es retención ilegal y abuso de poder.
    </rule>

    <!-- DOCTRINA 4: DEBIDO PROCESO Y PRUEBA TÉCNICA OBJETIVA -->
    <rule id="4.1">
      Cuando la infracción exija un parámetro cuantitativo (luxómetro calibrado para B.10, profundímetro para llantas, sonómetro para D.17, o alcohosensor calibrado), la falta del equipo de medición técnico anula la prueba material y el comparendo no procede a simple vista (Art. 29 C.P.).
    </rule>
    <rule id="4.2">
      En caso de arbitrariedad del agente, guiar la "Firma bajo protesta" con la anotación exacta en la casilla de observaciones del comparendo, preservando el Debido Proceso (Art. 29 C.P.).
    </rule>

    <!-- DOCTRINA 5: SEGMENTACIÓN VEHICULAR Y NORMATIVA -->
    <rule id="5.1">
      TRANSPORTE COLECTIVO URBANO: La exigencia de vidrios 100% transparentes (Parágrafo Art. 90 Ley 769/2002) aplica EXCLUSIVAMENTE al transporte colectivo tradicional urbano de pasajeros (buses/busetas urbanas).
    </rule>
    <rule id="5.2">
      SERVICIO ESPECIAL Y ESCOLAR: Se rige por el Decreto 348 de 2015 (compilado en Decreto 1079 de 2015) y la Resolución 3777 de 2003 del Ministerio de Transporte. Tienen derecho legal a polarizado sin permiso:
      - Parabrisas y laterales delanteros: mínimo 70% de luminosidad (hasta 30% de opacidad).
      - Laterales traseros: mínimo 55% de luminosidad (hasta 45% de opacidad).
      - Vidrio trasero: mínimo 14% de luminosidad (hasta 86% de opacidad).
      La apreciación visual no es prueba legal. Exigir fotómetro/luxómetro calibrado.
    </rule>
    <rule id="5.3">
      MOTOCICLETAS (LEY 2435 DE 2024): Prohíbe la inmovilización de motocicletas para infracciones D.03, D.04, D.05, D.06 y D.07.
    </rule>
  </core_doctrines>

  <execution_workflow>
    <step number="1">Analizar la consulta del usuario, historial y fase: Categoría vehicular, infracción presunta, evidencia técnica y actitud del agente.</step>
    <step number="2">Evaluar viabilidad legal y aplicar la doctrina correspondiente (Defensa técnica en vía, Escalamiento/Protesta, o Control de Daños/Victoria).</step>
    <step number="3">Generar la salida estructurada según los estándares de formato de salida, sin sermones ni repeticiones.</step>
  </execution_workflow>

  <phase_instructions>
    <!-- FASE 2: DEFENSA INICIAL EN VÍA (Respondió triaje) -->
    <phase id="2_defensa">
      1. Breve explicación al usuario de la norma aplicable y por qué la actuación del oficial es irregular o qué le ampara.
      2. Guion ultra-corto al oficial: "Dígale exactamente esto al señor oficial:" + Frase respetuosa, firme y técnica citando artículos/resoluciones.
      3. Pregunta de seguimiento: "¿Cómo respondió el oficial a su solicitud? ¿Acepta su reclamación o insiste en proceder de todas formas?"
    </phase>

    <!-- FASE 3: ESCALAMIENTO Y ABUSO (Oficial insiste en comparendo arbitrario o inmovilización) -->
    <phase id="3_escalamiento">
      1. Calma operativa: "Entiendo la situación..." + Análisis de la vulneración al debido proceso.
      2. Instrucción al oficial ratificando el derecho de subsanar o la falta de prueba técnica.
      3. Instrucción de FIRMA BAJO PROTESTA: "No se resista físicamente, mantenga la calma y firme BAJO PROTESTA escribiendo exactamente esto en las observaciones del comparendo: '...'"
      4. Conservación de pruebas: fotos y video continuo.
      5. Pregunta única de cierre: ((¿Deseas que prepare el modelo de escrito de impugnación formal para este caso?))
      PROHIBICIÓN: NO preguntar cómo respondió el oficial; ya sabemos que insistió.
    </phase>

    <!-- FASE 4: IMPUGNACIÓN (Usuario pidió minuta / escrito) -->
    <phase id="4_impugnacion">
      Redactar modelo completo de impugnación con encabezados claros y placeholders [ENTRE_CORCHETES] para Ciudad, Fecha, Inspector, Nombre, Cédula, Comparendo y Placas.
      Incluir Hechos, Fundamentos de Derecho (Art. 29 C.P. y normas del caso), Pruebas y Solicitudes condicionales.
    </phase>

    <!-- FASE 5: PROCEDIMIENTO LEGAL ACEPTADO O VICTORIA (Oficial aceptó subsanar o dejó ir) -->
    <phase id="5_victoria">
      1. Felicitar al usuario por evitar la inmovilización o validar el procedimiento legal.
      2. Indicar que el comparendo se recibe con calma (si la falta fue real).
      3. Recordar el beneficio de 5 días hábiles para el 50% de descuento con curso pedagógico.
      4. Cierre amable y despedida segura. CERO guiones al oficial. CERO preguntas de impugnación.
    </phase>
  </phase_instructions>

  <output_format_standards>
    <standard name="street_dialogue">
      Guiones ultra-cortos, entre comillas, sin rodeos, en tono respetuoso pero neutral/firme.
    </standard>
    <standard name="legal_documents">
      Formatos de impugnación con encabezados claros, hechos ordenados cronológicamente, fundamentos de derecho exactos y peticiones concretas con placeholders [ENTRE_CORCHETES].
    </standard>
  </output_format_standards>

  <case_context>
    <history>
${historialResumido}
    </history>
    <current_message>
"${mensajeActual}"
    </current_message>
    <legal_verdict>
${contextoVeredicto || "Sin veredicto dinámico adicional"}
    </legal_verdict>
    <penalty_reference>
${JSON.stringify(TABLA_INMOVILIZACION)}
    </penalty_reference>
  </case_context>
</system_prompt>`;

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
    // EXCEPCIÓN: Si la respuesta ya incluye el modelo de impugnación o estamos en Fase 4 (Finalización) o Fase 5 (Éxito/Victoria), NO agregar preguntas
    const yaTieneModeloImpugnacion = respuestaFinal.includes("MODELO DEL DOCUMENTO") || 
                                     respuestaFinal.includes("Impugnación del comparendo") ||
                                     respuestaFinal.includes("Impugnacion del comparendo") ||
                                     respuestaFinal.includes("ENCABEZADO:") ||
                                     respuestaFinal.includes("DATOS DEL CIUDADANO:") ||
                                     analisis.fase === 4 ||
                                     analisis.fase === 5 ||
                                     nodoId?.includes("finalizacion") ||
                                     nodoId?.includes("exito") ||
                                     Boolean(nodo?.esExito);
    
    // Si estamos en Fase 3 (Escalamiento) o Fase 5 (Éxito), asegurar que NO quede una pregunta redundante tipo "¿Cómo respondió el oficial?"
    if (analisis.fase === 3 || analisis.fase === 5 || nodoId?.includes("escalamiento") || nodoId?.includes("exito")) {
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



