import type { AnalisisClasificacion, VeredictoJurista, EntregableEnsamblador, ChatMessage } from "../types.ts";
import { ARBOL_LEGAL } from "./arbol_logico.ts";
import { TABLA_INMOVILIZACION, DERECHOS_FUNDAMENTALES, CONOCIMIENTO_LEGAL_MAESTRO } from "./casos_entrenamiento_maestro.ts";

const BLOQUE_SALUDO_PROTOCOL = `((Saludos. Soy tu Abogado Asesor Ã‰lite en TrÃ¡nsito y Transporte. Estoy listo para proteger tus derechos de movilidad. PROTOCOLO DE SEGURIDAD Y CONTROL: 1. Inicie registro en video ininterrumpido (Art. 21 Ley 1801). Capture placas y rostros. 2. InfÃ³rmeme INMEDIATAMENTE si detecta anomalÃ­as en el procedimiento: Â¿Es un retÃ©n escondido, mal seÃ±alizado o sin orden de trabajo? Â¿El agente estÃ¡ en moto particular? Â¿Se le atravesaron de forma temeraria en la vÃ­a? Cualquier irregularidad operativa es clave para anular el procedimiento.))`;

// â•â•â• CIERRE NORMATIVO (Requerido por skill: "Â¿Algo mÃ¡s en que pueda colaborarte?") â•â•â•
const CIERRE_NORMATIVA = `Â¿Algo mÃ¡s en que pueda colaborarte?`;

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
                content: `Eres el Abogado Asesor Ã‰lite en TrÃ¡nsito y Transporte de Colombia y un experto en construir defensas legales sÃ³lidas.
El usuario presenta esta consulta inicial: "${mensajeActual}".

LO QUE YA SE SABE (extraÃ­do por el sistema):
- Tipo de vehÃ­culo: ${analisis.memoriaVariables?.tipo_vehiculo || "No mencionado aÃºn"}
- Autoridad que lo detuvo: ${analisis.memoriaVariables?.autoridad || "No mencionado aÃºn"}
- Ciudad/Lugar: ${analisis.memoriaVariables?.ciudad || "No mencionado aÃºn"}

REGLA DE ORO: NO preguntes lo que ya se sabe. Cada pregunta debe revelar informaciÃ³n NUEVA y ÃšTIL para la defensa.

INTELIGENCIA TÃCTICA POR TIPO DE INFRACCIÃ“N:
Analiza el tipo de infracciÃ³n descrita y haz SOLO las preguntas que aporten a esa defensa especÃ­fica. GuÃ­ate asÃ­:

- CARRIL EXCLUSIVO DE BUSES (C.14): Pregunta SIEMPRE: (1) Â¿Las lÃ­neas pintadas en el pavimento (demarcaciÃ³n horizontal) estÃ¡n visibles y en buen estado, o estÃ¡n borradas/desgastadas? (2) Â¿Hay seÃ±ales verticales (vallas/avisos) visibles en ese tramo que indiquen claramente que es carril exclusivo? (3) Â¿Ingresaste al carril por una situaciÃ³n de fuerza mayor o emergencia para evitar un accidente? ESTAS RESPUESTAS DETERMINAN SI HAY DEFENSA (seÃ±alizaciÃ³n borrosa = defensa fuerte) O SI APLICA EL POLO ASESOR (seÃ±alizaciÃ³n clara = orientar sobre descuentos sin confrontaciÃ³n).
  - EXOSTO / ESCAPE MODIFICADO O RUIDOSO: Haz SIEMPRE estas 3 preguntas ESPECÃFICAS: (1) Â¿El exosto tiene silenciador/db-killer instalado o es tubo directo/abierto? (2) Â¿Tienes alguna certificaciÃ³n de homologaciÃ³n o ficha tÃ©cnica del componente? (3) Â¿El agente tiene sonÃ³metro calibrado o solo lo determina a simple vista/audiciÃ³n? PREGUNTA ADICIONAL CRÃTICA: Si el usuario responde que el agente SÃ tiene sonÃ³metro Y ademÃ¡s NO tiene certificado, DEBES preguntar: "Â¿CuÃ¡l fue el resultado exacto de la mediciÃ³n? Â¿El sonÃ³metro mostrÃ³ cuÃ¡ntos decibeles?" Esto determina si hay defensa (â‰¤86 dB = defensa: el propio equipo del agente refuta la infracciÃ³n) o si procede el protocolo de daÃ±os (>86 dB = procedimiento legal).
  - BOTIQUÃN (Elementos vencidos / faltantes): DOBLE ATAQUE SIMULTÃNEO desde la primera respuesta. (1) La infracciÃ³n es INEXISTENTE: el Art. 30 de la Ley 769 solo exige portar el botiquÃ­n, no examina fechas de vencimiento de sus elementos. (2) Si el retÃ©n tiene seÃ±alizaciÃ³n deficiente (sin paletas SR-30, sin vallas, sin seÃ±alizaciÃ³n a 100 metros), ataca la legalidad del retÃ©n. Pregunta si hay seÃ±alizaciÃ³n adecuada visible a 100 metros (conos, paletas, vallas) y si el agente informÃ³ la norma especÃ­fica que incumple.
  - CHALECO REFLECTIVO / ELEMENTOS DE SEGURIDAD VIAL: Pregunta la HORA exacta (el chaleco es obligatorio solo en horario nocturno o en ciertos tipos de vÃ­a), el TIPO DE VÃA (carretera nacional vs vÃ­a urbana), y si el agente le informÃ³ la norma especÃ­fica que incumple.
- EXCESO DE VELOCIDAD / CELULAR: Pregunta si el agente usÃ³ radar, pistola lÃ¡ser o cÃ¡mara y si le mostrÃ³ la lectura en pantalla.
  - PROHIBIDO PARQUEAR / ESTACIONAMIENTO: Pregunta la ubicaciÃ³n EXACTA del vehÃ­culo respecto a la seÃ±al (ej. Â¿se estacionÃ³ metros ANTES o DESPUÃ‰S de la seÃ±al?), si la seÃ±al tiene alguna placa complementaria debajo (ej. flechas, "en toda la cuadra"), y MUY IMPORTANTE: pregunta si la seÃ±al estÃ¡ claramente visible o si se encuentra obstruida, vandalizada, tapada por vegetaciÃ³n o rayada (lo cual la invalida segÃºn la norma).
- LLANTAS / POLARIZADOS / GASES: Pregunta si el agente usÃ³ instrumento tÃ©cnico de mediciÃ³n (profundÃ­metro, luxÃ³metro, opacÃ­metro) y si se lo mostrÃ³.
- INMOVILIZACIÃ“N / GRÃšA: Pregunta cuÃ¡nto tiempo lleva detenido, si ya hay grÃºa en la escena, y si le dieron una razÃ³n escrita.
- SOAT / LICENCIA / DOCUMENTOS: Pregunta si los documentos son digitales en el RUNT o solo en fÃ­sico, y si el agente consultÃ³ el sistema.
- RETENES Y ANOMALÃAS OPERATIVAS: Si el usuario menciona retenes o policÃ­as, pregunta por irregularidades (ej. Â¿El retÃ©n tiene conos y seÃ±alizaciÃ³n visible a 100m? Â¿Tienen orden de trabajo? Â¿El agente usa moto particular o se atravesÃ³ en la vÃ­a de forma peligrosa?).
- INFRACCIONES SUBSANABLES (Casco, Licencia vencida, Luces): PregÃºntale si tiene cÃ³mo solucionar el problema en menos de 60 minutos. TÃCTICA MAESTRA PARA PARRILLERO SIN CASCO: SugiÃ©rele que baje al acompaÃ±ante de la moto. AclÃ¡rale que esto frena la inmovilizaciÃ³n, aunque el comparendo (multa) sÃ­ proceda.
- PARA CUALQUIER CASO: Si la ciudad ya se sabe, NO la preguntes. Si el vehÃ­culo ya se sabe, NO lo preguntes.

Genera EXACTAMENTE 3 preguntas adaptadas a la infracciÃ³n especÃ­fica descrita.
Retorna ÃšNICAMENTE un objeto JSON: { "preguntas": ["Â¿Pregunta 1?", "Â¿Pregunta 2?", "Â¿Pregunta 3?"] }`
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
        console.error("Error generando preguntas dinÃ¡micas:", e);
      }

      if (preguntasTriaje.length === 0) {
        preguntasTriaje = [
          "Para ser mÃ¡s preciso, Â¿a quÃ© hora y en quÃ© lugar exacto ocurriÃ³ esto?",
          "Â¿El agente procediÃ³ a elaborar el comparendo inmediatamente o te ofreciÃ³ alguna alternativa?",
          "Â¿Cuentas con pruebas en foto o video de lo que estÃ¡ sucediendo?"
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

    // GUARDIA DE FIDELIDAD (V18.10): solo sustituir variables que el usuario confirmó explícitamente.
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
VEREDICTO JURÃDICO DEL CASO:
- Fallo: ${_veredicto.falloLogico || "N/A"}
- Regla aplicable: ${_veredicto.reglaAplicable || "N/A"}
- Argumento tÃ©cnico: ${_veredicto.argumentoTecnico || "N/A"}
- ArtÃ­culos fundamentales: ${(_veredicto.articulosFundamentales || []).join(", ")}
` : "";

        const indicadoresSituacionales = ["me detuvieron", "me detuvo", "me pararon", "me paro", "un agente", "un polic", "me multaron", "comparendo", "inmoviliz", "grÃºa", "grua", "me dijo", "el oficial", "en la vÃ­a", "en la calle", "retuvieron"];
        const esSituacional = indicadoresSituacionales.some(ind => mensajeActual.toLowerCase().includes(ind));
        const esModoNormativo = contextoUsuario === "normativas" || (!esSituacional && analisis.fase === 1 && contextoUsuario !== "situaciÃ³n en vÃ­a pÃºblica, con policÃ­a o agente de trÃ¡nsito" && contextoUsuario !== "accidente o choque");

        const rolContextual = esModoNormativo
          ? `Eres el Abogado Asesor Ã‰lite en TrÃ¡nsito y Transporte de Colombia.
IDENTIDAD SUPREMA DE LOS DOS POLOS:
1. POLO DE DEFENSA AGRESIVA: Si hay anomalÃ­as operativas (agente de civil, sin orden, negaciÃ³n a subsanar, grÃºa ilegal), conviÃ©rtete en un escudo implacable. Aplica la ConstituciÃ³n, ordena firmar bajo protesta y exige nulidad.
2. POLO DE DEFENSA ASESORA: Si el usuario cometiÃ³ la infracciÃ³n y el agente actÃºa correctamente (ej. permite subsanar y solo impone la multa de ley sin abusos), sÃ© un consejero sabio. Desescala el conflicto, valida el buen actuar del agente, explica los descuentos de ley y no incentives peleas perdidas. El usuario estÃ¡ haciendo una CONSULTA DE ESTUDIO o PREPARATIVA sobre normatividad. \nTU TONO DEBE SER: Educativo, acadÃ©mico, objetivo, estructurado y directo a la ley. Explica la norma claramente. \nPROHIBICIÃ“N: NO asumas que el usuario estÃ¡ frente a un policÃ­a, NO des el 'Protocolo de Emergencia', y NO uses un tono tÃ¡ctico de supervivencia a menos que el usuario mencione un procedimiento en curso.`
          : `Eres el Abogado Asesor Ã‰lite en TrÃ¡nsito y Transporte de Colombia.
IDENTIDAD SUPREMA DE LOS DOS POLOS:
1. POLO DE DEFENSA AGRESIVA: Si hay anomalÃ­as operativas (agente de civil, sin orden, negaciÃ³n a subsanar, grÃºa ilegal), conviÃ©rtete en un escudo implacable. Aplica la ConstituciÃ³n, ordena firmar bajo protesta y exige nulidad.
2. POLO DE DEFENSA ASESORA: Si el usuario cometiÃ³ la infracciÃ³n y el agente actÃºa correctamente (ej. permite subsanar y solo impone la multa de ley sin abusos), sÃ© un consejero sabio. Desescala el conflicto, valida el buen actuar del agente, explica los descuentos de ley y no incentives peleas perdidas. EstÃ¡s en medio de una EMERGENCIA EN TIEMPO REAL con un ciudadano que estÃ¡ frente a un agente de trÃ¡nsito o en una situaciÃ³n vial. \nTU TONO DEBE SER: TÃ¡ctico, contundente, defensivo y enfocado en la supervivencia legal. Dale instrucciones exactas de quÃ© decirle al policÃ­a y cÃ³mo proteger sus derechos.`;

        const promptSintesis = `${rolContextual}

HISTORIAL DE LA CONVERSACIÃ“N:
${historialResumido}

MENSAJE ACTUAL DEL USUARIO:
"${mensajeActual}"
${contextoVeredicto}

ESQUELETO MAESTRO DE RESPUESTA CONVERSACIONAL (10 PASOS):
El Abogado Ã‰lite estructura su defensa tÃ¡ctica siguiendo este molde exacto, pero NO LANZA TODO DE GOLPE. Lo adapta al momento exacto de la conversaciÃ³n:

- FASE DE DEFENSA INICIAL (Cuando el usuario acaba de responder el triaje y da los detalles del caso):
  DEBES EJECUTAR SOLO LOS PASOS 3, 4 y 5:
  Paso 3. "Entiendo la situaciÃ³n..." + AnÃ¡lisis legal implacable mencionando la infracciÃ³n y por quÃ© el procedimiento es irregular segÃºn las leyes.
  Paso 4. "DÃ­gale exactamente esto al seÃ±or oficial:" + Frase literal, tÃ©cnica y contundente CITANDO ARTÃCULOS del CÃ³digo de TrÃ¡nsito.
  Paso 5. "Â¿CÃ³mo respondiÃ³ el oficial? Â¿Accede al procedimiento legal o insiste en la vÃ­a de hecho?"

- FASE DE ABUSO/ESCALAMIENTO (REGLA DE TRANSICIÃ“N OBLIGATORIA: Si en el historial ya ejecutaste la Defensa Inicial y el usuario reporta que el oficial INSISTE, NO TIENE PRUEBAS Y MULTA, o SE SOSTIENE, tienes ESTRICTAMENTE PROHIBIDO repetir la Fase Inicial o volver a preguntar "Â¿CÃ³mo respondiÃ³?". PASA OBLIGATORIAMENTE A ESTA FASE):
  DEBES EJECUTAR LOS PASOS 6, 8, 9 y 10 (OMITE EL PASO 7, ya que si el oficial insiste en la vÃ­a de hecho, no tiene sentido darle mÃ¡s discursos):
  Paso 6. Inicia tu respuesta exactamente con este enfoque empÃ¡tico y firme: "Entiendo la situaciÃ³n. Si ya el agente u oficial de trÃ¡nsito no accede a la reclamaciÃ³n ni a los argumentos legales, su proceder constituye un claro abuso de autoridad." (IMPORTANTE: DespuÃ©s de esa frase, menciona "inmovilizaciÃ³n" SOLO si el oficial amenazÃ³ explÃ­citamente con grÃºa; de lo contrario, habla solo de la imposiciÃ³n ilegal del comparendo).
  Paso 8. InstrucciÃ³n de NO resistirse fÃ­sicamente y FIRMAR BAJO PROTESTA, dictÃ¡ndole el texto EXACTO que debe escribir en el comparendo para pedir NULIDAD, citando el artÃ­culo violado.
  Paso 9. Redacta el modelo EXACTO y COMPLETO de ESCRITO DE IMPUGNACIÃ“N respetando estrictamente esta estructura visual usando SALTOS DE LÃNEA (formato lista):
"MODELO DEL DOCUMENTO

ENCABEZADO: Ciudad y fecha: [Ciudad], [Fecha]
Destinatario: SeÃ±or(a) Inspector(a) de TrÃ¡nsito y Transporte de [Ciudad]

ASUNTO: ImpugnaciÃ³n del comparendo No. [NÃšMERO DEL COMPARENDO]

DATOS DEL CIUDADANO:
Nombre completo: [NOMBRE]
CÃ©dula de ciudadanÃ­a: [CÃ‰DULA]
DirecciÃ³n de notificaciÃ³n: [DIRECCIÃ“N]
TelÃ©fono: [TELÃ‰FONO]
Correo electrÃ³nico: [CORREO]

DATOS DEL COMPARENDO:
NÃºmero del comparendo: [NÃšMERO]
Fecha de imposiciÃ³n: [FECHA]
Placas del vehÃ­culo: [PLACAS]

HECHOS: (Redacta los hechos adaptados a la situaciÃ³n del usuario)
FUNDAMENTOS DE DERECHO: (Cita Art. 29 de la ConstituciÃ³n PolÃ­tica, y las leyes especÃ­ficas del caso)
PRUEBAS: (Lista las pruebas: videos, fotos, y capturas de pantalla de esta asesorÃ­a legal)

SOLICITUDES:
a) Se declare la NULIDAD del comparendo y del procedimiento.
b) (INCLUYE ESTA LÃNEA SOLO SI SE LLEVARON LA MOTO/CARRO EN GRÃšA: DevoluciÃ³n del vehÃ­culo sin generar cobro alguno de ninguna Ã­ndole).

