// Script para cargar conocimiento legal en chunks
// Ejecutar: node scripts/load-legal-chunks.cjs

const fs = require('fs');
const path = require('path');

const SUPABASE_FUNCTION_URL = "https://rmuqhrfahzkxtjedjxip.supabase.co/functions/v1/bulk-load-legal";
const CHUNK_SIZE = 30; // secciones por chunk

async function main() {
  console.log("Iniciando carga de conocimiento legal...");

  // Leer archivo
  const filePath = path.join(__dirname, '..', 'fuentes_legales', 'Base_Datos_Leyes_Completa.md');
  const content = fs.readFileSync(filePath, 'utf8');

  // Dividir en secciones
  const sections = content.split(/\n---\n/).filter((s) => s.trim().length > 100);
  console.log(`Secciones encontradas: ${sections.length}`);

  // Dividir en chunks
  const chunks = [];
  for (let i = 0; i < sections.length; i += CHUNK_SIZE) {
    const chunkSections = sections.slice(i, i + CHUNK_SIZE);
    chunks.push(chunkSections.join('\n---\n'));
  }

  console.log(`Chunks creados: ${chunks.length}`);

  // Procesar cada chunk
  let totalInserted = 0;
  let totalErrors = 0;

  for (let i = 0; i < chunks.length; i++) {
    console.log(`\nProcesando chunk ${i + 1}/${chunks.length}...`);

    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: chunks[i],
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      totalInserted += result.inserted;
      console.log(`Chunk ${i + 1}: ${result.inserted} insertados`);
    } else {
      totalErrors += CHUNK_SIZE;
      console.error(`Chunk ${i + 1} error:`, result.error || "Unknown");
    }

    // Pausa entre chunks
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\n=== RESUMEN FINAL ===`);
  console.log(`Total insertados: ${totalInserted}`);
  console.log(`Total errores: ${totalErrors}`);
}

main();