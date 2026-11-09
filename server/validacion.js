import { TIPOS, PAGINAS_MIN, PAGINAS_MAX } from './tarifas.js';
import { IDS_SERVICIOS, obtenerServicio } from './catalogo.js';

const CAMPOS_OBLIGATORIOS = ['tipo', 'paginas', 'formulario', 'segundoIdioma'];

/**
 * Valida el cuerpo de una solicitud de presupuesto.
 * No modifica el cuerpo ni confía en él: si es válido devuelve un objeto nuevo
 * solo con los cuatro campos permitidos (cualquier propiedad extra se descarta).
 *
 * @param {unknown} cuerpo - req.body tal y como llega
 * @returns {{ ok: true, datos: { tipo: string, paginas: number, formulario: boolean, segundoIdioma: boolean } }
 *         | { ok: false, errores: string[] }}
 */
export function validarSolicitud(cuerpo) {
  // 1. El cuerpo debe ser un objeto JSON (ni null, ni array, ni texto, ni número).
  if (typeof cuerpo !== 'object' || cuerpo === null || Array.isArray(cuerpo)) {
    return { ok: false, errores: ['El cuerpo de la solicitud debe ser un objeto JSON.'] };
  }

  const errores = [];

  // 2. Los cuatro campos obligatorios deben existir como propiedades propias.
  for (const campo of CAMPOS_OBLIGATORIOS) {
    if (!Object.hasOwn(cuerpo, campo)) {
      errores.push(`Falta el campo obligatorio "${campo}".`);
    }
  }
  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const { tipo, paginas, formulario, segundoIdioma } = cuerpo;

  // 3. tipo: solo "landing" o "corporativa".
  if (typeof tipo !== 'string' || !TIPOS.includes(tipo)) {
    errores.push(`"tipo" debe ser "landing" o "corporativa" (recibido: ${JSON.stringify(tipo)}).`);
  }

  // 4. paginas: número entero entre 1 y 20. La cadena "4" o el decimal 2.5 no valen.
  if (typeof paginas !== 'number' || !Number.isInteger(paginas)) {
    errores.push(`"paginas" debe ser un número entero (recibido: ${JSON.stringify(paginas)}).`);
  } else if (paginas < PAGINAS_MIN || paginas > PAGINAS_MAX) {
    errores.push(`"paginas" debe estar entre ${PAGINAS_MIN} y ${PAGINAS_MAX} (recibido: ${paginas}).`);
  }

  // 5. formulario y segundoIdioma: booleanos de verdad, no la cadena "false".
  if (typeof formulario !== 'boolean') {
    errores.push(`"formulario" debe ser true o false (recibido: ${JSON.stringify(formulario)}).`);
  }
  if (typeof segundoIdioma !== 'boolean') {
    errores.push(`"segundoIdioma" debe ser true o false (recibido: ${JSON.stringify(segundoIdioma)}).`);
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  return { ok: true, datos: { tipo, paginas, formulario, segundoIdioma } };
}

/**
 * Valida la selección de servicios de POST /api/presupuesto/confirmar.
 * Solo se leen los ids (y "paginas" si hace falta): cualquier otra propiedad,
 * como un "importe" enviado por el cliente, se descarta sin mirarla.
 *
 * @param {unknown} cuerpo
 * @returns {{ ok: true, datos: { ids: string[], paginas?: number } } | { ok: false, errores: string[] }}
 */
export function validarSeleccion(cuerpo) {
  if (typeof cuerpo !== 'object' || cuerpo === null || Array.isArray(cuerpo)) {
    return { ok: false, errores: ['El cuerpo de la solicitud debe ser un objeto JSON.'] };
  }
  const { servicios, paginas } = cuerpo;
  if (!Array.isArray(servicios) || servicios.length === 0) {
    return { ok: false, errores: ['"servicios" debe ser una lista con al menos un servicio.'] };
  }
  if (servicios.length > IDS_SERVICIOS.length) {
    return {
      ok: false,
      errores: [`"servicios" no puede tener más de ${IDS_SERVICIOS.length} elementos (hay servicios repetidos).`],
    };
  }

  const errores = [];
  const ids = [];
  for (const [i, item] of servicios.entries()) {
    const id = typeof item === 'object' && item !== null ? item.id : undefined;
    if (typeof id !== 'string' || id === '') {
      errores.push(`El servicio en la posición ${i + 1} no tiene un "id" válido.`);
    } else if (!obtenerServicio(id)) {
      errores.push(`El servicio "${id}" no existe en el catálogo.`);
    } else if (ids.includes(id)) {
      errores.push(`El servicio "${id}" está repetido.`);
    } else {
      ids.push(id);
    }
  }
  if (errores.length > 0) return { ok: false, errores };

  const bases = ids.filter((id) => obtenerServicio(id).clase === 'base');
  if (bases.length === 0) {
    errores.push('Falta un servicio base: elige "landing" o "corporativa".');
  } else if (bases.length > 1) {
    errores.push(`Solo puede haber un servicio base, y se han enviado ${bases.length}: ${bases.join(', ')}.`);
  }

  // El parámetro "paginas" solo se exige (y se valida) si se piden páginas adicionales.
  let paginasValidas;
  if (ids.includes('paginasAdicionales')) {
    if (paginas === undefined || paginas === null) {
      errores.push('Falta el parámetro "paginas" (número total de páginas) para las páginas adicionales.');
    } else if (typeof paginas !== 'number' || !Number.isInteger(paginas)) {
      errores.push(`"paginas" debe ser un número entero (recibido: ${JSON.stringify(paginas)}).`);
    } else if (paginas < PAGINAS_MIN || paginas > PAGINAS_MAX) {
      errores.push(`"paginas" debe estar entre ${PAGINAS_MIN} y ${PAGINAS_MAX} (recibido: ${paginas}).`);
    } else {
      paginasValidas = paginas;
    }
  }

  if (errores.length > 0) return { ok: false, errores };
  return { ok: true, datos: { ids, paginas: paginasValidas } };
}
