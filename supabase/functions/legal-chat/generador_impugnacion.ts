// generador_impugnacion.ts — V18 Generador de Impugnacion (Template fijo en codigo, GPT-4o solo genera hechos y fundamentos)
import { OpenAI } from "https://esm.sh/openai@4.28.0";
import type { ClasificacionConsulta, ChatMessage } from "./types.ts";

// ═══ PROMPT: Solo genera hechos, fundamentos, pruebas y causa de nulidad ═══
const PROMPT_IMPUGNACION = `Eres un abogado especialista en tránsito y transporte de Colombia.
Tu ÚNICA tarea es generar los campos dinámicos para un documento de impugnación de comparendo.

Básate en los HECHOS del caso, el HISTORIAL de la conversación y las NORMAS proporcionadas.

CAMPOS A GENERAR:
1. hechos: Narrativa cronológica de lo ocurrido, en tercera persona formal. Solo hechos declarados por el usuario.
2. fundamentos: Fundamentos de derecho citando artículos, resoluciones y sentencias específicas.
3. pruebasAdicionales: Pruebas adicionales específicas del caso (además de las genéricas del template).
4. causaNulidad: Causa específica de nulidad (ej: "Ausencia de prueba técnica", "Vicio en el procedimiento").

REGLAS:
- NO inventes hechos ni normas
- Los hechos deben ser EXACTAMENTE lo que el usuario reportó
- Los fundamentos deben citar normas reales y aplicables
- JAMÁS citar "Resolución 668 de 2018" (no existe)
- Español latinoamericano correcto

SALIDA JSON ÚNICAMENTE:
{
  "hechos": "texto de los hechos...",
  "fundamentos": "texto de los fundamentos de derecho...",
  "pruebasAdicionales": "texto de pruebas adicionales específicas...",
  "causaNulidad": "causa específica de nulidad..."
}`;

// ═══ TEMPLATE FIJO DE IMPUGNACION (se llena en CODIGO) ═══
const TEMPLATE_IMPUGNACION = `A continuación le presento el modelo de impugnación. Complete los datos marcados entre corchetes con su información personal.

---

Ciudad y fecha: [Ciudad], [Fecha]

Señor(a)
Inspector(a) de Tránsito y Transporte de [Ciudad]
[Dirección de la Secretaría de Tránsito si se conoce]

**ASUNTO: Impugnación del comparendo No. [NÚMERO DEL COMPARENDO] - {{CAUSA_NULIDAD}}**

Respetado(a) Inspector(a):

Yo, **[NOMBRE COMPLETO]**, identificado(a) con cédula de ciudadanía No. **[CÉDULA]**, domiciliado(a) en **[DIRECCIÓN]**, teléfono **[TELÉFONO]**, correo electrónico **[CORREO]**, me dirijo a su despacho dentro del término legal para IMPUGNAR el comparendo que a continuación relaciono:

**I. DATOS DEL COMPARENDO**
- Número del comparendo: [NÚMERO]
- Fecha del comparendo: [FECHA]
- Hora: [HORA]
- Lugar: [LUGAR]
- Placas del vehículo: [PLACAS]
- Código de infracción impuesta: [CÓDIGO]
- Agente que impuso el comparendo: [NOMBRE/PLACA DEL AGENTE]

**II. HECHOS**

{{HECHOS_DINAMICOS}}

**III. FUNDAMENTOS DE DERECHO**

{{FUNDAMENTOS_DINAMICOS}}

**IV. PRUEBAS**

Solicito se tengan como pruebas:
1. Video del procedimiento grabado en el lugar de los hechos.
2. Fotografías del vehículo, comparendo y agente.
3. Copia del comparendo con la anotación BAJO PROTESTA.
4. {{PRUEBAS_ADICIONALES}}
5. Captura de pantalla de esta conversación de asesoría legal.

**V. SOLICITUDES**

Con fundamento en los hechos y normas expuestos, solicito:
a) Se declare la NULIDAD del comparendo No. [NÚMERO] por {{CAUSA_NULIDAD}}.
b) Se ordene la exoneración de los costos de grúa y parqueadero generados por la inmovilización ilegal (si aplica).
c) Se inicie investigación disciplinaria contra el agente [NOMBRE/PLACA] por las irregularidades documentadas (si aplica).
d) Se archive el proceso contravencional.

**VI. NOTIFICACIONES**

Recibo notificaciones en: [DIRECCIÓN], teléfono [TELÉFONO], correo [CORREO].

Cordialmente,

**[NOMBRE COMPLETO]**
C.C. [CÉDULA]
[Ciudad], [Fecha]

---

**Recordatorios Post-Impugnación:**
1. Tiene **5 días hábiles** desde la notificación del comparendo para presentar la impugnación ante la Secretaría de Tránsito correspondiente.
2. Guarde el video completo del procedimiento en al menos 2 dispositivos.
3. Guarde captura de pantalla de esta conversación como soporte de asesoría.
4. Lleve copia física y digital de la impugnación.
5. Solicite radicado o sello de recibido al momento de entregar la impugnación.`;

export async function generarImpugnacion(
  openai: OpenAI,
  clasificacion: ClasificacionConsulta,
  normas: string,
  historial: ChatMessage[]
): Promise<string> {
  const t0 = performance.now();

  const historialTexto = historial
    .map(m => `[${m.role.toUpperCase()}]: ${m.content.substring(0, 300)}`)
    .join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: PROMPT_IMPUGNACION },
      {
        role: "user",
        content: `TEMA: ${clasificacion.tema}\n\nHECHOS DEL CASO:\n${clasificacion.resumenHechos}\n\nHISTORIAL COMPLETO:\n${historialTexto}\n\nNORMAS APLICABLES:\n${normas || "Usar principios transversales: Art. 29 CP, Art. 125 Ley 769/2002, Sentencia C-038/2020."}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const raw = JSON.parse(completion.choices[0].message.content || "{}");

  // CONSTRUIR documento con template fijo en CODIGO
  const documento = TEMPLATE_IMPUGNACION
    .replace("{{HECHOS_DINAMICOS}}", raw.hechos || "")
    .replace("{{FUNDAMENTOS_DINAMICOS}}", raw.fundamentos || "")
    .replace("{{PRUEBAS_ADICIONALES}}", raw.pruebasAdicionales || "Demas pruebas que se consideren pertinentes.")
    .replace(/\{\{CAUSA_NULIDAD\}\}/g, raw.causaNulidad || "Vicios en el procedimiento");

  const t1 = performance.now();
  console.log(`[GENERADOR IMPUGNACION] Tema: ${clasificacion.tema} | ${Math.round(t1 - t0)}ms`);

  return documento;
}