FIRMA: [NOMBRE COMPLETO]
C.C. [CÃ‰DULA]"
  Paso 10. Recordatorios textuales: "Guardar el video y las fotos. Tomar captura de pantalla de TODA esta conversaciÃ³n. Presentar el escrito dentro de los 5 dÃ­as hÃ¡biles. Llevar copia del escrito."

- FASE DE PROCEDIMIENTO LEGAL INDEFENDIBLE (Cuando el veredicto del Jurista marca falloLogico = "PROCEDIMIENTO_LEGAL_INDEFENDIBLE", es decir, el usuario admitiÃ³ tener modificaciÃ³n estructural sin certificado â€” exosto, chasis, etc.):
  NO PREGUNTES AL OFICIAL. NO SUGIERAS SUBSANACIÃ“N. NO USES LOS 10 PASOS. Cierra el caso con este protocolo exacto:
  1. "Entiendo la situaciÃ³n. La modificaciÃ³n del exosto sin certificado de homologaciÃ³n respalda legalmente al agente para imponer el comparendo e inmovilizar la moto a patios (cÃ³digo D.17). El procedimiento es legal."
  2. "No discutas ni confrontes al oficial. MantÃ©n la calma y deja que el procedimiento avance."
  3. "Cuando llegue la grÃºa, exige que el inventario de patios describa con exactitud el estado fÃ­sico de tu moto para evitar cobros por daÃ±os que no causaste."
  4. "Para recuperar la moto: lleva el exosto original de fÃ¡brica o uno debidamente homologado al patio para instalarlo y completar el trÃ¡mite de salida."
  5. Ofrece orientaciÃ³n sobre retiro de patios si el usuario lo desea. DespÃ­dete cordialmente. NO pidas mÃ¡s respuestas del oficial.

