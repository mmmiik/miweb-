// Catálogo de servicios que ofrece "Presupuesta mi web". Se DERIVA de tarifas.js
// (única fuente de precios): aquí no hay ningún importe escrito a mano.
//
// Tres clases de servicio:
//  · base    → landing / corporativa. Mutuamente excluyentes; incluyen la 1.ª página.
//  · paginas → páginas adicionales. Necesita el parámetro "paginas" (total, 1–20).
//  · extra   → formulario, segundoIdioma. Precio fijo.
import { TARIFAS, MONEDA, PAGINAS_MIN, PAGINAS_MAX } from './tarifas.js';

const PARAMETRO_PAGINAS = Object.freeze({
  nombre: 'paginas',
  tipo: 'entero',
  min: PAGINAS_MIN,
  max: PAGINAS_MAX,
  descripcion: `Número total de páginas del sitio, entre ${PAGINAS_MIN} y ${PAGINAS_MAX} (la primera ya está incluida en el servicio base).`,
});

export const SERVICIOS = Object.freeze([
  Object.freeze({
    id: 'landing',
    clase: 'base',
    nombre: 'Landing page',
    descripcion:
      'Página única orientada a la conversión: presentación, llamada a la acción y diseño adaptable a móvil. Incluye la primera página.',
    precio: TARIFAS.landing.precio,
    parametros: Object.freeze([]),
  }),
  Object.freeze({
    id: 'corporativa',
    clase: 'base',
    nombre: 'Web corporativa',
    descripcion:
      'Sitio web de empresa con identidad propia y estructura de varias secciones, adaptable a móvil. Incluye la primera página.',
    precio: TARIFAS.corporativa.precio,
    parametros: Object.freeze([]),
  }),
  Object.freeze({
    id: 'paginasAdicionales',
    clase: 'paginas',
    nombre: 'Páginas adicionales',
    descripcion:
      'Cada página a partir de la primera (carta, galería, contacto, equipo…). Se cobra por página adicional.',
    precioUnitario: TARIFAS.paginaAdicional.precio,
    parametros: Object.freeze([PARAMETRO_PAGINAS]),
  }),
  Object.freeze({
    id: 'formulario',
    clase: 'extra',
    nombre: 'Formulario de contacto',
    descripcion: 'Formulario para que los visitantes te escriban, con validación de los campos.',
    precio: TARIFAS.formulario.precio,
    parametros: Object.freeze([]),
  }),
  Object.freeze({
    id: 'segundoIdioma',
    clase: 'extra',
    nombre: 'Segundo idioma',
    descripcion: 'Traducción e integración de un segundo idioma en todas las páginas del sitio.',
    precio: TARIFAS.segundoIdioma.precio,
    parametros: Object.freeze([]),
  }),
]);

const POR_ID = new Map(SERVICIOS.map((s) => [s.id, s]));

export const IDS_SERVICIOS = Object.freeze(SERVICIOS.map((s) => s.id));

/** Devuelve el servicio del catálogo o undefined. (Con Map, "__proto__" o "constructor" no existen.) */
export function obtenerServicio(id) {
  return typeof id === 'string' ? POR_ID.get(id) : undefined;
}

/** Vista pública del catálogo para GET /api/catalogo. */
export function catalogoPublico() {
  return {
    moneda: MONEDA,
    servicios: SERVICIOS.map((s) => ({
      id: s.id,
      clase: s.clase,
      nombre: s.nombre,
      descripcion: s.descripcion,
      ...(s.precio !== undefined && { precio: s.precio }),
      ...(s.precioUnitario !== undefined && { precioUnitario: s.precioUnitario }),
      parametros: s.parametros.map((p) => ({ ...p })),
    })),
  };
}
