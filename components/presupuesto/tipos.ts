import type {
  Confirmacion,
  Propuesta,
  ServicioCatalogo,
} from "@/lib/api"

/** 1 Idea · 2 Sugerencias · 3 Tu selección · 4 Presupuesto */
export type Paso = 1 | 2 | 3 | 4

export const DESCRIPCION_MAX = 1500 // el servidor es quien la hace cumplir; aquí solo guía

export type EstadoPropuesta =
  | { fase: "cargando" }
  | { fase: "error"; mensaje: string }
  | { fase: "lista"; datos: Propuesta }

export type EstadoCalculo =
  | { fase: "cargando" }
  | { fase: "error"; mensaje: string }
  | {
      fase: "lista"
      confirmacion: Confirmacion
      pdfBlob: Blob
      pdfUrl: string
      numero: string
    }

export type CatalogoPorId = Record<string, ServicioCatalogo>

/** Un caso terminado en el asistente: es lo que el panel muestra como «Mi caso». */
export interface CasoPanel {
  cliente: string
  resumen: string
  pendientes: string[]
  confirmacion: Confirmacion
  pdfBlob: Blob
  numero: string
}
