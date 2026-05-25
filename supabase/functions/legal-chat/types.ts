// types.ts — V19 Sistema Adaptativo Universal con 3 Arquetipos Jurídicos

export type Role = "system" | "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

// V17: Sistema Adaptativo Universal — TemaLegal es string libre, no enum de 15 casos
export type TemaLegal = string;

// V15.2: 4 fases secuenciales
// 1: Triaje | 2: Analisis + Guion de Voz | 3: Contingencia | 4: Impugnacion
export type FaseProcesamiento = 1 | 2 | 3 | 4;

// V15.2: Doble modo de operacion
// A: Defensa Agresiva (oficial sin razon) | B: Asesoria Honesta (oficial con razon)
export type ModoOperacion = "A" | "B" | null;

// V19: 3 Arquetipos Jurídicos de Autoaprendizaje
// ABUSO: Oficial sin prueba técnica reglamentaria o actuando ilegalmente
// FALTA_INMOVILIZACION_ILEGAL: Falta real + comparendo válido, pero inmovilización no procede (Art. 125 Ley 769/2002)
// OFICIAL_CORRECTO: Falta real, prueba técnica válida, procedimiento completamente legal
export type Arquetipo = "ABUSO" | "FALTA_INMOVILIZACION_ILEGAL" | "OFICIAL_CORRECTO";

export interface AnalisisClasificacion {
  tema: TemaLegal;
  fase: FaseProcesamiento;
  modo: ModoOperacion;
  clase: "automovil" | "motocicleta" | "camioneta" | "campero" | "bus" | "camion" | "tractocamion" | "vehiculo_especial" | "otro" | null;
  servicio: "particular" | "publico" | "oficial" | "diplomatico" | null;
  autoridad: "policia_transito" | "agente_civil" | "policia_nacional" | "otro" | null;
  metodo: "visual" | "profundimetro" | "fotometro" | "luxometro" | "alcohosensor" | "radar" | "cinemometro" | "analizador_gases" | "opacimetro" | "camara" | "runt" | "subjetivo" | null;
  tipoInfraccion: string | null;
  codigoInfraccion: string | null;
  insistenciaOficial: boolean;
  quiereImpugnacion: boolean;
  subsanableEnSitio: boolean;
  informacionFaltante: string[];
  preguntasAdaptativas: string[];
}

export interface VeredictoJurista {
  modo: ModoOperacion;
  falloLogico: string;
  reglaAplicable: string;
  argumentoTecnico: string;
  citaNormativa: string;
  patronDefensivo: string;
  esLegal: boolean;
  aplicaInmovilizacion: boolean;
  procedeSubsanacion: boolean;
  articulosFundamentales: string[];
  codigoInfraccion: string | null;
  valorMultaSMLDV: string | null;
  descuentoProntoPago: boolean;
}

export interface EntregableEnsamblador {
  faseActual: number;
  plantillaEsqueleto: string;
  instruccionesDeTono: string;
  hechos_dinamicos: string;
  fundamentos_dinamicos: string;
}

export interface DocumentoLegal {
  titulo: string;
  contenido: string;
}

export interface EvidenciaLegal {
  documentosEncontrados: DocumentoLegal[];
}

// === V18: Tipos del Orquestador Determinista ===

export type FaseOrquestador = 1 | 2 | "2b" | 3 | 4 | "cierre";

export interface ClasificacionConsulta {
  tema: string;
  clase: string | null;
  servicio: string | null;
  autoridad: string | null;
  metodo: string | null;
  ciudad: string | null;
  subsanableEnSitio: boolean;
  resumenHechos: string;
  // V15.2: Modo de operacion A (Defensa) o B (Asesoria Honesta)
  modo: "A" | "B" | null;
  // V19: Arquetipo jurídico del caso — guía el razonamiento del generador de respuestas
  arquetipo?: Arquetipo;
}
