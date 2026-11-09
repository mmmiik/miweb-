import express from 'express';
import { TARIFAS, MONEDA } from './tarifas.js';
import { validarSolicitud, validarSeleccion, validarPropuesta } from './validacion.js';
import { calcularPresupuesto, calcularSeleccion } from './presupuesto.js';
import { catalogoPublico } from './catalogo.js';
import { proponerServicios } from './ia/proponer.js';
import { ErrorIA } from './ia/errores.js';

function exigirJson(req, res, next) {
  if (!req.is('application/json')) {
    return res.status(400).json({
      error: 'Solicitud no válida',
      detalles: ['La cabecera Content-Type debe ser application/json.'],
    });
  }
  next();
}

/**
 * Crea la app Express. Los tests pasan un cliente de OpenAI falso (`clienteIA`)
 * o un `timeoutIA` corto; en producción no se pasa nada y se usa el cliente real.
 */
export function crearApp({ clienteIA, timeoutIA } = {}) {
  const app = express();

  // Solo interpreta cuerpos con Content-Type: application/json.
  app.use(express.json());

  // GET /api/estado → confirma que el servicio funciona.
  app.get('/api/estado', (req, res) => {
    res.json({ status: 'ok' });
  });

  // GET /api/tarifas → tarifas que usa el servidor para calcular.
  app.get('/api/tarifas', (req, res) => {
    res.json({ moneda: MONEDA, tarifas: TARIFAS });
  });

  // GET /api/catalogo → servicios que se pueden presupuestar.
  app.get('/api/catalogo', (req, res) => {
    res.json(catalogoPublico());
  });

  // POST /api/presupuesto → valida la solicitud y, si es correcta, calcula el presupuesto.
  app.post('/api/presupuesto', (req, res) => {
    if (!req.is('application/json')) {
      return res.status(400).json({
        error: 'Solicitud no válida',
        detalles: ['La cabecera Content-Type debe ser application/json.'],
      });
    }

    const resultado = validarSolicitud(req.body);
    if (!resultado.ok) {
      return res.status(400).json({ error: 'Solicitud no válida', detalles: resultado.errores });
    }

    res.status(200).json(calcularPresupuesto(resultado.datos));
  });

  // POST /api/presupuesto/confirmar → líneas y total de una selección de servicios.
  // Los importes son SIEMPRE del servidor: de lo que envíe el cliente solo se leen los ids.
  app.post('/api/presupuesto/confirmar', exigirJson, (req, res) => {
    const resultado = validarSeleccion(req.body);
    if (!resultado.ok) {
      return res.status(400).json({ error: 'Solicitud no válida', detalles: resultado.errores });
    }
    res.status(200).json(calcularSeleccion(resultado.datos));
  });

  // POST /api/propuesta → la IA propone servicios del catálogo (sin importes).
  // 400 entrada inválida · 502 fallo de OpenAI · 504 timeout.
  app.post('/api/propuesta', exigirJson, async (req, res, next) => {
    const resultado = validarPropuesta(req.body);
    if (!resultado.ok) {
      return res.status(400).json({ error: 'Solicitud no válida', detalles: resultado.errores });
    }
    try {
      const propuesta = await proponerServicios(resultado.datos.descripcion, {
        cliente: clienteIA,
        timeoutMs: timeoutIA,
      });
      res.status(200).json({ cliente: resultado.datos.cliente, ...propuesta });
    } catch (err) {
      if (err instanceof ErrorIA) {
        return res.status(err.estado).json({ error: err.message });
      }
      next(err);
    }
  });

  // Cualquier otra ruta → 404 en JSON.
  app.use((req, res) => {
    res.status(404).json({ error: `No existe la ruta ${req.method} ${req.originalUrl}` });
  });

  // Manejo de errores: JSON mal formado → 400 en JSON (en lugar de la página HTML de Express).
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({
        error: 'Solicitud no válida',
        detalles: ['El cuerpo no es un JSON válido.'],
      });
    }
    console.error(err);
    res.status(err.status || 500).json({ error: 'Error interno del servidor' });
  });

  return app;
}

export const app = crearApp();
