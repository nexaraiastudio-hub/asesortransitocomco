// clasificador.ts — V19 Clasificador de Consulta con detección de Arquetipo Jurídico
import { OpenAI } from "https://esm.sh/openai@4.28.0";
import type { ChatMessage, ClasificacionConsulta, Arquetipo } from "./types.ts";

const PROMPT_CLASIFICADOR = `Eres un clasificador de consultas de transito colombiano.
Tu UNICA funcion es:
1. Identificar el TEMA principal de la consulta
2. Extraer DATOS FACTUALES del mensaje y el historial

Tu salida es JSON puro. NO generas texto para el usuario. NO inventas hechos.

TEMAS CONOCIDOS (usa estos nombres exactos cuando aplique):
llantas, polarizados, casco, semaforo, luz_fundida, embriaguez, soat_vencido, licencia, revision_tecnicomecanica, exceso_velocidad, cinturon_seguridad, kit_carretera, placa_mal_ubicada, escape_modificado, emisiones, carga, transporte_escolar, parqueo_prohibido, chaleco_reflectivo, piques, plataformas, maniobras_peligrosas, invasion_ciclorruta, pico_y_placa, contravia, celular, consulta_general_transito

Si el tema no encaja en ninguno, usa el mas cercano o "consulta_general_transito".
Si el usuario menciona "parrillero sin casco" o "persona sin casco", el tema es "casco".

EJEMPLOS DE CLASIFICACION (referencia obligatoria):
- "Me detuvieron por el labrado de las llantas", "neumáticos lisos" -> tema: "llantas"
- "Un policia me detuvo dice que el polarizado no cumple" -> tema: "polarizados"
- "Me detuvo un agente porque llevo una persona sin casco en la moto" -> tema: "casco"
- "Un agente me esta diciendo que me pase el semaforo en rojo" -> tema: "semaforo"
- "Me detuvieron porque dicen que no tengo el kit de carretera completo", "falta el botiquín", "elementos de primeros auxilios", "extintor", "dispositivo para apagar fuego" -> tema: "kit_carretera"
- "El agente dice que mi placa esta mal puesta y quiere multarme" -> tema: "placa_mal_ubicada"
- "Me multaron por no llevar el cinturon puesto" -> tema: "cinturon_seguridad"
- "Me detuvieron por estar ebrio", "conducir bajo los efectos del alcohol", "borracho", "alcoholemia", "estado de embriaguez" -> tema: "embriaguez"
- "Me van a multar por estar parqueado frente a un garaje" -> tema: "parqueo_prohibido"
- "Me pidieron el celular y preguntaron para dónde iba con el pasajero" o "trabajo en Didi, Uber, Cabify, Picap, inDrive" -> tema: "plataformas"
- "Me multan por ir por el andén en moto" o "moto por la ciclorruta" -> tema: "invasion_ciclorruta"
- "Me dicen que tengo pico y placa", "transitando en horario restringido" -> tema: "pico_y_placa"
- "Iba en contravía", "sentido contrario" -> tema: "contravia"
- "Me multan por hablar por celular", "mirar el teléfono", "manipular el radio" -> tema: "celular"

DATOS A EXTRAER (null si no se mencionan):
- clase: tipo de vehiculo (motocicleta, automovil, camioneta, bus, camion, otro)
- servicio: particular, publico, oficial, diplomatico. Si dice "escolar" o "carro escolar", servicio es "publico"
- autoridad: policia_transito, agente_civil, policia_nacional, otro
- metodo: como midio el oficial (visual, profundimetro, fotometro, luxometro, alcohosensor, radar, sonometro, camara, runt, subjetivo, ninguno)
- ciudad: ciudad donde ocurre
- subsanableEnSitio: true si la falta puede corregirse fisicamente en el lugar (ej: ponerse casco, cinturon, conseguir elemento faltante)
- resumenHechos: resumen BREVE y FACTUAL de lo que el usuario ha reportado en TODOS sus mensajes (historial + actual). Solo hechos declarados por el usuario, NUNCA inventar.

ARQUETIPO JURIDICO (razona esto siempre antes de responder — es el campo más importante):
Determina a cuál de los 3 arquetipos pertenece el caso basándote en los hechos declarados:
- "ABUSO": 
  1. El oficial NO tiene prueba técnica reglamentaria CUANDO ES OBLIGATORIA (usó apreciación visual para llantas, polarizados, ruido, velocidad o embriaguez). NOTA: Infracciones de comportamiento (andén, maniobras, parqueo, semáforo, contravía, cinturón, casco, celular) NO requieren equipo y son válidas visualmente.
  2. El oficial excede funciones (ej: interrogatorios/celulares en plataformas).
  3. Exige kit de carreteras a una motocicleta (que está exenta).
  4. La falta no existe legalmente (ej: parqueado antes de la señal sin placa complementaria). Si la falta no existe, es ABUSO directo, ignora la subsanabilidad.
  5. SEMÁFORO ESPECIAL — El usuario dice que el semáforo estaba en AMARILLO o CAMBIANDO cuando cruzó, o que era IMPOSIBLE FRENAR sin causar un accidente: En este caso, el Artículo 118 de la Ley 769 de 2002 establece que "si un vehículo ya está en la intersección en luz amarilla mantendrá la prelación hasta culminar el cruce." Esto es una defensa técnica válida → clasificar como ABUSO para activar el modo defensa.
- "FALTA_INMOVILIZACION_ILEGAL": La falta del usuario ES REAL y el comparendo SÍ procede, PERO la inmovilización NO procede porque la falta es subsanable en el sitio y el usuario puede corregirla, pero el oficial se NIEGA. Ejemplos: luz fundida (puede cambiar el bombillo), elemento de botiquín vencido (puede comprarlo cerca), o parqueo prohibido donde el conductor está presente para moverlo PERO el oficial insiste en llevarse el vehículo en grúa.
- "OFICIAL_CORRECTO": La falta es real, el procedimiento es completamente legal Y no existe ninguna defensa técnica o legal aplicable. Ejemplos: SOAT/Licencia vencida en RUNT, embriaguez con alcohosensor, polarizados con luxómetro, llantas con profundímetro, parqueo prohibido (garaje/esquina) donde el conductor está presente, transitar en andén/ciclorruta con moto, o pasarse un semáforo en ROJO FIRME presenciado por el agente (SOLO si el usuario confirma que estaba en rojo firme, NO en amarillo).

REGLAS:
- Extrae SOLO lo que el usuario declaro explicitamente.
- IMPORTANTE: Extrae la clase, autoridad y ciudad de TODOS los mensajes del historial. Si el usuario lo mencionó en el primer mensaje, DEBES incluirlo aquí, NO pongas null.
- Si dice "a simple vista" o "solo miro" o "no uso nada", metodo es "visual"
- resumenHechos debe incluir datos de TODOS los mensajes del usuario en el historial.
- Si no hay suficiente informacion para un campo, dejalo null.
- Si no hay suficiente información para determinar el arquetipo, usa "ABUSO" como valor por defecto.

SALIDA JSON UNICAMENTE:
{
  "tema": string,
  "clase": string | null,
  "servicio": string | null,
  "autoridad": string | null,
  "metodo": string | null,
  "ciudad": string | null,
  "subsanableEnSitio": boolean,
  "resumenHechos": string,
  "arquetipo": "ABUSO" | "FALTA_INMOVILIZACION_ILEGAL" | "OFICIAL_CORRECTO"
}`;

