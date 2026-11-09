// Segunda validación, con código propio: del modelo no se acepta nada sin comprobar,
// aunque el esquema estricto ya lo garantice.
import { obtenerServicio } from '../catalogo.js';
import { ErrorIA } from './errores.js';

const MAX_RESUMEN = 600;
const MAX_JUSTIFICACION = 300;
const MAX_PENDIENTE = 300;
const MAX_PENDIENTES = 10;

// Importes y plazos que el modelo no tiene permitido dar: se eliminan esas frases.
const UNIDAD_TIEMPO = '(?:horas?|d[ií]as?|semanas?|meses|mes)';
const CANTIDAD = /\d[\d.,]*\s*(?:€|eur\b|euros?\b|\$|usd\b|d[oó]lares)|[€$]\s*\d/i;
const PLAZO = new RegExp(
  `\\d+\\s*${UNIDAD_TIEMPO}\\b|\\b(?:un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\\s+${UNIDAD_TIEMPO}\\b|plazo de entrega|entrega(?:remos)? en`,
  'i',
);

function sinCompromisos(texto) {
  const frases = texto.split(/(?<=[.!?])\s+/).filter(Boolean);
  const buenas = frases.filter((f) => !CANTIDAD.test(f) && !PLAZO.test(f));
  return { texto: buenas.join(' ').trim(), recortado: buenas.length !== frases.length };
}

function limpiarTexto(valor, max) {
  if (typeof valor !== 'string') return null;
  const t = valor.replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

/**
 * @param {string} texto - salida de texto del modelo (JSON)
 * @returns {{ resumen: string, servicios: {id: string, justificacion: string}[], pendientes: string[], avisos: string[] }}
 * @throws {ErrorIA} 502 si la respuesta no es utilizable
 */
export function validarRespuestaModelo(texto) {
  let datos;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new ErrorIA(502, 'La IA devolvió una respuesta que no es JSON válido.');
  }
  if (typeof datos !== 'object' || datos === null || Array.isArray(datos) || !Array.isArray(datos.servicios)) {
    throw new ErrorIA(502, 'La IA devolvió una respuesta con un formato inesperado.');
  }

  const avisos = [];

  // Resumen
  const r = sinCompromisos(limpiarTexto(datos.resumen, MAX_RESUMEN) ?? '');
  if (r.recortado) avisos.push('Se eliminó del resumen texto con precios o plazos, que solo calcula el servidor.');
  const resumen = r.texto;

  // Servicios: solo ids del catálogo, sin repetidos y con un único servicio base.
  const servicios = [];
  const vistos = new Set();
  let baseElegida = null;
  for (const item of datos.servicios) {
    const id = typeof item === 'object' && item !== null ? item.id : undefined;
    const servicio = obtenerServicio(id);
    if (!servicio) {
      avisos.push(`La IA propuso un servicio que no existe en el catálogo ("${String(id).slice(0, 40)}") y se ha descartado.`);
      continue;
    }
    if (vistos.has(id)) continue;
    if (servicio.clase === 'base') {
      if (baseElegida) {
        avisos.push(`La IA propuso dos servicios base incompatibles; se mantiene "${baseElegida}" y se descarta "${id}". Revísalo.`);
        continue;
      }
      baseElegida = id;
    }
    vistos.add(id);

    const j = sinCompromisos(limpiarTexto(item.justificacion, MAX_JUSTIFICACION) ?? '');
    if (j.recortado) avisos.push(`Se eliminó de la justificación de "${servicio.nombre}" texto con precios o plazos.`);
    servicios.push({ id, justificacion: j.texto || 'Servicio del catálogo que encaja con lo que describes.' });
  }

  // Pendientes
  const pendientes = [];
  if (Array.isArray(datos.pendientes)) {
    for (const p of datos.pendientes) {
      const limpio = limpiarTexto(p, MAX_PENDIENTE);
      if (!limpio) continue;
      const s = sinCompromisos(limpio);
      if (s.texto) pendientes.push(s.texto);
      if (pendientes.length >= MAX_PENDIENTES) break;
    }
  }

  return { resumen, servicios, pendientes, avisos };
}
