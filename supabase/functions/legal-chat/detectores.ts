// detectores.ts - Funciones de detección de patrones en conversaciones
// Separadas para facilitar testing independiente

import { ChatMessage } from "./types.ts";

/**
 * Detecta si el usuario reporta que el oficial cedió/aceptó/retiró el procedimiento
 * Usa Regex para velocidad y cero costo de API
 */
export function detectarExitoConRegex(mensaje: string): boolean {
  const texto = mensaje.toLowerCase();
  const patronesExito = [
    "se fue",
    "me dejó ir",
    "me dejo ir",
    "no me hizo nada",
    "me entregó los papeles",
    "me entrego los papeles",
    "ya sigo mi camino",
    "me devolvió los documentos",
    "me devolvio los documentos",
    "cedió el oficial",
    "cedio el oficial",
    "no hubo comparendo",
    "lo convencí",
    "lo convenci",
    "se retiró",
    "se retiro",
    "aceptó",
    "acepto",
    "accedió",
    "accedio",
    "ya puedo irme",
    "me deja ir",
    "no va a hacer comparendo",
    "no va a poner comparendo",
    "no puso comparendo",
    "no impuso comparendo",
    "retiró el procedimiento",
    "retiro el procedimiento",
    "quedamos así",
    "quedamos asi",
    "todo bien",
    "solucionado",
    "resuelto",
    "oficial se fue",
    "oficial se retiro",
    "oficial se retiró",
    "ya no hay problema",
    "ya no hay comparendo",
    "me dejó seguir",
    "me dejo seguir"
  ];
  
  return patronesExito.some(patron => texto.includes(patron));
}

/**
 * Detecta si el oficial está insistiendo o hay abuso de autoridad
 * Activa Fase 3 (Contingencia)
 */
export function detectarAbusoEnMensaje(historial: ChatMessage[]): boolean {
  if (historial.length === 0) return false;
  
  const ultimoMensaje = historial[historial.length - 1].content.toLowerCase();
  
  const disparadoresAbuso = [
    "no quiere",
    "insiste",
    "persiste",
    "va a subir",
    "va a inmovilizar",
    "va a llevar",
    "grúa",
    "grua",
    "patio",
    "patio de grúa",
    "insulta",
    "grosero",
    "agresivo",
    "amenaza",
    "me amenazó",
    "me amenazo",
    "no le importa",
    "no le interesa",
    "dice que igual",
    "dice que de todas formas",
    "dice que me va a",
    "va a hacer comparendo",
    "va a poner comparendo",
    "va a proceder",
    "no acepta",
    "no cede",
    "se niega",
    "se rehúsa",
    "no tiene el equipo",
    "no tiene dispositivo",
    "le basta con ver",
    "a simple vista le basta",
    "no necesita medir",
    "no va a medir",
    "dice que no importa",
    "dice que eso no es",
    "dice que me equivoque",
    "dice que me equivoqué",
    "dice que está seguro",
    "dice que el sabe",
    "dice que él sabe",
    "dice que el decide",
    "dice que él decide"
  ];
  
  return disparadoresAbuso.some(palabra => ultimoMensaje.includes(palabra));
}

/**
 * Detecta si el usuario está pidiendo impugnación
 */
export function detectarSolicitudImpugnacion(mensaje: string): boolean {
  const texto = mensaje.toLowerCase();
  const patronesImpugnacion = [
    "sí",
    "si",
    "quiero",
    "por favor",
    "haga el favor",
    "redacte",
    "genere",
    "genere el documento",
    "redacte el documento",
    "sí redacte",
    "si redacte",
    "sí por favor",
    "si por favor",
    "adelante",
    "proceda",
    "hágalo",
    "hagalo",
    "deseo",
    "necesito",
    "sí necesito",
    "si necesito",
    "sí quiero",
    "si quiero"
  ];
  
  // Solo considerar impugnación si el mensaje es corto (respuesta a pregunta)
  if (mensaje.length > 50) return false;
  
  return patronesImpugnacion.some(patron => texto.includes(patron));
}

/**
 * Detecta si el usuario reporta una afirmación específica del oficial
 * que requiere refutación técnica (Fase 2b)
 */
export function detectarAfirmacionOficial(mensaje: string): boolean {
  const texto = mensaje.toLowerCase();
  
  const patronesAfirmacion = [
    "dice que",
    "me dice que",
    "afirma que",
    "sostiene que",
    "argumenta que",
    "alega que",
    "manifiesta que",
    "me dijo que",
    "dijo que",
    "sugiere que",
    "indica que",
    "asegura que",
    "me asegura que",
    "me comenta que",
    "comenta que",
    "me menciona que",
    "menciona que",
    "me señala que",
    "señala que"
  ];
  
  return patronesAfirmacion.some(patron => texto.includes(patron));
}

/**
 * Detecta si el mensaje indica que hay inmovilización o grúa involucrada
 */
export function detectarInmovilizacion(mensaje: string): boolean {
  const texto = mensaje.toLowerCase();
  const patronesInmovilizacion = [
    "grúa",
    "grua",
    "inmovilización",
    "inmovilizacion",
    "llevarse el carro",
    "llevarse la moto",
    "llevarse el vehículo",
    "llevarse el vehiculo",
    "se lo llevan",
    "se lo van a llevar",
    "va para el patio",
    "patio de grúa",
    "patio de grua",
    "lo van a subir",
    "lo van a inmovilizar",
    "lo van a llevar"
  ];
  
  return patronesInmovilizacion.some(patron => texto.includes(patron));
}
