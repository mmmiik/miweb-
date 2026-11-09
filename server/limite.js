// Límite de solicitudes por IP para POST /api/propuesta, la única ruta que cuesta dinero
// (cada llamada usa la API de OpenAI). Es un contador en memoria: en Vercel cada instancia
// de la función cuenta por separado, así que frena abusos básicos pero NO sustituye al tope
// de gasto que se configura en el panel de OpenAI.

export const LIMITE_POR_DEFECTO = Object.freeze({ max: 10, ventanaMs: 10 * 60 * 1000 });

export function crearLimite({ max, ventanaMs } = LIMITE_POR_DEFECTO) {
  const contadores = new Map(); // ip → { n, reinicio }

  return function comprobar(ip, ahora = Date.now()) {
    // Limpieza ocasional para que el mapa no crezca sin límite.
    if (contadores.size > 5000) {
      for (const [clave, c] of contadores) if (c.reinicio <= ahora) contadores.delete(clave);
    }
    const clave = ip || 'desconocida';
    let c = contadores.get(clave);
    if (!c || c.reinicio <= ahora) {
      c = { n: 0, reinicio: ahora + ventanaMs };
      contadores.set(clave, c);
    }
    c.n += 1;
    if (c.n > max) {
      return { ok: false, reintentarEnSeg: Math.max(1, Math.ceil((c.reinicio - ahora) / 1000)) };
    }
    return { ok: true };
  };
}
