// Cliente del SDK oficial de OpenAI. Solo se usa desde el servidor: la clave
// vive únicamente en la variable de entorno OPENAI_API_KEY.
import OpenAI from 'openai';
import { ErrorIA } from './errores.js';

export const MODELO_POR_DEFECTO = 'gpt-4.1-mini';

export function obtenerModelo() {
  return process.env.OPENAI_MODEL || MODELO_POR_DEFECTO;
}

let cache;

/** Crea (una vez) el cliente real. Sin clave → ErrorIA; nunca se inventa una respuesta. */
export function obtenerClienteOpenAI() {
  if (cache) return cache;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new ErrorIA(502, 'El servicio de IA no está configurado en el servidor.');
  }
  // maxRetries: 0 → el límite de tiempo lo controlamos nosotros con AbortController.
  cache = new OpenAI({ apiKey, maxRetries: 0 });
  return cache;
}
