import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

// load configuration from environment
const SUPABASE_URL = "https://rmuqhrfahzkxtjedjxip.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
  console.error("Missing environment variables: make sure SUPABASE_SERVICE_KEY and OPENAI_API_KEY are set in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function generarEmbedding(titulo, contenido) {
  const texto = `${titulo}\n\n${contenido}`;
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: texto,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error [${res.status}]: ${err}`);
  }

  const data = await res.json();
  return data.data[0].embedding;
}

async function main() {
  console.log("Buscando filas con embedding NULL...");

  const { data: filas, error } = await supabase
    .from("conocimiento_legal")
    .select("id, titulo, contenido")
    .is("embedding", null);

  if (error) {
    console.error("Error consultando Supabase:", error.message);
    process.exit(1);
  }

  if (!filas || filas.length === 0) {
    console.log("No hay filas con embedding NULL. Todo está al día.");
    return;
  }

  console.log(`Encontradas ${filas.length} filas sin embedding. Procesando...\n`);

  for (const fila of filas) {
    try {
      process.stdout.write(`[ID ${fila.id}] "${fila.titulo.substring(0, 60)}"... `);

      const embedding = await generarEmbedding(fila.titulo, fila.contenido);

      const { error: updateError } = await supabase
        .from("conocimiento_legal")
        .update({ embedding })
        .eq("id", fila.id);

      if (updateError) {
        console.log(`ERROR al guardar: ${updateError.message}`);
      } else {
        console.log("OK");
      }

      await new Promise((r) => setTimeout(r, 300));
    } catch (e) {
      console.log(`ERROR: ${e.message}`);
    }
  }

  console.log("\nProceso completado.");
}

main();
