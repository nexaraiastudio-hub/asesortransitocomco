// base_normativa.ts - Base de datos normativa del Jurista
// Separada para facilitar actualizaciones de leyes sin tocar la lógica

export interface NormativaTema {
  normas: string[];
  metodo_legal: string;
  metodo_invalido: string;
  codigo_infraccion?: string;
  subsanable: boolean;
  notas?: string;
  preguntas_fase1: string[];
}

export const BASE_NORMATIVA: Record<string, NormativaTema> = {
  "polarizados": {
    normas: [
      "Resolución 3777 de 2003",
      "Resolución 3443 de 2008 (vehículos escolares)",
      "Circular 0022 de 2002"
    ],
    metodo_legal: "fotómetro o luxómetro calibrado con certificado vigente",
    metodo_invalido: "apreciación visual, a simple vista, observación directa",
    codigo_infraccion: "B.10",
    subsanable: false,
    notas: "Vehículos escolares SÍ pueden tener polarizados: 70% panorámico y delanteros, 55% traseros",
    preguntas_fase1: [
      "¿Qué tipo de vehículo conduce? (automóvil particular, camioneta, bus o vehículo escolar — este último cambia la defensa)",
      "¿A qué autoridad pertenece el oficial que lo detuvo? (Policía de Tránsito, Agente Civil de Tránsito, Policía Nacional)",
      "¿El oficial utilizó un dispositivo electrónico llamado fotómetro o luxómetro para medir el porcentaje de transmisión de luz de los vidrios? ¿O lo está determinando a simple vista?"
    ]
  },
  
  "llantas": {
    normas: [
      "Resolución 3027 de 2010",
      "NTC 5375",
      "Artículo 29 Constitución Política (debido proceso)"
    ],
    metodo_legal: "profundímetro calibrado con certificado vigente",
    metodo_invalido: "tarjeta, moneda, observación visual, a ojo",
    codigo_infraccion: "C.04",
    subsanable: false,
    notas: "Límite motos: 1.0 mm, vehículos livianos: 1.6 mm, pesados: 2.0 mm",
    preguntas_fase1: [
      "¿Qué tipo de vehículo conduce? (moto, carro, camioneta, bus, camión)",
      "¿A qué autoridad pertenece el oficial que lo detuvo? (Policía de Tránsito, Agente Civil de Tránsito, Policía Nacional)",
      "¿El oficial utilizó un instrumento llamado profundímetro calibrado para medir el desgaste de la llanta? ¿O fue una revisión visual o subjetiva, por ejemplo usando una tarjeta o moneda?",
      "¿Le mostraron el resultado de la medición y el certificado de calibración del instrumento?"
    ]
  },
  
  "casco": {
    normas: [
      "Ley 769 de 2002",
      "Artículo 94 Ley 769 de 2002",
      "Artículo 96 Ley 769 de 2002",
      "Artículo 125 Ley 769 de 2002 (subsanación)",
      "Resolución 3027 de 2010"
    ],
    metodo_legal: "N/A - falta objetiva",
    metodo_invalido: "N/A",
    codigo_infraccion: "C.02",
    subsanable: true,
    notas: "Subsanación: descender al parrillero. Evita inmovilización pero el comparendo puede proceder",
    preguntas_fase1: [
      "¿En qué ciudad se encuentra?",
      "¿Su acompañante tiene un casco disponible o definitivamente no cuenta con uno en este momento?",
      "¿Existe alguna restricción de parrillero vigente en su ciudad en este horario?"
    ]
  },
  
  "cinturon": {
    normas: [
      "Artículo 82 Ley 769 de 2002",
      "Artículo 125 Ley 769 de 2002 (subsanación)",
      "Resolución 3027 de 2010"
    ],
    metodo_legal: "N/A - falta objetiva",
    metodo_invalido: "N/A",
    codigo_infraccion: "C.07",
    subsanable: true,
    notas: "Subsanación: abrocharse el cinturón en el momento",
    preguntas_fase1: [
      "¿En el momento de la detención, el cinturón estaba desabrochado o simplemente mal puesto?",
      "¿El agente tiene alguna prueba de la infracción? (fotografía, video, cámara de fotomulta) ¿O lo determinó por observación directa?",
      "¿Todos los ocupantes del vehículo llevaban el cinturón puesto o solo usted no lo llevaba?"
    ]
  },
  
  "cinturon_especial": {
    normas: [
      "Resolución 668 de 2018",
      "Ley 769 de 2002, Artículo 82"
    ],
    metodo_legal: "N/A - verificación de ficha técnica",
    metodo_invalido: "N/A",
    subsanable: false,
    notas: "Vehículos anteriores a 2018 se rigen por ficha técnica original. No aplica retroactivamente",
    preguntas_fase1: [
      "¿El vehículo es de placa blanca (Servicio Especial: escolar, turismo o empresarial)?",
      "¿De qué año es el modelo del vehículo?",
      "¿El oficial dice que faltan los cinturones o que alguien no lo tiene puesto?"
    ]
  },
  
  "silla_nino": {
    normas: [
      "NTC 4481",
      "Artículo 82 Ley 769 de 2002",
      "Resolución 3027 de 2010"
    ],
    metodo_legal: "certificación NTC 4481",
    metodo_invalido: "apreciación visual de la silla",
    codigo_infraccion: "B.18",
    subsanable: false,
    notas: "Menores de 2 años deben usar sistema de retención. Menores de 10 años no asiento delantero",
    preguntas_fase1: [
      "¿Qué edad tiene el niño que transporta?",
      "¿El niño viaja en asiento delantero o trasero?",
      "¿La silla de retención infantil tiene certificación NTC 4481 visible?",
      "¿El oficial alega que la silla no cumple o que no está usando una?"
    ]
  },
  
  "semaforo": {
    normas: [
      "Artículo 131 Ley 769 de 2002",
      "Artículo 29 Constitución Política"
    ],
    metodo_legal: "fotomulta (cámara) o percepción visual directa del agente en vía",
    metodo_invalido: "N/A (el agente en vía SÍ es testigo directo válido)",
    codigo_infraccion: "D.04",
    subsanable: false,
    notas: "Infracción D.04. NO da lugar a inmovilización. El agente en vía solo impone la orden de comparendo y el vehículo puede seguir su marcha. La Sentencia C-038 de 2020 aplica ÚNICAMENTE para fotomultas fijas, no para operativos presenciales en vía.",
    preguntas_fase1: [
      "¿En qué ciudad se encuentra y en qué intersección ocurrió?",
      "¿La infracción se la está imponiendo un agente en la calle o le llegó una fotomulta?",
      "¿En qué fase se encontraba el semáforo cuando usted pasó? (rojo firme, cambiando de amarillo a rojo, intermitente)",
      "¿Qué tipo de vehículo conduce?",
      "¿Había alguna circunstancia especial? (emergencia, semáforo dañado, congestión, desvío de tránsito)"
    ]
  },
  
  "luz_fundida": {
    normas: [
      "Artículo 125 Ley 769 de 2002 (subsanación)",
      "Resolución 3027 de 2010"
    ],
    metodo_legal: "N/A",
    metodo_invalido: "N/A",
    codigo_infraccion: "C.08",
    subsanable: true,
    notas: "Inmovilización solo con 2+ luces fundidas. Una sola: subsanable, no procede inmovilización",
    preguntas_fase1: [
      "¿Qué luz específicamente tiene fundida? (faro principal, direccional, luz trasera, luz de freno)",
      "¿Tiene la posibilidad de conseguir y cambiar el bombillo en este momento?",
      "¿La grúa donde están subiendo las motos tiene placa blanca visible y marcada con los datos de la empresa? ¿Cuántas motos llevan encima aproximadamente?"
    ]
  },
  
  "kit_carretera": {
    normas: [
      "Artículo 30 Ley 769 de 2002",
      "Resolución 3027 de 2010",
      "Artículo 125 Ley 769 de 2002 (subsanación)"
    ],
    metodo_legal: "N/A",
    metodo_invalido: "N/A",
    subsanable: true,
    notas: "1. Motocicletas: Totalmente exentas de portar kit de carretera y botiquín. 2. Vehículos Particulares: Exige botiquín básico y extintor (capacidad mínima). 3. Transporte Público/Especial/Escolar: Las exigencias son más estrictas y dependen del aforo de pasajeros. Requieren botiquín dotado para emergencias múltiples (gasas, vendajes, inmovilizador cervical, férulas) y extintores de mayor capacidad. 4. Subsanación: Si algún elemento está vencido o falta, la inmovilización NO procede si el conductor puede subsanarlo en el sitio de forma inmediata (comprando el elemento faltante).",
    preguntas_fase1: [
      "¿Qué tipo de vehículo conduce y cuántos pasajeros transporta? (automóvil, buseta, escolar, público, particular)",
      "¿Qué elemento específico del kit o botiquín dice el oficial que le falta o está vencido?",
      "¿El oficial le dio la opción de subsanar (conseguir o reemplazar) el elemento en este momento antes de proceder con la grúa?"
    ]
  },
  
  "placa": {
    normas: [
      "Resolución 4100 de 2004",
      "Resolución 3027 de 2010"
    ],
    metodo_legal: "N/A - placa visible y legible",
    metodo_invalido: "N/A",
    subsanable: false,
    notas: "NO existe norma sobre ángulo del soporte. Requisito: visible, legible, sin obstrucciones",
    preguntas_fase1: [
      "¿Qué tipo de vehículo conduce?",
      "¿Qué específicamente dice el oficial que está mal de la placa? (posición, iluminación, obstrucción, tamaño, tipo de soporte)",
      "¿La placa está visible, legible y sin obstrucciones físicas?"
    ]
  },
  
  "escape": {
    normas: [
      "Resolución 8321 de 1983",
      "Artículo 29 Constitución Política",
      "Sentencia C-038 de 2020"
    ],
    metodo_legal: "sonómetro o decibelímetro calibrado",
    metodo_invalido: "apreciación auditiva, a simple oído, 'suena muy fuerte'",
    subsanable: false,
    notas: "Determinación a simple oído no constituye prueba técnica legal",
    preguntas_fase1: [
      "¿Qué tipo de vehículo y qué tipo de motor tiene? (moto de dos tiempos, moto cuatro tiempos, carro gasolina, carro diésel)",
      "¿El oficial utilizó algún instrumento electrónico para medir el nivel de ruido del escape, como un sonómetro o decibelímetro? ¿O está determinando el nivel de ruido a simple oído?",
      "¿El escape del vehículo tiene algún documento o certificación de fábrica?"
    ]
  },
  
  "velocidad": {
    normas: [
      "Resolución 3027 de 2010"
    ],
    metodo_legal: "radar o cinemómetro calibrado con certificado vigente",
    metodo_invalido: "estimación visual, 'me pareció que iba rápido'",
    codigo_infraccion: "D.01",
    subsanable: false,
    notas: "El agente debe mostrar la lectura y el certificado de calibración",
    preguntas_fase1: [
      "¿En qué vía se encuentra? (avenida, calle, carretera, zona escolar)",
      "¿El oficial utilizó un radar o cinemómetro para medir la velocidad? ¿Le mostró la lectura y el certificado de calibración?",
      "¿Conoce el límite de velocidad de esa vía y a qué velocidad lo detuvieron?",
      "¿Había señalización de velocidad máxima visible?"
    ]
  },
  
  "piques": {
    normas: [
      "Artículo 131 Ley 769 de 2002"
    ],
    metodo_legal: "video de cámara de seguridad, radar, testigos oficiales",
    metodo_invalido: "observación solitaria del agente",
    subsanable: false,
    notas: "Infracción gravísima. Sanción: suspensión licencia 12-24 meses, multa 30 SMLDV",
    preguntas_fase1: [
      "¿Qué tipo de vehículo conduce? (moto, carro, camioneta)",
      "¿El oficial o las autoridades tienen alguna prueba del evento? (video de cámara de seguridad, grabación de otro agente, testigos oficiales, radar)",
      "¿Hubo algún accidente o daño a terceros durante el evento?",
      "¿Está en el lugar del supuesto hecho o ya lo trasladaron a otro lugar?"
    ]
  },
  
  "embriaguez": {
    normas: [
      "Ley 1696 de 2013",
      "Resolución 1844 de 2015"
    ],
    metodo_legal: "alcohosensor con certificación vigente",
    metodo_invalido: "síntomas físicos, olor a licor, criterio subjetivo",
    subsanable: false,
    notas: "El agente debe mostrar el resultado y el certificado de calibración",
    preguntas_fase1: [
      "¿El oficial utilizó un alcohosensor para realizar la prueba? ¿Le mostró el certificado de calibración vigente?",
      "¿Le informaron el resultado de la prueba antes de proceder?",
      "¿Pasaron más de 15 minutos entre la supuesta infracción y la prueba?",
      "¿Ha consumido alcohol en las últimas 8 horas? (Sea honesto para la defensa)"
    ]
  },
  
  "parqueo_prohibido": {
    normas: [
      "Artículo 76 Ley 769 de 2002",
      "Artículo 125 Ley 769 de 2002"
    ],
    metodo_legal: "señalización vertical visible conforme a reglamentación, u obstrucción de garaje/hidrante/esquina < 5m",
    metodo_invalido: "señalización inexistente, ilegible, o parqueo antes de la señal en sentido de vía sin placa complementaria",
    subsanable: true,
    notas: "Es prohibido parquear a menos de 5m de esquinas, frente a garajes e hidrantes. Si hay señal de prohibido parquear, la prohibición rige a partir del poste hacia adelante en el sentido de la vía, a menos que indique 'en toda la cuadra'. La inmovilización cesa si el conductor está presente para retirar el vehículo (subsanación).",
    preguntas_fase1: [
      "¿En qué posición exacta estaba parqueado su vehículo respecto a la señal de Prohibido Parquear? (¿antes de la señal o después de ella en el sentido del tráfico?)",
      "¿Existe algún letrero o placa complementaria bajo la señal que diga 'en toda la cuadra' o similar?",
      "¿Estaba parqueado obstruyendo la entrada de un garaje, un hidrante, o a menos de 5 metros de una esquina?",
      "¿Usted se encontraba presente en el sitio antes de que engancharan su vehículo a la grúa?"
    ]
  },

  "plataformas": {
    normas: [
      "Artículo 15 Constitución Política",
      "Artículo 29 Constitución Política",
      "Artículo 135 Ley 769 de 2002"
    ],
    metodo_legal: "verificación documental básica del vehículo y conductor",
    metodo_invalido: "interrogatorio a pasajeros, solicitud o retención de teléfonos celulares, preguntas sobre origen/destino del viaje",
    subsanable: false,
    notas: "El control de tránsito es estrictamente documental. El oficial no tiene facultades de policía judicial para interrogar a pasajeros sobre el uso de aplicaciones (Uber, Didi, etc.) ni para solicitar o revisar teléfonos celulares sin orden judicial.",
    preguntas_fase1: [
      "¿Qué tipo de vehículo conduce? (carro, moto)",
      "¿El oficial está solicitando el celular del conductor o de los pasajeros, o intentando interrogarlos sobre el servicio/plataforma?",
      "¿El oficial está exigiendo documentos del vehículo o está intentando bajar a los pasajeros para interrogarlos?"
    ]
  },

  "maniobras_peligrosas": {
    normas: [
      "Artículo 55 Ley 769 de 2002",
      "Artículo 94 Ley 769 de 2002",
      "Artículo 96 Ley 769 de 2002",
      "Resolución 3027 de 2010"
    ],
    metodo_legal: "verificación visual directa del oficial, video",
    metodo_invalido: "percepción sin evidencia objetiva de maniobra de peligro",
    subsanable: false,
    notas: "Zigzaguear entre vehículos constituye maniobra peligrosa y puede dar lugar a comparendo e inmovilización si pone en riesgo la seguridad. (Para motos por ciclorrutas ver invasion_ciclorruta).",
    preguntas_fase1: [
      "¿El oficial le imputa haber realizado zigzagueo o maniobras peligrosas entre vehículos?"
    ]
  },

  "invasion_ciclorruta": {
    normas: [
      "Artículo 131 de la Ley 769 de 2002",
      "Infracción D.05"
    ],
    metodo_legal: "verificación visual directa del oficial, foto, video",
    metodo_invalido: "N/A (la conducta de transitar por zonas peatonales o ciclorrutas es evidente visualmente)",
    codigo_infraccion: "D.05",
    subsanable: false,
    notas: "Conducir un vehículo sobre aceras, plazas, vías peatonales, separadores, bermas, demarcaciones de canalización, zonas verdes o vías especiales para vehículos no motorizados (ciclorrutas). INMOVILIZACIÓN OBLIGATORIA (infracción D).",
    preguntas_fase1: [
      "¿El oficial menciona que transitabas exactamente por la ciclorruta, andén o zona verde?",
      "¿Ya llegó la grúa para la inmovilización obligatoria del vehículo?"
    ]
  },

  "chaleco_reflectivo": {
    normas: [
      "Artículo 94 Ley 769 de 2002",
      "Artículo 125 Ley 769 de 2002"
    ],
    metodo_legal: "N/A - falta objetiva",
    metodo_invalido: "N/A",
    subsanable: true,
    notas: "El uso de chaleco reflectivo es obligatorio para motos entre las 18:00 y las 06:00 del día siguiente. Es subsanable en sitio (conseguir el chaleco), por lo que no procede la inmovilización.",
    preguntas_fase1: [
      "¿A qué hora ocurrió la detención?",
      "¿Tiene un chaleco reflectivo a la mano o la posibilidad de comprar/conseguir uno en el sitio?"
    ]
  },
  
  "soat_vencido": {
    normas: [
      "Artículo 42 Ley 769 de 2002",
      "Infracción D.02"
    ],
    metodo_legal: "consulta en RUNT o documento físico/digital válido",
    metodo_invalido: "N/A",
    codigo_infraccion: "D.02",
    subsanable: false,
    notas: "Conducir sin portar el SOAT vigente. Genera inmovilización inmediata (Infracción D.02). No aplica descuento si el documento aportado resulta ser falso.",
    preguntas_fase1: [
      "¿El SOAT está vencido, o usted no lo porta, o el oficial alega que es falso?",
      "¿El oficial verificó el estado del SOAT en el RUNT?"
    ]
  },
  
  "revision_tecnicomecanica": {
    normas: [
      "Artículo 50 y 52 Ley 769 de 2002",
      "Infracción C.35"
    ],
    metodo_legal: "consulta en RUNT o certificado físico vigente",
    metodo_invalido: "N/A",
    codigo_infraccion: "C.35",
    subsanable: false,
    notas: "No realizar la revisión técnico-mecánica y de emisiones contaminantes en los plazos establecidos. Inmovilización inmediata.",
    preguntas_fase1: [
      "¿La revisión técnico-mecánica está efectivamente vencida?",
      "¿De qué año es el modelo de su vehículo? (Esto determina si ya le correspondía realizar la primera revisión)"
    ]
  },
  
  "licencia": {
    normas: [
      "Artículos 17 y 131 Ley 769 de 2002",
      "Artículo 125 Ley 769 de 2002 (Subsanabilidad)"
    ],
    metodo_legal: "verificación en RUNT o documento físico/digital",
    metodo_invalido: "N/A",
    codigo_infraccion: "B.01, C.01, D.01",
    subsanable: true,
    notas: "Si olvidó la licencia (B.01) puede subsanar inmovilización en 60 minutos si alguien se la lleva. Si la licencia está vencida o no tiene la categoría (C.01), puede evitar la grúa consiguiendo a un conductor con licencia válida en menos de 60 minutos.",
    preguntas_fase1: [
      "¿Usted tiene licencia pero se le quedó, está vencida, o definitivamente no tiene licencia para la categoría de ese vehículo?",
      "¿Tiene a alguien con licencia válida que pueda llegar al sitio en menos de 60 minutos para llevarse el vehículo?"
    ]
  },
  
  "pico_y_placa": {
    normas: [
      "Artículo 131 Ley 769 de 2002 (Infracción C.14)",
      "Decretos locales de movilidad"
    ],
    metodo_legal: "verificación visual u horaria directa, cámara fotomulta",
    metodo_invalido: "N/A",
    codigo_infraccion: "C.14",
    subsanable: false,
    notas: "Transitar por sitios restringidos o en horas prohibidas (Pico y Placa). Comparendo e inmovilización obligatoria, salvo excepciones explícitas en el decreto local.",
    preguntas_fase1: [
      "¿Qué tipo de vehículo conduce y cuál es el último número de su placa?",
      "¿Su vehículo se encuentra amparado bajo alguna de las excepciones de restricción de su ciudad (ej. permiso especial, vehículo eléctrico, esquema de seguridad)?"
    ]
  },
  
  "contravia": {
    normas: [
      "Artículo 131 Ley 769 de 2002 (Infracción D.03)"
    ],
    metodo_legal: "verificación visual, fotos, cámaras",
    metodo_invalido: "N/A",
    codigo_infraccion: "D.03",
    subsanable: false,
    notas: "Transitar en sentido contrario al estipulado para la vía, calzada o carril. Comparendo e inmovilización obligatoria y directa.",
    preguntas_fase1: [
      "¿La vía estaba claramente señalizada indicando el sentido del tránsito (flechas, señales preventivas o de prohibido girar)?",
      "¿Era una maniobra breve para evadir un obstáculo repentino, o usted transitó deliberadamente en sentido contrario?"
    ]
  },
  
  "celular": {
    normas: [
      "Artículo 131 Ley 769 de 2002 (Infracción C.38)"
    ],
    metodo_legal: "verificación visual directa del agente en vía, cámaras",
    metodo_invalido: "N/A",
    codigo_infraccion: "C.38",
    subsanable: false,
    notas: "Usar sistemas móviles de comunicación o teléfonos instalados en los vehículos al momento de conducir, a excepción de accesorios de manos libres. La percepción visual del agente es prueba suficiente. NO da lugar a inmovilización.",
    preguntas_fase1: [
      "¿Usted estaba manipulando el celular, hablando, o usando algún dispositivo electrónico mientras el vehículo estaba en movimiento?",
      "¿El vehículo estaba completamente detenido o estacionado cuando usó el dispositivo?",
      "¿Estaba utilizando algún sistema de manos libres integrado al vehículo o auricular?"
    ]
  }
};
