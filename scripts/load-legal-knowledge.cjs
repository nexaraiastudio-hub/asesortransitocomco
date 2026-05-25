// Script para cargar conocimiento legal desde Base_Datos_Leyes_Completa.md
// Ejecutar: node scripts/load-legal-knowledge.js
// Requires: npm install node-fetch

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://rmuqhrfahzkxtjedjxip.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzYSIsInJlZiI6InJtdXFocmZhaHpreHRqZWRqeGlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkzNTc4NiwiZXhwIjoyMDg3NTExNzg2fQ.amMqqZItXvoZTgGQ-Q-z-C1KPJUO4rWNuoJlCIoNLE4";
const OPENAI_API_KEY = "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";

// Dynamic import for fetch in Node.js
let fetch;
(async () => {
  try {
    fetch = globalThis.fetch;
  } catch (e) {
    const module = await import('node-fetch');
    fetch = module.default;
  }
})();

async function generateEmbedding(text) {
  try {
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
  } catch (e) {
    console.error("Error generating embedding:", e);
    return null;
  }
}

async function insertKnowledge(titulo, contenido, anclaje_legal, embedding) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/conocimiento_legal`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({
      titulo: titulo.substring(0, 500),
      contenido: contenido,
      anclaje_legal: anclaje_legal,
      tags: ["legal", "transito"],
      embedding: JSON.stringify(embedding),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Insert error:", err);
    return false;
  }
  return true;
}

async function clearKnowledge() {
  console.log("Limpiando tabla conocimiento_legal...");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/conocimiento_legal`, {
    method: "DELETE",
    headers: {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Prefer": "return=minimal",
    },
  });
  console.log("Tabla limpiada");
}

async function main() {
  console.log("Iniciando carga de conocimiento legal...");

  // Read file
  const filePath = path.join(__dirname, '..', 'fuentes_legales', 'Base_Datos_Leyes_Completa.md');
  const content = fs.readFileSync(filePath, 'utf8');

  // Split into sections
  const sections = content.split(/\n---\n/).filter((s) => s.trim().length > 100);
  console.log(`Secciones encontradas: ${sections.length}`);

  // Clear table first
  await clearKnowledge();

  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    // Extract title
    const titleMatch = section.match(/sourceFile:\s*"([^"]+)"/);
    const title = titleMatch ? titleMatch[1].replace(/\.pdf$/i, "").trim() : `Documento ${i + 1}`;

    // Extract legal anchor
    const anclajeMatch = section.match(/(Ley\s+\d+[\/\w]*|Decreto\s+\d+[\/\w]*|Resolución\s+\d+|Artículo\s+\d+|Art\.\s*\d+)/gi);
    const anclajeLegal = anclajeMatch ? anclajeMatch.slice(0, 5).join(", ") : "Sin referencia";

    // Clean content
    const cleanedContent = section
      .replace(/^[a-f0-9-]{36}$/gm, "")
      .replace(/https:\/\/lh3\.googleusercontent\.com\/\S+/g, "")
      .replace(/^\s*[a-f0-9-]{32,}\s*$/gm, "")
      .trim()
      .substring(0, 10000);

    // Generate embedding
    const embedding = await generateEmbedding(`${title}\n\n${cleanedContent}`);

    if (!embedding) {
      errors++;
      console.error(`Error en sección ${i + 1}: ${title}`);
      continue;
    }

    // Insert
    const success = await insertKnowledge(title, cleanedContent, anclajeLegal, embedding);

    if (success) {
      inserted++;
      if (inserted % 10 === 0) {
        console.log(`Progreso: ${inserted}/${sections.length}`);
      }
    } else {
      errors++;
    }

    // Pause to not overload the API
    if (i % 5 === 0) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log(`\n=== RESUMEN ===`);
  console.log(`Total secciones: ${sections.length}`);
  console.log(`Insertados: ${inserted}`);
  console.log(`Errores: ${errors}`);
}

main();