export async function clasificarConsulta(
  openai: OpenAI,
  mensaje: string,
  historial: ChatMessage[]
): Promise<ClasificacionConsulta> {
  const t0 = performance.now();

  // Incluir solo mensajes del usuario del historial para contexto
  const historialUsuario = historial
    .filter(m => m.role === "user")
    .map(m => `[USUARIO]: ${m.content}`)
    .join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: PROMPT_CLASIFICADOR },
      {
        role: "user",
        content: `${historialUsuario ? `MENSAJES PREVIOS DEL USUARIO:\n${historialUsuario}\n\n` : ""}MENSAJE ACTUAL: "${mensaje}"`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.0,
  });

  const raw = JSON.parse(completion.choices[0].message.content || "{}");

  const arquetiposValidos: Arquetipo[] = ["ABUSO", "FALTA_INMOVILIZACION_ILEGAL", "OFICIAL_CORRECTO"];
  const arquetipoDetectado: Arquetipo = arquetiposValidos.includes(raw.arquetipo)
    ? raw.arquetipo
    : "ABUSO"; // Fallback seguro: si no detecta, asume que puede haber vicio

  const clasificacion: ClasificacionConsulta = {
    tema: raw.tema || "consulta_general_transito",
    clase: raw.clase || null,
    servicio: raw.servicio || null,
    autoridad: raw.autoridad || null,
    metodo: raw.metodo || null,
    ciudad: raw.ciudad || null,
    subsanableEnSitio: raw.subsanableEnSitio ?? false,
    resumenHechos: raw.resumenHechos || "",
    arquetipo: arquetipoDetectado,
    modo: arquetipoDetectado === "OFICIAL_CORRECTO" ? "B" : "A",
  };

  const t1 = performance.now();
  console.log(
    `[CLASIFICADOR] Tema: ${clasificacion.tema} | Arquetipo: ${clasificacion.arquetipo} | Clase: ${clasificacion.clase} | Ciudad: ${clasificacion.ciudad} | ${Math.round(t1 - t0)}ms`
  );

  return clasificacion;
}
