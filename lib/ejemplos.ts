// Ejemplos ya creados. Todo es ficticio.

/** Ejemplos del asistente: rellenan el formulario para ver cómo reacciona la IA en cada situación. */
export interface EjemploAsistente {
  id: string
  etiqueta: "Clara" | "Ambigua" | "Fuera del catálogo" | "Sencilla" | "Completa"
  cliente: string
  descripcion: string
}

export const EJEMPLOS_ASISTENTE: EjemploAsistente[] = [
  {
    id: "clara",
    etiqueta: "Clara",
    cliente: "Restaurante La Cepa (ficticio)",
    descripcion:
      "Somos un restaurante familiar y queremos una web con nuestra carta, un formulario para reservar mesa y que esté en español e inglés. Con unas 5 páginas.",
  },
  {
    id: "ambigua",
    etiqueta: "Ambigua",
    cliente: "Taller Norte (ficticio)",
    descripcion: "Quiero algo en internet para que me encuentren más clientes.",
  },
  {
    id: "fuera",
    etiqueta: "Fuera del catálogo",
    cliente: "Moda Sur (ficticio)",
    descripcion:
      "Necesito una tienda online con pago con tarjeta, gestión de stock, posicionamiento SEO y una app móvil.",
  },
  {
    id: "sencilla",
    etiqueta: "Sencilla",
    cliente: "Concierto Benéfico (ficticio)",
    descripcion:
      "Organizamos un concierto benéfico el 15 de marzo. Queremos una sola página con la información del evento y un formulario para que la gente se apunte.",
  },
  {
    id: "completa",
    etiqueta: "Completa",
    cliente: "Academia Horizonte (ficticia)",
    descripcion:
      "Somos una academia de idiomas. Queremos una web corporativa de unas 8 páginas (quiénes somos, cursos, profesorado, precios, blog, contacto…), con formulario de contacto y versión en inglés.",
  },
]

/** Ejemplos del panel: selecciones fijas que el servidor presupuesta (sin usar la IA). */
export interface EjemploPanel {
  id: string
  titulo: string
  cliente: string
  resumen: string
  servicios: string[]
  paginas?: number
}

export const EJEMPLOS_PANEL: EjemploPanel[] = [
  {
    id: "evento",
    titulo: "Landing de evento",
    cliente: "Concierto Benéfico (ficticio)",
    resumen: "Una sola página con la información del evento y un formulario de inscripción.",
    servicios: ["landing", "formulario"],
  },
  {
    id: "restaurante",
    titulo: "Restaurante bilingüe",
    cliente: "Restaurante La Cepa (ficticio)",
    resumen: "Web corporativa de 5 páginas con carta, reservas y versión en inglés.",
    servicios: ["corporativa", "paginasAdicionales", "formulario", "segundoIdioma"],
    paginas: 5,
  },
  {
    id: "academia",
    titulo: "Academia con 12 páginas",
    cliente: "Academia Horizonte (ficticia)",
    resumen: "Web corporativa amplia con formulario y versión en inglés.",
    servicios: ["corporativa", "paginasAdicionales", "formulario", "segundoIdioma"],
    paginas: 12,
  },
]
