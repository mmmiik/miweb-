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

/**
 * Calcula las líneas de un presupuesto a partir de una SELECCIÓN de servicios
 * ya validada (ver validarSeleccion). Los importes salen del catálogo, que a su
 * vez sale de tarifas.js. Las líneas se devuelven en el orden del catálogo.
 *
 * @param {{ ids: string[], paginas?: number }} seleccion
 */
export function calcularSeleccion({ ids, paginas }) {
  const lineas = SERVICIOS.filter((s) => ids.includes(s.id)).map((s) => {
    if (s.clase === 'paginas') {
      const extra = paginas - 1;
      return {
        id: s.id,
        nombre: s.nombre,
        descripcion: `${extra} ${extra === 1 ? 'página adicional' : 'páginas adicionales'} (${paginas} en total).`,
        importe: extra * s.precioUnitario,
      };
    }
    return { id: s.id, nombre: s.nombre, descripcion: s.descripcion, importe: s.precio };
  });
  const total = lineas.reduce((suma, l) => suma + l.importe, 0);
  return { lineas, total, moneda: MONEDA };
}
