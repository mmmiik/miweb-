import type { ResultadoPresupuesto, Tipo } from "@/lib/api"

export type Vista = "resumen" | "tarifas" | "pruebas"

export type EstadoConexion = "comprobando" | "conectada" | "desconectada"

export interface Solicitud {
  tipo: Tipo
  // null si el campo está vacío: se envía igualmente y es el servidor quien lo rechaza.
  paginas: number | null
  formulario: boolean
  segundoIdioma: boolean
}

/** Una solicitud enviada a la API y lo que respondió el servidor. */
export interface Entrada {
  id: number
  hora: string
  solicitud: Solicitud
  resultado: ResultadoPresupuesto
}
