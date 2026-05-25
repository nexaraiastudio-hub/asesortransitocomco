import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load env variables
const envPath = path.resolve(__dirname, '../../../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
let apiKey = '';
envContent.split(/\r?\n/).forEach(line => {
  if (line.startsWith('OPENAI_API_KEY=')) {
    apiKey = line.split('=')[1].trim();
  }
});

if (!apiKey) {
  console.error("No OPENAI_API_KEY found in .env");
  process.exit(1);
}

// 2. Read prompt from clasificador.ts
const clasificadorPath = path.resolve(__dirname, 'clasificador.ts');
const clasificadorContent = fs.readFileSync(clasificadorPath, 'utf8');
const promptMatch = clasificadorContent.match(/const PROMPT_CLASIFICADOR = `([\s\S]*?)`;/);
if (!promptMatch) {
  console.error("Could not find PROMPT_CLASIFICADOR in clasificador.ts");
  process.exit(1);
}
const PROMPT_CLASIFICADOR = promptMatch[1];

// 3. Define test cases
const testCases = [
  {
    name: "Parqueo Prohibido - Antes de señal",
    input: "Quieren llevarse mi carro en grúa por mal parqueo. Yo estoy parqueado antes de la señal de prohibido parquear, no después.",
    expectedArquetipo: "ABUSO"
  },
  {
    name: "Parqueo Prohibido - Frente a garaje",
    input: "El tránsito va a inmovilizar mi camioneta. La dejé un momento frente al portón de una casa y dicen que es mal parqueo.",
    expectedArquetipo: "OFICIAL_CORRECTO"
  },
  {
    name: "Plataformas - Interrogatorio a pasajero y pedir celular",
    input: "Trabajo en Uber. Un policía de tránsito me detuvo y está interrogando a mi pasajero, además me está pidiendo mi celular para revisar la aplicación",
    expectedArquetipo: "ABUSO"
  },
  {
    name: "Kit Carretera - Exigencia a Moto",
    input: "Me pararon en la moto y el agente me está pidiendo botiquín y extintor",
    expectedArquetipo: "ABUSO"
  },
  {
    name: "Kit Carretera - Botiquín vencido sin subsanación",
    input: "Me detuvieron en mi carro particular, me revisaron el botiquín y el alcohol está vencido. Quieren inmovilizarme. No me dio la oportunidad de comprar otro en la farmacia de la esquina",
    expectedArquetipo: "FALTA_INMOVILIZACION_ILEGAL"
  },
  {
    name: "Maniobras - Moto en andén",
    input: "Me pararon porque me subí al andén con la moto para saltarme un trancón",
    expectedArquetipo: "OFICIAL_CORRECTO"
  }
];

// 4. Run tests
async function runTests() {
  console.log("Iniciando pruebas de clasificación de nuevos casos...");
  console.log("-----------------------------------------------------");

  let passed = 0;

  for (const tc of testCases) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // Use mini for faster testing
          messages: [
            { role: "system", content: PROMPT_CLASIFICADOR },
            { role: "user", content: JSON.stringify([{ role: "user", content: tc.input }]) }
          ],
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        console.error(`Error de API para "${tc.name}":`, data);
        continue;
      }

      const resultText = data.choices[0].message.content;
      const resultJson = JSON.parse(resultText);
      const predictedArquetipo = resultJson.arquetipo;

      if (predictedArquetipo === tc.expectedArquetipo) {
        console.log(`✅ [PASS] ${tc.name}`);
        console.log(`   Detectado correctamente: ${predictedArquetipo} (Tema: ${resultJson.tema})`);
        passed++;
      } else {
        console.log(`❌ [FAIL] ${tc.name}`);
        console.log(`   Esperado: ${tc.expectedArquetipo}, Obtenido: ${predictedArquetipo} (Tema: ${resultJson.tema})`);
        console.log(`   JSON Completo:`, resultJson);
      }
    } catch (err) {
      console.error(`Error ejecutando caso "${tc.name}":`, err.message);
    }
  }

  console.log("-----------------------------------------------------");
  console.log(`Resultados: ${passed}/${testCases.length} pasaron correctamente.`);
}

runTests();
