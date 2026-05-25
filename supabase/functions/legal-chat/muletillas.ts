export const FORBIDDEN_MULETILLAS = [
  "con gusto",
  "entiendo",
  "lo siento",
  "espero",
  "por favor",
  "claro que",
  "lamento"
];

export const WHITELIST_MULETILLAS = [
  "gracias",
  "muchas gracias",
  "agradezco su atención"
];

/**
 * Checks if a response contains forbidden muletillas.
 * It ignores sentences that match a whitelist.
 * Returns the detected muletilla, or null if clean.
 */
export function detectarMuletillaProhibida(respuesta: string): string | null {
  const lowerRespuesta = respuesta.toLowerCase();
  
  const hasForbidden = FORBIDDEN_MULETILLAS.some(muletilla => lowerRespuesta.includes(muletilla));
  if (!hasForbidden) return null;

  const sentences = respuesta.split(/[.?!]/).map(s => s.trim().toLowerCase()).filter(Boolean);
  
  for (const sentence of sentences) {
    for (const forbidden of FORBIDDEN_MULETILLAS) {
      if (sentence.includes(forbidden)) {
        const isWhitelisted = WHITELIST_MULETILLAS.some(whitelistPhrase => sentence.includes(whitelistPhrase));
        if (!isWhitelisted) {
          return forbidden;
        }
      }
    }
  }

  return null;
}

export function limpiarMuletillas(respuesta: string): string {
  const muletilla = detectarMuletillaProhibida(respuesta);
  if (!muletilla) return respuesta;

  let limpia = respuesta;
  // Si encontramos muletillas prohibidas (no en la whitelist), las removemos o reemplazamos.
  // Aquí podemos simplemente quitar la frase "con gusto", "lo siento", etc.
  for (const prohibida of FORBIDDEN_MULETILLAS) {
    const isWhitelisted = WHITELIST_MULETILLAS.some(w => limpia.toLowerCase().includes(w));
    if (!isWhitelisted) {
      // Reemplaza la frase case-insensitive
      const regex = new RegExp(prohibida + "[.,]*\\s*", "gi");
      limpia = limpia.replace(regex, "");
    }
  }
  return limpia;
}
