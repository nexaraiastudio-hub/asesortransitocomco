// validadores.ts - Funciones de validación post-generación
// Filtro anti-alucinación para garantizar precisión legal

import { NormativaTema } from "./base_normativa.ts";

/**
 * Valida que el texto generado solo cite normas permitidas
 * Elimina o marca normas que no estén en la lista del tema específico
 * PERMITE normas generales como Ley 769/2002 y Art. 29 CP
 */
export function validarNormasPostGeneracion(
  texto: string, 
  norma: NormativaTema | null
): string {
  if (!norma) return texto;
  
  // Regex para encontrar citas de normas
  const regexNormas = /(Resolución|Res|Res\.|Ley|NTC|Circular|Sentencia|Artículo|Art|Art\.)\s*(\d+(?:\.\d+)?)\s*(?:de\s*)?(\d{4})?/gi;
  
  let textoValidado = texto;
  const matches = texto.matchAll(regexNormas);
  
  for (const match of matches) {
    const normaEncontrada = match[0];
    const tipo = match[1].toLowerCase();
    const numero = match[2];
    const anio = match[3];
    
    // Construir representaciones para comparar
    const representacionesNorma = [
      normaEncontrada,
      `${tipo} ${numero}`,
      anio ? `${tipo} ${numero} de ${anio}` : null
    ].filter(Boolean);
    
    // Verificar si es una norma permitida
    const esPermitida = norma.normas.some(permitida => {
      const pLower = permitida.toLowerCase();
      return representacionesNorma.some(r => r && pLower.includes(r.toLowerCase()));
    });
    
    // Normas generales SIEMPRE permitidas
    const esNormaGeneral = 
      (tipo.includes("ley") && (numero === "769" || numero === "1801")) ||
      (tipo.includes("art") && (numero === "29" || numero === "20" || numero === "21" || numero === "82" || numero === "125" || numero === "131" || numero === "416")) ||
      (tipo.includes("sentencia") && numero.includes("038")) ||
      (tipo.includes("sentencia") && numero.includes("799")) ||
      (tipo.includes("código") || tipo.includes("codigo")) ||
      normaEncontrada.toLowerCase().includes("constitución") ||
      normaEncontrada.toLowerCase().includes("constitucion");
    
    if (!esPermitida && !esNormaGeneral) {
      // Marcar la norma inválida
      console.log(`[VALIDADOR] Norma no permitida detectada: ${normaEncontrada}`);
      textoValidado = textoValidado.replace(
        normaEncontrada,
        `[norma no aplicable al caso]`
      );
    }
  }
  
  return textoValidado;
}

/**
 * Valida que la descripción de irregularidad no exceda el límite de palabras
 * para que quepa en el formulario físico de comparendo
 */
export function validarLongitudDescripcion(
  descripcion: string, 
  maxPalabras: number = 12
): string {
  const palabras = descripcion.split(/\s+/).filter(p => p.length > 0);
  
  if (palabras.length > maxPalabras) {
    console.log(`[VALIDADOR] Descripción truncada de ${palabras.length} a ${maxPalabras} palabras`);
    return palabras.slice(0, maxPalabras).join(" ");
  }
  
  return descripcion;
}

/**
 * Valida que el guion no contenga instrucciones metanarrativas
 * (como "Dígale al oficial:" dentro del guion)
 */
export function limpiarGuion(guion: string): string {
  // Eliminar prefijos comunes que la IA podría generar
  const prefijosAEliminar = [
    /^"+/,
    /"+$/,
    /^d[ií]gale exactamente esto al oficial:?\s*/i,
    /^d[ií]gale al oficial:?\s*/i,
    /^guion:?\s*/i,
    /^texto:?\s*/i,
    /^respuesta:?\s*/i,
  ];
  
  let guionLimpio = guion.trim();
  
  for (const prefijo of prefijosAEliminar) {
    guionLimpio = guionLimpio.replace(prefijo, "").trim();
  }
  
  // Asegurar que no tenga comillas al inicio y final
  if (guionLimpio.startsWith('"') && guionLimpio.endsWith('"')) {
    guionLimpio = guionLimpio.slice(1, -1).trim();
  }
  
  return guionLimpio;
}

/**
 * Verifica que la respuesta tenga el formato requerido
 * Retorna true si pasa todas las validaciones
 */
export function validarFormatoRespuesta(respuesta: string): {
  valido: boolean;
  errores: string[];
} {
  const errores: string[] = [];
  
  // Verificar que no esté vacía
  if (!respuesta || respuesta.trim().length === 0) {
    errores.push("Respuesta vacía");
  }
  
  // Verificar que no sea demasiado corta
  if (respuesta.length < 50) {
    errores.push("Respuesta demasiado corta");
  }
  
  // Verificar que no sea demasiado larga (posible alucinación)
  if (respuesta.length > 2000) {
    errores.push("Respuesta excesivamente larga");
  }
  
  // Verificar que tenga la pregunta de control
  if (!respuesta.includes("((") || !respuesta.includes("))")) {
    errores.push("Falta pregunta de control ((...))");
  }
  
  return {
    valido: errores.length === 0,
    errores
  };
}

/**
 * Función maestra de validación que aplica todos los filtros
 */
export function validarRespuestaCompleta(
  respuesta: string,
  norma: NormativaTema | null,
  opciones?: {
    validarNormas?: boolean;
    validarLongitudDescripcion?: boolean;
    limpiarGuion?: boolean;
    validarFormato?: boolean;
  }
): {
  texto: string;
  valido: boolean;
  errores: string[];
} {
  const opcionesDefault = {
    validarNormas: true,
    validarLongitudDescripcion: false,
    limpiarGuion: false,
    validarFormato: true,
    ...opciones
  };
  
  let texto = respuesta;
  const errores: string[] = [];
  
  // Validar normas
  if (opcionesDefault.validarNormas && norma) {
    texto = validarNormasPostGeneracion(texto, norma);
  }
  
  // Limpiar guion si aplica
  if (opcionesDefault.limpiarGuion) {
    texto = limpiarGuion(texto);
  }
  
  // Validar formato
  if (opcionesDefault.validarFormato) {
    const validacionFormato = validarFormatoRespuesta(texto);
    if (!validacionFormato.valido) {
      errores.push(...validacionFormato.errores);
    }
  }
  
  return {
    texto,
    valido: errores.length === 0,
    errores
  };
}
