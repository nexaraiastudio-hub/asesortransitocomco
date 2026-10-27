import OpenAI from "https://deno.land/x/openai@v4.69.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";
import type { AnalisisClasificacion, EvidenciaLegal } from "../types.ts";

export async function nodo2_Investigador(
  openai: OpenAI,
  supabase: ReturnType<typeof createClient>,
  analisis: AnalisisClasificacion
): Promise<EvidenciaLegal> {
  const t0 = performance.now();

  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: `Normatividad colombiana sobre ${analisis.tema} en ${analisis.clase} ${analisis.servicio} infracción ${analisis.tipoInfraccion}`,
  });
  const embedding = embeddingResponse.data[0].embedding;

  const { data: documents, error } = await supabase.rpc("match_legal_documents", {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: 5,
  });

  if (error) {
    console.error("[NODO 2] Error en RPC:", error);
  }

  const docsRecuperados = (documents || []).map((d: any) => ({
    titulo: d.titulo,
    contenido: d.content,
  }));

  // Respaldo de conocimiento normativo directo para exosto y ruido (Ley 2450 de 2025)
  if (analisis.tema === "exosto" || analisis.tema === "escape" || (analisis.tipoInfraccion && /c\.?28|d\.?17/i.test(analisis.tipoInfraccion))) {
    const yaTieneLey2450 = docsRecuperados.some(d => d.titulo?.includes("2450") || d.contenido?.includes("2450"));
    if (!yaTieneLey2450) {
      docsRecuperados.push({
        titulo: "Ley 2450 de 2025 (Ley Contra el Ruido) - Control al Ruido Vehicular",
        contenido: "Ley 2450 del 4 de marzo de 2025 (Vigencia 5 de marzo de 2025, Diario Oficial No. 53049). Objeto: Política nacional de calidad acústica (control de ruido y vibraciones). Control Vehicular: Faculta el control al ruido vehicular y motocicletas con sistemas de escape modificados (exostos libres o resonadores). Exige que toda sanción por emisión acústica cuente con soporte técnico objetivo (sonómetro calibrado con certificado metrológico vigente, límite 86 dB). La apreciación auditiva subjetiva 'a simple oído' viola el Artículo 29 de la Constitución Política (Debido Proceso) y hace nulo cualquier comparendo o inmovilización por falta de prueba material objetiva."
      });
    }
  }

  const t1 = performance.now();
  console.log(`[NODO 2 - V14] Documentos recuperados: ${docsRecuperados.length} | Tiempo: ${Math.round(t1 - t0)}ms`);

  return {
    documentosEncontrados: docsRecuperados,
  };
}
