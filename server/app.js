import express from 'express';
import { TARIFAS, MONEDA } from './tarifas.js';
import { validarSolicitud } from './validacion.js';
import { calcularPresupuesto } from './presupuesto.js';

export const app = express();

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
