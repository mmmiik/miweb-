// Acceso a la API Express. Las rutas son relativas (/api/...): en desarrollo Next las
// reenvía a :3000 (rewrites de next.config.ts) y en producción las sirve la función de
// Vercel en el mismo origen. El navegador NUNCA calcula importes: solo muestra lo que
// devuelve el servidor.

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

export type Resultado<T> =
  | { ok: true; status: number; datos: T }
  | { ok: false; status: number; datos: ErrorApi }

export type ResultadoPresupuesto = Resultado<Presupuesto>

/* ---------- Catálogo, propuesta y confirmación ---------- */

export type ClaseServicio = "base" | "paginas" | "extra"

export interface ParametroServicio {
  nombre: string
  tipo: "entero"
  min: number
  max: number
  descripcion: string
}

export interface ServicioCatalogo {
  id: string
  clase: ClaseServicio
  nombre: string
  descripcion: string
  precio?: number
  precioUnitario?: number
  parametros: ParametroServicio[]
}

export interface Catalogo {
  moneda: string
  servicios: ServicioCatalogo[]
}

export interface ServicioPropuesto {
  id: string
  nombre: string
  justificacion: string
  parametros: ParametroServicio[]
}

export interface Propuesta {
  cliente: string
  resumen: string
  servicios: ServicioPropuesto[]
  pendientes: string[]
  avisos: string[]
}

export interface LineaPresupuesto {
  id: string
  clase: ClaseServicio
  nombre: string
  descripcion: string
  /** De dónde sale el importe: cantidad × precio unitario, calculado por el servidor. */
  cantidad: number
  precioUnitario: number
  calculo: string
  importe: number
}

/** Cómo se reparte el total entre servicio base, páginas adicionales y extras. */
export interface ParteComposicion {
  clase: ClaseServicio
  nombre: string
  importe: number
  porcentaje: number
}

export interface Confirmacion {
  lineas: LineaPresupuesto[]
  composicion: ParteComposicion[]
  total: number
  moneda: string
}

export interface SeleccionPdf {
  cliente: string
  resumen: string
  servicios: { id: string }[]
  paginas?: number
  pendientes: string[]
}

const MENSAJE_SIN_API =
  "No se pudo contactar con la API. Comprueba tu conexión (en local, que `npm run dev` está en marcha)."

async function leerError(res: Response): Promise<ErrorApi> {
  try {
    const datos = await res.json()
    if (datos && typeof datos.error === "string") return datos as ErrorApi
  } catch {
    /* el cuerpo no era JSON */
  }
  return { error: `La API respondió ${res.status} sin un mensaje legible.` }
}

async function pedirJson<T>(
  ruta: string,
  cuerpo?: unknown,
  signal?: AbortSignal
): Promise<Resultado<T>> {
  let res: Response
  try {
    res = await fetch(ruta, {
      method: cuerpo === undefined ? "GET" : "POST",
      headers: cuerpo === undefined ? undefined : { "Content-Type": "application/json" },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      cache: "no-store",
      signal,
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e
    return { ok: false, status: 0, datos: { error: MENSAJE_SIN_API } }
  }
  if (!res.ok) return { ok: false, status: res.status, datos: await leerError(res) }
  try {
    return { ok: true, status: res.status, datos: (await res.json()) as T }
  } catch {
    return {
      ok: false,
      status: res.status,
      datos: { error: "La API devolvió una respuesta que no se puede leer." },
    }
  }
}

export const obtenerCatalogo = () => pedirJson<Catalogo>("/api/catalogo")

export const pedirPropuesta = (
  solicitud: { cliente: string; descripcion: string },
  signal?: AbortSignal
) => pedirJson<Propuesta>("/api/propuesta", solicitud, signal)

export const confirmarServicios = (
  seleccion: { servicios: { id: string }[]; paginas?: number },
  signal?: AbortSignal
) => pedirJson<Confirmacion>("/api/presupuesto/confirmar", seleccion, signal)

/** Pide el PDF al servidor. Devuelve el Blob tal cual: es el mismo que se descarga. */
export async function pedirPdf(
  seleccion: SeleccionPdf,
  signal?: AbortSignal
): Promise<
  | { ok: true; blob: Blob; numero: string }
  | { ok: false; status: number; datos: ErrorApi }
> {
  let res: Response
  try {
    res = await fetch("/api/presupuesto/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(seleccion),
      cache: "no-store",
      signal,
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e
    return { ok: false, status: 0, datos: { error: MENSAJE_SIN_API } }
  }
  if (!res.ok) return { ok: false, status: res.status, datos: await leerError(res) }
  const blob = await res.blob()
  return {
    ok: true,
    blob,
    numero: res.headers.get("X-Presupuesto-Numero") ?? "presupuesto",
  }
}

/* ---------- Estado, tarifas y presupuesto directo (vista Pruebas) ---------- */

/** Consulta GET /api/estado y mide cuánto tarda en responder. */
export async function obtenerEstado(): Promise<{ ok: boolean; ms: number }> {
  const inicio = performance.now()
  try {
    const res = await fetch("/api/estado", { cache: "no-store" })
    const ms = Math.round(performance.now() - inicio)
    if (!res.ok) return { ok: false, ms }
    const datos = await res.json()
    return { ok: datos.status === "ok", ms }
  } catch {
    return { ok: false, ms: Math.round(performance.now() - inicio) }
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
  return res.ok
    ? { ok: true, status: res.status, datos: (await res.json()) as Presupuesto }
    : { ok: false, status: res.status, datos: await leerError(res) }
}

export function formatearEuros(
  cantidad: number,
  moneda = "EUR",
  decimales = false
): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: moneda,
    minimumFractionDigits: decimales ? 2 : 0,
    maximumFractionDigits: decimales ? 2 : 0,
    // En es-ES, sin esto 1250 se mostraría como "1250 €" en vez de "1.250 €".
    useGrouping: "always",
  } as Intl.NumberFormatOptions).format(cantidad)
}
