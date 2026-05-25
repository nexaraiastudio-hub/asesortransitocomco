import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── 1. Autenticación (solo admin puede operar la base de conocimiento) ─
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY no configurada en Supabase secrets" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabaseClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Sólo administradores pueden gestionar la base de conocimiento" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 2. Parsear body ────────────────────────────────────────────────────
    const { action, id, titulo, contenido, anclaje_legal, tags } = await req.json();

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // ── 3. Generar embedding con OpenAI (para insert y update) ─────────────
    const generateEmbedding = async (titulo: string, contenido: string): Promise<number[] | null> => {
      const textToEmbed = `${titulo}\n\n${contenido}`;
      const embResponse = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: textToEmbed,
        }),
      });

      if (!embResponse.ok) {
        const errText = await embResponse.text();
        console.error(`[generate-embedding] OpenAI error [${embResponse.status}]: ${errText}`);
        return null;
      }

      const embData = await embResponse.json();
      // Retornar el array de floats directamente (NO stringify)
      return embData.data[0].embedding as number[];
    };

    // ── 4. Acciones CRUD ───────────────────────────────────────────────────
    if (action === "insert" || action === "update") {
      if (!titulo || !contenido) {
        return new Response(JSON.stringify({ error: "Título y contenido son requeridos" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const embedding = await generateEmbedding(titulo, contenido);
      if (!embedding) {
        return new Response(JSON.stringify({ error: "Error generando el vector de embedding con OpenAI" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const record = {
        titulo,
        contenido,
        anclaje_legal: anclaje_legal || null,
        tags: tags || null,
        // Insertar como array nativo — Supabase lo convierte al tipo vector(1536)
        embedding: JSON.stringify(embedding),
      };

      if (action === "insert") {
        const { data, error } = await serviceClient
          .from("conocimiento_legal")
          .insert(record)
          .select("id, titulo, contenido, anclaje_legal, tags")
          .single();

        if (error) {
          console.error("[generate-embedding] Error al insertar:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log(`[generate-embedding] Documento insertado: "${titulo}" (id: ${data.id})`);
        return new Response(JSON.stringify({ success: true, document: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      } else {
        // update
        if (!id) {
          return new Response(JSON.stringify({ error: "ID requerido para actualizar" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error } = await serviceClient
          .from("conocimiento_legal")
          .update(record)
          .eq("id", id);

        if (error) {
          console.error("[generate-embedding] Error al actualizar:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log(`[generate-embedding] Documento actualizado (id: ${id})`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "delete") {
      if (!id) {
        return new Response(JSON.stringify({ error: "ID requerido para eliminar" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await serviceClient
        .from("conocimiento_legal")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("[generate-embedding] Error al eliminar:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[generate-embedding] Documento eliminado (id: ${id})`);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Acción no válida: "${action}". Usa insert, update o delete.` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[generate-embedding] Error inesperado:", error);
    return new Response(JSON.stringify({ error: "Error interno del servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
