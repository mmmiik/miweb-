import type {
  Confirmacion,
  Propuesta,
  ServicioCatalogo,
} from "@/lib/api"

export type Paso = 1 | 2 | 3

export const DESCRIPCION_MAX = 1500 // el servidor es quien la hace cumplir; aquí solo guía

export type EstadoPropuesta =
  | { fase: "cargando" }
  | { fase: "error"; mensaje: string }
  | { fase: "lista"; datos: Propuesta }

/** Un servicio de la lista del paso 2: propuesto por la IA o añadido a mano. */
export interface ItemServicio {
  id: string
  /** Solo los propuestos por la IA tienen justificación. */
  justificacion?: string
  propuesto: boolean
}

export type EstadoCalculo =
  | { fase: "cargando" }
  | { fase: "error"; mensaje: string }
  | {
      fase: "lista"
      confirmacion: Confirmacion
      pdfUrl: string
      numero: string
    }

export type CatalogoPorId = Record<string, ServicioCatalogo>
