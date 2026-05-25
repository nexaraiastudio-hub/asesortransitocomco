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
 */
export function hasForbiddenMuletilla(respuesta) {
  // Simple check: if none of the forbidden phrases are there, return false immediately.
  const lowerRespuesta = respuesta.toLowerCase();
  
  const hasForbidden = FORBIDDEN_MULETILLAS.some(muletilla => lowerRespuesta.includes(muletilla));
  if (!hasForbidden) return false;

  // More nuanced check: split by sentences and check if the sentence containing the muletilla is whitelisted.
  const sentences = respuesta.split(/[.?!]/).map(s => s.trim().toLowerCase()).filter(Boolean);
  
  for (const sentence of sentences) {
    for (const forbidden of FORBIDDEN_MULETILLAS) {
      if (sentence.includes(forbidden)) {
        // Check if this sentence is covered by the whitelist
        const isWhitelisted = WHITELIST_MULETILLAS.some(whitelistPhrase => sentence.includes(whitelistPhrase));
        if (!isWhitelisted) {
          return true; // found a forbidden phrase in a sentence that is NOT whitelisted
        }
      }
    }
  }

  return false;
}
