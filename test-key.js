import { OpenAI } from 'openai';

const OPENAI_KEY = process.env.OPENAI_API_KEY;
console.log(`Clave leída: ${OPENAI_KEY ? OPENAI_KEY.substring(0, 10) + '...' : 'NO LEÍDA'}`);

const openai = new OpenAI({ apiKey: OPENAI_KEY });

async function test() {
    try {
        const res = await openai.models.list();
        console.log('✅ Clave válida. Modelos listados correctamente.');
    } catch (e) {
        console.error('❌ Error con la clave:', e.message);
    }
}

test();
