import { TIPOS, PAGINAS_MIN, PAGINAS_MAX } from './tarifas.js';

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
