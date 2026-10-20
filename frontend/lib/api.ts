// Acceso a la API Express. Las rutas son relativas (/api/...) y Next las
// reenvía a http://localhost:3000 mediante los rewrites de next.config.ts.

export type Tipo = "landing" | "corporativa"

export interface Tarifa {
  concepto: string
  precio: number
}

export interface RespuestaTarifas {
  moneda: string
  tarifas: Record<
    | "landing"
    | "corporativa"
    | "paginaAdicional"
    | "formulario"
    | "segundoIdioma",
    Tarifa
  >
}

export interface Presupuesto {
  base: number
  paginasAdicionales: number
  formulario: number
  segundoIdioma: number
  total: number
  moneda: string
}

export interface ErrorApi {
  error: string
  detalles?: string[]
}

export type ResultadoPresupuesto =
  | { ok: true; status: number; datos: Presupuesto }
  | { ok: false; status: number; datos: ErrorApi }

export async function obtenerEstado(): Promise<boolean> {
  try {
    const res = await fetch("/api/estado", { cache: "no-store" })
    if (!res.ok) return false
    const datos = await res.json()
    return datos.status === "ok"
  } catch {
    return false
  }
}

export async function obtenerTarifas(): Promise<RespuestaTarifas> {
  const res = await fetch("/api/tarifas", { cache: "no-store" })
  if (!res.ok) throw new Error(`Error ${res.status} al pedir las tarifas`)
  return res.json()
}

/**
 * Envía la solicitud tal cual (sin validar ni calcular nada en el cliente):
 * quien decide si es correcta y cuánto cuesta es siempre el servidor.
 */
export async function pedirPresupuesto(
  solicitud: unknown
): Promise<ResultadoPresupuesto> {
  const res = await fetch("/api/presupuesto", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(solicitud),
  })

  let datos: unknown
  try {
    datos = await res.json()
  } catch {
    // Si la API no está arrancada, el proxy de Next devuelve un error que no es JSON.
    datos = {
      error: `La API respondió ${res.status} sin un cuerpo JSON. ¿Está arrancada en el puerto 3000?`,
    }
  }

  return res.ok
    ? { ok: true, status: res.status, datos: datos as Presupuesto }
    : { ok: false, status: res.status, datos: datos as ErrorApi }
}

export function formatearEuros(cantidad: number, moneda = "EUR"): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
    // En es-ES, sin esto 1250 se mostraría como "1250 €" en vez de "1.250 €".
    useGrouping: "always",
  } as Intl.NumberFormatOptions).format(cantidad)
}
