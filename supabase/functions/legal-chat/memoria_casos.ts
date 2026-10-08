// memoria_casos.ts - Sistema de aprendizaje continuo de casos exitosos

export interface CasoExitoso {
  id?: string;
  created_at?: string;
  tema: string;
  arquetipo: "ABUSO" | "FALTA_INMOVILIZACION_ILEGAL" | "OFICIAL_CORRECTO";
  fase1_usuario: string;
  fase1_respuesta: string;
  fase2_usuario: string;
  fase2_respuesta: string;
  fase2b_usuario?: string;
  fase2b_respuesta?: string;
  fase3_usuario?: string;
  fase3_respuesta?: string;
  argumento_decisivo: string;
  resultado: string;
  fase_resolucion: number | string;
  aprobado: boolean;
  usos: number;
}


import { recuperarNormativa } from "./agentes/agente_leyes.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

// SUPABASE_URL usado como verificación de disponibilidad de entorno
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
// SERVICE_ROLE_KEY eliminado (SEC-003): casos_exitosos permite SELECT a usuarios autenticados por RLS

/**
 * Detecta si el usuario está reportando éxito en su mensaje
 */
export function detectarExito(mensaje: string): boolean {
  const mensajeLower = mensaje.toLowerCase();
  return mensajeLower.includes('gracias') || 
         mensajeLower.includes('excelente') || 
         mensajeLower.includes('perfecto') || 
         mensajeLower.includes('éxito') || 
         mensajeLower.includes('exitoso') ||
         mensajeLower.includes('funcionó') ||
         mensajeLower.includes('me sirvió') ||
         mensajeLower.includes('me ayudó') ||
         mensajeLower.includes('resuelto') ||
         mensajeLower.includes('solucionado');
}

/**
 * Detecta si el usuario está solicitando una impugnación
 */
export function detectarSolicitudImpugnacion(mensaje: string, historial: ChatMessage[]): boolean {
  const mensajeLower = mensaje.toLowerCase();
  return mensajeLower.includes('impugnar') || 
         mensajeLower.includes('impugnación') || 
         mensajeLower.includes('comparendo') || 
         mensajeLower.includes('multa') || 
         mensajeLower.includes('sanción') ||
         mensajeLower.includes('modelo de impugnación') ||
         mensajeLower.includes('redacte el modelo') ||
         mensajeLower.includes('quiero impugnar');
}

/**
 * Extrae el resultado del último mensaje del usuario
 */
export function extraerResultado(mensaje: string): string {
  // Implementación simplificada - en un caso real, esto sería más sofisticado
  return mensaje.substring(0, 100); // Primeros 100 caracteres como resultado
}

/**
 * Construye un caso exitoso a partir del historial de chat
 */
export function construirCasoDesdeHistorial(
    tema: string,
    modo: string | null,
    historial: ChatMessage[],
    ultimoMensajeUsuarioAnterior: string // NUEVO: pasar el último mensaje del usuario ANTES de la nueva consulta
  ): CasoExitoso | null {
    if (historial.length < 2) return null;

    // Usar el último mensaje del usuario ANTES de la nueva consulta (no el último mensaje del historial completo)
    const ultimoMensaje = ultimoMensajeUsuarioAnterior;
    
    // Determinar si fue exitoso basado en detección de éxito o solicitud de impugnación
    const esExitoso = detectarExito(ultimoMensaje) || 
                     detectarSolicitudImpugnacion(ultimoMensaje, historial);
    
    if (!esExitoso) return null;

    // Extraer entidades del historial para hacer el caso más rico
    const hechosClave = {
      mensajeInicial: historial[0].content,
      mensajeFinal: ultimoMensaje,
      interacciones: historial.length,
      tieneHistorial: historial.length > 2
    };

    // Determinar normas aplicadas basado en el tema y contexto
    const normativa = recuperarNormativa(tema);
    const normasAplicadas = normativa?.normas || [];
    
    // Determinar resultado clave
    const resultadoClave = modo === "B" 
      ? "FALTA_INMOVILIZACION_ILEGAL - Asesoría honesta exitosa" 
      : "ABUSO - Defensa agresiva exitosa";

    // Crear el caso exitoso con todos los campos necesarios
    const caso: CasoExitoso = {
      id: crypto.randomUUID(),
      tema: tema,
      arquetipo: modo === "B" ? "FALTA_INMOVILIZACION_ILEGAL" : "ABUSO",
      fase1_usuario: hechosClave,
      fase1_respuesta: "",
      fase2_usuario: "",
      fase2_respuesta: "",
      argumento_decisivo: normasAplicadas.join(", "),
      resultado: resultadoClave,
      fase_resolucion: "cierre",
      aprobado: false,
      usos: 0,
      created_at: new Date().toISOString()
    };

    return caso;
  }

/**
 * Obtiene casos exitosos por tema desde Supabase
 * Recibe el cliente autenticado del usuario (nunca crea uno con Service Role)
 */
export async function obtenerCasosExitososPorTema(
  tema: string,
  supabaseClient: ReturnType<typeof createClient>,
  limit: number = 5
): Promise<CasoExitoso[]> {
  // Si no tenemos configuración de Supabase, devolvemos un array vacío
  if (!SUPABASE_URL) {
    console.log('[MEMORIA] Configuración de Supabase no disponible para obtener casos exitosos');
    return [];
  }

  try {
    // Usar el cliente autenticado recibido — aplica RLS correctamente
    const { data, error } = await supabaseClient
      .from('casos_exitosos')
      .select('*')
      .ilike('tema', `%${tema}%`)
      .order('usos', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[MEMORIA] Error al obtener casos exitosos:', error)
      return []
    }

    return data as CasoExitoso[]
  } catch (err) {
    console.error('[MEMORIA] Excepción al obtener casos exitosos:', err)
    return []
  }
}

/**
 * Formatea casos exitosos para inyectar en el prompt
 */
export function formatearCasosParaPrompt(casos: CasoExitoso[]): string {
  if (casos.length === 0) return "";

  let resultado = `
=== CASOS EXITOSOS SIMILARES APRENDIDOS ===
`;
  for (let i = 0; i < casos.length; i++) {
    const c = casos[i];
    const fecha = c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Fecha desconocida';
    resultado += `
Caso ${i + 1}: ${c.tema}
- Tema legal: ${c.tema}
- Arquetipo: ${c.arquetipo}
- Fecha: ${fecha}
- Norma aplicada: ${c.argumento_decisivo || 'No especificada'}
- Resultado: ${c.resultado || 'Éxito'}
- Hechos clave: ${JSON.stringify(c.hechos_clave || {})}
`;
  }
  return resultado;
}
