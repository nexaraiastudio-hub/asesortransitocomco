import 'dotenv/config';
import { hasForbiddenMuletilla } from './test-utils.mjs';

const FUNCTION_URL = 'https://rmuqhrfahzkxtjedjxip.supabase.co/functions/v1/legal-chat';
const API_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const CASOS_FASE2 = [
  {
    nombre: '🚗 CASO A — Polarizados COMPLETO → Debe dar RAZONAMIENTO + GUION (MODO A)',
    payload: {
      messages: [
        { role: 'user',      content: 'Me detuvieron por vidrios polarizados en mi carro particular. El agente de tránsito dijo que los midió a ojo, no tenía ningún aparato.' },
        { role: 'assistant', content: '¿A qué autoridad pertenece el oficial que te detuvo? ¿Es Policía de Tránsito, Agente Civil de Tránsito o Policía Nacional?' },
        { role: 'user',      content: 'Es un agente civil de tránsito. No tenía ningún luxómetro ni fotómetro, solo dijo que los vidrios se ven muy oscuros.' }
      ]
    }
  },
  {
    nombre: '🏍️ CASO B — Casco parrillero COMPLETO → Debe dar GUION de subsanación (MODO B)',
    payload: {
      messages: [
        { role: 'user',      content: 'Me pararon en la moto porque mi parrillero no tiene casco. El policía de tránsito dice que va a llamar la grúa.' },
        { role: 'assistant', content: '¿En qué ciudad se encuentra? ¿Su acompañante tiene un casco disponible o definitivamente no cuenta con uno?' },
        { role: 'user',      content: 'Estoy en Bogotá. El parrillero no tiene casco. No hay nadie que le traiga uno. El policía insiste con la grúa.' }
      ]
    }
  }
];

async function probarFase2(caso) {
  console.log('\n' + '═'.repeat(72));
  console.log(caso.nombre);
  console.log('═'.repeat(72));
  const ultimo = caso.payload.messages[caso.payload.messages.length - 1];
  console.log(`📤 Último mensaje del usuario: "${ultimo.content}"`);
  console.log(`📜 Historial: ${caso.payload.messages.length} mensajes (simula conversación avanzada)`);
  console.log('─'.repeat(72));

  const t0 = Date.now();
  try {
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'apikey': API_KEY,
      },
      body: JSON.stringify(caso.payload),
    });

    const duracion = Date.now() - t0;
    const data = await res.json();

    if (!res.ok) {
      console.log(`❌ HTTP ${res.status}: ${data.error || JSON.stringify(data)}`);
      return;
    }

    const respuesta = data.response || data.message || JSON.stringify(data);
    console.log(`⏱️  Tiempo: ${duracion}ms | Fase: ${data.fase || 'N/A'} | Tema: ${data.tema || 'N/A'}`);
    console.log('\n📥 RESPUESTA COMPLETA:');
    console.log('─'.repeat(72));
    console.log(respuesta);

    // Verificaciones de Fase 2
    console.log('\n✅ VERIFICACIONES FASE 2:');
    const tieneRazonamiento = /RAZONAMIENTO JUR[IÍ]DICO/i.test(respuesta);
    const tieneGuion        = /d[íi]gale exactamente|guion|script/i.test(respuesta);
    const tieneComillas     = (respuesta.match(/"/g) || []).length >= 2;
    const sinMuletillas     = !hasForbiddenMuletilla(respuesta);
    const tieneNorma        = /Res\.|Art\.|Ley\s\d|C\.N\.T|Constituci/i.test(respuesta);
    const faseCorrecta      = data.fase === 2 || data.fase === '2' || data.fase === '2b';

    console.log(`   ${tieneRazonamiento ? '✅' : '❌'} Tiene sección RAZONAMIENTO JURIDICO`);
    console.log(`   ${tieneGuion        ? '✅' : '❌'} Tiene guion de voz para el oficial`);
    console.log(`   ${tieneComillas     ? '✅' : '⚠️ '} Guion entre comillas dobles`);
    console.log(`   ${sinMuletillas     ? '✅' : '❌'} Sin muletillas de chatbot`);
    console.log(`   ${tieneNorma        ? '✅' : '⚠️ '} Cita normativa específica`);
    console.log(`   ${faseCorrecta      ? '✅' : '⚠️ '} Fase 2 activada (actual: ${data.fase})`);

  } catch (err) {
    console.log(`❌ Error de red: ${err.message}`);
  }
}

async function main() {
  console.log('═'.repeat(72));
  console.log('🧪 TEST FASE 2 — DEFENSA COMPLETA CON HISTORIAL CARGADO');
  console.log('📡 Se simula conversación avanzada para forzar Fase 2');
  console.log('═'.repeat(72));

  if (!API_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY no configurada en .env');
    process.exit(1);
  }

  for (const caso of CASOS_FASE2) {
    await probarFase2(caso);
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n' + '═'.repeat(72));
  console.log('🏁 TEST FASE 2 COMPLETADO');
  console.log('═'.repeat(72));
}

main();
