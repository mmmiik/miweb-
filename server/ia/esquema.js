// Esquema JSON estricto de la salida estructurada. Los ids son un enum del
// catálogo, pero el servidor vuelve a comprobarlo (validarRespuesta.js).
import { IDS_SERVICIOS } from '../catalogo.js';

export function formatoSalida() {
  return {
    type: 'json_schema',
    name: 'propuesta_servicios',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['resumen', 'servicios', 'paginas', 'pendientes'],
      properties: {
        resumen: { type: 'string' },
        servicios: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'justificacion'],
            properties: {
              id: { type: 'string', enum: [...IDS_SERVICIOS] },
              justificacion: { type: 'string' },
            },
          },
        },
        // Total de páginas que indica el cliente (exacto o el máximo de un rango); null si no lo dice.
        paginas: { type: ['integer', 'null'] },
        pendientes: { type: 'array', items: { type: 'string' } },
      },
    },
  };
}
