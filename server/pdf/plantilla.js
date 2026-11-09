// Plantilla del PDF: A4, fondo blanco, márgenes amplios, tipografía sans, tinta casi negra y
// grises. Único acento azul (#0A84FF): línea bajo la cabecera y total. Sin logos ni rellenos.
// Es una función pura: recibe datos YA calculados por el servidor y devuelve la definición de pdfmake.

const TINTA = '#18181B';
const GRIS = '#71717A';
const LINEA = '#D4D4D8';
const ACENTO = '#0A84FF';
const BARRA = '#52525B'; // gris oscuro: las barras de composición no usan el acento
const BARRA_ANCHO = 150;

const ANCHO_UTIL = 595.28 - 2 * 56; // A4 menos márgenes laterales

const formatoMoneda = (moneda) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: moneda, useGrouping: 'always' });

const formatoFecha = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Madrid',
});

/** Quita caracteres de control que no se pueden pintar. */
export function limpiar(texto) {
  return String(texto ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}

/** Nº de presupuesto PM-AAAAMMDD-XXXX generado por el servidor (XXXX: 4 caracteres aleatorios). */
export function generarNumero(fecha = new Date(), aleatorio = Math.random) {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(fecha); // AAAA-MM-DD
  const sufijo = Math.floor(aleatorio() * 36 ** 4)
    .toString(36)
    .toUpperCase()
    .padStart(4, '0');
  return `PM-${partes.replaceAll('-', '')}-${sufijo}`;
}

const etiqueta = (texto) => ({ text: texto.toUpperCase(), style: 'etiqueta' });

/**
 * @param {{ cliente: string, resumen: string, pendientes: string[],
 *           lineas: {nombre: string, descripcion: string, calculo: string, importe: number}[],
 *           composicion: {nombre: string, importe: number, porcentaje: number}[],
 *           total: number, moneda: string }} datos
 * @param {{ numero: string, fecha: Date }} meta
 */
export function construirDocumento(datos, { numero, fecha }) {
  const euros = formatoMoneda(datos.moneda);
  const resumen = limpiar(datos.resumen) || 'Sin resumen del proyecto.';

  const cabeceraTabla = [
    { text: 'Servicio', style: 'cabeceraTabla' },
    { text: 'Descripción y cálculo', style: 'cabeceraTabla' },
    { text: 'Importe', style: 'cabeceraTabla', alignment: 'right' },
  ];

  const filas = datos.lineas.map((l) => [
    { text: limpiar(l.nombre), bold: true },
    {
      stack: [
        { text: limpiar(l.descripcion), color: GRIS },
        { text: `Cálculo: ${limpiar(l.calculo)}`, fontSize: 9, margin: [0, 3, 0, 0] },
      ],
    },
    { text: euros.format(l.importe), alignment: 'right', noWrap: true },
  ]);

  const pendientes = datos.pendientes.map(limpiar).filter(Boolean);

  return {
    info: {
      title: `Presupuesto ${numero}`,
      author: 'Presupuesta mi web',
      subject: `Presupuesto para ${limpiar(datos.cliente)}`,
    },
    pageSize: 'A4',
    pageMargins: [56, 56, 56, 72],
    defaultStyle: { font: 'Roboto', fontSize: 10, lineHeight: 1.25, color: TINTA },
    styles: {
      marca: { fontSize: 16, bold: true },
      documento: { fontSize: 9, bold: true, color: GRIS, characterSpacing: 1.5 },
      meta: { fontSize: 9, color: GRIS },
      etiqueta: { fontSize: 8, bold: true, color: GRIS, characterSpacing: 1, margin: [0, 0, 0, 4] },
      cabeceraTabla: { fontSize: 8, bold: true, color: GRIS, characterSpacing: 0.5 },
      totalEtiqueta: { fontSize: 9, bold: true, color: GRIS, characterSpacing: 1.5 },
      totalImporte: { fontSize: 26, bold: true, color: ACENTO },
    },
    content: [
      // Cabecera
      {
        columns: [
          { text: 'Presupuesta mi web', style: 'marca', width: '*' },
          {
            width: 'auto',
            alignment: 'right',
            stack: [
              { text: 'PRESUPUESTO', style: 'documento' },
              { text: `Nº ${numero}`, style: 'meta', margin: [0, 4, 0, 0] },
              { text: formatoFecha.format(fecha), style: 'meta' },
            ],
          },
        ],
      },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: ANCHO_UTIL, y2: 0, lineWidth: 1, lineColor: ACENTO }],
        margin: [0, 12, 0, 20],
      },

      // Cliente y resumen
      etiqueta('Cliente'),
      { text: limpiar(datos.cliente), fontSize: 12, bold: true, margin: [0, 0, 0, 18] },
      etiqueta('Resumen del proyecto'),
      { text: resumen, margin: [0, 0, 0, 20] },

      // Servicios
      {
        table: {
          headerRows: 1,
          dontBreakRows: true,
          widths: [120, '*', 80],
          body: [cabeceraTabla, ...filas],
        },
        layout: {
          hLineWidth: (i) => (i === 0 ? 0 : 0.5),
          vLineWidth: () => 0,
          hLineColor: () => LINEA,
          paddingLeft: (i) => (i === 0 ? 0 : 8),
          paddingRight: (i, nodo) => (i === nodo.table.widths.length - 1 ? 0 : 8),
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
      },

      // Composición: de dónde sale el total (servicio base, páginas, extras)
      {
        unbreakable: true,
        margin: [0, 16, 0, 0],
        stack: [
          etiqueta('Composición del total'),
          ...datos.composicion.map((c) => ({
            columns: [
              { text: limpiar(c.nombre), width: 120 },
              {
                width: BARRA_ANCHO + 8,
                canvas: [
                  { type: 'rect', x: 0, y: 4, w: BARRA_ANCHO, h: 4, r: 2, color: '#E4E4E7' },
                  ...(c.porcentaje > 0
                    ? [{ type: 'rect', x: 0, y: 4, w: Math.max(3, (BARRA_ANCHO * c.porcentaje) / 100), h: 4, r: 2, color: BARRA }]
                    : []),
                ],
              },
              { text: euros.format(c.importe), alignment: 'right', width: '*' },
              { text: `${c.porcentaje} %`, alignment: 'right', color: GRIS, width: 40 },
            ],
            margin: [0, 3, 0, 3],
          })),
        ],
      },

      // Total, alineado a la derecha
      {
        unbreakable: true,
        alignment: 'right',
        margin: [0, 14, 0, 18],
        stack: [
          { text: 'TOTAL', style: 'totalEtiqueta' },
          { text: euros.format(datos.total), style: 'totalImporte', margin: [0, 2, 0, 0] },
        ],
      },

      // Aclaraciones
      {
        unbreakable: true,
        stack: [
          etiqueta('Aclaraciones y aspectos pendientes de concretar'),
          pendientes.length > 0
            ? { ul: pendientes, markerColor: GRIS, color: TINTA, margin: [0, 2, 0, 0] }
            : { text: 'Sin aspectos pendientes', color: GRIS },
        ],
      },
    ],

    footer: (paginaActual, totalPaginas) => ({
      margin: [56, 0, 56, 0],
      stack: [
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: ANCHO_UTIL, y2: 0, lineWidth: 0.5, lineColor: LINEA }] },
        {
          margin: [0, 8, 0, 0],
          columns: [
            { text: 'Importes calculados por el servidor. Sin impuestos aplicados.', style: 'meta', width: '*' },
            { text: `${paginaActual}/${totalPaginas}`, style: 'meta', width: 'auto', alignment: 'right' },
          ],
        },
      ],
    }),
  };
}
