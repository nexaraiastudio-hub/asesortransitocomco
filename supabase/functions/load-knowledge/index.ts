import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Download the markdown file from storage
    const fileUrl = `${supabaseUrl}/storage/v1/object/knowledge-files/Base_Datos_Leyes_Completa.md`;
    const fileResponse = await fetch(fileUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.status}`);
    }

    const content = await fileResponse.text();

    // Split by sourceFile sections (each starts with ---)
    const sections = content.split(/\n---\n/).filter((s) => s.trim().length > 100);

    // Group into chunks of ~4000 chars each for manageable AI context
    const MAX_CHUNK_SIZE = 8000;
    const chunks: { title: string; content: string }[] = [];
    let currentChunk = "";
    let currentTitle = "Sección Legal 1";
    let chunkIndex = 1;

    for (const section of sections) {
      // Extract title from sourceFile if available
      const titleMatch = section.match(/sourceFile:\s*"([^"]+)"/);
      const sectionTitle = titleMatch ? titleMatch[1].replace(/\.pdf$/i, "") : "";

      if (currentChunk.length + section.length > MAX_CHUNK_SIZE && currentChunk.length > 0) {
        chunks.push({ title: currentTitle, content: currentChunk.trim() });
        chunkIndex++;
        currentTitle = sectionTitle || `Sección Legal ${chunkIndex}`;
        currentChunk = section;
      } else {
        if (!currentTitle || currentTitle.startsWith("Sección Legal")) {
          currentTitle = sectionTitle || currentTitle;
        }
        currentChunk += "\n\n" + section;
      }
    }

    // Push last chunk
    if (currentChunk.trim().length > 0) {
      chunks.push({ title: currentTitle, content: currentChunk.trim() });
    }

    // Clear existing documents
    await fetch(`${supabaseUrl}/rest/v1/knowledge_documents?id=not.is.null`, {
      method: "DELETE",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
    });

    // Insert chunks in batches
    const BATCH_SIZE = 50;
    let inserted = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE).map((chunk) => ({
        title: chunk.title.substring(0, 500),
        content: chunk.content,
      }));

      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/knowledge_documents`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(batch),
      });

      if (!insertResponse.ok) {
        const errText = await insertResponse.text();
        console.error(`Batch insert error: ${errText}`);
      } else {
        inserted += batch.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_sections: sections.length,
        chunks_created: chunks.length,
        inserted,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing knowledge base:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
