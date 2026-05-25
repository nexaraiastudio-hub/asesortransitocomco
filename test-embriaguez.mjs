import 'dotenv/config';
import { hasForbiddenMuletilla } from './test-utils.mjs';

const FUNCTION_URL = 'https://rmuqhrfahzkxtjedjxip.supabase.co/functions/v1/legal-chat';
const API_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const CASOS = [
  {
    nombre: '🍺 CASO 1 — Solo síntomas, sin alcohosensor → MODO A (sin prueba técnica)',
    payload: {
      messages: [
        { role: 'user',      content: 'Me detuvieron en un retén. El policía de tránsito dice que tengo "olor a licor" y "ojos rojos" pero no usó ningún aparato. Conduzco un carro particular.' },
        { role: 'assistant', content: '¿El oficial utilizó un alcohosensor para realizar la prueba? ¿Le mostró el certificado de calibración vigente?' },
        { role: 'user',      content: 'No, ningún aparato. Solo dijo que huele a licor y me quiere poner un comparendo por embriaguez.' }
      ]
    }
  },
  {
    nombre: '📋 CASO 2 — Alcohosensor sin certificado de calibración → MODO A (vicio procedimental)',
    payload: {
      messages: [
        { role: 'user',      content: 'Me pusieron el alcohosensor y dio 0.6 g/l. Pero cuando pedí ver el certificado de calibración del aparato, el policía dijo que no lo tiene a mano. Soy conductor de carro particular.' },
        { role: 'assistant', content: '¿Le informaron el resultado de la prueba antes de proceder? ¿Pasaron más de 15 minutos entre la detención y la prueba?' },
        { role: 'user',      content: 'Sí me mostraron el resultado en pantalla. La detención fue inmediata, menos de 5 minutos. Pero el certificado de calibración del aparato no lo tienen.' }
      ]
    }
  },
  {
    nombre: '⚖️ CASO 3 — Embriaguez real comprobada → MODO B (asesoría honesta)',
    payload: {
      messages: [
        { role: 'user',      content: 'Me hicieron la prueba de alcohosensor, dio 1.8 g/l. Sí tomé anoche. El aparato tiene certificado vigente y me lo mostraron. Soy conductor de moto.' },
        { role: 'assistant', content: '¿Ha consumido alcohol en las últimas 8 horas? ¿Pasaron más de 15 minutos entre la detención y la prueba?' },
        { role: 'user',      content: 'Sí, tomé hace 5 horas. Me hicieron la prueba inmediatamente. El certificado estaba al día.' }
      ]
    }
  }
];

async function probarCaso(caso, num) {
  console.log('\n' + '═'.repeat(72));
  console.log(caso.nombre);
  console.log('═'.repeat(72));
  const ultimo = caso.payload.messages[caso.payload.messages.length - 1];
  console.log(`📤 Respuesta del usuario: "${ultimo.content}"`);
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

    console.log('\n🔍 ANÁLISIS:');
    const tieneRazonamiento = /RAZONAMIENTO/i.test(respuesta);
    const tieneGuion        = /d[íi]gale exactamente|\"Señor/i.test(respuesta);
    const citeNorma         = /Ley 1696|Res.*1844|alcohosensor|calibra/i.test(respuesta);
    const modoA             = /no.*v[aá]lida|vicio|subjetiv|sin prueba|no.*m[eé]todo/i.test(respuesta);
    const modoB             = /consecuencia|suspensi[oó]n|30 SMLDV|retenci[oó]n|perder la licencia/i.test(respuesta);
    const sinMuletillas     = !hasForbiddenMuletilla(respuesta);

    console.log(`   ${tieneRazonamiento ? '✅' : '❌'} Razonamiento jurídico presente`);
    console.log(`   ${tieneGuion        ? '✅' : '❌'} Guion de voz para el oficial`);
    console.log(`   ${citeNorma         ? '✅' : '❌'} Cita Ley 1696/2013 o Res. 1844/2015`);
    console.log(`   ${modoA && num < 3  ? '✅' : (num < 3 ? '⚠️ ' : '—')} MODO A activo (Defensa Agresiva)${num < 3 ? '' : ' [no aplica]'}`);
    console.log(`   ${modoB && num === 3 ? '✅' : (num === 3 ? '⚠️ ' : '—')} MODO B activo (Asesoría Honesta)${num === 3 ? '' : ' [no aplica]'}`);
    console.log(`   ${sinMuletillas     ? '✅' : '❌'} Sin muletillas de chatbot`);

  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
  }
}

async function main() {
  console.log('═'.repeat(72));
  console.log('🧪 TEST EMBRIAGUEZ — 3 VARIANTES (Sin prueba / Vicio / Real)');
  console.log(`📡 ${FUNCTION_URL}`);
  console.log('═'.repeat(72));

  if (!API_KEY) { console.error('❌ API KEY faltante'); process.exit(1); }

  for (let i = 0; i < CASOS.length; i++) {
    await probarCaso(CASOS[i], i + 1);
    if (i < CASOS.length - 1) await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n' + '═'.repeat(72));
  console.log('🏁 TEST EMBRIAGUEZ COMPLETADO');
  console.log('═'.repeat(72));
}

main();
