-- Limpia la tabla antes de insertar
DELETE FROM conocimiento_legal;

-- Inserta cada registro
INSERT INTO conocimiento_legal (id, titulo, contenido, anclaje_legal, tags) VALUES
(1, 'Choques Simples (Ley 2251/22)', 'En accidentes de solo daños materiales, es obligatorio retirar los vehículos para no bloquear la vía. Se deben tomar fotos/videos como prueba.', 'Ley 2251 de 2022', ARRAY['choque', 'daños']),
(2, 'Registro de Vehículos', 'La policía puede registrar el vehículo por seguridad, pero no puede desarmar partes ni abrir compartimentos cerrados sin sospecha fundada.', 'Art. 158 Ley 1801', ARRAY['requisa', 'policía']),
(3, 'Fotomultas', 'Requieren plena identificación del infractor según la Sentencia C-038 de 2020. El dueño no siempre es el responsable.', 'Sentencia C-038/20', ARRAY['fotomulta', 'nulo']),
(4, 'Motos y Casco', 'La Ley 2435 de 2024 prohíbe la inmovilización si el casco cumple la norma técnica y la falta es subsanable.', 'Ley 2435 de 2024', ARRAY['motos', 'casco']),
(5, 'Documentos RUNT', 'Los documentos pueden presentarse en formato digital mediante consulta en tiempo real en la plataforma RUNT.', 'Circular MinTransporte', ARRAY['licencia', 'runt']),
(6, 'Inmovilización y Patios', 'Si la causa de la inmovilización se puede corregir en el sitio, el agente debe permitirlo para evitar el traslado a patios.', 'Art. 125 CNT', ARRAY['grúa', 'patios']),
(7, 'Impugnación de Comparendos', 'Existen términos de 5 a 11 días para solicitar audiencia de descargos tras un comparendo.', 'Art. 135 CNT', ARRAY['audiencia', 'impugnar']),
(8, 'Vehículos de Carga', 'Uso obligatorio de remesa y manifiesto. Básculas deben estar acreditadas por la ONAC.', 'Decreto 1079/15', ARRAY['carga', 'camión']),
(9, 'Servicio Público', 'Se requiere tarjeta de operación y seguros específicos. La informalidad debe ser probada con el pago del servicio.', 'Ley 336/96', ARRAY['taxi', 'especial']),
(10, 'Micromovilidad', 'Bicicletas y scooters tienen derecho a ocupar un carril. El casco es obligatorio en horarios nocturnos.', 'Ley 1811/16', ARRAY['bici', 'scooter']),
(11, 'Alcoholemia', 'Protocolo de Medicina Legal exige tiempo de espera y segunda prueba. La negativa acarrea la máxima sanción.', 'Ley 1696/13', ARRAY['alcohol', 'retén']),
(12, 'Calibración de Equipos', 'Todos los radares y alcohosensores deben tener certificado de calibración vigente para ser prueba válida.', 'Ley 1843/17', ARRAY['radar', 'onac']),
(13, 'Ética y Defensa del Conductor', 'Mantener respeto, grabar el procedimiento y exigir el debido proceso son derechos fundamentales del conductor.', 'Art. 29 CP', ARRAY['abuso', 'grabar']),
(14, 'Peatones', 'El peatón tiene prelación en la vía. El sistema seguro prioriza la vida sobre el flujo vehicular.', 'Ley 2251/22', ARRAY['peatón', 'paso']),
(15, 'Caducidad y Prescripción de Multas', 'Las multas vencen al año si no hay sanción (caducidad) o a los 3-6 años si no se cobran (prescripción).', 'Art. 159 CNT', ARRAY['simit', 'borrar']),
(16, 'Derecho al Silencio', 'Nadie está obligado a declarar contra sí mismo ni contra sus parientes. El agente no puede interrogarte sobre tu destino, trabajo o vida privada en un retén.', 'Artículo 33 Constitución Política', ARRAY['interrogatorio', 'preguntas', 'retén', 'hablar', 'silencio', 'policía', 'guarda', 'interrogar']),
(17, 'Límites a la Requisa', 'El registro de vehículos es preventivo y superficial. La policía no puede abrir compartimentos sellados, maletas o desvalijar el carro sin orden judicial o flagrancia.', 'Sentencia C-789 de 2006', ARRAY['requisa', 'revisar', 'baúl', 'maleta', 'inspección', 'registro', 'abrir', 'carro', 'vehículo']),
(18, 'Derecho a Grabar', 'Es legal grabar todo procedimiento policial. El agente no puede impedirlo, borrar el video ni quitarte el celular. La transparencia es un derecho.', 'Artículo 21 Ley 1801 de 2016', ARRAY['grabar', 'video', 'celular', 'evidencia', 'filmar', 'cámara', 'procedimiento', 'policía']),
(19, 'Debido Proceso y Pruebas', 'Toda multa debe basarse en pruebas técnicas y objetivas. Las apreciaciones visuales subjetivas del agente sin equipo calibrado son nulas.', 'Art. 29 Constitución / Art. 161 CNT', ARRAY['prueba', 'técnica', 'ojo', 'ilegal', 'nulo', 'debido proceso', 'subjetivo', 'legalidad']),
(20, 'Inmovilización y Grúas', 'Si el conductor llega antes de que la grúa inicie el recorrido, el agente DEBE entregar el vehículo y solo imponer el comparendo sin llevarse el carro.', 'Artículo 127 Código Nacional de Tránsito', ARRAY['grúa', 'inmovilizar', 'parqueadero', 'llevarse el carro', 'patio', 'enganchar']),
(21, 'Accidentes con Heridos', 'En accidentes con heridos o muertos es obligatorio el levantamiento del IPAT por el agente quien actúa como policía judicial. No se mueven los vehículos.', 'Artículo 144 y 148 CNT', ARRAY['heridos', 'muertos', 'ambulancia', 'víctimas', 'IPAT', 'croquis', 'accidente grave']),
(22, 'SYSTEM_PROMPT', 'ROL:
  Abogado Penalista y de Tránsito de élite en Colombia. Creado por Nexara IA Studio. Tono: Profesional, asertivo, táctico y protector.

  REGLAS DE COMPORTAMIENTO:

  Identidad del Usuario: Saluda siempre usando el nombre: "{userName}". PROHIBIDO usar el correo electrónico.

  Jerarquía Jurídica: Constitución Política > Ley 769 de 2002 (CNT) > Resoluciones > Manual de Señalización.

  Regla de Oro (Fuentes): Citar obligatoriamente el Artículo, Sentencia o Resolución exacta de la base de datos de conocimiento. Si no existe en la base, indicar que no
   se tiene la fuente para validarlo.

  No Alucinación: No inventar leyes ni mezclar argumentos técnicos.

  INSTRUCCIONES DE RESPUESTA:

  Saludo y Alerta: Saludo personalizado + "¡ACTIVA TU CÁMARA YA!".
  Identificación Legal: Código de infracción y procedimiento arbitrario.
  Script de Defensa: Texto entre comillas para el oficial.
  Protocolo de Evidencia: Qué grabar y fotografiar.
  Observación en Comparendo: Texto para observaciones.
  Impugnación: Plazo de 5 días hábiles.', 'SYSTEM_PROMPT', ARRAY['system']);

-- Reinicia la secuencia del ID si usas autoincremento
SELECT setval('conocimiento_legal_id_seq', 22, true);
