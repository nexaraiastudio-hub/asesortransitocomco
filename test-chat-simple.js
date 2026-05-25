import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("SUPABASE_URL:", SUPABASE_URL);
console.log("SUPABASE_SERVICE_ROLE_KEY (first 5 chars):", SUPABASE_SERVICE_ROLE_KEY ? SUPABASE_SERVICE_ROLE_KEY.substring(0,5) : "N/A");

console.log("=".repeat(70));
console.log("🧪 TEST SIMPLE DE CHAT - VERIFICACIÓN DE FUNCIONAMIENTO");
console.log("=".repeat(70));

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testChat() {
  try {
    console.log("\n📋 PASO 1: Verificando base de datos");
    console.log("-".repeat(70));
    
    const { data: docs, error: dbError } = await supabase
      .from("conocimiento_legal")
      .select("id, titulo")
      .limit(3);

    if (dbError) {
      console.error("❌ Error en BD:", dbError.message);
      return;
    }

    console.log(`✅ BD conectada - ${docs.length} documentos encontrados`);
    docs.forEach((doc, i) => console.log(`   ${i + 1}. ${doc.titulo}`));

    console.log("\n📋 PASO 2: Verificando SYSTEM_PROMPT");
    console.log("-".repeat(70));

    const { data: prompt, error: promptErr } = await supabase
      .from("conocimiento_legal")
      .select("titulo, contenido")
      .eq("titulo", "SYSTEM_PROMPT")
      .single();

    if (promptErr) {
      console.log("⚠️  SYSTEM_PROMPT no encontrado (usará hardcodeado)");
    } else {
      console.log(`✅ SYSTEM_PROMPT encontrado (${prompt.contenido.length} chars)`);
    }

    console.log("\n📋 PASO 3: Probando búsqueda de documentos");
    console.log("-".repeat(70));

    const pregunta = "exceso de velocidad";
    const { data: results, error: searchErr } = await supabase
      .from('conocimiento_legal')
      .select('titulo, anclaje_legal')
      .neq('titulo', 'SYSTEM_PROMPT')
      .textSearch('contenido', pregunta)
      .limit(3);

    if (searchErr) {
      console.error("❌ Error en búsqueda:", searchErr.message);
    } else {
      console.log(`✅ Búsqueda funcionando - ${results.length} resultados para "${pregunta}"`);
      results.forEach((r, i) => console.log(`   ${i + 1}. ${r.titulo} - ${r.anclaje_legal || 'N/A'}`));
    }

    console.log("\n📋 PASO 4: Verificando función legal-chat");
    console.log("-".repeat(70));
    console.log("⚠️  Para probar la función legal-chat necesitas:");
    console.log("   1. Abrir la app en el navegador: http://localhost:8081");
    console.log("   2. Iniciar sesión con tus credenciales");
    console.log("   3. Hacer una pregunta en el chat");
    console.log("\n💡 Si el chat no responde, verifica:");
    console.log("   • OPENAI_API_KEY está configurada en .env");
    console.log("   • La función legal-chat está desplegada");
    console.log("   • El usuario tiene sesión activa");

    console.log("\n" + "=".repeat(70));
    console.log("✅ VERIFICACIÓN COMPLETADA");
    console.log("=".repeat(70));
    console.log("\n🚀 Abre http://localhost:8081 y prueba el chat directamente");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
  }
}

testChat();
