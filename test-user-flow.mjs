import 'dotenv/config';

const FUNCTION_URL = 'https://rmuqhrfahzkxtjedjxip.supabase.co/functions/v1/legal-chat';
const API_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const historial = [];

async function testTurn(message) {
  console.log('--------------------------------------------------');
  console.log('USER:', message);
  console.log('--------------------------------------------------');
  
  const payload = {
    history: historial,
    message: message
  };
  
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      'apikey': API_KEY,
    },
    body: JSON.stringify(payload),
  });
  
  const data = await res.json();
  if (!res.ok) {
    console.error("ERROR:", data);
    return;
  }
  
  const respuesta = data.response || data.message || JSON.stringify(data);
  console.log('AI:', respuesta);
  console.log(`Debug: Fase=${data.fase} | Tema=${data.tema} | Modo=${data.modo} | Arquetipo=${data.arquetipo} | Clase=${data.clase} | Autoridad=${data.autoridad}`);
  
  historial.push({ role: 'user', content: message });
  historial.push({ role: 'assistant', content: respuesta });
}

async function main() {
  if (!API_KEY) {
    console.error('Missing API_KEY');
    process.exit(1);
  }
  
  await testTurn("me detuvo un agentede transito porque iba en moto por la cicloruta y pretende hacer un comparendo");
  await new Promise(r => setTimeout(r, 2000));
  await testTurn("bogota, si quiere hacer comparendo e inmovilizacion");
  await new Promise(r => setTimeout(r, 2000));
  await testTurn("el oficial insiste en llevarse la moto en la grua al patio");
}

main();
