/**
 * BASE DE CONOCIMIENTO MAESTRA — 86 CASOS DE ENTRENAMIENTO
 * 
 * PROPÓSITO: Este archivo NO es una lista de respuestas fijas.
 * Es el conjunto de patrones de razonamiento legal que la IA debe
 * internalizar para responder con precisión forense a CUALQUIER
 * pregunta del usuario sobre tránsito y transporte en Colombia.
 * 
 * La IA aprende DE estos ejemplos cómo:
 *  - Identificar la infracción exacta (código + ley)
 *  - Diferenciar penalidades entre moto y carro
 *  - Detectar cuándo un procedimiento es ilegal
 *  - Estructurar la defensa táctica en tiempo real
 *  - Generar el texto bajo protesta y el escrito de impugnación
 */

export const CONOCIMIENTO_LEGAL_MAESTRO = `
════════════════════════════════════════════════════════
BLOQUE 1 — INFRACCIONES CLÁSICAS CON LEY 2435 DE 2024
════════════════════════════════════════════════════════

REGLA MAESTRA (Ley 2435 del 12 de noviembre de 2024 — Ley de Igualdad Sancionatoria):
Las infracciones D.03, D.04, D.05, D.06 y D.07 YA NO generan inmovilización obligatoria
para motocicletas. Hoy aplica SOLO MULTA tanto para motos como para carros en esas 5
infracciones. Cualquier agente que intente gruar una moto por esas infracciones comete
una inmovilización ilegal. Citar siempre esta ley para defender al motociclista.

CASO 1 — Moto sin casco (C.01):
- Infracción: C.01, Ley 769/2002 Art. 131
- Penalidad MOTO: Multa + inmovilización hasta pagar o conseguir casco
- Penalidad CARRO: No aplica
- Defensa: Exigir al agente que consigne el tipo de casco en el comparendo. Subsanar en 60 min.

CASO 2 — No portar SOAT (C.02 / B.02):
- Infracción: B.02 (sin SOAT) / C.02 (SOAT vencido), Ley 769/2002
- El RUNT digital es VÁLIDO como prueba. Circular 20221010000601 MinTransporte.
- Penalidad: Multa. CERO inmovilización si el vehículo puede circular en condiciones seguras.
- Defensa: Mostrar SOAT digital. Si el agente multa por no tener papel físico → abuso de autoridad.

CASO 3 — Licencia de conducción vencida (C.04):
- Infracción: C.04, Ley 769/2002
- Penalidad: Multa + inmovilización hasta que llegue un conductor con licencia vigente (60 min).
- Defensa: Derecho a esperar 60 minutos para que llegue un tercero habilitado. El agente no puede
  llamar la grúa si no han transcurrido los 60 minutos del plazo de subsanación.

CASO 4 — Licencia sin categoría habilitada (C.03):
- Infracción: C.03, Ley 769/2002
- Aplica multa e inmovilización. Diferencia con C.04: aquí el conductor NUNCA estuvo habilitado.
- Defensa: Verificar si la categoría aparece restringida o en trámite en el RUNT.

CASO 5 — Exceso de velocidad (C.29):
- Infracción: C.29, Ley 769/2002
- Requiere cinemómetro (radar/láser) o cámara homologada y calibrada.
- El agente NO puede determinar el exceso de velocidad "al ojo" ni por persecución manual.
- Defensa: Exigir certificado de calibración del equipo. Sin él, el procedimiento es nulo.

CASO 6 — No usar cinturón de seguridad (C.07):
- Infracción: C.07, Ley 769/2002
- Aplica solo multa. CERO inmovilización.
- Defensa: Si el agente no tiene video que pruebe la ausencia del cinturón, es su palabra contra
  la del conductor. Exigir prueba objetiva. Anotar "no hay prueba material" en observaciones.

CASO 7 — Hablar por celular mientras conduce (C.38):
- Infracción: C.38, Ley 769/2002
- Aplica solo multa. CERO inmovilización.
- Requiere PRUEBA OBJETIVA: foto o video. El dicho del agente NO desvirtúa la presunción
  de inocencia (Art. 29 CP). Sin evidencia material → comparendo nulo en audiencia.

CASO 8 — SOAT vencido hace más de 3 días (C.02):
- Infracción: C.02, Ley 769/2002
- Multa + inmovilización preventiva hasta que se contrate el SOAT.
- Defensa: El agente debe esperar 60 minutos mientras se tramita el SOAT digital en línea.
  No puede llamar la grúa de inmediato.

CASO 9 — No portar licencia de tránsito (B.04):
- Infracción: B.04, Ley 769/2002
- El RUNT digital es VÁLIDO. Circular 20221010000601 MinTransporte.
- Aplica solo multa. CERO inmovilización por falta del papel físico.

CASO 10 — Revisión técnico-mecánica (RTM) vencida (C.23):
- Infracción: C.23, Ley 769/2002
- Aplica multa + inmovilización.
- Defensa: Si hay RTM vigente en el RUNT aunque no se porte el papel, el agente no puede sancionar.

CASO 11 — Vidrios polarizados sin permiso (C.17):
- Infracción: C.17, Ley 769/2002. Resolución 3777 de 2003 MinTransporte.
- El agente DEBE usar luxómetro o fotómetro calibrado. NUNCA puede determinar "al ojo".
- Límites: 70% transmitancia en panorámico y laterales delanteros; 55% en traseros.
- Defensa: Sin equipo calibrado → el procedimiento viola el debido proceso (Art. 29 CP).

CASO 12 — Llantas con labrado mínimo insuficiente (C.11):
- Infracción: C.11, Ley 769/2002
- Herramienta obligatoria: PROFUNDÍMETRO CALIBRADO (NTC 5375, Resolución 3027 de 2010).
- Límite MOTO: 1.0 mm. Límite CARRO: 1.6 mm.
- El agente NO puede usar tarjetas, monedas ni apreciación visual.
- Sin profundímetro calibrado → procedimiento NULO.

CASO 13 — Pico y Placa (C.14 / Decreto local):
- Infracción: Decreto municipal de cada ciudad.
- Aplica multa + inmovilización para TODOS los vehículos incluyendo motos.
- Defensa: Verificar si el vehículo tiene exención (médico, servicio de emergencias, etc.)
  y si la señalización de Pico y Placa estaba visible en el sector.

CASO 14 — Conducir en estado de embriaguez (D.09, D.10, D.11 según grado):
- Requiere protocolo estricto: deprivación 15 min, boquilla sellada destapada en presencia
  del conductor, alcohosensor calibrado (certificado INM vigente), opción de prueba de contraste.
- Grado 1: 0.21-0.39 g/l → Multa + inmovilización + curso
- Grado 2: 0.40-0.79 g/l → Multa + inmovilización + 1 año suspensión
- Grado 3: +0.80 g/l / Renuncia → Multa + inmovilización + 3 años suspensión
- Sin protocolo completo → resultado atacable en audiencia.

CASO 15 — Conducir con licencia suspendida o cancelada (C.05):
- Infracción: C.05, Ley 769/2002
- Aplica multa + inmovilización.
- Defensa: Verificar la fecha exacta de vigencia de la suspensión en el RUNT.
  Si ya venció la suspensión, el comparendo es nulo.

════════════════════════════════════════════════════════
BLOQUE 2 — RETENES ILEGALES E IRREGULARIDADES OPERATIVAS
════════════════════════════════════════════════════════

CASO 16 — Retén sin señalización reglamentaria:
- Norma: Resolución 1885 de 2015 (Manual de Señalización) + Ley 769 Art. 116
- Un retén sin conos, paletas SR-30 ni vallas informativas es ILEGAL.
- Defensa: Grabar panorámicamente la ausencia de señalización. Solicitar nulidad
  del comparendo por vicios de forma procesal.

CASO 17 — Retén oculto o "pesca milagrosa":
- Norma: Constitución Art. 209 (Principio de Publicidad) + Ley 769 Art. 116
- Los controles de tránsito no pueden funcionar como trampas. Esconderse detrás
  de curvas, árboles o puentes para sorprender conductores es una violación al
  principio de publicidad del acto administrativo.
- Defensa: Grabar el punto exacto donde están escondidos los agentes. Atacar el
  procedimiento en audiencia demostrando que el objetivo era recaudar, no prevenir.

CASO 18 — Retén sin orden de operaciones escrita:
- Norma: Directivas Administrativas de la Policía Nacional y MinTransporte.
- Todo retén requiere orden escrita del comandante jurisdiccional.
- Defensa: Preguntar: "Señor oficial, ¿me permite confirmar la orden de operaciones
  de este puesto de control?" La negativa es prueba de irregularidad.

CASO 19 — Exigir documentos físicos e ignorar el RUNT digital:
- Norma: Circular 20221010000601 del Ministerio de Transporte.
- El SOAT y la licencia en formato digital son 100% válidos.
- Si el agente multa por no tener papel físico → abuso de autoridad y desconocimiento
  doloso de las directrices ministeriales.

CASO 20 — Retención ilegal de documentos (Cédula o licencia al bolsillo):
- Norma: Código Penal Art. 416 (Abuso de Autoridad) + Ley 769 Art. 136.
- El agente SOLO puede verificar visualmente los documentos, NO retenerlos físicamente.
- Defensa: Grabar hasta que el oficial devuelva la propiedad. Amenazar con denuncia penal.

CASO 21 — Inspección del baúl o guantera sin orden judicial:
- Norma: Constitución Arts. 15 y 28 + Código de Policía Ley 1801 Art. 159.
- Un agente de TRÁNSITO (azul/civil) NO tiene potestad para requisar el baúl.
  Es usurpación de funciones. Solo la Policía Nacional (verde) puede hacer registro
  visual preventivo, pero NO desvalijar sin indicios de delito.
- Defensa: Prohibir el acceso al baúl a agentes civiles de tránsito.

CASO 22 — Retén conformado por un solo agente:
- Norma: Manual de Infracciones (Res. 3027 de 2010) + protocolos operativos.
- Un agente solitario parando vehículos es foco de irregularidad.
- Defensa: Reportar al 123 que hay un agente sin equipo de apoyo.

CASO 23 — Operativos en jurisdicciones ajenas:
- Norma: Ley 769 de 2002, Art. 7 (Autoridades y jurisdicción territorial).
- Agente municipal en vía nacional = incompetencia territorial.
- Cualquier comparendo firmado ahí es NULO de pleno derecho.

CASO 24 — Inmovilización sin dar los 60 minutos para subsanar:
- Norma: Resolución 3027 de 2010 (Manual de Infracciones).
- La ley otorga HASTA 60 MINUTOS para subsanar algunas faltas.
- Si el agente llama la grúa al minuto uno → violación al debido proceso.

CASO 25 — Persecución peligrosa por evadir retén o falta menor:
- Norma: Código Penal (Extralimitación) + Protocolos de Uso de la Fuerza.
- La Policía NO puede poner en riesgo la vida de terceros por una falta de tránsito menor.
- Si causa accidente por persecución temeraria → responsabilidad civil y penal del Estado.

CASO 26 — Retén nocturno en zona sin iluminación:
- Norma: Resolución 1885 de 2015 (Señalización — retroiluminación).
- Puesto de control en oscuridad total es ilegal y pone en riesgo la vida.
- Defensa: Grabar la oscuridad y falta de luces de advertencia. Anular el procedimiento.

CASO 27 — El "tramojo" o insinuación de soborno ("Para el refresco"):
- Norma: Código Penal Art. 404 (Concusión) + Art. 405 (Cohecho).
- TOLERANCIA CERO. No entregar dinero jamás.
- Defensa: Decir: "Señor agente, proceda con el comparendo, pero no cederé a insinuaciones.
  Está grabado." Denunciar ante la Fiscalía y la Procuraduría.

════════════════════════════════════════════════════════
BLOQUE 3 — ABUSOS EN PRUEBAS DE ALCOHOLEMIA
════════════════════════════════════════════════════════

CASO 28 — Alcoholemia positiva por enjuague o medicamentos (Sin espera):
- Norma: Resolución 1844 de 2015 de Medicina Legal (Protocolo de Deprivación).
- Obligatorio: 15 MINUTOS de espera antes de la prueba. Sin esta espera → procedimiento NULO.

CASO 29 — Negativa a prueba de contraste (Sangre):
- Norma: Ley 1696 de 2013 + Resolución 1844 de 2015.
- El ciudadano tiene PLENO DERECHO a exigir examen clínico de sangre para desvirtuar el resultado.
- Si el agente se niega → escribir en observaciones: "Solicité prueba de contraste clínico y fue negada."

CASO 30 — Alcohosensor sin certificado de calibración vigente:
- Norma: Resolución 1844 de 2015 + Lineamientos Instituto Nacional de Metrología.
- Antes del primer soplido: exigir ver el certificado de calibración.
- Sin certificado vigente → los resultados carecen de valor científico y legal.

CASO 31 — Multar por "negativa" a persona con asma o problemas pulmonares:
- Norma: Resolución 1844 de 2015 (Sección de Excepciones Clínicas).
- No se puede clasificar como "renuncia" a quien no logra el volumen de aire por causa médica.
- Defensa: Exigir prueba de sangre y dejar constancia médica. Denuncia por prevaricato si se niegan.

CASO 32 — Falta de boquilla sellada destapada en presencia del conductor:
- Norma: Resolución 1844 de 2015 (Cadena de custodia y asepsia).
- La boquilla DEBE abrirse exclusivamente en presencia del conductor.
- Si el agente se acerca con la boquilla ya instalada → prohibir soplar, grabar el dispositivo contaminado.

CASO 33 — Uso de Grado 3 directo sin graduación técnica:
- Norma: Ley 1696 de 2013, Art. 5.
- Grado 3 solo aplica ante renuncia real y voluntaria. Si hubo cooperación pero el agente
  aplica Grado 3 por cólera → abuso de poder. No firmar sin anotar la objeción.

CASO 34 — Esconder el visor de la máquina al conductor:
- Norma: Resolución 1844 de 2015 (Principio de Contradicción y Transparencia).
- El ciudadano tiene derecho a ver la pantalla inmediatamente y a recibir la tirilla impresa.
- Defensa: Grabar el ocultamiento del visor. Es alteración dolosa del procedimiento.

CASO 35 — Presión para firmar el formato de consentimiento bajo amenaza:
- Norma: Código Penal Art. 182 (Constreñimiento ilegal).
- La entrevista previa debe ser 100% voluntaria.
- Si hay coacción → firmar BAJO PROTESTA: "Firmo por coacción e intimidación del agente."

════════════════════════════════════════════════════════
BLOQUE 4 — EL "NEGOCIO" DE LAS GRÚAS Y LOS PATIOS
════════════════════════════════════════════════════════

CASO 36 — Inmovilizar por infracción que solo da multa:
- Norma: Ley 769 de 2002, Art. 131.
- Si la norma NO estipula grúa, retener el vehículo es prevaricato + retención ilegal.
- Defensa: Exigir la liberación inmediata citando el artículo exacto que NO contempla inmovilización.

CASO 37 — Daños materiales en el enganche (Romper parachoques, rayar motos):
- Norma: Ley 769 Art. 125 + Responsabilidad Civil Extracontractual del Estado.
- ANTES de que la grúa arranque: grabar video detallado de cada daño.
- Obligar al agente a anotar el daño en el Formato de inmovilización (inventario físico).

CASO 38 — El "carrusel de grúas" (5 motos en un planchón, cobro individual):
- Norma: Enriquecimiento sin justa causa + pliegos de concesión municipal.
- No pagar la tarifa completa. Exigir liquidación dividida o auditoría del GPS del remolcador.

CASO 39 — Robo de autopartes en los patios (Batería, espejos, computador):
- Norma: Código Civil (Contrato de Depósito) + Art. 90 Constitución.
- NUNCA firmar el acta de salida sin revisar el vehículo pieza por pieza.
- Si falta algo → bloquear la salida, llamar Policía Judicial, interponer denuncia por hurto agravado.

CASO 40 — Cobros excesivos por parqueadero en patios:
- Norma: Resoluciones tarifarias de los Concejos Municipales.
- Los patios no pueden cobrar más de la tabla publicada por la Alcaldía.
- Si cobran de más → Concusión. Exigir factura detallada + queja a la Superintendencia de Transporte.

CASO 41 — Negativa a entregar vehículo viernes para cobrar fin de semana:
- Norma: Ley 1437 de 2011 (CPACA) + Principio de Buena Fe.
- Si cumplió requisitos el viernes: enviar PQR o correo institucional como evidencia.
  Exigir devolución de los días cobrados ilegalmente (sábado y domingo).

CASO 42 — Caídas del sistema o trámites infinitos para demorar la orden de salida:
- Norma: Decreto 019 de 2012 (Ley Antitrámites) + Estatuto del Consumidor.
- El ciudadano NO paga la ineficiencia del Estado.
- Pedir certificado escrito de la falla del sistema. Con él → exigir exoneración de esos días.

CASO 43 — Grúas que operan sin contratos vigentes:
- Norma: Ley 80 de 1993 (Estatuto General de Contratación Estatal).
- Toda grúa en vía debe pertenecer a un consorcio con contrato municipal activo.
- Si la grúa es "pirata" → Peculado por Uso. Exigir mostrar el convenio. Si no → anular procedimiento.

CASO 44 — Arrancar la grúa con el conductor dentro del vehículo:
- Norma: Ley 769 Art. 125 + Código Penal (Secuestro).
- Si el usuario ya está adentro: NO bajarse, asegurar puertas, transmitir en vivo,
  llamar 123, acusar de secuestro simple y tentativa de homicidio.

CASO 45 — Pérdida total del vehículo en los patios (Desvalije o incendio):
- Norma: Falla en la prestación del servicio público (Jurisprudencia del Consejo de Estado).
- El Estado responde aunque alegue "incendio fortuito". El vehículo estaba bajo custodia estatal.
- Defensa: Demandar a la Alcaldía y al concesionario por el avalúo comercial + indemnización.

CASO 46 — La "grúa fantasma" (Cobrar servicio no prestado):
- Norma: Estatuto del Consumidor + Código Penal (Cobro de lo no debido).
- Si el ciudadano llegó ANTES de que la grúa enganchara o arrancara: NO se cobra el servicio.
- Defensa: Interponer queja formal exigiendo devolución del cobro por servicio no prestado.

CASO 47 — Exigir "Paz y Salvo" de multas pasadas para liberar el vehículo:
- Norma: Sentencias Corte Constitucional + Ley 769 Art. 125.
- Solo se debe subsanar el comparendo ACTUAL que motivó la inmovilización.
- Si niegan la salida por deudas pasadas → Acción de Tutela inmediata.

════════════════════════════════════════════════════════
BLOQUE 5 — IRREGULARIDADES EN COMPARENDOS Y PROCESOS
════════════════════════════════════════════════════════

CASO 48 — Comparendo con información falsa inventada por el agente:
- Norma: Código Penal Art. 286 (Falsedad ideológica en documento público).
- Grabarse inmediatamente mostrando la realidad (ej: cinturón puesto).
- Firmar bajo protesta. Usar el video para denuncia penal ante la Fiscalía.

CASO 49 — Comparendo en vía privada (Conjunto cerrado, parqueadero):
- Norma: Ley 769 de 2002, Art. 1 (Ámbito de aplicación).
- Agentes solo tienen jurisdicción en vías públicas o privadas abiertas al público.
- En propiedad privada cerrada → nulidad absoluta por falta de competencia territorial.

CASO 50 — Negar o demorar el derecho a audiencia de impugnación:
- Norma: Ley 769 Art. 136 (Derecho de contradicción).
- Si agendan la audiencia tarde para que el ciudadano pierda el derecho → Acción de Tutela.
- Se tumba el cobro completo por violación al Debido Proceso y al Derecho a la Defensa.

CASO 51 — Cobrar deudas prescritas (Multas caducadas):
- Norma: Ley 769 Art. 159 (Prescripción de 3 años + máximo 3 más con cobro coactivo notificado).
- NUNCA hacer "acuerdos de pago" con multas prescritas (reviven la deuda).
- Exigir que declaren la prescripción de oficio.

CASO 52 — Comparendo por video de redes sociales sin flagrancia:
- Norma: Ley 1843 de 2017 (Control de tecnología).
- Un agente físico NO puede multar en la calle usando un video de TikTok.
- Sin flagrancia ni fotodetección oficial → nulidad por carencia probatoria in situ.

CASO 53 — Duplicidad de sanciones por el mismo hecho:
- Norma: Constitución Art. 29 (Non bis in idem).
- No se puede multar dos veces por la misma acción central.
- Defensa: Invocar la Constitución para tumbar la multa más costosa.

CASO 54 — Trampas a conductores de plataformas con agentes disfrazados:
- Norma: Jurisprudencia Corte Suprema (Prohibición del "Agente Provocador") + Derecho al Trabajo.
- Los pantallazos de la app demuestran la instigación dolosa de la autoridad.
- Derriba la inmovilización del carro (D.12) por instigación ilegal.

CASO 55 — Agresión física, groserías o decomiso del celular:
- Norma: Ley 1952 de 2019 (Código General Disciplinario - Falta Gravísima) + Daño en bien ajeno.
- NO responder físicamente. Asegurar puertas. Ir directo a la Procuraduría con la evidencia.

════════════════════════════════════════════════════════
BLOQUE 6 — FALSOS POSITIVOS ESPECIALES Y TECNOLÓGICOS
════════════════════════════════════════════════════════

CASO 56 — Botiquín con curas o vendas "vencidas":
- Norma: Ley 769 Art. 30. Infracción C.11.
- La ley exige portar el equipo de prevención, NO un botiquín médico con fechas de caducidad.
- Si el agente multa por curas vencidas → comparendo anulable. El ciudadano SÍ cumple con portar.

CASO 57 — Placas ilegibles por desgaste natural:
- Norma: Infracción B.03. Principio de No retroactividad.
- Desgaste por sol/lluvia no es adulteración dolosa. Solo aplica multa B.03.
- Ordenar tramitar duplicado. El agente NO puede inmovilizar por desgaste natural.

CASO 58 — Retén para exigir llanta de repuesto inflada:
- Norma: Ley 769 Art. 30. Infracción C.11.
- La ley exige LLEVAR llanta de repuesto. NO otorga al agente facultades de calibrador de presión.
- Si el agente multa por presión baja → extralimitación. El ciudadano SÍ porta la llanta.

CASO 59 — Acusar de parrillero prohibido sin flagrancia:
- Norma: Decretos Alcaldías (Parrillero). Infracción C.14.
- Sin captura en flagrancia (parrillero montado al momento exacto de la orden) → nulidad.
- El agente no puede multar por "testimonios de terceros" o "porque le pareció verlo antes".

CASO 60 — Exigir planillas de carga por equipaje personal de familia:
- Norma: Ley 769 de 2002. Infracción D.12 (Cambio de servicio).
- Maletas, bicicletas o colchón de uso personal NO convierten al carro en "vehículo de carga".
- Grabar la evidencia del equipaje personal. Amenazar con denuncia por prevaricato.

CASO 61 — La trampa del semáforo con luz amarilla de 1 segundo:
- Norma: Infracción D.04. Manual de Señalización (Tiempos mínimos de semaforización).
- Físicamente imposible frenar en 1 segundo sin causar accidente.
- No pagar. Impugnar exigiendo el certificado técnico de tiempos de la intersección.
  Un amarillo de 1 segundo viola el principio de confianza y el tiempo de reacción humana.

CASO 62 — Maniobra peligrosa por esquivar un hueco:
- Norma: Ley 769 Art. 131 (D.07 vs Art. 136 - Fuerza Mayor).
- Esquivar un cráter del Estado = eximente de responsabilidad por fuerza mayor / estado de necesidad.
- Fotografiar el hueco. Firmar bajo protesta: "Maniobra evasiva para salvaguardar la vida
  ante falla en la vía pública."

CASO 63 — Inmovilizar vehículos clásicos o antiguos por falta de tecnologías modernas:
- Norma: Resoluciones especiales MinTransporte para vehículos antiguos. Principio de No Retroactividad.
- Un agente NO puede exigir estándares de 2026 a un clásico de 1970.
- La tarjeta de propiedad avala la clasificación del vehículo. Rechazar el procedimiento.

CASO 64 — Rechazar descuento del 50% por caída del sistema CIA/RUNT:
- Norma: CPACA Ley 1437 (Inoperancia del Estado no puede perjudicar al ciudadano).
- Si el sistema cae durante el curso → pedir constancia escrita de la falla.
- Con esa constancia → exigir que el tránsito mantenga el 50% de descuento.

CASO 65 — Fotomultas por velocidad calculadas por "promedio de tramo":
- Norma: Resolución 718 de 2018 (SAST). Infracción C.29.
- Las cámaras en Colombia miden velocidad INSTANTÁNEA en un punto (radar/láser calibrado).
- El "promedio de tramo" con dos cámaras lejanas carece de sustento metrológico explícito.
- Impugnar exigiendo certificado de calibración del sistema completo.

CASO 66 — Multar por llevar mascota en el asiento delantero:
- Norma: Ley 769 de 2002 (Infracción de distracción).
- El Código Nacional de Tránsito NO prohíbe explícitamente mascotas adelante.
- El agente debe probar (con fotos) que el perro bloqueaba el timón o estaba encima del conductor.
- CERO inmovilización en cualquier escenario.

CASO 67 — Vidrios oscuros de fábrica en camionetas importadas:
- Norma: Resolución 3777 de 2003 (Aplica a películas y polarizados instalados, NO a cristales de fábrica).
- Los cristales fundidos y entintados desde la planta de ensamblaje NO requieren permiso.
- Defensa: Demostrar la marca de agua del cristal original (DOT internacional).
  El permiso de la Policía es para polarizados callejeros, no para vidrios originales de fábrica.

CASO 68 — Acusar de prestar servicio de plataformas sin prueba (D.12):
- Norma: Ley 769 Art. 131 (D.12) + Arts. 15, 28 y 29 Constitución.
- La infracción D.12 requiere DEMOSTRACIÓN OBJETIVA de un contrato de transporte oneroso.
- El agente NO puede exigir ver el celular (Arts. 15 y 28 CP protegen la intimidad).
- Un interrogatorio coercitivo y la negativa a mostrar el celular JAMÁS pueden ser prueba de la falta.
- Sin material probatorio real → comparendo nulo.

════════════════════════════════════════════════════════
BLOQUE 7 — CASOS ADICIONALES DE ABUSO Y PROCEDIMIENTO
════════════════════════════════════════════════════════

CASO 69 — Ruido excesivo (Exosto modificado, C.22):
- Norma: Infracción C.22. Resolución 910 de 2008 + NTC 4231.
- Requiere SONÓMETRO CALIBRADO. NO se puede sancionar "a simple oído".
- Sin el equipo técnico → comparendo nulo. CERO inmovilización.

CASO 70 — Menores de 10 años en asiento delantero (B.08):
- Norma: Ley 769 Art. 82. Infracción B.08.
- Aplica solo MULTA. CERO inmovilización.
- Subsanar inmediatamente: ubicar al menor en sillas traseras con cinturón.

CASO 71 — Bloquear intersección (C.03):
- Norma: Ley 769 Art. 131. Infracción C.03.
- Aplica MULTA. CERO inmovilización.
- Defensa: Si el bloqueo fue por fuerza mayor (embotellamiento súbito sin salida) → invocarlo.

CASO 72 — No acatar señales manuales del agente (C.31):
- Norma: Ley 769 Art. 131. Infracción C.31.
- MULTA. CERO inmovilización.
- Si la orden fue confusa o no se hizo con señal reglamentaria → firmar bajo protesta por
  "falta de claridad en la orden impartida."

CASO 73 — Conducir en reversa más allá de lo permitido (D.03 o D.07):
- Norma: Ley 769 Art. 119. Infracciones D.03 / D.07.
- LEY 2435 DE 2024: SOLO MULTA para motos Y carros. CERO inmovilización.

CASO 74 — Emisión de gases excesiva (C.18):
- Norma: Ley 769 Art. 131. Infracción C.18.
- Requiere ANALIZADOR DE GASES U OPACÍMETRO CALIBRADO.
- Sin medición con la máquina → prueba inexistente → procedimiento nulo.

CASO 75 — Cargar combustible con pasajeros (C.34):
- Norma: Ley 769 Art. 131. Infracción C.34.
- Aplica MULTA al conductor. CERO inmovilización.
- Bajar pasajeros inmediatamente para subsanar el riesgo.

CASO 76 — Moto transitando por andenes o ciclorrutas (D.05):
- Norma: Ley 769 Art. 131. Infracción D.05.
- LEY 2435 DE 2024: SOLO MULTA. CERO inmovilización. La grúa por D.05 en moto es ILEGAL.

CASO 77 — Girar en U en zona prohibida (C.02 — NO es D.03):
- Infracción correcta: C.02 (Girar en U en zona prohibida). D.03 es transitar en contravía.
- Aplica MULTA. CERO inmovilización para carros.
- Para motos + D.03: LEY 2435 DE 2024 → SOLO MULTA.

CASO 78 — Transitar por carril de uso exclusivo (C.14):
- Infracción: C.14. Aplica MULTA E INMOVILIZACIÓN para cualquier vehículo.
- Defensa: Verificar señalización del carril exclusivo (Transmilenio, cicloruta, etc.)
  Si no hay señalización clara → atacar por falta de señalización.

CASO 79 — Adelantar en doble línea amarilla (D.06):
- Infracción: D.06. Ley 769 Art. 131.
- Para CARROS: MULTA. CERO inmovilización.
- Para MOTOS: LEY 2435 DE 2024 → SOLO MULTA. CERO inmovilización (la inmovilización antigua fue eliminada).

CASO 80 — No respetar pare o semáforo en rojo (D.04):
- Infracción: D.04. Ley 769 Art. 131.
- Para CARROS: SOLO MULTA. CERO inmovilización. (Inmovilización es EXCLUSIVA para motos).
- Para MOTOS: LEY 2435 DE 2024 → SOLO MULTA. CERO inmovilización (eliminada por Ley 2435).
- Un agente que intente gruar un carro por pasarse un semáforo comete prevaricato.

CASO 81 — Transitar en contravía (D.03):
- Infracción: D.03. Ley 769 Art. 131.
- Para CARROS: MULTA. CERO inmovilización.
- Para MOTOS: LEY 2435 DE 2024 → SOLO MULTA. CERO inmovilización.

CASO 82 — Maniobras peligrosas o temerarias (D.07):
- Infracción: D.07. Ley 769 Art. 131.
- Para CARROS: MULTA. CERO inmovilización.
- Para MOTOS: LEY 2435 DE 2024 → SOLO MULTA. CERO inmovilización.

CASO 83 — Cobro de grúa durante días de paro o cese de actividades:
- Norma: CPACA Ley 1437 (Inoperancia del Estado no puede perjudicar al ciudadano).
- Los días de paro administrativo NO se cargan al ciudadano. Exigir descuento en la liquidación.

CASO 84 — Extracción de gasolina o fluidos en los patios:
- Norma: Código Civil (Contrato de Depósito) + Art. 90 Constitución.
- El Estado asume custodia integral del vehículo. Si ingresan fluidos y salen vacíos → hurto agravado.
- NUNCA firmar el acta de salida sin verificar los niveles del vehículo.

CASO 85 — Impedir la grabación del procedimiento (Manotear o tapar la cámara):
- Norma: Art. 20 Constitución + Art. 21 Ley 1801 de 2016.
- Grabar un procedimiento público es un DERECHO FUNDAMENTAL. No puede ser impedido.
- Si el agente manotea o tapa la cámara → denuncia penal ante la Fiscalía por abuso de autoridad
  y violación de derechos fundamentales (Ley 1952 de 2019).

CASO 86 — Comparendo por transitar sin seguro obligatorio SOAT (B.02) usando app:
- Norma: B.02. Circular MinTransporte 2022.
- El SOAT digital (PDF, foto, correo) es prueba válida igual que el papel.
- El agente DEBE consultar el RUNT en tiempo real antes de imponer comparendo.
  Si hay cobertura activa en el RUNT y el agente multa de todas formas → abuso de autoridad.

=== NUEVOS CASOS DE ÉXITO (TÁCTICAS MAESTRAS CONSOLIDADAS) ===

Caso #92: Llantas medidas con moneda (Táctica Ilegal del Policía)
Contexto: Agente de tránsito usa una "moneda con marca" para medir el labrado de las llantas de una moto.
Veredicto del Jurista: Ilegal. No se puede medir a "ojímetro" ni con herramientas informales.
Respuesta Élite (Turno 2): "Señor oficial, según la Res. 3027 de 2010 y NTC 5375, el labrado debe medirse exclusivamente con un profundímetro calibrado. Usar una moneda carece de validez legal y técnica."
Cierre (Turno 3): El agente reconoce el error y deja ir al usuario. Fase de Victoria aplicada con éxito.

Caso #93: Táctica de Subsanación "Bajar al Parrillero"
Contexto: Policía detiene a un conductor porque el parrillero va sin casco e intenta inmovilizar.
Respuesta Élite: Instruye de inmediato al usuario a que baje al parrillero de la moto. Al cesar la falta (el parrillero ya no está en la moto), desaparece el riesgo de inmovilización. La multa procede, pero la moto se salva.

Caso #94: Trampa del Horario (Chaleco a las 5:50 p.m.)
Contexto: Oficial exige chaleco antes de las 6:00 p.m. argumentando "visibilidad reducida".
Respuesta Élite: Ataca inmediatamente la línea temporal. "Señor oficial, son las 5:50 p.m. El Art. 94 fija la obligatoriedad desde las 6:00 p.m. No hay clima extremo, su apreciación subjetiva no deroga la ley."

Caso #95: Polarizados - Desmentir "100% Transparente"
Contexto: Agente dice que vehículo escolar debe ser totalmente transparente.
Respuesta Élite: Desmiente de inmediato citando la Res. 3777. "Ningún vehículo está obligado a ser 100% transparente. El límite legal es 70% delanteros y 55% traseros, y debe medirse EXCLUSIVAMENTE con luxómetro calibrado, jamás a simple vista."
`;

