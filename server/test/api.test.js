// Pruebas de la API con el test runner nativo de Node (node:test) y fetch.
// Ejecutar con: npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../app.js';
import { calcularPresupuesto } from '../presupuesto.js';

let servidor;
let URL_BASE;

before(async () => {
  // Puerto 0 → el sistema asigna uno libre, así no choca con una API ya arrancada.
  await new Promise((resolve) => {
    servidor = app.listen(0, resolve);
  });
  URL_BASE = `http://localhost:${servidor.address().port}`;
});

after(() => {
  servidor.close();
});

function pedirPresupuesto(cuerpo, cabeceras = { 'Content-Type': 'application/json' }) {
  return fetch(`${URL_BASE}/api/presupuesto`, {
    method: 'POST',
    headers: cabeceras,
    body: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
  });
}

// Solicitud válida de referencia: en cada caso inválido solo se cambia un campo.
const VALIDA = { tipo: 'landing', paginas: 1, formulario: false, segundoIdioma: false };

// ---------- Rutas GET ----------

test('GET /api/estado → 200 { status: "ok" }', async () => {
  const res = await fetch(`${URL_BASE}/api/estado`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok' });
});

test('GET /api/tarifas → 200 con las cinco tarifas identificadas', async () => {
  const res = await fetch(`${URL_BASE}/api/tarifas`);
  assert.equal(res.status, 200);
  const cuerpo = await res.json();
  assert.equal(cuerpo.moneda, 'EUR');
  assert.equal(cuerpo.tarifas.landing.precio, 300);
  assert.equal(cuerpo.tarifas.corporativa.precio, 600);
  assert.equal(cuerpo.tarifas.paginaAdicional.precio, 50);
  assert.equal(cuerpo.tarifas.formulario.precio, 80);
  assert.equal(cuerpo.tarifas.segundoIdioma.precio, 150);
});

// ---------- Los nueve casos obligatorios ----------

test('Caso 1 · Landing, 1 página, sin extras → 200 · 300 €', async () => {
  const res = await pedirPresupuesto(VALIDA);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), {
    base: 300, paginasAdicionales: 0, formulario: 0, segundoIdioma: 0, total: 300, moneda: 'EUR',
  });
});

test('Caso 2 · Corporativa, 4 páginas, formulario, sin segundo idioma → 200 · 830 €', async () => {
  const res = await pedirPresupuesto({ tipo: 'corporativa', paginas: 4, formulario: true, segundoIdioma: false });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), {
    base: 600, paginasAdicionales: 150, formulario: 80, segundoIdioma: 0, total: 830, moneda: 'EUR',
  });
});

test('Caso 3 · Landing, 2 páginas, ambos extras → 200 · 580 €', async () => {
  const res = await pedirPresupuesto({ tipo: 'landing', paginas: 2, formulario: true, segundoIdioma: true });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), {
    base: 300, paginasAdicionales: 50, formulario: 80, segundoIdioma: 150, total: 580, moneda: 'EUR',
  });
});

test('Caso 4 · Landing, 20 páginas, sin extras → 200 · 1.250 €', async () => {
  const res = await pedirPresupuesto({ ...VALIDA, paginas: 20 });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), {
    base: 300, paginasAdicionales: 950, formulario: 0, segundoIdioma: 0, total: 1250, moneda: 'EUR',
  });
});

const CASOS_INVALIDOS = [
  ['Caso 5 · paginas: 0', { paginas: 0 }],
  ['Caso 6 · paginas: 21', { paginas: 21 }],
  ['Caso 7 · paginas: 2.5', { paginas: 2.5 }],
  ['Caso 8 · tipo: "tienda"', { tipo: 'tienda' }],
  ['Caso 9 · formulario: "false"', { formulario: 'false' }],
];

for (const [nombre, cambio] of CASOS_INVALIDOS) {
  test(`${nombre} → 400`, async () => {
    const res = await pedirPresupuesto({ ...VALIDA, ...cambio });
    assert.equal(res.status, 400);
    const cuerpo = await res.json();
    assert.equal(cuerpo.error, 'Solicitud no válida');
    assert.equal(cuerpo.detalles.length, 1, 'solo debe fallar el campo modificado');
    assert.equal(cuerpo.total, undefined, 'no debe calcular el presupuesto');
  });
}

