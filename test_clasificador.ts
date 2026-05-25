import { clasificarConsulta } from "./supabase/functions/legal-chat/clasificador.ts";

const historial = [
  { role: "user", content: "me detuvo un agentede transito porque iba en moto por la cicloruta y pretende hacer un comparendo" },
  { role: "assistant", content: "((Saludos. Soy tu Abogado Asesor Élite...)) Para poder ayudarte de la mejor manera posible, necesito un poco más de información sobre tu situación. ¿En qué ciudad o municipio de Colombia ocurrió la detención? Además, ¿el oficial mencionó específicamente que estabas transitando por la ciclorruta, andén o zona verde? También, ¿ya llegó la grúa para la inmovilización obligatoria de tu vehículo? Con estos detalles podré orientarte adecuadamente. ((Pregunta de Control...))" },
];
const ultimoMensaje = "bogota, si quiere hacer comparendo e inmovilizacion";

async function run() {
  const clasificacion = await clasificarConsulta(ultimoMensaje, historial);
  console.log(JSON.stringify(clasificacion, null, 2));
}

run();
