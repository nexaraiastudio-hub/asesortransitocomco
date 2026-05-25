// Script para cargar conocimiento legal en partes
// Ejecutar: node scripts/load-legal-by-parts.cjs

const fs = require('fs');
const path = require('path');

const SUPABASE_FUNCTION_URL = "https://rmuqhrfahzkxtjedjxip.supabase.co/functions/v1/bulk-load-legal";
const OPENAI_API_KEY = "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";

async function generateEmbedding(text) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.substring(0, 8000),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("OpenAI error:", err);
    return null;
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function loadSections(sections) {
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    // Extraer título
    const titleMatch = section.match(/sourceFile:\s*"([^"]+)"/);
    const title = titleMatch ? titleMatch[1].replace(/\.pdf$/i, "").trim() : `Documento ${i + 1}`;

    // Extraer anclaje legal
    const anclajeMatch = section.match(/(Ley\s+\d+[\/\w]*|Decreto\s+\d+[\/\w]*|Resolución\s+\d+|Artículo\s+\d+|Art\.\s*\d+)/gi);
    const anclajeLegal = anclajeMatch ? anclajeMatch.slice(0, 5).join(", ") : "Sin referencia";

    // Limpiar contenido
    const cleanedContent = section
      .replace(/^[a-f0-9-]{36}$/gm, "")
      .replace(/https:\/\/lh3\.googleusercontent\.com\/\S+/g, "")
      .replace(/^\s*[a-f0-9-]{32,}\s*$/gm, "")
      .trim()
      .substring(0, 10000);

    // Generar embedding
    const embedding = await generateEmbedding(`${title}\n\n${cleanedContent}`);

    if (!embedding) {
      errors++;
      console.error(`Error en sección ${i + 1}: ${title}`);
      continue;
    }

    // Enviar a la función
    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: section,
        generateEmbedding: true,
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      inserted++;
      console.log(`Insertado: ${inserted}/${sections.length} - ${title.substring(0, 50)}`);
    } else {
      errors++;
      console.error(`Error en sección ${i + 1}:`, result.error || "Unknown error");
    }

    // Pausa para no saturar la API
    if (i % 5 === 0) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`\n=== RESUMEN ===`);
  console.log(`Total secciones: ${sections.length}`);
  console.log(`Insertados: ${inserted}`);
  console.log(`Errores: ${errors}`);
}

async function main() {
  console.log("Iniciando carga de conocimiento legal...");

  // Leer archivo
  const filePath = path.join(__dirname, '..', 'fuentes_legales', 'Base_Datos_Leyes_Completa.md');
  const content = fs.readFileSync(filePath, 'utf8');

  // Dividir en secciones
  const sections = content.split(/\n---\n/).filter((s) => s.trim().length > 100);
  console.log(`Secciones encontradas: ${sections.length}`);

  // Cargar
  await loadSections(sections);
}

main();