import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

// Use environment variables (already loaded from .env by Hermes)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_KEY) {
    console.error('������❌ ERROR: Faltan variables de entorno. Verifica .env o configuración de Hermes.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_KEY });

const FILE_PATH = path.join(process.cwd(), 'fuentes_legales', 'Base_Datos_Leyes_Completa.md');
const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;

async function sembrarElite() {
    console.log(`���������🚀 Iniciando Procesamiento Élite de: ${FILE_PATH}`);
    
    const content = fs.readFileSync(FILE_PATH, 'utf-8');
    let sections = content.split(/(?=^##\\s|###\\s)/m);
    console.log(`���������📦 Secciones totales en MD: ${sections.length}`);

    // MODO PRODUCCIÓN: Procesar TODAS las secciones
    console.log("���������🚀 MODO PRODUCCIÓN: Procesando las 3358 secciones del MD.");

    let allChunks = [];
    for (let section of sections) {
        if (section.length > CHUNK_SIZE) {
            for (let i = 0; i < section.length; i += (CHUNK_SIZE - CHUNK_OVERLAP)) {
                allChunks.push(section.substring(i, i + CHUNK_SIZE));
            }
        } else {
            allChunks.push(section);
        }
    }

    console.log(`���������🧩 Fragmentos a subir: ${allChunks.length}`);

    let exitosos = 0;
    let fallidos = 0;

    for (let i = 0; i < allChunks.length; i++) {
        const chunk = allChunks[i];
        const titleMatch = chunk.match(/^(?:#+\\s)?(.+)/m);
        const title = titleMatch ? titleMatch[1].substring(0, 100).trim() : `Fragmento ${i+1}`;

        // Determine tags
        let tags = ["auto-procesado", "elite"];
        if (chunk.includes("LEY 2486 DE 2025") || chunk.includes("Ley 2486")) {
            tags = [
                ...tags,
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

        try {
            process.stdout.write(`  ���� �� �� ⏳ [${i+1}/${allChunks.length}] \"${title}\"... `);

            const res = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: chunk
            });
            const embedding = res.data[0].embedding;

            const { error } = await supabase.from('conocimiento_legal').insert({
                titulo: title,
                contenido: chunk,
                anclaje_legal: "Base de Datos Completa MD (Prueba 100)",
                tags: tags,
                embedding: embedding
            });

            if (error) {
                console.log(`������❌ ERROR SUPABASE: ${error.message}`);
                fallidos++;
            } else {
                console.log(`������✅ OK`);
                exitosos++;
            }
        } catch (err) {
            console.log(`������❌ ERROR OPENAI/RED: ${err.message}`);
            fallidos++;
        }

        if (i % 5 === 0) await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\\n���������📊 FINALIZADO: ${exitosos} exitosos, ${fallidos} fallidos.`);
}

sembrarElite();