import { TARIFAS, MONEDA } from './tarifas.js';

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
