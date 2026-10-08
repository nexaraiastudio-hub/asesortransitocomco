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
    return { documentosEncontrados: [] };
  }

  const t1 = performance.now();
  console.log(`[NODO 2 - V14] Documentos recuperados: ${documents?.length || 0} | Tiempo: ${Math.round(t1 - t0)}ms`);

  return {
    documentosEncontrados: (documents || []).map((d: any) => ({
      titulo: d.titulo,
      contenido: d.content,
    })),
  };
}
