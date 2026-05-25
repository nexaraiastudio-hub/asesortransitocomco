import 'dotenv/config';
import { hasForbiddenMuletilla } from './test-utils.mjs';

const FUNCTION_URL = 'https://rmuqhrfahzkxtjedjxip.supabase.co/functions/v1/legal-chat';
const API_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const CASOS_PRUEBA = [
  {
    nombre: '🚗 CASO 1 — Polarizados (Debe activar MODO A - sin luxómetro)',
    payload: {
      messages: [
        {
          role: 'user',
          content: 'Me detuvieron por vidrios polarizados en mi carro particular. El agente de tránsito dijo que los midió a ojo, no tenía ningún aparato.'
        }
      ]
    }
  },
  {
    nombre: '🏍️ CASO 2 — Casco parrillero (Debe activar MODO B - falta real)',
    payload: {
      messages: [
        {
          role: 'user',
          content: 'Me pararon en la moto porque mi parrillero no tiene casco. El policía de tránsito dice que va a llamar la grúa.'
        }
      ]
    }
  }
];

async function probarCaso(caso) {
  console.log('\n' + '═'.repeat(70));
  console.log(caso.nombre);
  console.log('═'.repeat(70));
  console.log('📤 Enviando:', caso.payload.messages[0].content);
  console.log('─'.repeat(70));

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
    console.log(`⏱️  Tiempo de respuesta: ${duracion}ms | Fase detectada: ${data.fase || 'N/A'} | Tema: ${data.tema || 'N/A'}`);
    console.log('\n📥 RESPUESTA DEL SISTEMA:');
    console.log('─'.repeat(70));
    console.log(respuesta);

    // Verificaciones automáticas
    console.log('\n✅ VERIFICACIONES:');
    const tieneRazonamiento = respuesta.includes('RAZONAMIENTO JURIDICO') || respuesta.includes('RAZONAMIENTO JURÍDICO');
    const tieneGuion = respuesta.includes('exactamente') || respuesta.includes('Dígale') || respuesta.includes('Digale');
    const tieneComillas = (respuesta.match(/"/g) || []).length >= 2;
    const sinMuletillas = !hasForbiddenMuletilla(respuesta);
    const tieneSaludo = respuesta.includes('Abogado Asesor');

    console.log(`   ${tieneRazonamiento ? '✅' : '⚠️ '} Tiene sección RAZONAMIENTO JURIDICO`);
    console.log(`   ${tieneGuion       ? '✅' : '⚠️ '} Tiene guion de voz para el oficial`);
    console.log(`   ${tieneComillas    ? '✅' : '⚠️ '} Guion entre comillas dobles`);
    console.log(`   ${sinMuletillas    ? '✅' : '❌'} Sin muletillas de chatbot`);
    console.log(`   ${tieneSaludo      ? '✅' : '⚠️ '} Protocolo de saludo inyectado`);

  } catch (err) {
    console.log(`❌ Error de red: ${err.message}`);
  }
}

async function main() {
  console.log('═'.repeat(70));
  console.log('🧪 TEST EN VIVO — HIVE-LAW PRODUCCIÓN (Chain-of-Thought + Reflexion)');
  console.log(`📡 Endpoint: ${FUNCTION_URL}`);
  console.log('═'.repeat(70));

  if (!API_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY no configurada en .env');
    process.exit(1);
  }

  for (const caso of CASOS_PRUEBA) {
    await probarCaso(caso);
    // Pausa entre casos para no saturar
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log('\n' + '═'.repeat(70));
  console.log('🏁 TEST COMPLETADO');
  console.log('═'.repeat(70));
}

main();
