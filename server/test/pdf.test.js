// Pruebas de POST /api/presupuesto/pdf. El texto se extrae del PDF REAL devuelto por la API
// (con pdfjs-dist), así que se comprueba lo que de verdad verá el usuario.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearApp } from '../app.js';
import { generarNumero } from '../pdf/plantilla.js';

async function conServidor(opciones, prueba) {
  const app = crearApp(opciones);
  const servidor = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://localhost:${servidor.address().port}`;
  const post = (ruta, cuerpo) =>
    fetch(`${base}${ruta}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    });
  try {
    await prueba({ base, post });
  } finally {
    servidor.close();
  }
}

/** Texto plano de todas las páginas del PDF (espacios normalizados). */
async function textoDelPdf(buffer) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const tarea = pdfjs.getDocument({ data: new Uint8Array(buffer), verbosity: 0 });
  const doc = await tarea.promise;
  const paginas = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const contenido = await (await doc.getPage(i)).getTextContent();
    paginas.push(contenido.items.map((it) => it.str).join(' ').replace(/\s+/g, ' '));
  }
  const numPaginas = doc.numPages;
  await tarea.destroy();
  return { texto: paginas.join(' '), paginas: numPaginas };
}

const CLIENTE = 'Restaurante La Cepa (ficticio)';

/** ¿Contiene el PDF este texto? Se compara sin espacios: pdfjs separa las letras de los textos con interletraje. */
const contiene = (texto, trozo) => texto.replace(/\s+/g, '').includes(trozo.replace(/\s+/g, ''));

test('PDF · es un application/pdf válido con cabecera, cliente, resumen, tabla, total y pie', async () => {
  await conServidor({}, async ({ post }) => {
    const res = await post('/api/presupuesto/pdf', {
      cliente: CLIENTE,
      resumen: 'Restaurante con carta, reservas y dos idiomas. Ñandú, acción y ¿qué tal?',
      servicios: [{ id: 'corporativa' }, { id: 'paginasAdicionales' }, { id: 'formulario' }, { id: 'segundoIdioma' }],
      paginas: 5,
      pendientes: ['¿Necesita pasarela de pago?'],
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'application/pdf');
    assert.match(res.headers.get('x-presupuesto-numero'), /^PM-\d{8}-[0-9A-Z]{4}$/);
    const buffer = Buffer.from(await res.arrayBuffer());
    assert.equal(buffer.subarray(0, 5).toString(), '%PDF-');

    const { texto, paginas } = await textoDelPdf(buffer);
    assert.equal(paginas, 1);
    for (const esperado of [
      'Presupuesta mi web',
      'PRESUPUESTO',
      `Nº ${res.headers.get('x-presupuesto-numero')}`,
      'CLIENTE',
      CLIENTE,
      'Ñandú, acción y ¿qué tal?', // tildes, eñe y signos de apertura correctos
      'Web corporativa',
      '4 páginas adicionales (5 en total).',
      'Formulario de contacto',
      'Segundo idioma',
      '600,00 €',
      '200,00 €',
      '80,00 €',
      '150,00 €',
      '1.030,00 €',
      'ACLARACIONES Y ASPECTOS PENDIENTES DE CONCRETAR',
      '¿Necesita pasarela de pago?',
      'Importes calculados por el servidor. Sin impuestos aplicados.',
      '1/1',
    ]) {
      assert.ok(contiene(texto, esperado), `falta «${esperado}» en el PDF:\n${texto}`);
    }
    // No se inventan plazos, validez ni condiciones.
    assert.doesNotMatch(texto, /plazo|validez|v[aá]lido hasta|entrega|condiciones/i);
  });
});

test('PDF · sin pendientes indica "Sin aspectos pendientes"', async () => {
  await conServidor({}, async ({ post }) => {
    const res = await post('/api/presupuesto/pdf', { cliente: CLIENTE, resumen: 'Una página.', servicios: [{ id: 'landing' }] });
    assert.equal(res.status, 200);
    const { texto } = await textoDelPdf(Buffer.from(await res.arrayBuffer()));
    assert.ok(contiene(texto, 'Sin aspectos pendientes'));
    assert.ok(contiene(texto, '300,00 €'));
  });
});

test('PDF · ignora importes, totales y líneas enviados por el cliente y recalcula', async () => {
  await conServidor({}, async ({ post }) => {
    const res = await post('/api/presupuesto/pdf', {
      cliente: CLIENTE,
      resumen: 'Una página.',
      total: 1,
      importe: 1,
      lineas: [{ nombre: 'Regalo', importe: 0 }],
      servicios: [{ id: 'landing', importe: 0, precio: 0 }, { id: 'formulario', importe: -999 }],
      pendientes: [],
    });
    assert.equal(res.status, 200);
    const { texto } = await textoDelPdf(Buffer.from(await res.arrayBuffer()));
    assert.ok(contiene(texto, '380,00 €')); // 300 + 80 calculados por el servidor
    assert.ok(!contiene(texto, 'Regalo'));
    assert.ok(!contiene(texto, '999'));
  });
});

test('PDF · entradas inválidas → 400 en JSON (id desconocido, dos bases, sin cliente, falta paginas…)', async () => {
  await conServidor({}, async ({ post }) => {
    const valido = { cliente: CLIENTE, resumen: 'x', servicios: [{ id: 'landing' }] };
    const casos = [
      { ...valido, cliente: '' },
      { ...valido, servicios: [{ id: 'landing' }, { id: 'seo' }] },
      { ...valido, servicios: [{ id: 'landing' }, { id: 'corporativa' }] },
      { ...valido, servicios: [{ id: 'landing' }, { id: 'paginasAdicionales' }] },
      { ...valido, servicios: [] },
      { ...valido, pendientes: 'no es lista' },
      { ...valido, pendientes: [42] },
      { ...valido, resumen: 'a'.repeat(1001) },
    ];
    for (const caso of casos) {
      const res = await post('/api/presupuesto/pdf', caso);
      assert.equal(res.status, 400, JSON.stringify(caso).slice(0, 120));
      assert.match(res.headers.get('content-type'), /application\/json/);
      assert.ok((await res.json()).detalles.length > 0);
    }
  });
});

test('PDF · muchas aclaraciones largas: se pagina y el pie numera x/y', async () => {
  await conServidor({}, async ({ post }) => {
    const pendientes = Array.from({ length: 10 }, (_, i) => `Aclaración ${i + 1}: ${'texto de relleno '.repeat(14)}`.trim());
    const res = await post('/api/presupuesto/pdf', {
      cliente: CLIENTE,
      resumen: 'r '.repeat(450).trim(),
      servicios: [{ id: 'corporativa' }, { id: 'paginasAdicionales' }, { id: 'formulario' }, { id: 'segundoIdioma' }],
      paginas: 20,
      pendientes,
    });
    assert.equal(res.status, 200);
    const { texto, paginas } = await textoDelPdf(Buffer.from(await res.arrayBuffer()));
    assert.ok(paginas >= 2, `se esperaban ≥2 páginas y hay ${paginas}`);
    assert.ok(contiene(texto, `1/${paginas}`) && contiene(texto, `${paginas}/${paginas}`));
    assert.ok(contiene(texto, 'Aclaración 10'));
  });
});

test('generarNumero → PM-AAAAMMDD-XXXX con la fecha indicada', () => {
  const n = generarNumero(new Date('2026-03-05T10:00:00Z'), () => 0.5);
  assert.match(n, /^PM-20260305-[0-9A-Z]{4}$/);
});

// ---------- Escenario 6 · flujo completo: propuesta → cambios del usuario → confirmar → PDF ----------

test('Escenario 6 · el usuario modifica la propuesta y el PDF refleja la selección final con importes recalculados', async () => {
  const modelo = {
    responses: {
      create: async () => ({
        status: 'completed',
        output: [],
        output_text: JSON.stringify({
          resumen: 'Restaurante que quiere carta, reservas y web en dos idiomas.',
          servicios: [
            { id: 'corporativa', justificacion: 'Varias secciones.' },
            { id: 'paginasAdicionales', justificacion: 'Carta y reservas.' },
            { id: 'formulario', justificacion: 'Reservas.' },
            { id: 'segundoIdioma', justificacion: 'Dos idiomas.' },
          ],
          pendientes: ['¿Quiere pago online? Pendiente de valorar.'],
        }),
      }),
    },
  };
  await conServidor({ clienteIA: modelo }, async ({ post }) => {
    // 1. La IA propone.
    const propuesta = await (await post('/api/propuesta', { cliente: CLIENTE, descripcion: 'Carta, reservas y dos idiomas.' })).json();
    assert.equal(propuesta.servicios.length, 4);

    // 2. El usuario cambia de opinión: quita el segundo idioma, cambia a landing y pone 3 páginas.
    const seleccion = propuesta.servicios
      .map((s) => ({ id: s.id === 'corporativa' ? 'landing' : s.id }))
      .filter((s) => s.id !== 'segundoIdioma');
    const paginas = 3;

    // 3. El servidor calcula los totales.
    const conf = await (await post('/api/presupuesto/confirmar', { servicios: seleccion, paginas })).json();
    assert.equal(conf.total, 300 + 2 * 50 + 80); // 480

    // 4. El PDF refleja exactamente esa selección y esos importes.
    const res = await post('/api/presupuesto/pdf', {
      cliente: propuesta.cliente,
      resumen: propuesta.resumen,
      servicios: seleccion,
      paginas,
      pendientes: propuesta.pendientes,
    });
    assert.equal(res.status, 200);
    const { texto } = await textoDelPdf(Buffer.from(await res.arrayBuffer()));
    assert.ok(contiene(texto, 'Landing page'));
    assert.ok(contiene(texto, '2 páginas adicionales (3 en total).'));
    assert.ok(contiene(texto, 'Formulario de contacto'));
    assert.ok(!contiene(texto, 'Segundo idioma'), 'el servicio quitado no debe aparecer');
    assert.ok(!contiene(texto, 'Web corporativa'), 'el servicio sustituido no debe aparecer');
    assert.ok(contiene(texto, '480,00 €'));
    assert.ok(!contiene(texto, '1.030,00 €') && !contiene(texto, '830,00 €'));
    for (const l of conf.lineas) {
      assert.ok(contiene(texto, l.nombre));
      assert.ok(contiene(texto, new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(l.importe)));
    }
    assert.ok(contiene(texto, '¿Quiere pago online? Pendiente de valorar.'));
  });
});
