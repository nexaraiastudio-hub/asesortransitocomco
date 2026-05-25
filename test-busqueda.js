import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

// === CARGA MANUAL DE ENV ===
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) env[key.trim()] = value.join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

async function testBusqueda() {
    console.log('🔍 Probando búsqueda vectorial...');
    
    // 1. Generar embedding de una pregunta
    const res = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: "procedimiento en accidentes de solo daños materiales"
    });
    const embedding = res.data[0].embedding;

    // 2. Intentar llamar a match_documents
    const { data, error } = await supabase.rpc('match_documents', {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 3
    });

    if (error) {
        console.error('❌ ERROR: La función match_documents no existe o falló:', error.message);
        console.log('💡 Necesitamos crear la función RPC en Supabase.');
    } else {
        console.log('✅ ¡Buscador Inteligente funcionando! Resultados encontrados:', data.length);
        data.forEach((d, i) => console.log(`   ${i+1}. ${d.titulo}`));
    }
}

testBusqueda();
