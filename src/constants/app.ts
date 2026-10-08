// Application constants

export const VOICE_OPTIONS = [
  { name: 'es-US-Neural2-A', label: 'Sofía (Neural)', gender: 'FEMALE' },
  { name: 'es-US-Neural2-B', label: 'Carlos (Neural)', gender: 'MALE' },
] as const

export const CONTEXT_OPTIONS = [
  {
    value: 'normativas',
    label: 'Normativas y reglamentos generales',
    description: 'Preguntas sobre leyes, decretos, resoluciones y reglas de tránsito en Colombia'
  },
  {
    value: 'situación en vía pública, con policía o agente de tránsito',
    label: 'Situación en vía pública, con policía o agente de tránsito',
    description: 'Situaciones específicas que viviste o presenciaste en la vía pública'
  },
  {
    value: 'accidente o choque',
    label: 'Accidente o choque',
    description: 'Información sobre qué hacer en caso de accidente de tránsito'
  }
] as const

export const GREETING_TEXT = '((Saludos. Soy tu Abogado Asesor Élite en Tránsito y Transporte. Estoy listo para proteger tus derechos de movilidad. PROTOCOLO DE SEGURIDAD: Inicie registro en video y fotografías inmediatamente. Bajo el Artículo 20 de la Constitución Política de Colombia y el Artículo 21 de la Ley 1801 de 2016 (Código Nacional de Seguridad y Convivencia Ciudadana), usted tiene el derecho legítimo de grabar procedimientos públicos. Capture placas, nombres y señalización. Es su prueba reina.))'

export const NORMATIVE_CLOSING = '¿Algo más en que pueda colaborarte?'

export const SITUATIONAL_INDICATORS = [
  'me detuvieron', 'me detuvo', 'me pararon', 'me paro',
  'un agente', 'un policía', 'el agente', 'el policía',
  'me multaron', 'me van a multar', 'comparendo',
  'inmoviliz', 'grúa', 'grua',
  'me dijo', 'me dice', 'el oficial',
  'me pidieron', 'me piden',
  'en la vía', 'en la calle', 'en el puesto',
  'me retuvieron', 'me revisaron'
] as const

export const NORMATIVE_TOPICS = [
  'consulta_general_transito',
  'polarizados',
  'llantas',
  'casco',
  'semaforo',
  'luces',
  'kit_carretera',
  'soat_vencido',
  'licencia',
  'revision_tecnicomecanica',
  'velocidad',
  'embriaguez',
  'cinturon_seguridad'
] as const

export const MAX_FILE_SIZE = 10 * 1024 * 1024
export const MAX_FILES = 5

export const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
} as const
