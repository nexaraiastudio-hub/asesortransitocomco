// nodo2_investigador.ts — V17 Busqueda Semantica Adaptativa (cualquier tema de transito)
import OpenAI from "https://deno.land/x/openai@v4.69.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";
import type { AnalisisClasificacion, EvidenciaLegal } from "../types.ts";

export async function nodo2_Investigador(
  openai: OpenAI,
  supabase: ReturnType<typeof createClient>,
  analisis: AnalisisClasificacion
): Promise<EvidenciaLegal> {
  const t0 = performance.now();

  // V17: Query amplia adaptativa para cualquier tema de transito colombiano
  // Normalizar el tema para la busqueda (guion_bajo -> espacio)
  const temaLegible = analisis.tema.replace(/_/g, " ");

  const queryParts = [
    `Normatividad colombiana sobre ${temaLegible}`,
    analisis.clase ? `en ${analisis.clase}` : "",
    analisis.servicio ? `servicio ${analisis.servicio}` : "",
    analisis.tipoInfraccion ? `infraccion ${analisis.tipoInfraccion}` : "",
    analisis.codigoInfraccion ? `codigo ${analisis.codigoInfraccion}` : "",
    "transito transporte Colombia Ley 769 resolucion ministerio",
  ].filter(Boolean).join(" ");

  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: queryParts,
  });
  const embedding = embeddingResponse.data[0].embedding;

  // Busqueda primaria: threshold estandar
  const { data: documents, error } = await supabase.rpc("match_legal_documents", {
    query_embedding: embedding,
    match_threshold: 0.45,
    match_count: 6,
  });

  if (error) {
    console.error("[NODO 2 - V17] Error en RPC:", error);
    return { documentosEncontrados: [] };
  }

  // Si no se encontraron documentos especificos, hacer busqueda mas generica
  if (!documents || documents.length === 0) {
    console.log(`[NODO 2 - V17] Sin docs especificos para "${temaLegible}", buscando normativa general...`);
    
    const queryGenerica = `Codigo Nacional de Transito Colombia Ley 769 2002 infracciones sanciones procedimiento`;
    const embeddingGenerico = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: queryGenerica,
    });
    
    const { data: docsGenericos, error: errorGenerico } = await supabase.rpc("match_legal_documents", {
      query_embedding: embeddingGenerico.data[0].embedding,
      match_threshold: 0.3,
      match_count: 4,
    });

    if (!errorGenerico && docsGenericos && docsGenericos.length > 0) {
      const t1 = performance.now();
      console.log(`[NODO 2 - V17] Docs genericos recuperados: ${docsGenericos.length} | Tema: ${analisis.tema} | ${Math.round(t1 - t0)}ms`);
      return {
        documentosEncontrados: docsGenericos.map((d: any) => ({
          titulo: d.titulo,
          contenido: d.content,
        })),
      };
    }

    const t1 = performance.now();
    console.log(`[NODO 2 - V17] Sin documentos (ni especificos ni genericos) | Tema: ${analisis.tema} | ${Math.round(t1 - t0)}ms`);
    return { documentosEncontrados: [] };
  }

  const t1 = performance.now();
  console.log(`[NODO 2 - V17] Docs recuperados: ${documents.length} | Tema: ${analisis.tema} | ${Math.round(t1 - t0)}ms`);

  return {
    documentosEncontrados: documents.map((d: any) => ({
      titulo: d.titulo,
      contenido: d.content,
    })),
  };
}
