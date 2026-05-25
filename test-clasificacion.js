import 'dotenv/config';
import OpenAI from 'openai';
import { clasificarConsulta } from './supabase/functions/legal-chat/clasificador.ts';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const historial = [
  { role: "user", content: "me detuvo un agentede transito porque iba en moto por la cicloruta y pretende hacer un comparendo" },
  { role: "assistant", content: "((Saludos...)) ¿En qué ciudad...?" }
];
const ultimoMensaje = "bogota, si quiere hacer comparendo e inmovilizacion";

async function run() {
  const clasificacion = await clasificarConsulta(openai, ultimoMensaje, historial);
  console.log(clasificacion);
}
run();
