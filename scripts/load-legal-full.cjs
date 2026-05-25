// Script para cargar conocimiento legal completo
// Ejecutar: node scripts/load-legal-full.cjs

const fs = require('fs');
const path = require('path');

const SUPABASE_FUNCTION_URL = "https://rmuqhrfahzkxtjedjxip.supabase.co/functions/v1/bulk-load-legal";

async function main() {
  console.log("Iniciando carga de conocimiento legal...");

  // Leer archivo
  const filePath = path.join(__dirname, '..', 'fuentes_legales', 'Base_Datos_Leyes_Completa.md');
  const content = fs.readFileSync(filePath, 'utf8');

  console.log(`Archivo leído: ${content.length} caracteres`);

  // Enviar a la función
  console.log("Enviando a Supabase Functions...");
  const response = await fetch(SUPABASE_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: content,
    }),
  });

  const result = await response.json();
  console.log("Resultado:", result);
}

main();