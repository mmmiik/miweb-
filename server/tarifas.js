// Tarifas oficiales del servidor. Son la única fuente de precios: el cliente
// nunca puede enviar ni modificar un precio. Object.freeze impide cambiarlas
// en tiempo de ejecución.
export const TARIFAS = Object.freeze({
  landing: Object.freeze({ concepto: 'Landing, incluida la primera página', precio: 300 }),
  corporativa: Object.freeze({ concepto: 'Web corporativa, incluida la primera página', precio: 600 }),
  paginaAdicional: Object.freeze({ concepto: 'Cada página adicional a la primera', precio: 50 }),
  formulario: Object.freeze({ concepto: 'Formulario de contacto', precio: 80 }),
  segundoIdioma: Object.freeze({ concepto: 'Segundo idioma', precio: 150 }),
});

// Lista explícita de tipos válidos (no se usa "tipo in TARIFAS", porque así
// colarían valores como "paginaAdicional" o "formulario").
export const TIPOS = Object.freeze(['landing', 'corporativa']);

export const PAGINAS_MIN = 1;
export const PAGINAS_MAX = 20;
export const MONEDA = 'EUR';