/**
 * TABLA MAESTRA DE INMOVILIZACIONES
 * Referencia rápida para el Auditor Jurídico:
 * - MOTO/CARRO = si aplica inmovilización para ese tipo de vehículo
 * - Con base en Ley 769/2002 + Ley 2435 de 2024
 */
export const TABLA_INMOVILIZACION: Record<string, { moto: boolean; carro: boolean; nota: string }> = {
  "B.02": { moto: false, carro: false, nota: "Solo multa. SOAT digital válido." },
  "B.03": { moto: false, carro: false, nota: "Solo multa por placa en mal estado." },
  "B.04": { moto: false, carro: false, nota: "Solo multa. Licencia digital válida." },
  "B.08": { moto: false, carro: false, nota: "Solo multa por menor en asiento delantero." },
  "C.01": { moto: true,  carro: false, nota: "Moto: multa + inmovilización hasta subsanar." },
  "C.02": { moto: true,  carro: true,  nota: "SOAT vencido: multa + inmovilización. Esperar 60 min." },
  "C.03": { moto: false, carro: false, nota: "Solo multa por bloquear intersección." },
  "C.04": { moto: true,  carro: true,  nota: "Licencia categoría incorrecta: multa + inmovilización." },
  "C.07": { moto: false, carro: false, nota: "Solo multa por no usar cinturón." },
  "C.11": { moto: false, carro: false, nota: "Solo multa. Requiere equipo técnico para verificar." },
  "C.14": { moto: true,  carro: true,  nota: "Carril exclusivo: multa + inmovilización ambos." },
  "C.17": { moto: false, carro: false, nota: "Solo multa. Requiere luxómetro calibrado." },
  "C.22": { moto: false, carro: false, nota: "Solo multa. Requiere sonómetro calibrado." },
  "C.23": { moto: true,  carro: true,  nota: "RTM vencida: multa + inmovilización." },
  "C.29": { moto: false, carro: false, nota: "Solo multa. Requiere cinemómetro calibrado." },
  "C.31": { moto: false, carro: false, nota: "Solo multa por no acatar señales del agente." },
  "C.34": { moto: false, carro: false, nota: "Solo multa al conductor. CERO inmovilización." },
  "C.38": { moto: false, carro: false, nota: "Solo multa. Requiere prueba fotográfica u objetiva." },
  "D.03": { moto: false, carro: false, nota: "LEY 2435/2024: Solo multa. CERO inmovilización para motos y carros." },
  "D.04": { moto: false, carro: false, nota: "LEY 2435/2024: Solo multa. CERO inmovilización para motos y carros." },
  "D.05": { moto: false, carro: false, nota: "LEY 2435/2024: Solo multa. CERO inmovilización para motos." },
  "D.06": { moto: false, carro: false, nota: "LEY 2435/2024: Solo multa. CERO inmovilización para motos y carros." },
  "D.07": { moto: false, carro: false, nota: "LEY 2435/2024: Solo multa. CERO inmovilización para motos y carros." },
  "D.08": { moto: true,  carro: true,  nota: "Luces: inmovilización SOLO si son 2 o más luces. Una sola luz = solo multa." },
  "D.09": { moto: true,  carro: true,  nota: "Embriaguez Grado 1: multa + inmovilización." },
  "D.10": { moto: true,  carro: true,  nota: "Embriaguez Grado 2: multa + inmovilización + 1 año suspensión." },
  "D.11": { moto: true,  carro: true,  nota: "Embriaguez Grado 3: multa + inmovilización + 3 años suspensión." },
  "D.12": { moto: true,  carro: true,  nota: "Servicio de plataforma sin autorización: requiere prueba objetiva de contrato oneroso." },
};

