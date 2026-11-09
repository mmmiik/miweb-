// Pide al modelo una propuesta de servicios y la devuelve ya validada y enriquecida
// con datos del catálogo (nombre, parámetros). Nunca incluye importes.
import { obtenerServicio } from '../catalogo.js';
import { construirInstrucciones, construirEntrada } from './instrucciones.js';
import { formatoSalida } from './esquema.js';
import { validarRespuestaModelo } from './validarRespuesta.js';
import { obtenerClienteOpenAI, obtenerModelo } from './cliente.js';
import { ErrorIA } from './errores.js';

export const TEMPERATURA = 0.1;
export const MAX_TOKENS_SALIDA = 600;
export const TIMEOUT_MS = 20_000;

function esTimeout(err) {
  return (
    err?.name === 'AbortError' ||
    err?.name === 'APIUserAbortError' ||
    err?.name === 'APIConnectionTimeoutError' ||
    err?.code === 'ETIMEDOUT'
  );
}

/**
 * @param {string} descripcion - ya validada (no vacía, con límite)
 * @param {{ cliente?: { responses: { create: Function } }, modelo?: string, timeoutMs?: number }} [opciones]
 *        "cliente" permite inyectar un cliente falso en los tests.
 */
export async function proponerServicios(descripcion, { cliente, modelo, timeoutMs = TIMEOUT_MS } = {}) {
  const openai = cliente ?? obtenerClienteOpenAI();
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), timeoutMs);

  let respuesta;
  try {
    respuesta = await openai.responses.create(
      {
        model: modelo ?? obtenerModelo(),
        instructions: construirInstrucciones(),
        input: construirEntrada(descripcion),
        temperature: TEMPERATURA,
        max_output_tokens: MAX_TOKENS_SALIDA,
        store: false,
        text: { format: formatoSalida() },
      },
      { signal: controlador.signal },
    );
  } catch (err) {
    if (esTimeout(err) || controlador.signal.aborted) {
      throw new ErrorIA(504, 'La IA tardó demasiado en responder. Inténtalo de nuevo.');
    }
    // Detalle solo en el log del servidor (nunca claves ni el cuerpo de la petición).
    console.error('Error al llamar a OpenAI:', err?.status ?? '', err?.name ?? '', err?.message ?? '');
    throw new ErrorIA(502, 'No se pudo obtener la propuesta de la IA. Inténtalo de nuevo.');
  } finally {
    clearTimeout(temporizador);
  }

  if (respuesta?.status === 'incomplete') {
    throw new ErrorIA(502, 'La respuesta de la IA quedó incompleta. Inténtalo de nuevo.');
  }
  const rechazo = respuesta?.output?.some?.((o) => o?.content?.some?.((c) => c?.type === 'refusal'));
  if (rechazo) {
    throw new ErrorIA(502, 'La IA no pudo atender esta solicitud. Reformula la descripción.');
  }
  if (typeof respuesta?.output_text !== 'string' || respuesta.output_text === '') {
    throw new ErrorIA(502, 'La IA devolvió una respuesta vacía.');
  }

  const { resumen, servicios, pendientes, avisos } = validarRespuestaModelo(respuesta.output_text);

  return {
    resumen,
    servicios: servicios.map((s) => {
      const def = obtenerServicio(s.id);
      return {
        id: s.id,
        nombre: def.nombre,
        justificacion: s.justificacion,
        // Parámetros que debe completar el usuario (el modelo nunca los inventa).
        parametros: def.parametros.map((p) => ({ ...p })),
      };
    }),
    pendientes,
    avisos,
  };
}
