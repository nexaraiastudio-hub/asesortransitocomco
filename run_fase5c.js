const fs = require('fs');
const fetch = require('node-fetch');

const SUPABASE_URL = 'https://rmuqhrfahzkxtjedjxip.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtdXFocmZhaHpreHRqZWRqeGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MzU3ODYsImV4cCI6MjA4NzUxMTc4Nn0.muZiWW9i7fMEtBtq5o7z4aVaFFsnK9bVxVIu8h3y8DY';

const EMAIL = 'bermudezcarlose1977@gmail.com';
const PASSWORD = 'charly20220';

const LOCAL_EDGE_URL = 'http://localhost:8000/';

async function login() {
  const res = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Login failed: ' + JSON.stringify(data));
  return data.access_token;
}

const CASOS = [
  { name: 'CASO 1: Consulta Jurídica Simple', message: '¿De cuánto es la multa por pasar un semáforo en rojo?', context: undefined },
  { name: 'CASO 2: Consulta Jurídica Normal', message: 'Iba en mi moto y la grúa se la llevó porque me estacioné un momento. ¿Pueden inmovilizarme la moto por mal parqueo?', context: 'normativas' },
  { name: 'CASO 3: Consulta Jurídica Compleja', message: 'Me hicieron un comparendo por alcoholemia, pero yo no estaba manejando, estaba durmiendo en el carro apagado esperando a que se me pasara. ¿Puedo apelar?', context: 'situación en vía pública, con policía o agente de tránsito' },
  { name: 'CASO 4: Consulta Ambigua', message: 'Me pusieron una multa injusta ayer, ¿qué hago?', context: undefined },
  { name: 'CASO 5: Caso con RAG (Documentos Legales)', message: '¿Cuáles son los requisitos exactos para la instalación de vidrios polarizados según la última resolución?', context: 'normativas' }
];

async function run() {
  console.log('Logging in...');
  const token = await login();
  console.log('Login success.');

  for (let i = 0; i < CASOS.length; i++) {
    const caso = CASOS[i];
    console.log('\n=============================================');
    console.log('EJECUTANDO: ' + caso.name);
    console.log('Mensaje: ' + caso.message);
    
    const start = Date.now();
    const res = await fetch(LOCAL_EDGE_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: caso.message, history: [], context: caso.context })
    });
    
    const timeMs = Date.now() - start;
    console.log('HTTP Status: ' + res.status);
    
    const data = await res.text();
    console.log('Latencia Total Request: ' + timeMs + 'ms');
    console.log('Respuesta: ' + data);
    console.log('=============================================\n');
    
    // wait a bit between requests to avoid overlapping logs
    await new Promise(r => setTimeout(r, 2000));
  }
}

run().catch(console.error);