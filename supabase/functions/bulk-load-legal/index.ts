import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY no configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, content: providedContent } = await req.json();

    if (action === "clear") {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data: records, error: selectError } = await supabaseAdmin.from("conocimiento_legal").select("id");

      if (selectError) {
        return new Response(JSON.stringify({ error: selectError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (records && records.length > 0) {
        for (const record of records) {
          await supabaseAdmin.from("conocimiento_legal").delete().eq("id", record.id);
        }
      }

      return new Response(JSON.stringify({ success: true, deleted: records?.length ?? 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Procesar contenido
    let content = providedContent;
    if (!content) {
      return new Response(JSON.stringify({ error: "No content provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Dividir en secciones
    const sections = content.split(/\n---\n/).filter((s) => s.trim().length > 100);
    console.log(`Secciones: ${sections.length}`);

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];

      const titleMatch = section.match(/sourceFile:\s*"([^"]+)"/);
      const title = titleMatch ? titleMatch[1].replace(/\.pdf$/i, "").trim() : `Documento ${i + 1}`;

      const anclajeMatch = section.match(/(Ley\s+\d+|Decreto\s+\d+|Resolución\s+\d+|Artículo\s+\d+|Art\.\s*\d+)/gi);
      const anclajeLegal = anclajeMatch ? anclajeMatch.slice(0, 5).join(", ") : "Sin referencia";

      const cleanedContent = section
        .replace(/^[a-f0-9-]{36}$/gm, "")
        .replace(/https:\/\/lh3\.googleusercontent\.com\/\S+/g, "")
        .replace(/^\s*[a-f0-9-]{32,}\s*$/gm, "")
        .trim()
        .substring(0, 10000);

      // Generar embedding
      const embResponse = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: `${title}\n\n${cleanedContent}`.substring(0, 8000),
        }),
      });

      if (!embResponse.ok) {
        errors++;
        console.error("Embedding error:", await embResponse.text());
        continue;
      }

      const embData = await embResponse.json();
      const embedding = embData.data[0].embedding;

      const { error } = await supabaseAdmin.from("conocimiento_legal").insert({
        titulo: title.substring(0, 500),
        contenido: cleanedContent,
        anclaje_legal: anclajeLegal,
        tags: ["legal", "transito"],
        embedding: JSON.stringify(embedding),
      });

      if (error) {
        errors++;
        console.error("Insert error:", error.message);
      } else {
        inserted++;
        if (inserted % 10 === 0) {
          console.log(`Insertados: ${inserted}`);
        }
      }

      if (i % 5 === 0) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    return new Response(JSON.stringify({ success: true, inserted, errors, total: sections.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Error interno", details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});