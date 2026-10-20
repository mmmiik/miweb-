import { formatearEuros, pedirPresupuesto } from "@/lib/api"

// Los nueve casos obligatorios del enunciado. Se envían tal cual, incluidos los
// inválidos, para comprobar que es el servidor quien los rechaza. En los casos
// inválidos solo cambia un campo y el resto se mantiene correcto.
const VALIDA = {
  tipo: "landing",
  paginas: 1,
  formulario: false,
  segundoIdioma: false,
}

export interface Caso {
  caso: number
  descripcion: string
  solicitud: object
  status: number
  total?: number
}

export interface Obtenido {
  status: number
  texto: string
  correcto: boolean
}

export const CASOS: Caso[] = [
  {
    caso: 1,
    descripcion: "Landing, 1 página, sin extras",
    solicitud: VALIDA,
    status: 200,
    total: 300,
  },
  {
    caso: 2,
    descripcion: "Corporativa, 4 páginas, formulario y sin segundo idioma",
    solicitud: {
      tipo: "corporativa",
      paginas: 4,
      formulario: true,
      segundoIdioma: false,
    },
    status: 200,
    total: 830,
  },
  {
    caso: 3,
    descripcion: "Landing, 2 páginas, ambos extras",
    solicitud: {
      tipo: "landing",
      paginas: 2,
      formulario: true,
      segundoIdioma: true,
    },
    status: 200,
    total: 580,
  },
  {
    caso: 4,
    descripcion: "Landing, 20 páginas, sin extras",
    solicitud: { ...VALIDA, paginas: 20 },
    status: 200,
    total: 1250,
  },
  {
    caso: 5,
    descripcion: "paginas: 0",
    solicitud: { ...VALIDA, paginas: 0 },
    status: 400,
  },
  {
    caso: 6,
    descripcion: "paginas: 21",
    solicitud: { ...VALIDA, paginas: 21 },
    status: 400,
  },
  {
    caso: 7,
    descripcion: "paginas: 2.5",
    solicitud: { ...VALIDA, paginas: 2.5 },
    status: 400,
  },
  {
    caso: 8,
    descripcion: 'tipo: "tienda"',
    solicitud: { ...VALIDA, tipo: "tienda" },
    status: 400,
  },
  {
    caso: 9,
    descripcion: 'formulario: "false"',
    solicitud: { ...VALIDA, formulario: "false" },
    status: 400,
  },
]

/** Envía un caso a la API y compara el resultado con lo esperado. */
export async function ejecutarCaso(c: Caso): Promise<Obtenido> {
  try {
    const r = await pedirPresupuesto(c.solicitud)
    const texto = r.ok
      ? `Total: ${formatearEuros(r.datos.total, r.datos.moneda)}`
      : (r.datos.detalles?.join(" ") ?? r.datos.error)
    const correcto =
      r.status === c.status && (!r.ok || r.datos.total === c.total)
    return { status: r.status, texto, correcto }
  } catch {
    return { status: 0, texto: "Sin conexión con la API", correcto: false }
  }
}
