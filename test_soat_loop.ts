import { nodo1_Analista } from "./supabase/functions/legal-chat/agentes/nodo1_analista.ts";
import OpenAI from "https://deno.land/x/openai@v4.69.0/mod.ts";
import "https://deno.land/std@0.224.0/dotenv/load.ts";

const openai = new OpenAI();

async function testLoop() {
  const history = [
    { role: "user", content: "tengo el soat vencido y me detuvo un agente de transito" },
    { role: "assistant", content: "¿Qué tipo de vehículo conduce? ¿Qué autoridad lo detuvo, Tránsito o Policía? ¿Hace cuánto tiempo se venció su SOAT?" }
  ];
  const mensaje = "particular, transito, ayer";

  console.log("Simulando Nodo 1...");
  const analisis = await nodo1_Analista(openai, mensaje, history);
  console.log("Resultado Nodo 1:", analisis);
}

testLoop();