// ---------- Casos adicionales ----------

const OTROS_INVALIDOS = [
  ['paginas como cadena "4"', { ...VALIDA, paginas: '4' }],
  ['segundoIdioma como cadena "false"', { ...VALIDA, segundoIdioma: 'false' }],
  ['tipo "paginaAdicional" (es una tarifa, no un tipo)', { ...VALIDA, tipo: 'paginaAdicional' }],
  ['falta un campo obligatorio', { tipo: 'landing', paginas: 1, formulario: false }],
  ['cuerpo vacío {}', {}],
  ['el cuerpo es un array', [VALIDA]],
];

for (const [nombre, cuerpo] of OTROS_INVALIDOS) {
  test(`Extra · ${nombre} → 400`, async () => {
    const res = await pedirPresupuesto(cuerpo);
    assert.equal(res.status, 400);
    assert.ok((await res.json()).detalles.length > 0);
  });
}

test('Extra · JSON mal formado → 400 en JSON', async () => {
  const res = await pedirPresupuesto('{"tipo": "landing",');
  assert.equal(res.status, 400);
  assert.match(res.headers.get('content-type'), /application\/json/);
  assert.deepEqual((await res.json()).detalles, ['El cuerpo no es un JSON válido.']);
});

test('Extra · sin Content-Type: application/json → 400', async () => {
  const res = await pedirPresupuesto(JSON.stringify(VALIDA), { 'Content-Type': 'text/plain' });
  assert.equal(res.status, 400);
});

test('Extra · propiedades adicionales (total, precio, tarifas) se ignoran', async () => {
  const res = await pedirPresupuesto({
    ...VALIDA, total: 1, precio: 1, base: 1, tarifas: { landing: { precio: 1 } },
  });
  assert.equal(res.status, 200);
  const cuerpo = await res.json();
  assert.equal(cuerpo.base, 300);
  assert.equal(cuerpo.total, 300);
});

test('Extra · __proto__ en el cuerpo no altera nada', async () => {
  const res = await pedirPresupuesto('{"tipo":"landing","paginas":1,"formulario":false,"segundoIdioma":false,"__proto__":{"total":1}}');
  assert.equal(res.status, 200);
  assert.equal((await res.json()).total, 300);
});

test('Extra · ruta inexistente → 404 en JSON', async () => {
  const res = await fetch(`${URL_BASE}/api/no-existe`);
  assert.equal(res.status, 404);
  assert.ok((await res.json()).error);
});

// ---------- Función de cálculo aislada (sin HTTP) ----------

test('calcularPresupuesto funciona sin Express', () => {
  assert.deepEqual(calcularPresupuesto({ tipo: 'corporativa', paginas: 4, formulario: true, segundoIdioma: false }), {
    base: 600, paginasAdicionales: 150, formulario: 80, segundoIdioma: 0, total: 830, moneda: 'EUR',
  });
});

// ---------- Fase 1 · catálogo y /api/presupuesto/confirmar ----------

