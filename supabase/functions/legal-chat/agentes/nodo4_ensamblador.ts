import type { AnalisisClasificacion, EntregableEnsamblador, VeredictoJurista } from "../types.ts";

export async function nodo4_Ensamblador(
  analisis: AnalisisClasificacion,
  veredicto: VeredictoJurista | null
): Promise<EntregableEnsamblador> {
  const t0 = performance.now();

  // GUARDIA DE FIDELIDAD UNIVERSAL (V18.11)
  // No hay reglas hardcodeadas por tema.
  // Si faltan datos en `informacionFaltante`, devolvemos la ruta a `_inicio`.
  if (analisis.nodoActual && !analisis.nodoActual.endsWith("_inicio")) {
    if (analisis.informacionFaltante && analisis.informacionFaltante.length > 0) {
      console.log(`[NODO 4 FIX] Faltan preguntas por responder. Forzando ${analisis.tema}_inicio.`);
      analisis.nodoActual = analisis.tema + "_inicio";
    }
  }

  const t1 = performance.now();
  console.log(`[NODO 4 - V18.11] Guardia Evaluada | Tiempo: ${Math.round(t1 - t0)}ms`);

  return {
    faseActual: analisis.fase,
    plantillaEsqueleto: "V18_GRAPH_NODE",
    instruccionesDeTono: "Actúa como Abogado Asesor Élite."
  };
}
