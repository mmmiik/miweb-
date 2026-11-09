import express from 'express';
import { TARIFAS, MONEDA } from './tarifas.js';
import { validarSolicitud, validarSeleccion, validarPropuesta, validarPdf } from './validacion.js';
import { calcularPresupuesto, calcularSeleccion } from './presupuesto.js';
import { catalogoPublico } from './catalogo.js';
import { proponerServicios } from './ia/proponer.js';
import { ErrorIA } from './ia/errores.js';
import { generarPdf } from './pdf/generar.js';
import { crearLimite } from './limite.js';

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
export function crearApp({ clienteIA, timeoutIA, limitePropuestas } = {}) {
  const app = express();
  // Detrás del proxy de Vercel la IP real viene en X-Forwarded-For (un solo salto).
  app.set('trust proxy', 1);
  const limite = crearLimite(limitePropuestas);

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

  // POST /api/presupuesto/pdf → PDF del presupuesto. El servidor RECALCULA los importes a
  // partir de los ids y pone él mismo la fecha y el número: no se lee ninguna cifra del cuerpo.
  app.post('/api/presupuesto/pdf', exigirJson, async (req, res, next) => {
    const resultado = validarPdf(req.body);
    if (!resultado.ok) {
      return res.status(400).json({ error: 'Solicitud no válida', detalles: resultado.errores });
    }
    try {
      const { buffer, numero } = await generarPdf(resultado.datos);
      res
        .status(200)
        .set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${numero}.pdf"`,
          'Content-Length': String(buffer.length),
          'Cache-Control': 'no-store',
          'X-Presupuesto-Numero': numero,
          'Access-Control-Expose-Headers': 'X-Presupuesto-Numero, Content-Disposition',
        })
        .send(buffer);
    } catch (err) {
      console.error('Error al generar el PDF:', err);
      next(err);
    }
  });

  // POST /api/propuesta → la IA propone servicios del catálogo (sin importes).
  // 400 entrada inválida · 429 demasiadas solicitudes · 502 fallo de OpenAI · 504 timeout.
  app.post('/api/propuesta', exigirJson, async (req, res, next) => {
    const resultado = validarPropuesta(req.body);
    if (!resultado.ok) {
      return res.status(400).json({ error: 'Solicitud no válida', detalles: resultado.errores });
    }
    // Solo cuentan las solicitudes válidas: son las que llegan a OpenAI y cuestan dinero.
    const permitido = limite(req.ip);
    if (!permitido.ok) {
      res.set('Retry-After', String(permitido.reintentarEnSeg));
      return res.status(429).json({
        error: `Demasiadas solicitudes. Inténtalo de nuevo en ${Math.ceil(permitido.reintentarEnSeg / 60)} min.`,
      });
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
  // Express reconoce un manejador de errores por sus 4 parámetros: "next" debe estar aunque no se use.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
