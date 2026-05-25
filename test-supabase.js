import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rmuqhrfahzkxtjedjxip.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log("=".repeat(60));
console.log("🧪 TEST DE RESPUESTA A PREGUNTA DEL USUARIO");
console.log("=".repeat(60));
console.log("\n📋 Configuración:");
console.log("  SUPABASE_URL:", SUPABASE_URL);
console.log("  SUPABASE_ANON_KEY existe:", !!SUPABASE_ANON_KEY);

if (!SUPABASE_ANON_KEY) {
  console.error("\n❌ ERROR: VITE_SUPABASE_PUBLISHABLE_KEY no está definida en el archivo .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLegalChat() {
  console.log("\n" + "=".repeat(60));
  console.log("🔍 PASO 1: Autenticando usuario de prueba");
  console.log("=".repeat(60));

  try {
    console.log(`\n⏳ Intentando autenticar usuario existente...`);

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: "testuser@gmail.com",
      password: "test123456",
    });

    if (signInError) {
      console.error("❌ Error de autenticación:", signInError.message);
      console.log("\n⚠️  INSTRUCCIONES:");
      console.log("   1. Crea un usuario manualmente en Supabase Dashboard");
      console.log("   2. O usa las credenciales de un usuario existente");
      console.log("   3. Actualiza el email/password en este archivo");
      return;
    }

    const session = signInData.session;

    if (!session) {
      console.error("❌ No se pudo obtener sesión");
      return;
    }

    console.log("✅ Usuario autenticado exitosamente");
    console.log(`   Token obtenido (primeros 30 chars): ${session.access_token.substring(0, 30)}...`);

    console.log("\n" + "=".repeat(60));
    console.log("🔍 PASO 2: Verificando conexión a la base de datos");
    console.log("=".repeat(60));

    const { data: conocimientos, error: dbError } = await supabase
      .from("conocimiento_legal")
      .select("id, titulo")
      .limit(5);

    if (dbError) {
      console.error("❌ Error conectando a la BD:", dbError);
      return;
    }

    console.log(`✅ Conexión exitosa. Documentos en BD: ${conocimientos.length}`);
    console.log("\nPrimeros documentos:");
    conocimientos.forEach((doc, i) => {
      console.log(`  ${i + 1}. ${doc.titulo} (ID: ${doc.id})`);
    });

    console.log("\n" + "=".repeat(60));
    console.log("🔍 PASO 3: Verificando SYSTEM_PROMPT");
    console.log("=".repeat(60));

    const { data: systemPrompt, error: promptError } = await supabase
      .from("conocimiento_legal")
      .select("titulo, contenido")
      .eq("titulo", "SYSTEM_PROMPT")
      .single();

    if (promptError) {
      console.log("⚠️  SYSTEM_PROMPT no encontrado en BD (se usará el hardcodeado)");
    } else {
      console.log("✅ SYSTEM_PROMPT encontrado en BD");
      console.log(`   Longitud del contenido: ${systemPrompt.contenido.length} caracteres`);
      console.log(`   Primeros 200 chars: ${systemPrompt.contenido.substring(0, 200)}...`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("🔍 PASO 4: Probando búsqueda de documentos relevantes");
    console.log("=".repeat(60));

    const preguntaTest = "Me detuvieron por exceso de velocidad, ¿qué debo hacer?";
    console.log(`\n📝 Pregunta de prueba: "${preguntaTest}"`);

    const palabrasClave = preguntaTest.split(' ').slice(0, 5).join(' | ');
    console.log(`🔎 Palabras clave para búsqueda: "${palabrasClave}"`);

    const { data: documentosRelevantes, error: searchError } = await supabase
      .from('conocimiento_legal')
      .select('id, titulo, contenido, anclaje_legal')
      .neq('titulo', 'SYSTEM_PROMPT')
      .textSearch('contenido', palabrasClave)
      .limit(3);

    if (searchError) {
      console.error("❌ Error en búsqueda:", searchError);
    } else {
      console.log(`\n✅ Documentos relevantes encontrados: ${documentosRelevantes.length}`);
      documentosRelevantes.forEach((doc, i) => {
        console.log(`\n  ${i + 1}. ${doc.titulo}`);
        console.log(`     Anclaje legal: ${doc.anclaje_legal || 'N/A'}`);
        console.log(`     Contenido (primeros 150 chars): ${doc.contenido.substring(0, 150)}...`);
      });
    }

    console.log("\n" + "=".repeat(60));
    console.log("🚀 PASO 5: Invocando función legal-chat");
    console.log("=".repeat(60));

    console.log("\n⏳ Enviando pregunta a la función legal-chat...");
    console.log(`   Pregunta: "${preguntaTest}"`);

    const { data: chatResponse, error: chatError } = await supabase.functions.invoke("legal-chat", {
      body: {
        query: preguntaTest
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (chatError) {
      console.error("\n❌ Error invocando legal-chat:", chatError);
      console.error("   Detalles:", JSON.stringify(chatError, null, 2));
      return;
    }

    console.log("\n✅ Respuesta recibida de legal-chat:");
    console.log("=".repeat(60));

    if (chatResponse?.response) {
      console.log("\n" + chatResponse.response);
      console.log("\n" + "=".repeat(60));
      console.log(`📊 Estadísticas de la respuesta:`);
      console.log(`   Longitud: ${chatResponse.response.length} caracteres`);
      console.log(`   Palabras: ~${chatResponse.response.split(' ').length} palabras`);

      const tieneArticulos = /art[íi]culo|ley|resoluci[óo]n|sentencia/i.test(chatResponse.response);
      const tieneCitas = /[""]/.test(chatResponse.response);
      const tieneProtocolo = /protocolo|evidencia|grabar|fotografiar/i.test(chatResponse.response);
      const tieneSaludo = /líder|usuario/i.test(chatResponse.response);
      const tieneAlerta = /cámara|graba/i.test(chatResponse.response);

      console.log(`\n✅ Verificaciones de calidad:`);
      console.log(`   ${tieneArticulos ? '✅' : '❌'} Contiene referencias legales (artículos, leyes, etc.)`);
      console.log(`   ${tieneCitas ? '✅' : '❌'} Contiene citas textuales (scripts de defensa)`);
      console.log(`   ${tieneProtocolo ? '✅' : '❌'} Incluye protocolo de evidencia`);
      console.log(`   ${tieneSaludo ? '✅' : '❌'} Incluye saludo personalizado`);
      console.log(`   ${tieneAlerta ? '✅' : '❌'} Incluye alerta de activar cámara`);

    } else {
      console.log("⚠️  No se recibió respuesta en el formato esperado");
      console.log("   Datos recibidos:", JSON.stringify(chatResponse, null, 2));
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ TEST COMPLETADO EXITOSAMENTE");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("\n❌ Error durante el test:", error);
    console.error("   Stack:", error.stack);
  }
}

testLegalChat();
