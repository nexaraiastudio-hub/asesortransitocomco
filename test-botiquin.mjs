import 'dotenv/config';
import { hasForbiddenMuletilla } from './test-utils.mjs';

const FUNCTION_URL = 'https://rmuqhrfahzkxtjedjxip.supabase.co/functions/v1/legal-chat';
const API_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Tres escenarios de botiquín (kit de carretera)
const CASOS = [
  {
    nombre: '🩹 CASO 1 — Falta de botiquín (MODO A, falta objetiva) → requiere subsanación en sitio',
    payload: {
      messages: [
        { role: 'user',      content: 'Me detuvieron y me dijeron que no llevaba botiquín en el coche. Yo no tengo ninguno.' },
        { role: 'assistant', content: '¿Qué tipo de vehículo conduce? (automóvil, moto, camioneta, bus, camión)' },
        { role: 'user',      content: 'Conduzco un automóvil particular.' }
      ]
    }
  },
  {
    nombre: '🩹 CASO 2 — Botiquín incompleto (subsanable) → puede subsanarse en el lugar',
    payload: {
      messages: [
        { role: 'user',      content: 'El agente dice que mi botiquín está incompleto, falta el termómetro.' },
        { role: 'assistant', content: '¿Qué tipo de vehículo conduce? (automóvil, moto, camioneta, bus, camión)' },
        { role: 'user',      content: 'Es una camioneta de trabajo.' }
      ]
    }
  },
  {
    nombre: '🩹 CASO 3 — Botiquín completo (MODO B, cumplimiento) → no hay infracción',
    payload: {
      messages: [
        { role: 'user',      content: 'Tengo el botiquín de carretera completo según la normativa.' },
        { role: 'assistant', content: '¿Qué tipo de vehículo conduce? (automóvil, moto, camioneta, bus, camión)' },
        { role: 'user',      content: 'Conduzco una moto.' }
      ]
    }
  }
];

async function probarCaso(caso, idx) {
  console.log('\n' + '═'.repeat(72));
  console.log(caso.nombre);
  console.log('═'.repeat(72));
  const ultimo = caso.payload.messages[caso.payload.messages.length - 1];
  console.log(`📤 Último mensaje del usuario: "${ultimo.content}"`);
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
    console.log(`⏱️  Tiempo: ${duracion}ms | Fase: ${data.fase} | Tema: ${data.tema}`);
    console.log('\n📥 RESPUESTA:');
    console.log('─'.repeat(72));
    console.log(respuesta);

    console.log('\n🔍 ANALISIS:');
    const tieneRazonamiento = /RAZONAMIENTO/i.test(respuesta);
    const tieneGuion = /d[íi]gale exactamente|\"Señor/i.test(respuesta);
    const cita = /Resolución 3027|kit_carretera|Ley|Artículo/i.test(respuesta);
    const modoA = /subsanable|falta|incompleto|no tiene|no lleva/i.test(respuesta);
    const modoB = /cumple|completo|no procede|no hay infracción/i.test(respuesta);
    const sinMuletillas = !hasForbiddenMuletilla(respuesta);

    console.log(`   ${tieneRazonamiento ? '✅' : '❌'} Razonamiento juridico`);
    console.log(`   ${tieneGuion ? '✅' : '❌'} Guion de voz`);
    console.log(`   ${cita ? '✅' : '❌'} Cita normativa (Resolución 3027, etc.)`);
    console.log(`   ${modoA && idx < 3 ? '✅' : (idx < 3 ? '⚠️' : '—')} MODO A activo${idx < 3 ? '' : ' [no aplica]'}`);
    console.log(`   ${modoB && idx === 3 ? '✅' : (idx === 3 ? '⚠️' : '—')} MODO B activo${idx === 3 ? '' : ' [no aplica]'}`);
    console.log(`   ${sinMuletillas ? '✅' : '❌'} Sin muletillas`);

  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
  }
}

async function main() {
  console.log('═'.repeat(72));
  console.log('🧪 TEST KIT DE CARRETERA (BOTIQUÍN) — 3 ESCENARIOS');
  console.log(`📡 ${FUNCTION_URL}`);
  console.log('═'.repeat(72));

  if (!API_KEY) { console.error('❌ API_KEY no configurada'); process.exit(1); }

  for (let i = 0; i < CASOS.length; i++) {
    await probarCaso(CASOS[i], i + 1);
    if (i < CASOS.length - 1) await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n' + '═'.repeat(72));
  console.log('🏁 TEST BOTIQUIN COMPLETADO');
  console.log('═'.repeat(72));
}

main();
