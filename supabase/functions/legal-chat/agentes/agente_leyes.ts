import { BASE_NORMATIVA } from "../base_normativa.ts";
import { NormativaTema } from "../types.ts";

/**
 * Experto en Normas de Tránsito de Bogotá / Colombia
 * Su objetivo es recuperar la normativa vigente para un caso específico.
 */
export function recuperarNormativa(tema: string): NormativaTema | null {
  if (!tema) return null;
  return BASE_NORMATIVA[tema] || null;
}
