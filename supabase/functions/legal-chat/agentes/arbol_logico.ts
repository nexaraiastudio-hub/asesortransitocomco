export interface NodoLegal {
  id: string;
  contexto: string;
  guion: string;
  preguntasTriaje: string[];
  leyes: string[];
  siguienteNodo?: string;
  esExito?: boolean;
}

export const ARBOL_LEGAL: Record<string, NodoLegal> = {
  // === CASO 1: LLANTAS ===
  "llantas_inicio": {
    id: "llantas_inicio",
    contexto: "Inicio de triaje para llantas.",
    guion: "",
    preguntasTriaje: [
      "¿Qué tipo de vehículo estás conduciendo?",
      "¿A qué autoridad pertenece el agente que te detuvo?",
      "¿El agente utilizó algún equipo de medición, como un profundímetro, para verificar el labrado de las llantas? ¿O determinó el estado de las llantas por simple apreciación visual?"
    ],
    leyes: ["Artículo 20 CN", "Artículo 21 Ley 1801"],
    siguienteNodo: "llantas_defensa"
  },
  "llantas_defensa": {
    id: "llantas_defensa",
    contexto: "Defensa por llantas a simple vista.",
    guion: `Entiendo la situación. El oficial utilizó [metodo_medicion] para verificar el labrado de las llantas de su [TIPO_VEHICULO], lo cual no es un método legalmente aceptado.

Dígale exactamente esto: 'Señor oficial, con el respeto que usted se merece, el uso de [metodo_medicion] no es un método legal para medir la profundidad del labrado de las llantas. La Resolución 3027 de 2010 del Ministerio de Transporte establece que la profundidad mínima del labrado de las llantas de un [TIPO_VEHICULO], debe ser de [LIMIT_MM], medida con un instrumento calibrado denominado profundímetro. Asimismo, la Norma Técnica Colombiana NTC 5375 especifica que el único instrumento válido para realizar esta medición es el profundímetro calibrado. Además, el Artículo 28 del Código Nacional de Tránsito (Ley 769 de 2002) establece las condiciones técnico-mecánicas que deben cumplir los vehículos para transitar por las vías públicas, incluyendo el estado de los neumáticos. Le solicito que utilice un profundímetro calibrado, como lo establece la ley. De lo contrario, se viola mi derecho al Debido Proceso consagrado en el Artículo 29 de la Constitución Política de Colombia.'`,
    preguntasTriaje: ["¿Cómo respondió el oficial a tu solicitud? ¿Accede al procedimiento legal o insiste en la vía de hecho?"],
    leyes: ["Res 3027 de 2010", "NTC 5375", "Art 28 Ley 769", "Art 29 CP"],
    siguienteNodo: "llantas_escalamiento"
  },
  "llantas_escalamiento": {
    id: "llantas_escalamiento",
    contexto: "Escalamiento por insistencia del oficial en llantas.",
    guion: `La amenaza de comparendo e inmovilización en este caso constituye un posible abuso de autoridad. El comparendo y la inmovilización no procede porque el oficial no utilizó el equipo de medición técnica adecuado. Según la Resolución 3027 de 2010 del Ministerio de Transporte y la Norma Técnica Colombiana NTC 5375, lo que hace nulo el procedimiento.

Además, ¡USTED TIENE DERECHO A SUBSANAR EN EL SITIO! El Artículo 125 del Código Nacional de Tránsito (Ley 769 de 2002) establece que la inmovilización se suspenderá tan pronto cese la causa que la motivó. Si usted puede cambiar la llanta en este momento (porque tiene la de repuesto, o alguien puede traérsela en un tiempo razonable antes de que actúe la grúa), el agente NO puede llevarse su [TIPO_VEHICULO].

Dígale exactamente esto al señor oficial:

"Señor oficial, el comparendo y la inmovilización de mi vehículo en estas circunstancias no procede legalmente por la ausencia del profundímetro calibrado. Aún así, en cumplimiento del Artículo 125 de la Ley 769 de 2002, solicito mi derecho a subsanar la falta en el sitio procediendo a cambiar la llanta en este momento. La ley es clara en que la inmovilización debe suspenderse al cesar la causa. Si usted me lo impide y procede con la grúa de forma arbitraria, incurre en responsabilidad como servidor público. Estoy grabando este procedimiento como es mi derecho bajo el Artículo 21 de la Ley 1801 de 2016."

Si el oficial procede con la inmovilización a pesar de su solicitud y de que usted ofreció cambiar la llanta:

NO se resista físicamente.
Firme BAJO PROTESTA Y ESCRIBA ESTO EN LAS OBSERVACIONES DEL COMPARENDO, AL FIRMAR NO ESTÁ ACEPTANDO LA CULPA:
"Firmo bajo protesta. Se violó el debido proceso y el principio de subsanación. El oficial usó [metodo_medicion] en vez de profundímetro calibrado (Res 3027/2010). Además, el agente me negó arbitrariamente el derecho a subsanar la falta en el sitio (cambiar la llanta) consagrado en el Art. 125 de la Ley 769 de 2002. Procedimiento nulo."

Grabe TODO: el inventario del vehículo, las condiciones, y cómo usted tenía la disposición (o la llanta de repuesto) para hacer el cambio.
Tome fotos del estado del vehículo ANTES de que se lo lleven.
Recuerda que tienes un plazo de 5 días hábiles para solicitar una audiencia de descargos ante la autoridad de tránsito competente.
Tomar captura de pantalla de TODA esta conversación.
Si procedió, prepararemos un documento de apelación.`,
    preguntasTriaje: ["¿Deseas que redacte el documento de apelación incluyendo la violación al derecho a subsanar?"],
    leyes: ["Art 21 Ley 1801", "Res 3027 de 2010", "NTC 5375", "Art 125 Ley 769"],
    siguienteNodo: "llantas_finalizacion"
  },
    "llantas_solo_comparendo": {
    id: "llantas_solo_comparendo",
    contexto: "El oficial permite subsanar (cambiar llanta) pero insiste en hacer el comparendo sin profundímetro",
    guion: `Entiendo perfectamente la situación. El oficial le permite cambiar la llanta, lo cual es positivo porque se respeta su derecho a subsanar (Artículo 125, Ley 769 de 2002). Sin embargo, insiste en imponer el comparendo SIN haber utilizado un profundímetro calibrado, lo cual constituye una violación al debido proceso.

En este caso, su estrategia legal es clara:

1. CAMBIE LA LLANTA INMEDIATAMENTE. Con esto elimina la causa de inmovilización y su moto queda libre.

2. EN CUANTO AL COMPARENDO: No se oponga físicamente. FIRME BAJO PROTESTA. Al firmar NO está aceptando la culpa, está ejerciendo su derecho a impugnar.

ESCRIBA EXACTAMENTE ESTO EN LAS OBSERVACIONES DEL COMPARENDO:

"Firmo bajo protesta. El agente de tránsito determinó el estado de las llantas usando una moneda como método de medición, lo cual NO es un instrumento legal. La Resolución 3027 de 2010 del Ministerio de Transporte y la Norma Técnica Colombiana NTC 5375 establecen que el ÚNICO instrumento válido para medir la profundidad del labrado es el profundímetro calibrado. Al no contar con dicho instrumento, el agente carece de prueba técnica válida para fundamentar esta infracción, violando mi derecho al Debido Proceso (Art. 29 CP). Procedimiento nulo. Procederé con impugnación formal."

CONSECUENCIAS LEGALES PARA EL OFICIAL:
El agente de tránsito que impone un comparendo sin el sustento técnico y probatorio requerido por la ley se expone a:
- Artículo 416 del Código Penal: Abuso de Autoridad por acto arbitrario e injusto (pena de 1 a 4 años de prisión).
- Investigación disciplinaria ante la Procuraduría General de la Nación por violación al debido proceso.
- Responsabilidad patrimonial personal si el ciudadano demanda por vía contencioso-administrativa.

Dígale esto al oficial: "Señor oficial, voy a firmar el comparendo bajo protesta porque usted no cuenta con el profundímetro calibrado que exige la Resolución 3027 de 2010. Dejo constancia escrita de que este procedimiento carece de prueba técnica válida. Tenga presente que imponer sanciones sin el debido sustento probatorio puede generar responsabilidades disciplinarias y penales conforme al Artículo 416 del Código Penal. Procederé con la impugnación formal dentro de los 5 días hábiles."

Grabe TODO el procedimiento. Tome foto del comparendo firmado con sus observaciones. Tomar captura de pantalla de TODA esta conversación.`,
    preguntasTriaje: ["¿Deseas que redacte el documento formal de impugnación del comparendo?"],
    leyes: ["Art 29 CP", "Res 3027 de 2010", "NTC 5375", "Art 125 Ley 769", "Art 416 Código Penal"],
    siguienteNodo: "llantas_finalizacion"
  },
  "llantas_protesta": {
    id: "llantas_protesta",
    contexto: "Fallback por si el modelo usa este nombre",
    guion: "",
    preguntasTriaje: ["¿Deseas que redacte el documento de apelación?"],
    leyes: [],
    siguienteNodo: "llantas_finalizacion"
  },
  "llantas_finalizacion": {
    id: "llantas_finalizacion",
    contexto: "Documento de impugnación.",
    guion: `A continuación le presento el modelo de escrito de impugnación. Complete los datos marcados entre corchetes con su información personal.

MODELO DEL DOCUMENTO.

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

HECHOS: El día [FECHA], fui detenido por un agente de tránsito quien, mediante una inspección visual, determinó que las llantas de mi vehículo no cumplían con la norma de labrado. Sin embargo, no se utilizó ningún instrumento de medición calibrado, como un profundímetro, para verificar la profundidad del labrado de las llantas, lo cual es un requisito establecido por la normativa vigente.

FUNDAMENTOS DE DERECHO:

Artículo 29 de la Constitución Política de Colombia (Debido Proceso)
Resolución 3027 de 2010 del Ministerio de Transporte, que establece que la profundidad mínima del labrado debe ser medida con un profundímetro calibrado.
Norma Técnica Colombiana NTC 5375, que especifica el uso exclusivo del profundímetro calibrado para la medición de la profundidad del labrado.

PRUEBAS:

Registro en video del procedimiento
Fotografías del vehículo y la señalización
Capturas de pantalla de esta asesoría legal

SOLICITUDES: a) Se declare la NULIDAD del comparendo No. [NÚMERO] por incumplimiento de los procedimientos técnicos y legales establecidos. b) Se tomen las medidas administrativas correspondientes para evitar la repetición de procedimientos irregulares.
Y se solicita la devolución del vehículo sin generar cobro alguno de ninguna índole.

FIRMA: [NOMBRE COMPLETO]
C.C. [CÉDULA]

Recordar al ciudadano:

Guardar el video y las fotos.
Tomar captura de pantalla de TODA esta conversación.
Presentar el escrito dentro de los 5 días hábiles.
Llevar copia del escrito.`,
    preguntasTriaje: [],
    leyes: [],
    esExito: true
  },
  "llantas_exito": {
    id: "llantas_exito",
    contexto: "Éxito sin comparendo.",
    guion: "¡Excelente! Has logrado ejercer tu derecho y el oficial ha respetado el debido proceso.",
    preguntasTriaje: [],
    leyes: [],
    esExito: true
  },

  // === CASO 2: POLARIZADOS ===
  "polarizados_inicio": {
    id: "polarizados_inicio",
    contexto: "Inicio de triaje polarizados.",
    guion: "",
    preguntasTriaje: [
      "¿Qué tipo de vehículo estás conduciendo (Automóvil, Camioneta, etc.)?",
      "¿A qué autoridad pertenece el agente que te detuvo (Policía de Tránsito o Agente de Movilidad azul)?",
      "¿El oficial utilizó un dispositivo electrónico llamado fotómetro o luxómetro para medir el porcentaje de transmisión de luz? ¿O lo está determinando a simple vista?"
    ],
    leyes: ["Artículo 20 CN", "Artículo 21 Ley 1801"],
    siguienteNodo: "polarizados_defensa"
  },
  "polarizados_defensa": {
    id: "polarizados_defensa",
    contexto: "Defensa por polarizados.",
    guion: `Entiendo la situación. El oficial está pretendiendo imponer una sanción basada en una apreciación subjetiva ('a simple vista') y bajo una premisa normativa que requiere precisión técnica, especialmente en un [TIPO_VEHICULO].

Dígale exactamente esto: 'Señor oficial, con el respeto que usted se merece, la norma técnica colombiana exige que la opacidad de los vidrios se mida con un equipo técnico calibrado llamado fotómetro o luxómetro. La simple apreciación visual no es una prueba legal para determinar si un vidrio cumple o no con los niveles de transmisión de luz. Según la Resolución 3777 de 2003 del Ministerio de Transporte, se establecen los porcentajes permitidos, y el Manual de Infracciones (Resolución 3027 de 2010) especifica que para la infracción B.10, la autoridad debe contar con el equipo de medición adecuado. Si usted procede sin dicha medición, estaría vulnerando mi derecho al Debido Proceso según el Artículo 29 de la Constitución Política.'

Además, sobre los vehículos escolares, si bien la norma exige visibilidad, la Resolución 3777 permite niveles de transmisión de luz (70% en panorámico y vidrios laterales delanteros), por lo cual el término 'totalmente transparente' debe ajustarse a esos porcentajes técnicos y no al criterio del agente.`,
    preguntasTriaje: ["¿Cómo respondió el oficial a tu solicitud? ¿Accede al procedimiento legal solicitando el equipo técnico o insiste en realizar el comparendo e inmovilización?"],
    leyes: ["Res 3777 de 2003", "Res 3027 de 2010", "Art 29 CP"],
    siguienteNodo: "polarizados_escalamiento"
  },
  "polarizados_escalamiento": {
    id: "polarizados_escalamiento",
    contexto: "Escalamiento polarizados.",
    guion: `Dígale exactamente esto al señor oficial:

"Señor oficial, el comparendo y la inmovilización por la infracción B.10 no proceden legalmente bajo una apreciación subjetiva. La Resolución 3027 de 2010 y la Circular 0022 de 2002 de la Superintendencia de Puertos y Transporte establecen que para sancionar por vidrios polarizados, la autoridad DEBE contar con un fotómetro o luxómetro debidamente calibrado que certifique que el grado de transmisión de luz es inferior al permitido. Realizar este procedimiento 'a ojo' constituye una vía de hecho y una desviación de poder. Le informo que dejaré constancia de la falta de equipo técnico en el registro que estoy realizando."

Si el oficial procede con la inmovilización a pesar de su advertencia técnica:

NO se resista físicamente, mantenga la calma y siga grabando.

Firme BAJO PROTESTA y escriba esto exactamente en las observaciones del comparendo:

"Firmo bajo protesta. Se vulnera el Debido Proceso (Art. 29 C.P.) ya que el agente impone comparendo B.10 e inmovilización basándose en una apreciación visual, sin utilizar el fotómetro/luxómetro calibrado exigido por la ley para determinar la opacidad. No existe prueba técnica de la infracción. El vehículo cumple con la visibilidad, pero el agente se niega a realizar la medición legal."

Exija el inventario: Asegúrese de que quede registrado el estado de los sellos, vidrios y accesorios del vehículo.

Tome fotos de los vidrios: Si es posible, ponga su mano o un objeto detrás del vidrio para demostrar que existe visibilidad (transparencia) a pesar de la apreciación del agente.

Recuerde que tiene 5 días hábiles para la audiencia de descargos. La inmovilización genera un perjuicio mayor al servicio, lo cual agravia la actuación del oficial.

Si el vehículo es llevado a los patios, debemos proceder de inmediato con la impugnación para evitar costos de parqueadero.`,
    preguntasTriaje: ["¿Deseas que redacte el modelo de impugnación para este caso de fotometría?"],
    leyes: ["Res 3027 de 2010", "Circular 0022 de 2002"],
    siguienteNodo: "polarizados_finalizacion"
  },
  "polarizados_protesta": {
    id: "polarizados_protesta",
    contexto: "Fallback",
    guion: "",
    preguntasTriaje: ["¿Deseas que redacte el modelo de impugnación para este caso de fotometría?"],
    leyes: [],
    siguienteNodo: "polarizados_finalizacion"
  },
  "polarizados_finalizacion": {
    id: "polarizados_finalizacion",
    contexto: "Impugnación polarizados.",
    guion: `A continuación le presento el modelo de escrito de impugnación. Complete los datos marcados entre corchetes con su información personal.

MODELO DEL DOCUMENTO
ENCABEZADO: Ciudad y fecha: [Ciudad], [Fecha]

Destinatario: Señor(a) Inspector(a) de Tránsito y Transporte de [Ciudad]

ASUNTO: Impugnación del comparendo No. [NÚMERO DEL COMPARENDO] - Nulidad por falta de prueba técnica.

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

HECHOS: El día [FECHA], mi vehículo fue objeto de un comparendo por presunto incumplimiento en la norma de vidrios polarizados. El agente de tránsito procedió a sancionar e inmovilizar basándose únicamente en su percepción sensorial (vista), omitiendo el uso del equipo técnico (fotómetro/luxómetro) obligatorio para medir la transmisión lumínica, a pesar de que se le solicitó expresamente cumplir con dicho protocolo legal.

FUNDAMENTOS DE DERECHO:

Artículo 29 de la Constitución Política de Colombia: Derecho fundamental al Debido Proceso y principio de legalidad de la prueba.

Resolución 3777 de 2003 del Ministerio de Transporte: Define los porcentajes permitidos de transmisión de luz y la necesidad de equipos técnicos para su verificación.

Resolución 3027 de 2010 (Manual de Infracciones): Establece que para la infracción B.10, la autoridad debe acreditar la contravención mediante el uso de instrumentos de medición.

Circular 0022 de 2002 de la Superintendencia de Puertos y Transporte: Reitera que la autoridad de tránsito no puede imponer sanciones por polarizados de forma subjetiva.

PRUEBAS:

Registro en video donde se evidencia que el agente no portaba ni utilizó fotómetro calibrado.
Fotografías de los vidrios del vehículo demostrando la visibilidad del interior.
Copia del comparendo donde consta la observación de "Firmo bajo protesta" por falta de equipo técnico.

SOLICITUDES: a) Se declare la NULIDAD del comparendo No. [NÚMERO] por carecer de fundamento técnico y probatorio.

b) Se ordene la entrega inmediata del vehículo y la exoneración del pago de grúa y patios, toda vez que la inmovilización fue producto de un procedimiento irregular y sin soporte legal.

c) Se compulse copia a la oficina de control interno disciplinario de la institución por posible extralimitación de funciones del agente.

FIRMA: [NOMBRE COMPLETO]
C.C. [CÉDULA]

Recordar al ciudadano:

Guardar el video del procedimiento; es su prueba reina de que no hubo medición técnica.
Tomar captura de pantalla de TODA esta conversación.
Presentar el escrito dentro de los 5 días hábiles siguientes.
Al ser un vehículo escolar, mencione en la audiencia que se está afectando la prestación de un servicio público esencial.`,
    preguntasTriaje: [],
    leyes: [],
    esExito: true
  },
  "polarizados_exito": {
    id: "polarizados_exito",
    contexto: "Exito",
    guion: "¡Excelente! Has logrado ejercer tu derecho y el oficial ha respetado el debido proceso.",
    preguntasTriaje: [],
    leyes: [],
    esExito: true
  },

  // === CASO 3: CASCO ===
  "casco_inicio": {
    id: "casco_inicio",
    contexto: "Inicio triaje casco",
    guion: "",
    preguntasTriaje: [
      "¿En qué ciudad o municipio te encuentras actualmente?",
      "¿El acompañante (parrillero) tiene el casco en su poder pero no lo lleva puesto, o simplemente no dispone de uno?",
      "¿Existe alguna restricción vigente de 'parrillero' o acompañante en la zona donde te encuentras?"
    ],
    leyes: [],
    siguienteNodo: "casco_subsanacion"
  },
  "casco_defensa": {
    id: "casco_defensa",
    contexto: "Fallback name",
    guion: "",
    preguntasTriaje: [],
    leyes: [],
    siguienteNodo: "casco_subsanacion"
  },
  "casco_subsanacion": {
    id: "casco_subsanacion",
    contexto: "Defensa por casco",
    guion: `Entiendo la situación. Tu acompañante no dispone de casco, lo cual representa una infracción directa a las normas de seguridad vial en Colombia.

En este caso, la norma es clara. El oficial tiene la facultad de intervenir. Dígale esto para intentar manejar el procedimiento dentro de la legalidad: 'Señor oficial, reconozco la falta frente al Artículo 94 y 96 de la Ley 769 de 2002, que exige el uso de casco tanto para el conductor como para el acompañante. Sin embargo, le solicito respetuosamente que se me permita subsanar la falta en el sitio, trayendo un casco reglamentario para mi acompañante o permitiendo que este continúe su trayecto por otro medio, evitando así la inmovilización del vehículo, basándome en el principio de proporcionalidad y eficiencia administrativa'.

No obstante, técnicamente, según el Código Nacional de Tránsito, la infracción C.24 (Conducir motocicleta sin observar las normas establecidas) conlleva una multa de 15 salarios mínimos legales diarios vigentes. Es importante que sepas que, a diferencia de otras faltas, el no llevar el casco reglamentario sí da lugar a la inmovilización inmediata del vehículo según el Artículo 131, literal C, numeral 24.

RECOMENDACIÓN TÉCNICA:
Si el oficial decide proceder, verifique que el comparendo sea impuesto por la infracción C.24. Si el oficial intenta registrar una infracción diferente o más grave, deje la anotación en las observaciones.`,
    preguntasTriaje: ["¿Cómo respondió el oficial a tu solicitud de subsanar? ¿Está redactando el comparendo o ya solicitó la grúa para la inmovilización?"],
    leyes: ["Art 94 y 96 Ley 769", "Art 131 Ley 769"],
    siguienteNodo: "casco_protesta"
  },
  "casco_protesta": {
    id: "casco_protesta",
    contexto: "Escalamiento casco",
    guion: `Dígale exactamente esto al señor oficial:

"Señor oficial, reconozco que se ha incurrido en la infracción por la falta de casco del acompañante. No obstante, le solicito que, en cumplimiento del Artículo 125 del Código Nacional de Tránsito (Ley 769 de 2002), se me permita subsanar la falta en el sitio. El acompañante procederá a retirarse de la motocicleta y continuar su camino por otro medio, eliminando así la causa que originó la detención. La ley establece que la inmovilización debe cesar si se subsana la causa, y en este momento la motocicleta cumple con todas sus condiciones para transitar conmigo como único ocupante cumpliendo la norma."

Si el oficial persiste en la inmovilización a pesar de que el acompañante se baje o se consiga un casco:

NO se resista físicamente.

Firme BAJO PROTESTA y escriba esto exactamente en las observaciones del comparendo:

"Firmo bajo protesta. Se vulnera el debido proceso y el principio de proporcionalidad. El acompañante se retiró del vehículo, subsanando la causa de la inmovilización en el sitio según el Art. 125 de la Ley 769 de 2002. El agente insiste en la inmovilización de forma arbitraria a pesar de que la infracción cesó al quedar solo el conductor con su casco reglamentario."

Grabe el inventario: Es vital que grabe cómo suben la moto a la grúa para evitar daños adicionales.

Tome fotos: Registre que usted sí porta su casco y que el acompañante ya no está sobre el vehículo.

Nota importante: Aunque la multa (C.24) es difícil de apelar porque el hecho existió, la inmovilización puede ser declarada ilegal si usted demostró que podía subsanar (bajando al parrillero) y el agente se lo impidió. Esto le ahorraría los costos de grúa y patios.`,
    preguntasTriaje: ["¿Deseas que prepare el modelo de impugnación enfocado en la ilegalidad de la inmovilización por haber subsanado en el sitio?"],
    leyes: ["Art 125 Ley 769"],
    siguienteNodo: "casco_finalizacion"
  },
  "casco_escalamiento": {
    id: "casco_escalamiento",
    contexto: "Fallback name",
    guion: "",
    preguntasTriaje: [],
    leyes: [],
    siguienteNodo: "casco_finalizacion"
  },
  "casco_finalizacion": {
    id: "casco_finalizacion",
    contexto: "Minuta casco",
    guion: `A continuación le presento el modelo de escrito de impugnación. Este documento se enfoca en que, aunque la infracción existió, la inmovilización fue ilegal porque usted ofreció subsanar la falta en el sitio. Complete los datos marcados entre corchetes.

MODELO DEL DOCUMENTO
ENCABEZADO: Ciudad y fecha: [Ciudad], [Fecha]

Destinatario: Señor(a) Inspector(a) de Tránsito y Transporte de [Ciudad]

ASUNTO: Impugnación del comparendo No. [NÚMERO DEL COMPARENDO] - Solicitud de nulidad de inmovilización por subsanación en sitio.

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

HECHOS: El día [FECHA], fui requerido por un agente de tránsito debido a que mi acompañante no portaba el casco reglamentario. Ante el requerimiento, procedí a solicitar la subsanación de la falta en el sitio de los hechos, de acuerdo con lo previsto en la Ley 769 de 2002, informando al agente que el acompañante descendería del vehículo para continuar su trayecto por otro medio. A pesar de que la causa de la inmovilización desapareció (al quedar el vehículo solo con el conductor portando su equipo de seguridad), el agente procedió de forma arbitraria con la inmovilización del vehículo.

FUNDAMENTOS DE DERECHO:

Artículo 29 de la Constitución Política de Colombia: Debido proceso y principio de proporcionalidad.

Artículo 125 de la Ley 769 de 2002 (Código Nacional de Tránsito): Establece claramente que "la inmovilización se suspenderá tan pronto cese la causa que la motivó". Al bajar el acompañante sin casco, la causa de la inmovilización cesó de inmediato.

Sentencia C-799 de 2003 de la Corte Constitucional: Donde se establece que la inmovilización no debe ser una sanción adicional si se puede corregir la falta en el lugar.

PRUEBAS:

Registro en video donde se observa al acompañante retirándose del vehículo y al conductor con su casco puesto antes de que la grúa enganchara la moto.
Copia del comparendo con la anotación de "Subsanación en sitio negada".
Testimonio del acompañante: [NOMBRE DEL ACOMPAÑANTE].

SOLICITUDES: a) Se declare la ilegalidad del procedimiento de inmovilización.

b) Se me exonere del pago de los conceptos de Grúa y Patios, toda vez que la ley me facultaba para subsanar y el agente lo impidió.

c) Se mantenga el debate sobre la multa, pero se reconozca la vulneración al derecho de propiedad por la retención innecesaria del vehículo.

FIRMA: [NOMBRE COMPLETO]
C.C. [CÉDULA]

Recordar al ciudadano:

Usted tiene 5 días hábiles para presentarse a los descargos en los Centros de Servicios de Movilidad.
No olvide llevar el video donde se vea que el parrillero se bajó. Ese es su argumento principal para recuperar el dinero de patios y grúa.
Tome captura de pantalla de TODA esta conversación.
El hecho de que la infracción C.24 sea real no le da derecho al policía a inmovilizar si usted ya bajó al acompañante. ¡Defienda su derecho!`,
    preguntasTriaje: [],
    leyes: [],
    esExito: true
  },
  "casco_exito": {
    id: "casco_exito",
    contexto: "Exito",
    guion: "¡Excelente! Has logrado ejercer tu derecho y el oficial ha respetado el debido proceso.",
    preguntasTriaje: [],
    leyes: [],
    esExito: true
  },

  // === CASO 4: SEMAFORO ===
  "semaforo_inicio": {
    id: "semaforo_inicio",
    contexto: "Inicio triaje semaforo",
    guion: "",
    preguntasTriaje: [
      "¿En qué ciudad te encuentras y en qué intersección exacta ocurrió la detención?",
      "¿El agente tiene alguna prueba física del hecho, como un registro de cámara o video, o se basa únicamente en su observación?",
      "¿El semáforo estaba en rojo fijo, o cruzaste mientras estaba en amarillo o haciendo la transición?",
      "¿Había alguna circunstancia especial, como un cruce dirigido por el mismo agente o paso de vehículo de emergencia?"
    ],
    leyes: [],
    siguienteNodo: "semaforo_defensa"
  },
  "semaforo_defensa": {
    id: "semaforo_defensa",
    contexto: "Defensa semaforo",
    guion: `Entiendo la situación. El oficial pretende sancionarlo por la infracción D.04 (pasarse un semáforo en rojo o amarillo) basándose exclusivamente en su percepción visual, sin contar con apoyo tecnológico que respalde su afirmación.

Dígale exactamente esto: 'Señor oficial, con el respeto que usted se merece, yo realicé el cruce de la intersección de manera legal. El semáforo se encontraba en transición y yo ya había superado la línea de pare cuando el cambio ocurrió. Usted no cuenta con una prueba técnica, fotográfica o de video que demuestre que el vehículo ingresó a la intersección con la luz en rojo. Según el Artículo 29 de la Constitución Política, tengo derecho a la presunción de inocencia y a que se me garantice el debido proceso. Una acusación sin pruebas físicas vulnera mi derecho a la defensa, ya que el Código Nacional de Tránsito exige que las autoridades se apoyen en pruebas claras para imponer sanciones de esta gravedad'.

Tenga en cuenta que la infracción D.04 no solo genera una multa de 30 salarios mínimos legales diarios vigentes, sino que también da lugar a la inmovilización inmediata del vehículo.`,
    preguntasTriaje: ["¿Cómo respondió el oficial a tu argumento? ¿Reconoce la falta de pruebas técnicas o insiste en realizar el comparendo y solicitar la grúa para inmovilizar?"],
    leyes: ["Art 29 CP", "Infracción D.04"],
    siguienteNodo: "semaforo_protesta"
  },
  "semaforo_protesta": {
    id: "semaforo_protesta",
    contexto: "Escalamiento semaforo",
    guion: `Dígale exactamente esto al señor oficial:

"Señor oficial, el Artículo 131 del Código Nacional de Tránsito es claro al separar las infracciones. Si usted me acusa de cruzar en rojo (D.04), debe probar que el vehículo ingresó a la intersección con la luz en rojo y no en amarillo. Al no tener evidencia técnica, su acusación es subjetiva y viola el principio de favorabilidad y presunción de inocencia. Respecto a las 'maniobras peligrosas' (D.07), esta es una calificación gravísima que requiere una descripción técnica de los hechos y no un simple juicio de valor. Le informo que si procede con la inmovilización bajo estos argumentos sin pruebas, estaré radicando una queja formal por abuso de autoridad y desviación de poder."

Si el oficial procede con la inmovilización a pesar de su defensa:

NO se resista físicamente, mantenga la calma y asegúrese de que el video capte el estado del semáforo si es posible.

Firme BAJO PROTESTA y escriba esto exactamente en las observaciones del comparendo:

"Firmo bajo protesta. Rechazo la acusación. El agente no cuenta con pruebas técnicas ni registro fílmico del supuesto cruce en rojo. Crucé en amarillo antes de la línea de pare. El agente invoca 'maniobras peligrosas' sin fundamento técnico para forzar una inmovilización ilegal, vulnerando el Art. 29 de la Constitución y el debido proceso."

Grabe el entorno: Capture el estado de los semáforos de la intersección y verifique si hay cámaras de seguridad de la ciudad cerca que puedan servir como prueba a su favor.

Tome fotos del vehículo y del agente: Asegúrese de tener registro de quién realiza el procedimiento.

Recuerde que tiene 5 días hábiles para la audiencia de descargos. Podemos solicitar la revisión de videos de cámaras de seguridad para demostrar su inocencia. Si el vehículo es llevado a los patios, debemos impugnar inmediatamente argumentando la falta de "plena identificación" de la infracción y la ausencia de pruebas.`,
    preguntasTriaje: ["¿Deseas que redacte el modelo de impugnación para este caso de semáforo y maniobra peligrosa?"],
    leyes: ["Art 131 Ley 769", "Infracción D.04", "Infracción D.07"],
    siguienteNodo: "semaforo_finalizacion"
  },
  "semaforo_escalamiento": {
    id: "semaforo_escalamiento",
    contexto: "Fallback name",
    guion: "",
    preguntasTriaje: [],
    leyes: [],
    siguienteNodo: "semaforo_finalizacion"
  },
  "semaforo_finalizacion": {
    id: "semaforo_finalizacion",
    contexto: "Minuta semaforo",
    guion: `A continuación le presento el modelo de escrito de impugnación. Este documento se centra en la ausencia de prueba técnica y en la indebida tipificación. Complete los datos marcados entre corchetes.

MODELO DEL DOCUMENTO
ENCABEZADO: Ciudad y fecha: [Ciudad], [Fecha]

Destinatario: Señor(a) Inspector(a) de Tránsito y Transporte de [Ciudad]

ASUNTO: Impugnación del comparendo No. [NÚMERO DEL COMPARENDO] - Nulidad por ausencia de prueba técnica y falsa motivación.

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

HECHOS: El día [FECHA], fui requerido por un agente de tránsito quien afirmó que realicé el cruce con luz en rojo. Manifiesto que realicé el cruce en la fase de transición (amarillo), habiendo superado la línea de pare conforme a la ley. El agente, careciendo de medios tecnológicos de prueba (fotos o videos), procedió a imponer el comparendo e inmovilizar el vehículo alegando "maniobras peligrosas" de forma subjetiva, con el único fin de dar apariencia de legalidad a una inmovilización sin sustento probatorio.

FUNDAMENTOS DE DERECHO:

Artículo 29 de la Constitución Política de Colombia: Derecho al Debido Proceso y Presunción de Inocencia. La carga de la prueba recae sobre la autoridad.

Sentencia C-038 de 2020 de la Corte Constitucional: Establece que la responsabilidad en materia de tránsito es personal y debe ser probada fehacientemente.

Artículo 129 de la Ley 769 de 2002: Indica que las multas no podrán imponerse sin que se establezca plenamente la ocurrencia de la infracción.

Principio de Tipicidad: Un cruce de semáforo (D.04) no puede ser arbitrariamente elevado a maniobra peligrosa (D.07) solo para facilitar una inmovilización si no existen los elementos técnicos que lo configuren.

PRUEBAS:

Registro en video del procedimiento donde se cuestiona al agente por la falta de pruebas técnicas.
Solicitud de exhibición de los videos de las cámaras del sistema de seguridad ubicadas en la intersección.
Testimonio de los ocupantes del vehículo y/o testigos presenciales.

SOLICITUDES: a) Se declare la NULIDAD del comparendo No. [NÚMERO] ante la inexistencia de prueba técnica que desvirtúe mi presunción de inocencia.

b) Se ordene la devolución de los dineros pagados por concepto de Grúa y Patios, debido a la inmovilización injustificada.

c) Se compulse copia a la oficina de Control Interno Disciplinario para que se investigue el proceder del agente por presunta falsa motivación en el acto administrativo.

FIRMA: [NOMBRE COMPLETO]
C.C. [CÉDULA]

Recordar al ciudadano:

Usted cuenta con 5 días hábiles tras la imposición para comparecer.
Si es una zona con cámaras, su solicitud de que la Secretaría de Movilidad revise los videos de las cámaras de seguridad es fundamental.
Tome captura de pantalla de TODA esta conversación.
El testimonio del agente no es "prueba plena" si existen dudas razonables sobre la fase del semáforo.`,
    preguntasTriaje: [],
    leyes: [],
    esExito: true
  },
  "semaforo_exito": {
    id: "semaforo_exito",
    contexto: "Exito",
    guion: "¡Excelente! Has logrado ejercer tu derecho y el oficial ha respetado el debido proceso.",
    preguntasTriaje: [],
    leyes: [],
    esExito: true
  },

  // === CASO 5: LUCES ===
  "luces_inicio": {
    id: "luces_inicio",
    contexto: "Inicio triaje luces",
    guion: "",
    preguntasTriaje: [
      "¿Qué luz exactamente dice el agente que está fundida (farola principal, direccional, o luz de freno)?",
      "¿Usted tiene la posibilidad de cambiar el bombillo o reparar la conexión en este mismo momento y lugar?",
      "¿La grúa en la que están subiendo las motos tiene placa de servicio público (placa blanca) y los logos de la autoridad de tránsito competente?"
    ],
    leyes: [],
    siguienteNodo: "luces_defensa"
  },
  "luces_defensa": {
    id: "luces_defensa",
    contexto: "Defensa luces",
    guion: `ATENCIÓN: Lo que mencionas de "varias motos en una sola grúa" es una irregularidad común. Según el Manual de Infracciones, cada vehículo inmovilizado debe tener su propio inventario y la grúa no debe exceder su capacidad de carga ni maltratar los vehículos.

Dígale exactamente esto al señor oficial:

"Señor oficial, según el Manual de Infracciones (Resolución 3027 de 2010), la infracción por luces en mal estado (C.08) permite la subsanación en el sitio. El Artículo 125 de la Ley 769 de 2002 establece claramente que la inmovilización debe suspenderse tan pronto cese la causa que la motivó. En este momento procedo a realizar el cambio del bombillo y la revisión de la conexión para garantizar la seguridad vial. Solicito que, una vez corregida la falla técnica, se me permita continuar mi marcha sin que proceda la inmovilización del vehículo, pues la causa habrá desaparecido antes de que el vehículo sea retirado por la grúa."

"Respecto a la grúa, informe al agente que está grabando cómo suben varias motocicletas en un mismo planchón, lo cual contraviene las normas de seguridad de carga y puede generar daños a la propiedad privada, de los cuales la autoridad será responsable."`,
    preguntasTriaje: ["¿El oficial ya inició la orden de comparendo o apenas le notificó la intención de inmovilizar por la luz?"],
    leyes: ["Res 3027 de 2010", "Art 125 Ley 769"],
    siguienteNodo: "luces_protesta"
  },
  "luces_protesta": {
    id: "luces_protesta",
    contexto: "Escalamiento luces",
    guion: `Si el oficial persiste en la inmovilización a pesar de que usted cambie el bombillo:

NO se resista, pero asegúrese de que el video muestre la luz funcionando después de su arreglo.

Firme BAJO PROTESTA y escriba esto en las observaciones:

"Firmo bajo protesta. Se vulnera el debido proceso y el Art. 125 de la Ley 769 de 2002. El agente se niega a permitir la subsanación en el sitio (cambio de luz C.08) a pesar de contar con el repuesto. Además, denuncio el procedimiento irregular de la grúa al transportar múltiples motos sin las medidas de seguridad y protección adecuadas."

Tome fotos del 'amontonamiento' de motos: Esto sirve para impugnar por irregularidades en el procedimiento de inmovilización.`,
    preguntasTriaje: ["¿Deseas que redacte el modelo de impugnación enfocado en la negación del derecho a la subsanación y el procedimiento irregular de la grúa?"],
    leyes: ["Art 125 Ley 769"],
    siguienteNodo: "luces_finalizacion"
  },
  "luces_escalamiento": {
    id: "luces_escalamiento",
    contexto: "Fallback name",
    guion: "",
    preguntasTriaje: [],
    leyes: [],
    siguienteNodo: "luces_finalizacion"
  },
  "luces_finalizacion": {
    id: "luces_finalizacion",
    contexto: "Minuta luces",
    guion: `A continuación le presento el modelo de escrito de impugnación. Este documento es clave porque se enfoca en la violación al derecho de subsanación y en las irregularidades del procedimiento de transporte (grúa). Complete los datos marcados entre corchetes.

MODELO DEL DOCUMENTO
ENCABEZADO: Ciudad y fecha: [Ciudad], [Fecha]

Destinatario: Señor(a) Inspector(a) de Tránsito y Transporte de [Ciudad]

ASUNTO: Impugnación del comparendo No. [NÚMERO DEL COMPARENDO] - Nulidad por negación de subsanación en sitio e irregularidades en la inmovilización.

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

HECHOS: El día [FECHA], fui requerido en un puesto de control por presentar una falla en la luz de la farola principal (Infracción C.08). De inmediato, manifesté mi voluntad y capacidad de subsanar la falta en el sitio, contando con el repuesto y las herramientas necesarias. Sin embargo, el agente de tránsito negó este derecho legal, procediendo con la inmovilización. Asimismo, denuncio que mi vehículo fue transportado en una grúa, la cual cargaba múltiples motocicletas simultáneamente, poniendo en riesgo la integridad de mi propiedad privada por falta de aseguramiento individual.

FUNDAMENTOS DE DERECHO:

Artículo 29 de la Constitución Política: Debido proceso administrativo.

Artículo 125 de la Ley 769 de 2002: "La inmovilización se suspenderá tan pronto cese la causa que la motivó". Al ofrecer el cambio del bombillo, la causa de la inmovilización debía desaparecer.

Resolución 3027 de 2010 (Manual de Infracciones): Establece que para la infracción C.08 se debe permitir la subsanación.

Normas sobre transporte de carga y vehículos: El transporte de varios vehículos en una sola grúa sin el cumplimiento de las normas de seguridad técnica constituye una irregularidad en el procedimiento administrativo.

PRUEBAS:

Registro en video donde se observa que tengo el repuesto y el agente se niega a permitir la subsanación.
Fotografías/Video de la grúa transportando múltiples motos, evidenciando el mal procedimiento.
Copia del comparendo con la anotación de protesta por negación de subsanación.

SOLICITUDES: a) Se declare la NULIDAD del comparendo y del acta de inmovilización por violación al debido proceso.

b) Se exonere el pago de Grúa y Patios, ya que la ley obligaba a suspender la inmovilización si se corregía la falla en el sitio.

c) Se investigue la idoneidad del servicio de grúas contratado, dado el riesgo de daño a los vehículos por sobrecarga.

FIRMA: [NOMBRE COMPLETO]
C.C. [CÉDULA]

Recordar al ciudadano:

Usted tiene 5 días hábiles para radicar este documento.
El video de la grúa con muchas motos es una prueba de "procedimiento irregular" que debilita la posición de la Secretaría de Tránsito.
Guarde registro de cualquier rayón o daño que sufra la moto al bajarla de esa grúa; ellos son responsables civilmente.
Tome captura de pantalla de TODA esta conversación.`,
    preguntasTriaje: [],
    leyes: [],
    esExito: true
  },
  "luces_exito": {
    id: "luces_exito",
    contexto: "Exito",
    guion: "¡Excelente! Has logrado ejercer tu derecho y el oficial ha respetado el debido proceso.",
    preguntasTriaje: [],
    leyes: [],
    esExito: true
  },

  // === CASO 6: CHOQUE ===
  "choque_inicio": {
    id: "choque_inicio",
    contexto: "Inicio triaje choque",
    guion: "",
    preguntasTriaje: [
      "¿Hubo heridos o fallecidos en el accidente, o son solo daños materiales (choque de latas)?",
      "¿Los vehículos continúan bloqueando la vía o ya los movieron?",
      "¿El agente de tránsito ya llegó y les exigió mover los vehículos bajo amenaza de comparendo por bloqueo de vía?"
    ],
    leyes: [],
    siguienteNodo: "choque_defensa"
  },
  "choque_defensa": {
    id: "choque_defensa",
    contexto: "Defensa por choque simple",
    guion: "Muevan los vehículos de inmediato según la Ley 2251 de 2022 para evitar el comparendo por bloqueo.",
    preguntasTriaje: ["¿Movieron los vehículos?"],
    leyes: [],
    siguienteNodo: "choque_escalamiento"
  },
  "choque_escalamiento": {
    id: "choque_escalamiento",
    contexto: "Escalamiento choque",
    guion: "Si el oficial intenta inmovilizar sin heridos, es ilegal.",
    preguntasTriaje: ["¿Se resolvió el incidente?"],
    leyes: [],
    siguienteNodo: "choque_finalizacion"
  },
  "choque_finalizacion": {
    id: "choque_finalizacion",
    contexto: "Acta de conciliación",
    guion: "Modelo de acta de conciliación...",
    preguntasTriaje: [],
    leyes: [],
    esExito: true
  },
  "choque_exito": {
    id: "choque_exito",
    contexto: "Exito",
    guion: "Problema resuelto exitosamente.",
    preguntasTriaje: [],
    leyes: [],
    esExito: true
  },

  // === CASO 6B: CHOQUE - NODOS EXTENDIDOS ===
  "choque_solo_comparendo": {
    id: "choque_solo_comparendo",
    contexto: "Choque sin inmovilización - solo comparendo",
    guion: `Entiendo la situación. El oficial pretende imponerle un comparendo tras el accidente de tránsito, sin proceder a la inmovilización del vehículo.

Dígale exactamente esto al señor oficial:

"Señor oficial, con el respeto que usted se merece, según la Ley 2251 de 2022 y el Artículo 143 del Código Nacional de Tránsito (Ley 769 de 2002), en un accidente de tránsito con solo daños materiales (sin heridos), los conductores tienen el deber de retirar los vehículos de la vía para no obstruir el tráfico. Solicito que el comparendo refleje fielmente los hechos ocurridos y que se respete mi derecho al debido proceso consagrado en el Artículo 29 de la Constitución Política. Además, le informo que tengo derecho a presentar mis descargos dentro de los 5 días hábiles siguientes."

Si el oficial procede con el comparendo:

NO se resista físicamente.
Firme BAJO PROTESTA Y ESCRIBA ESTO EN LAS OBSERVACIONES DEL COMPARENDO, AL FIRMAR NO ESTÁ ACEPTANDO LA CULPA:
"Firmo bajo protesta ya que no estoy de acuerdo con los hechos descritos. Me reservo el derecho a impugnar dentro del término legal. Solicito copia del croquis y de las pruebas recaudadas."

Grabe TODO el procedimiento de principio a fin de forma ininterrumpida.
Tome fotos de los daños de AMBOS vehículos, del lugar del accidente y de las señales de tránsito.
Recuerda que tienes un plazo de 5 días hábiles para solicitar una audiencia de descargos.
Tomar captura de pantalla de TODA esta conversación.`,
    preguntasTriaje: ["¿Deseas que redacte el modelo de impugnación del comparendo por el accidente?"],
    leyes: ["Ley 2251 de 2022", "Art 143 Ley 769", "Art 29 CP"],
    siguienteNodo: "choque_finalizacion"
  },
  "choque_solo_inmovilizacion": {
    id: "choque_solo_inmovilizacion",
    contexto: "Choque con amenaza de inmovilización o grúa",
    guion: `Entiendo la situación. El oficial está amenazando con inmovilizar su vehículo tras el accidente.

Dígale exactamente esto al señor oficial:

"Señor oficial, con el respeto que usted se merece, según el Artículo 125 de la Ley 769 de 2002, la inmovilización solo procede cuando hay heridos o fallecidos en el accidente, cuando el conductor se encuentra en estado de embriaguez, o cuando el vehículo no tiene SOAT o está involucrado en un hecho punible. Si este accidente es solo de daños materiales y mi documentación está en regla, la inmovilización NO procede legalmente. La Ley 2251 de 2022 establece que en accidentes de solo daños, los conductores deben retirar los vehículos de la vía. Le solicito que se respete mi derecho al debido proceso."

Si el oficial procede con la inmovilización a pesar de su solicitud:

NO se resista físicamente.
Firme BAJO PROTESTA Y ESCRIBA ESTO EN LAS OBSERVACIONES DEL COMPARENDO:
"Firmo bajo protesta. Se inmoviliza mi vehículo de forma arbitraria en un accidente de solo daños materiales, sin heridos, sin embriaguez y con documentación vigente. Vulneración al Art. 125 de la Ley 769 de 2002 y al debido proceso (Art. 29 CP). Procedimiento nulo."

Grabe TODO el procedimiento, especialmente el inventario del vehículo antes de subirlo a la grúa.
Tome fotos del estado del vehículo ANTES de que se lo lleven.
Recuerda que tienes un plazo de 5 días hábiles para solicitar una audiencia de descargos.
Tomar captura de pantalla de TODA esta conversación.`,
    preguntasTriaje: ["¿Deseas que redacte el modelo de impugnación contra la inmovilización ilegal?"],
    leyes: ["Art 125 Ley 769", "Ley 2251 de 2022", "Art 29 CP"],
    siguienteNodo: "choque_finalizacion"
  },
  "choque_conciliacion": {
    id: "choque_conciliacion",
    contexto: "Choque - ambos conductores quieren conciliar",
    guion: `Entiendo la situación. Ambos conductores están dispuestos a resolver esto de manera amistosa, lo cual es la mejor opción en un accidente de solo daños materiales.

La Ley 2251 de 2022 (Ley de Choques Simples) les permite a los conductores involucrados en accidentes con solo daños materiales llegar a un acuerdo y retirarse sin necesidad de esperar a las autoridades de tránsito.

PASOS PARA LA CONCILIACIÓN:
1. Retiren los vehículos de la vía pública inmediatamente.
2. Tomen fotos de los daños de AMBOS vehículos desde todos los ángulos.
3. Intercambien datos: nombre completo, cédula, teléfono, placa, SOAT y aseguradora.
4. Redacten un Acta de Conciliación firmada por ambas partes.

IMPORTANTE: Si tienen seguro (póliza todo riesgo o SOAT), pueden reportar el siniestro directamente a su aseguradora. El SOAT cubre daños a personas y el seguro todo riesgo cubre daños al vehículo.`,
    preguntasTriaje: ["¿Deseas que redacte el modelo de Acta de Conciliación para que ambos conductores lo firmen?"],
    leyes: ["Ley 2251 de 2022", "Art 143 Ley 769"],
    siguienteNodo: "choque_acta_conciliacion"
  },
  "choque_acta_conciliacion": {
    id: "choque_acta_conciliacion",
    contexto: "Entregable: Acta de Conciliación por choque",
    guion: `A continuación le presento el modelo de Acta de Conciliación. Complete los datos marcados entre corchetes con la información de ambas partes.

MODELO DEL DOCUMENTO

ACTA DE CONCILIACIÓN POR ACCIDENTE DE TRÁNSITO
(Ley 2251 de 2022 - Choques Simples)

FECHA Y LUGAR: [Ciudad], [Fecha], [Hora]
DIRECCIÓN DEL ACCIDENTE: [Dirección exacta]

DATOS DEL CONDUCTOR 1:
Nombre completo: [NOMBRE]
Cédula: [CÉDULA]
Teléfono: [TELÉFONO]
Placa del vehículo: [PLACA]
Marca y modelo: [MARCA/MODELO]
SOAT vigente No.: [NÚMERO SOAT]
Aseguradora: [ASEGURADORA]

DATOS DEL CONDUCTOR 2:
Nombre completo: [NOMBRE]
Cédula: [CÉDULA]
Teléfono: [TELÉFONO]
Placa del vehículo: [PLACA]
Marca y modelo: [MARCA/MODELO]
SOAT vigente No.: [NÚMERO SOAT]
Aseguradora: [ASEGURADORA]

DESCRIPCIÓN DE LOS HECHOS: [Descripción breve de cómo ocurrió el accidente]

DAÑOS REGISTRADOS:
Vehículo 1: [Descripción de los daños]
Vehículo 2: [Descripción de los daños]

ACUERDO: Las partes acuerdan de manera libre y voluntaria resolver el presente incidente bajo los siguientes términos: [Detallar el acuerdo: quién paga, monto, plazos, etc.]

FIRMAS:
Conductor 1: _______________ C.C. [CÉDULA]
Conductor 2: _______________ C.C. [CÉDULA]
Testigo (opcional): _______________ C.C. [CÉDULA]

Recordar a ambas partes:
Cada conductor debe conservar una copia firmada de esta acta.
Tomen fotos del acta firmada y de los daños.
Reporten a sus respectivas aseguradoras dentro de las 24 horas.
Tomar captura de pantalla de TODA esta conversación.`,
    preguntasTriaje: [],
    leyes: ["Ley 2251 de 2022"],
    esExito: true
  },
  "choque_finalizacion_solo_multa": {
    id: "choque_finalizacion_solo_multa",
    contexto: "Impugnación de multa por choque sin inmovilización",
    guion: `A continuación le presento el modelo de escrito de impugnación del comparendo. Complete los datos marcados entre corchetes.

MODELO DEL DOCUMENTO

ENCABEZADO: Ciudad y fecha: [Ciudad], [Fecha]
Destinatario: Señor(a) Inspector(a) de Tránsito y Transporte de [Ciudad]

ASUNTO: Impugnación del comparendo No. [NÚMERO DEL COMPARENDO] por accidente de tránsito.

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

HECHOS: El día [FECHA], se presentó un accidente de tránsito con solo daños materiales en [DIRECCIÓN]. Los vehículos fueron retirados de la vía en cumplimiento de la Ley 2251 de 2022. El agente de tránsito impuso comparendo sin considerar las circunstancias atenuantes ni el cumplimiento de la normativa por parte del suscrito.

FUNDAMENTOS DE DERECHO:
Artículo 29 de la Constitución Política de Colombia: Debido Proceso.
Ley 2251 de 2022: Procedimiento para accidentes de tránsito con solo daños materiales.
Artículo 143 de la Ley 769 de 2002: Procedimiento en caso de accidentes.

PRUEBAS:
Registro fotográfico y en video del accidente y del procedimiento.
Copia del comparendo con observaciones bajo protesta.
Capturas de pantalla de esta asesoría legal.

SOLICITUDES: a) Se revise la procedencia del comparendo y se declare su nulidad.
b) Se tomen en cuenta las circunstancias atenuantes del caso.

FIRMA: [NOMBRE COMPLETO]
C.C. [CÉDULA]

Recordar al ciudadano:
Usted tiene 5 días hábiles para presentar los descargos.
Conserve todas las pruebas (fotos, videos, comparendo).
Tomar captura de pantalla de TODA esta conversación.`,
    preguntasTriaje: [],
    leyes: ["Ley 2251 de 2022", "Art 143 Ley 769", "Art 29 CP"],
    esExito: true
  },

  // === CASO 7: OTRO (SOAT, Pico y Placa, Tecnomecánica, Alcoholemia, etc.) ===
  "otro_inicio": {
    id: "otro_inicio",
    contexto: "Inicio de triaje para casos no estándar (SOAT, Pico y Placa, Tecnomecánica, Alcoholemia, etc.)",
    guion: "",
    preguntasTriaje: [],
    leyes: ["Artículo 20 CN", "Artículo 21 Ley 1801"],
    siguienteNodo: "otro_defensa"
  },
  "otro_defensa": {
    id: "otro_defensa",
    contexto: "Defensa dinámica para casos no estándar. El veredicto del Nodo 3 (Jurista) provee el contenido legal.",
    guion: "",
    preguntasTriaje: ["¿Cómo respondió el oficial a tu solicitud? ¿Accede o insiste en proceder con el comparendo o la inmovilización?"],
    leyes: [],
    siguienteNodo: "otro_finalizacion"
  },
  "otro_finalizacion": {
    id: "otro_finalizacion",
    contexto: "Finalización/impugnación para casos no estándar.",
    guion: "",
    preguntasTriaje: [],
    leyes: [],
    esExito: true
  }
};
