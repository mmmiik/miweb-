// Genera el PDF en el servidor con pdfmake. Recibe una selección YA validada y recalcula
// todos los importes con calcularSeleccion: nada de lo que envíe el cliente se usa como cifra.
import pdfmake from 'pdfmake';
import { calcularSeleccion } from '../presupuesto.js';
import { fuentesRoboto } from './fuentes.js';
import { construirDocumento, generarNumero } from './plantilla.js';

let fuentesCargadas = false;

/**
 * @param {{ cliente: string, resumen: string, ids: string[], paginas?: number }} datos
 * @param {{ fecha?: Date, numero?: string }} [opciones]  (inyectables para los tests)
 * @returns {Promise<{ buffer: Buffer, numero: string, total: number }>}
 */
export async function generarPdf(datos, { fecha = new Date(), numero = generarNumero(fecha) } = {}) {
  if (!fuentesCargadas) {
    pdfmake.addFonts(fuentesRoboto());
    // El PDF solo lleva texto: se prohíbe que pdfmake descargue URLs o lea archivos locales.
    pdfmake.setUrlAccessPolicy(() => false);
    pdfmake.setLocalAccessPolicy(() => false);
    fuentesCargadas = true;
  }
  const { lineas, composicion, total, moneda } = calcularSeleccion({ ids: datos.ids, paginas: datos.paginas });
  const definicion = construirDocumento(
    { cliente: datos.cliente, resumen: datos.resumen, lineas, composicion, total, moneda },
    { numero, fecha },
  );
  const buffer = Buffer.from(await pdfmake.createPdf(definicion).getBuffer());
  return { buffer, numero, total };
}
