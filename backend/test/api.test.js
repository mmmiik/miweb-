// Pruebas de la API con el test runner nativo de Node (node:test) y fetch.
// Ejecutar con: npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { calcularPresupuesto } from '../src/presupuesto.js';

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