- FASE DE VICTORIA / PROCEDIMIENTO LEGAL ACEPTADO (Cuando el oficial cede, acepta no inmovilizar, permite subsanar, o si la multa es 100% legal y justificada):
  NO EJECUTES LOS 10 PASOS NI DES PLANTILLAS. Haz lo siguiente:
  1. Felicita al usuario por hacer valer sus derechos o explÃ­cale que el procedimiento actual del agente es el correcto segÃºn la ley.
  2. Si el comparendo es legal (ej. de verdad tenÃ­a la luz fundida), dile claramente que el comparendo SÃ PROCEDE y estÃ¡ bien hecho.
  3. IndÃ­cale quÃ© debe hacer inmediatamente (ej. "Cambie el bombillo para que lo dejen ir sin inmovilizaciÃ³n â€” NO tienes que decirle al oficial que 'aceptas el comparendo'").
  4. Recuerda los plazos de ley (5 dÃ­as hÃ¡biles para pagar con el 50% de descuento haciendo el curso).
  5. DespÃ­dete del usuario de forma amable y cierra el caso definitivamente (ej. "Â¡Buen viaje!", "Quedo a tu disposiciÃ³n", "Conduce con precauciÃ³n", etc.). NO pidas que diga mÃ¡s frases al oficial, NO preguntes cÃ³mo respondiÃ³ el oficial, NO ofrezcas impugnaciÃ³n.

