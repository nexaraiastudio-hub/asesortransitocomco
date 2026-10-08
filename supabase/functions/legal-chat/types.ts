export type Role = "system" | "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface AnalisisClasificacion {
  tema: "licencia" | "polarizados" | "llantas" | "casco" | "semaforo" | "luces" | "otro" | "fuera_de_dominio";
  fase: 1 | 2 | 3 | 4 | 5; // 1: DiagnÃ³stico, 2: Defensa, 3: Escalado, 4: Documental, 5: Final
  clase: "automovil" | "motocicleta" | "camioneta" | "campero" | "bus" | "camion" | "tractocamion" | "otro" | null;
  servicio: "particular" | "publico" | "oficial" | "diplomatico" | null;
  autoridad: "transito" | "policia" | "otro" | null;
  metodo: "visual" | "profundimetro" | "fotometro" | null;
  tipoInfraccion: string | null;
  insistenciaOficial: boolean;
  quiereMinuta: boolean;
  objetivoAlcanzado: boolean; // Indica si se evitÃ³ la inmovilizaciÃ³n o se logrÃ³ la subsanaciÃ³n
  nodoActual: string | null; // ID del nodo en el grafo legal (V18)
  memoriaVariables: Record<string, any>; // Hash Table para persistencia de datos
  informacionFaltante: string[];
}

export interface VeredictoJurista {
  falloLogico: string;
  reglaAplicable: string;
  argumentoTecnico: string;
  citaNormativa: string;
  esLegal: boolean;
  aplicaInmovilizacion: boolean;
  procedeSubsanacion: boolean;
  articulosFundamentales: string[];
}

export interface EntregableEnsamblador {
  faseActual: number;
  plantillaEsqueleto: string;
  instruccionesDeTono: string;
}

export interface DocumentoLegal {
  titulo: string;
  contenido: string;
}

export interface EvidenciaLegal {
  documentosEncontrados: DocumentoLegal[];
}