function confirmar(cuerpo) {
  return fetch(`${URL_BASE}/api/presupuesto/confirmar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
}

test('GET /api/catalogo → servicios con precios derivados de las tarifas', async () => {
  const res = await fetch(`${URL_BASE}/api/catalogo`);
  assert.equal(res.status, 200);
  const { moneda, servicios } = await res.json();
  assert.equal(moneda, 'EUR');
  assert.deepEqual(
    servicios.map((s) => s.id),
    ['landing', 'corporativa', 'paginasAdicionales', 'formulario', 'segundoIdioma'],
  );
  const por = Object.fromEntries(servicios.map((s) => [s.id, s]));
  assert.equal(por.landing.precio, 300);
  assert.equal(por.corporativa.precio, 600);
  assert.equal(por.paginasAdicionales.precioUnitario, 50);
  assert.deepEqual(
    por.paginasAdicionales.parametros.map((p) => [p.nombre, p.min, p.max]),
    [['paginas', 1, 20]],
  );
  assert.equal(por.formulario.precio, 80);
  assert.equal(por.segundoIdioma.precio, 150);
  for (const s of servicios) assert.ok(s.nombre && s.descripcion);
});

test('confirmar · líneas con id, nombre, descripción e importe, y total', async () => {
  const res = await confirmar({
    servicios: [{ id: 'corporativa' }, { id: 'paginasAdicionales' }, { id: 'formulario' }],
    paginas: 4,
  });
  assert.equal(res.status, 200);
  const cuerpo = await res.json();
  assert.equal(cuerpo.moneda, 'EUR');
  assert.deepEqual(
    cuerpo.lineas.map((l) => [l.id, l.importe]),
    [['corporativa', 600], ['paginasAdicionales', 150], ['formulario', 80]],
  );
  for (const l of cuerpo.lineas) assert.ok(l.nombre && l.descripcion);
  assert.equal(cuerpo.total, 830);
});

test('confirmar · mismos totales que /api/presupuesto en todas las combinaciones equivalentes', async () => {
  for (const tipo of ['landing', 'corporativa']) {
    for (const paginas of [1, 2, 7, 20]) {
      for (const formulario of [false, true]) {
        for (const segundoIdioma of [false, true]) {
          const esperado = calcularPresupuesto({ tipo, paginas, formulario, segundoIdioma });
          const servicios = [{ id: tipo }, { id: 'paginasAdicionales' }];
          if (formulario) servicios.push({ id: 'formulario' });
          if (segundoIdioma) servicios.push({ id: 'segundoIdioma' });
          const res = await confirmar({ servicios, paginas });
          assert.equal(res.status, 200);
          assert.equal((await res.json()).total, esperado.total, JSON.stringify({ tipo, paginas, formulario, segundoIdioma }));
        }
      }
    }
  }
});

test('confirmar · ignora importes, totales y precios enviados por el cliente', async () => {
  const res = await confirmar({
    total: 1,
    servicios: [{ id: 'landing', importe: 0, precio: 0 }, { id: 'formulario', importe: -50 }],
  });
  assert.equal(res.status, 200);
  const cuerpo = await res.json();
  assert.deepEqual(cuerpo.lineas.map((l) => l.importe), [300, 80]);
  assert.equal(cuerpo.total, 380);
});

test('confirmar · id desconocido, "__proto__", repetido o mal formado → 400', async () => {
  const casos = [
    [{ id: 'landing' }, { id: 'seo' }],
    [{ id: '__proto__' }],
    [{ id: 'landing' }, { id: 'landing' }],
    [{ id: 5 }],
    [{}],
  ];
  for (const servicios of casos) {
    const res = await confirmar({ servicios });
    assert.equal(res.status, 400, JSON.stringify(servicios));
    const cuerpo = await res.json();
    assert.equal(cuerpo.error, 'Solicitud no válida');
    assert.ok(cuerpo.detalles.length > 0);
  }
});

test('confirmar · dos bases a la vez, ninguna base o lista vacía → 400', async () => {
  let res = await confirmar({ servicios: [{ id: 'landing' }, { id: 'corporativa' }] });
  assert.equal(res.status, 400);
  assert.match((await res.json()).detalles[0], /un servicio base/);
  res = await confirmar({ servicios: [{ id: 'formulario' }] });
  assert.equal(res.status, 400);
  assert.match((await res.json()).detalles[0], /Falta un servicio base/);
  res = await confirmar({ servicios: [] });
  assert.equal(res.status, 400);
});

test('confirmar · páginas adicionales sin "paginas" o con valor inválido → 400 con mensaje claro', async () => {
  const base = [{ id: 'landing' }, { id: 'paginasAdicionales' }];
  let res = await confirmar({ servicios: base });
  assert.equal(res.status, 400);
  assert.match((await res.json()).detalles[0], /Falta el parámetro "paginas"/);
  for (const paginas of [0, 21, 2.5, '4']) {
    res = await confirmar({ servicios: base, paginas });
    assert.equal(res.status, 400, String(paginas));
  }
});

test('confirmar · "paginas" sin páginas adicionales se ignora', async () => {
  const res = await confirmar({ servicios: [{ id: 'landing' }], paginas: 999 });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).total, 300);
});

test('confirmar · cuerpo no objeto, Content-Type incorrecto y JSON roto → 400', async () => {
  assert.equal((await confirmar([])).status, 400);
  let res = await fetch(`${URL_BASE}/api/presupuesto/confirmar`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: 'x',
  });
  assert.equal(res.status, 400);
  res = await fetch(`${URL_BASE}/api/presupuesto/confirmar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{roto',
  });
  assert.equal(res.status, 400);
});