/**
 * DERECHOS PROCESALES FUNDAMENTALES
 * Aplican transversalmente a CUALQUIER caso de tránsito.
 */
export const DERECHOS_FUNDAMENTALES = `
DERECHOS IRRENUNCIABLES DEL CIUDADANO EN CUALQUIER PROCEDIMIENTO VIAL:

1. DERECHO A GRABAR: Art. 20 Constitución + Art. 21 Ley 1801/2016.
   Nadie puede impedir grabar un procedimiento público. El agente que manotee la cámara
   incurre en abuso de autoridad (Código Penal Art. 416).

2. PRESUNCIÓN DE INOCENCIA: Art. 29 Constitución.
   La carga de la prueba es del agente. Su dicho verbal solo NO es suficiente para
   desvirtuar la inocencia del ciudadano.

3. DEBIDO PROCESO: Art. 29 Constitución.
   Todo procedimiento sancionatorio debe cumplir las formas legales. Violación del
   protocolo técnico = nulidad del comparendo.

4. DERECHO A SUBSANAR: Art. 125 Ley 769/2002.
   Hasta 60 minutos para subsanar algunas faltas antes de que proceda la inmovilización.

5. DERECHO A AUDIENCIA DE DESCARGOS: Art. 136 Ley 769/2002.
   5 días hábiles para solicitar audiencia y presentar pruebas.

6. PROHIBICIÓN DE AUTOINCRIMINACIÓN: Art. 33 Constitución.
   Nadie está obligado a declarar contra sí mismo. El ciudadano puede negarse a responder
   preguntas sin que su silencio constituya prueba en su contra.

7. INTIMIDAD Y RESERVA DE COMUNICACIONES: Arts. 15 y 28 Constitución.
   El agente NO puede exigir el celular sin orden judicial. Los datos personales
   están protegidos por la Ley 1266 de 2008 (Habeas Data).

8. NON BIS IN IDEM: Art. 29 Constitución.
   Nadie puede ser sancionado dos veces por el mismo hecho.
`;
