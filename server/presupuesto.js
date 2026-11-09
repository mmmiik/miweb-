import { TARIFAS, MONEDA } from './tarifas.js';
import { SERVICIOS } from './catalogo.js';

/**
 * Calcula un presupuesto a partir de datos YA validados.
 * Es una función pura e independiente de Express: no conoce req ni res y
 * todos los precios salen de TARIFAS, nunca del cliente.
 *
 * Total = precio base + páginas adicionales + extras seleccionados
 *
 * @param {{ tipo: 'landing' | 'corporativa', paginas: number, formulario: boolean, segundoIdioma: boolean }} datos
 */
export function calcularPresupuesto({ tipo, paginas, formulario, segundoIdioma }) {
  const base = TARIFAS[tipo].precio;
  const paginasAdicionales = (paginas - 1) * TARIFAS.paginaAdicional.precio;
  const costeFormulario = formulario ? TARIFAS.formulario.precio : 0;
  const costeSegundoIdioma = segundoIdioma ? TARIFAS.segundoIdioma.precio : 0;

  return {
    base,
    paginasAdicionales,
    formulario: costeFormulario,
    segundoIdioma: costeSegundoIdioma,
    total: base + paginasAdicionales + costeFormulario + costeSegundoIdioma,
    moneda: MONEDA,
  };
}

const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: MONEDA, useGrouping: 'always' });
const eur = (n) => euros.format(n);

const NOMBRE_CLASE = Object.freeze({ base: 'Servicio base', paginas: 'Páginas adicionales', extra: 'Extras' });

/** Reparte 100 entre los importes con el método del mayor resto: los porcentajes suman siempre 100. */
function porcentajes(importes) {
  const total = importes.reduce((a, b) => a + b, 0);
  if (total === 0) return importes.map(() => 0);
  const brutos = importes.map((i) => (i / total) * 100);
  const bases = brutos.map(Math.floor);
  let resto = 100 - bases.reduce((a, b) => a + b, 0);
  const orden = brutos.map((b, i) => [b - Math.floor(b), i]).sort((a, b) => b[0] - a[0]);
  for (const [, i] of orden) {
    if (resto-- <= 0) break;
    bases[i] += 1;
  }
  return bases;
}

/**
 * Calcula las líneas de un presupuesto a partir de una SELECCIÓN de servicios
 * ya validada (ver validarSeleccion). Los importes salen del catálogo, que a su
 * vez sale de tarifas.js. Las líneas se devuelven en el orden del catálogo.
 *
 * Cada línea explica de dónde sale su importe (`clase`, `cantidad`, `precioUnitario`,
 * `calculo`) y `composicion` reparte el total entre servicio base, páginas y extras.
 *
 * @param {{ ids: string[], paginas?: number }} seleccion
 */
export function calcularSeleccion({ ids, paginas }) {
  const lineas = SERVICIOS.filter((s) => ids.includes(s.id)).map((s) => {
    if (s.clase === 'paginas') {
      const extra = paginas - 1;
      return {
        id: s.id,
        clase: s.clase,
        nombre: s.nombre,
        descripcion: `${extra} ${extra === 1 ? 'página adicional' : 'páginas adicionales'} (${paginas} en total).`,
        cantidad: extra,
        precioUnitario: s.precioUnitario,
        calculo: `${extra} × ${eur(s.precioUnitario)} (la primera página ya está incluida en el servicio base)`,
        importe: extra * s.precioUnitario,
      };
    }
    return {
      id: s.id,
      clase: s.clase,
      nombre: s.nombre,
      descripcion: s.descripcion,
      cantidad: 1,
      precioUnitario: s.precio,
      calculo: `${s.clase === 'base' ? 'Tarifa fija' : 'Precio fijo'} de ${eur(s.precio)}`,
      importe: s.precio,
    };
  });
  const total = lineas.reduce((suma, l) => suma + l.importe, 0);

  const clases = ['base', 'paginas', 'extra'].filter((c) => lineas.some((l) => l.clase === c));
  const importes = clases.map((c) => lineas.filter((l) => l.clase === c).reduce((a, l) => a + l.importe, 0));
  const pct = porcentajes(importes);
  const composicion = clases.map((c, i) => ({
    clase: c,
    nombre: NOMBRE_CLASE[c],
    importe: importes[i],
    porcentaje: pct[i],
  }));

  return { lineas, composicion, total, moneda: MONEDA };
}
