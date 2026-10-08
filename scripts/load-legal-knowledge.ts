// Script para cargar conocimiento legal desde Base_Datos_Leyes_Completa.md
// Ejecutar: deno run --allow-net --allow-env scripts/load-legal-knowledge.ts

const SUPABASE_URL = "https://rmuqhrfahzkxtjedjxip.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbG...NLE4";
const OPENAI_API_KEY = "sk-pro...uA4A";

async function generateEmbedding(text: string): Promise<number[] | null> {
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

async function insertKnowledge(titulo: string, contenido: string, anclaje_legal: string, tags: string[], embedding: number[]) {
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
      tags: tags,
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

  // Leer archivo
  const content = await Deno.readTextFile("./fuentes_legales/Base_Datos_Leyes_Completa.md");

  // Dividir en secciones
  const sections = content.split(/\\n---\\n/).filter((s) => s.trim().length > 100);
  console.log(`Secciones encontradas: ${sections.length}`);

  // Limpiar tabla primero
  await clearKnowledge();

  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    // Extraer título
    const titleMatch = section.match(/sourceFile:\\s*\"([^\"]+)\"/);
    const title = titleMatch ? titleMatch[1].replace(/\\.pdf$/i, "").trim() : `Documento ${i + 1}`;

    // Extraer anclaje legal
    const anclajeMatch = section.match(/(Ley\\s+\\d+[\\/\\w]*|Decreto\\s+\\d+[\\/\\w]*|Resolución\\s+\\d+|Artículo\\s+\\d+|Art\\.\\s*\\d+)/gi);
    const anclajeLegal = anclajeMatch ? anclajeMatch.slice(0, 5).join(", ") : "Sin referencia";

    // Limpiar contenido
    const cleanedContent = section
      .replace(/^[a-f0-9-]{36}$/gm, "")
      .replace(/https:\\/\\/lh3\\.googleusercontent\\.com\\/\\S+/g, "")
      .replace(/^\\s*[a-f0-9-]{32,}\\s*$/gm, "")
      .trim()
      .substring(0, 10000);

    // Determine tags
    let baseTags = ["legal", "transito"];
    // Add synonyms for Ley 2486
    if (cleanedContent.includes("LEY 2486 DE 2025") || cleanedContent.includes("Ley 2486")) {
      baseTags = [
        ...baseTags,
        "bic electrica",
        "cicla electrica",
        "bicicleta electrica",
        "monopatin",
        "monopatin electrica",
        "bicicleta eléctrica normativa",
        "normas bici eléctrica Colombia",
        "reglas patinetas eléctricas",
        "ley scooters eléctricos Colombia",
        "puedo usar bici eléctrica Bogotá",
        "requisitos bici eléctrica",
        "comparendo bici eléctrica casco",
        "multas patineta eléctrica",
        "normativa micromovilidad Colombia"
      ];
    }

    // Generar embedding
    const embedding = await generateEmbedding(`${title}\\n\\n${cleanedContent}`);

    if (!embedding) {
      errors++;
      console.error(`Error en sección ${i + 1}: ${title}`);
      continue;
    }

    // Insertar
    const success = await insertKnowledge(title, cleanedContent, anclajeLegal, baseTags, embedding);

    if (success) {
      inserted++;
      if (inserted % 10 === 0) {
        console.log(`Progreso: ${inserted}/${sections.length}`);
      }
    } else {
      errors++;
    }

    // Pausa para no saturar la API
    if (i % 5 === 0) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log(`\\n=== RESUMEN ===`);
  console.log(`Total secciones: ${sections.length}`);
  console.log(`Insertados: ${inserted}`);
  console.log(`Errores: ${errors}`);
}

main();