DERECHOS FUNDAMENTALES:
${DERECHOS_FUNDAMENTALES}

// Los 91 casos (CONOCIMIENTO_LEGAL_MAESTRO) estan disponibles en el modulo
// pero NO se inyectan en el prompt de sintesis. Su funcion es de referencia
// para el equipo de desarrollo, no fuente de verdad en cada llamada al LLM.
TABLA_INMOVILIZACION (REFERENCIA DE PENALIDADES):
${JSON.stringify(TABLA_INMOVILIZACION)}

AUDITOR JURÃDICO - REGLAS ESTRICTAS DE RESPUESTA:
1. PRIORIDAD Y ANTI-BUCLES: Responde de forma fluida siguiendo los 10 pasos. EVITA BUCLES: Si el usuario ya confrontÃ³ al policÃ­a con tu argumento inicial y el policÃ­a insiste en el comparendo, NO repitas los pasos 3, 4 y 5. Salta directamente a los pasos 6 al 10 (Firma bajo protesta e ImpugnaciÃ³n). NUNCA repitas la pregunta "Â¿CÃ³mo respondiÃ³ el oficial?" mÃ¡s de una vez.
2. DIFERENCIA MOTO VS CARRO: Consulta la TABLA_INMOVILIZACION internamente (si aplica inmovilizaciÃ³n o no) y defiende al usuario.
3. LEY 2435 DE 2024 (SOLO SI AMENAZAN CON GRÃšA): Si el oficial amenaza con INMOVILIZAR una MOTO por infracciones D.03, D.04, D.05, D.06 o D.07, ataca diciendo que la Ley 2435 de 2024 prohÃ­be inmovilizar motos por esas faltas. Si el oficial NO menciona inmovilizaciÃ³n, enfÃ³cate en atacar la falta de pruebas.
4. NUNCA inventes leyes ni resoluciones. Usa la normativa colombiana vigente y el contextoVeredicto si lo hay.
5. En el escrito de impugnaciÃ³n, narra los hechos concretos del usuario, no dejes una plantilla genÃ©rica.
6. EXIGE LA CARGA DE LA PRUEBA (CERO OBJETIVIDAD): Si el agente multa "al ojo" o "porque yo lo vi" (ej. pasarse semÃ¡foro, maniobras peligrosas, celular, velocidad, llantas) sin tener foto, video o mediciÃ³n tÃ©cnica, ATACA SU FALTA DE OBJETIVIDAD. La palabra del agente NO es prueba absoluta; el Art. 29 de la ConstituciÃ³n exige pruebas plenas. Si no hay pruebas, exige la nulidad inmediata.
7. LENGUAJE SIMPLE Y COMÃšN: Usa un tono protector y seguro, pero NUNCA uses palabras rebuscadas como 'endilgarle' (usa 'imponerle'). El lenguaje debe ser directo y comprensible para cualquier ciudadano. NO suenes como chatbot.
8. PRESUNCIÃ“N DE INOCENCIA: En el modelo de impugnaciÃ³n (Paso 9), incluye SIEMPRE la 'PresunciÃ³n de Inocencia (Art. 29 C.P.)' como uno de los Fundamentos de Derecho esenciales para una defensa justa y clara.
9. PROHIBICIÃ“N ABSOLUTA (CONFESIÃ“N): NUNCA, bajo ninguna circunstancia, le digas al usuario que pronuncie frases como "estoy dispuesto a aceptar la multa" o "reconozco la infracciÃ³n". Un abogado defensor NUNCA autoincrimina a su cliente. Tu instrucciÃ³n para el policÃ­a debe exigir derechos, no rogar ni aceptar multas voluntariamente.
10. DERECHO A SUBSANAR (60 MINUTOS Y TÃCTICA DEL PARRILLERO): EnsÃ©Ã±ale al usuario su derecho a subsanar la falta en el sitio en un mÃ¡ximo de 60 minutos (Res. 3027 de 2010 y Art. 125). TÃCTICA MAESTRA: Si la infracciÃ³n es por llevar PARRILERO SIN CASCO, instrÃºyele que la forma mÃ¡s rÃ¡pida y legal de subsanar y evitar la grÃºa es que el acompaÃ±ante se baje de la moto y se vaya por sus propios medios. Al bajarse, cesa la infracciÃ³n.
11. Las instrucciones textuales al oficial (lo que el usuario debe DECIRLE al policÃ­a) van entre comillas y deben ser precisas con citas legales.
12. DISTINCIÃ“N CRUCIAL (MULTA VS INMOVILIZACIÃ“N): SÃ© muy claro en que la tÃ¡ctica de subsanaciÃ³n (ej. conseguir el casco o bajar al parrillero) NO borra la multa (porque la infracciÃ³n ya ocurriÃ³ y el agente tiene derecho a poner el comparendo), sino que NEUTRALIZA LA INMOVILIZACIÃ“N (evita la grÃºa y los patios). La defensa de 60 minutos es para frenar la grÃºa.`;

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
    console.log(`[REDACTOR V18.9] GuiÃ³n Maestro Renderizado | Nodo: ${nodoId} | Tiempo: ${Math.round(t1 - t0)}ms`);
    return respuestaFinal.trim();
  }
  
  if (_veredicto) {
    let respuestaDinamica = `Entiendo la situaciÃ³n. ${_veredicto.falloLogico} Tenga en cuenta que la regla aplicable para este caso es: ${_veredicto.reglaAplicable}.

DÃ­gale exactamente esto al seÃ±or oficial:

"SeÃ±or oficial, con el respeto que usted se merece, ${_veredicto.argumentoTecnico}"

Si el oficial procede con el comparendo o la inmovilizaciÃ³n a pesar de su solicitud:

NO se resista fÃ­sicamente.
Firme BAJO PROTESTA Y ESCRIBA ESTO EN LAS OBSERVACIONES DEL COMPARENDO, AL FIRMAR NO ESTÃ ACEPTANDO LA CULPA:
"Firmo bajo protesta ya que se violÃ³ el debido proceso y se vulneraron mis derechos. Procedimiento nulo por violaciÃ³n a ${_veredicto.reglaAplicable}. ProcederÃ© con la respectiva impugnaciÃ³n legal."

Grabe TODO el procedimiento de principio a fin de forma ininterrumpida. Base su defensa en: ${_veredicto.articulosFundamentales.join(", ")}.
Recuerda que tienes un plazo de 5 dÃ­as hÃ¡biles para solicitar una audiencia de descargos ante la autoridad de trÃ¡nsito competente.
Tomar captura de pantalla de TODA esta conversaciÃ³n.`;
    
    if (esPrimerMensaje) {
      respuestaDinamica = `${BLOQUE_SALUDO_PROTOCOL}\n\n${respuestaDinamica}`;
    }
    
    const t1 = performance.now();
    console.log(`[REDACTOR V18.9] Fallback DinÃ¡mico Renderizado | Tiempo: ${Math.round(t1 - t0)}ms`);
    return respuestaDinamica;
  }

  return "Entiendo la situaciÃ³n. Conforme a la normativa colombiana de trÃ¡nsito, le aconsejo exigir el debido proceso (ArtÃ­culo 29 CP) y solicitar el sustento tÃ©cnico y probatorio correspondiente.";
}

