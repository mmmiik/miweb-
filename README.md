# Presupuesta mi web

API REST hecha con **Node.js, Express y JavaScript** que recibe las características de una web, **valida** los datos en el servidor y devuelve un **presupuesto desglosado** calculado con las tarifas del propio servidor. Incluye una interfaz React (Next.js + shadcn/ui) que consume la API.

> Actividad 0613 · Desarrollo web en entorno servidor · RA7 (CE 7.4 y 7.6)

---

## Índice

1. [Estructura del proyecto](#1-estructura-del-proyecto)
2. [Requisitos](#2-requisitos)
3. [Instalación y ejecución de la API](#3-instalación-y-ejecución-de-la-api-backend)
4. [Rutas de la API](#4-rutas-de-la-api)
5. [Validación](#5-validación)
6. [Cálculo del presupuesto](#6-cálculo-del-presupuesto)
7. [Pruebas](#7-pruebas)
8. [Interfaz React (frontend)](#8-interfaz-react-frontend)

---

## 1. Estructura del proyecto

```
proyecto_miweb/
├── README.md
├── backend/                  ← API (Node.js + Express + JavaScript)
│   ├── package.json          ← dependencias (express) y scripts start / dev / test
│   ├── package-lock.json
│   ├── pruebas.http          ← peticiones listas para la extensión REST Client de VS Code
│   ├── src/
│   │   ├── server.js         ← arranca el servidor (puerto 3000)
│   │   ├── app.js            ← app Express: rutas y manejo de errores
│   │   ├── tarifas.js        ← tarifas oficiales (congeladas con Object.freeze)
│   │   ├── validacion.js     ← validarSolicitud(): comprueba los datos
│   │   └── presupuesto.js    ← calcularPresupuesto(): función de cálculo independiente
│   └── test/
│       └── api.test.js       ← pruebas automáticas (node:test, sin dependencias extra)
└── frontend/                 ← interfaz React (Next.js + shadcn/ui), consume la API
```

La API está separada en capas: **tarifas** (datos), **validación**, **cálculo** (función pura que no conoce Express) y **rutas** (`app.js`, que solo coordina).

## 2. Requisitos

- **Node.js 18 o superior** (probado con Node 25) y **npm**.
- Comprobar versiones: `node -v` y `npm -v`.

## 3. Instalación y ejecución de la API (backend)

```bash
cd backend
npm install      # instala Express a partir de package.json / package-lock.json
npm start        # arranca la API
```

Salida esperada:

```
API "Presupuesta mi web" escuchando en http://localhost:3000
```

| | |
|---|---|
| **Puerto** | `3000` (se puede cambiar con la variable de entorno `PORT`) |
| **URL base** | `http://localhost:3000` |
| Modo desarrollo (se reinicia al guardar) | `npm run dev` |
| Pruebas automáticas | `npm test` |

Cambiar el puerto: `PORT=4000 npm start` en bash, o `$env:PORT=4000; npm start` en PowerShell.

## 4. Rutas de la API

| Método | Ruta | Descripción | Respuesta correcta |
|---|---|---|---|
| GET | `/api/estado` | Comprueba que el servicio funciona | `200` `{ "status": "ok" }` |
| GET | `/api/tarifas` | Tarifas que usa el servidor | `200` con las 5 tarifas |
| POST | `/api/presupuesto` | Valida la solicitud y calcula el presupuesto | `200` desglose · `400` si los datos no son válidos |

Cualquier otra ruta devuelve `404` con un JSON `{ "error": "..." }`.

### GET /api/estado

```json
{ "status": "ok" }
```

### GET /api/tarifas

```json
{
  "moneda": "EUR",
  "tarifas": {
    "landing":         { "concepto": "Landing, incluida la primera página",          "precio": 300 },
    "corporativa":     { "concepto": "Web corporativa, incluida la primera página",  "precio": 600 },
    "paginaAdicional": { "concepto": "Cada página adicional a la primera",           "precio": 50 },
    "formulario":      { "concepto": "Formulario de contacto",                       "precio": 80 },
    "segundoIdioma":   { "concepto": "Segundo idioma",                               "precio": 150 }
  }
}
```

### POST /api/presupuesto

Requiere la cabecera **`Content-Type: application/json`** y un cuerpo con los cuatro campos obligatorios:

```json
{
  "tipo": "corporativa",
  "paginas": 4,
  "formulario": true,
  "segundoIdioma": false
}
```

**Respuesta 200:**

```json
{
  "base": 600,
  "paginasAdicionales": 150,
  "formulario": 80,
  "segundoIdioma": 0,
  "total": 830,
  "moneda": "EUR"
}
```

**Respuesta 400** (ejemplo con `"paginas": 0`):

```json
{
  "error": "Solicitud no válida",
  "detalles": ["\"paginas\" debe estar entre 1 y 20 (recibido: 0)."]
}
```

### Cómo enviar las peticiones

Abrir la URL en el navegador **no** envía un POST con JSON. Hay que usar la terminal o un cliente HTTP.

**bash / Git Bash / macOS / Linux (curl):**

```bash
curl http://localhost:3000/api/estado
curl http://localhost:3000/api/tarifas
curl -X POST http://localhost:3000/api/presupuesto \
  -H "Content-Type: application/json" \
  -d '{"tipo":"corporativa","paginas":4,"formulario":true,"segundoIdioma":false}'
```

**Windows PowerShell:**

```powershell
Invoke-RestMethod http://localhost:3000/api/estado
Invoke-RestMethod http://localhost:3000/api/tarifas | ConvertTo-Json -Depth 3

$body = '{"tipo":"corporativa","paginas":4,"formulario":true,"segundoIdioma":false}'
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/presupuesto -ContentType 'application/json' -Body $body

# Con curl.exe en PowerShell hay que escapar las comillas internas:
curl.exe -X POST http://localhost:3000/api/presupuesto -H "Content-Type: application/json" -d '{\"tipo\":\"landing\",\"paginas\":0,\"formulario\":false,\"segundoIdioma\":false}'
```

**VS Code:** abrir [backend/pruebas.http](backend/pruebas.http) con la extensión *REST Client* y pulsar *Send Request* encima de cada caso.

## 5. Validación

La hace [backend/src/validacion.js](backend/src/validacion.js) **antes** de calcular nada. Si algo falla, la API responde **400** con un mensaje por cada error y **no calcula** el presupuesto.

| Comprobación | Cómo se hace | Ejemplo rechazado |
|---|---|---|
| `Content-Type: application/json` | `req.is('application/json')` en la ruta | `text/plain` |
| JSON bien formado | middleware de errores (`entity.parse.failed`) → 400 en JSON | `{"tipo":"landing",` |
| El cuerpo es un objeto | `typeof === 'object'`, no `null` y no array | `[1,2]` |
| Están los 4 campos | `Object.hasOwn(cuerpo, campo)` | falta `segundoIdioma` |
| `tipo` | debe ser string e igual a `"landing"` o `"corporativa"` (lista explícita) | `"tienda"` |
| `paginas` | `typeof === 'number'`, `Number.isInteger` y entre 1 y 20 | `0`, `21`, `2.5`, `"4"` |
| `formulario`, `segundoIdioma` | `typeof === 'boolean'` | `"false"` |

**Las propiedades extra se ignoran.** El validador devuelve un objeto nuevo con **solo** los cuatro campos permitidos: el cuerpo no se copia ni se mezcla nunca. Así, si el cliente envía `"total": 1`, `"precio": 1` o incluso `"tarifas": {...}`, no influye en el resultado. Las tarifas además están congeladas con `Object.freeze`, así que no se pueden modificar en tiempo de ejecución.

**Ejemplo explicado (caso 9):** llega `"formulario": "false"`. Es la **cadena** `"false"`, no el booleano `false`. `typeof "false"` es `"string"`, así que no pasa la comprobación `typeof formulario !== 'boolean'`. Se añade el error `"formulario" debe ser true o false (recibido: "false").` y la ruta responde 400 sin llamar a `calcularPresupuesto`.

## 6. Cálculo del presupuesto

La función [`calcularPresupuesto()`](backend/src/presupuesto.js) es **independiente del manejador de la ruta**: no recibe `req` ni `res`, solo los datos ya validados, y todos los precios los saca de `TARIFAS`.

```
Total = precio base + páginas adicionales + extras seleccionados
```

| Concepto | Precio |
|---|---|
| Landing, incluida la primera página | 300 € |
| Web corporativa, incluida la primera página | 600 € |
| Cada página adicional a la primera | 50 € |
| Formulario de contacto | 80 € |
| Segundo idioma | 150 € |

Sin impuestos, descuentos ni conceptos adicionales.

**Ejemplo explicado:** `{ "tipo": "corporativa", "paginas": 4, "formulario": true, "segundoIdioma": false }`

| Paso | Cálculo | Importe |
|---|---|---|
| base | `TARIFAS.corporativa.precio` | 600 € |
| paginasAdicionales | `(4 − 1) × 50` | 150 € |
| formulario | `true` → `TARIFAS.formulario.precio` | 80 € |
| segundoIdioma | `false` → 0 | 0 € |
| **total** | `600 + 150 + 80 + 0` | **830 €** |

Flujo de una petición: `app.js` comprueba el Content-Type → `validarSolicitud(req.body)` → si es válida, `calcularPresupuesto(datos)` → `res.status(200).json(...)`.

## 7. Pruebas

### 7.1 Tabla de pruebas

Pruebas hechas con `curl` contra la API arrancada (`npm start`). En los casos inválidos solo cambia el campo que se comprueba y el resto se mantiene correcto (`"tipo":"landing","paginas":1,"formulario":false,"segundoIdioma":false`).

**Rutas GET**

| Ruta | Resultado esperado | Resultado obtenido |
|---|---|---|
| `GET /api/estado` | 200 · `{"status":"ok"}` | ✅ 200 · `{"status":"ok"}` |
| `GET /api/tarifas` | 200 · las 5 tarifas con su nombre | ✅ 200 · `landing` 300, `corporativa` 600, `paginaAdicional` 50, `formulario` 80, `segundoIdioma` 150, `moneda` EUR |

**POST /api/presupuesto: los nueve casos obligatorios**

| Caso | Solicitud enviada | Resultado esperado | Resultado obtenido |
|---|---|---|---|
| 1 | `{"tipo":"landing","paginas":1,"formulario":false,"segundoIdioma":false}` | 200 · Total: 300 € | ✅ 200 · `{"base":300,"paginasAdicionales":0,"formulario":0,"segundoIdioma":0,"total":300,"moneda":"EUR"}` |
| 2 | `{"tipo":"corporativa","paginas":4,"formulario":true,"segundoIdioma":false}` | 200 · Total: 830 € | ✅ 200 · `{"base":600,"paginasAdicionales":150,"formulario":80,"segundoIdioma":0,"total":830,"moneda":"EUR"}` |
| 3 | `{"tipo":"landing","paginas":2,"formulario":true,"segundoIdioma":true}` | 200 · Total: 580 € | ✅ 200 · `{"base":300,"paginasAdicionales":50,"formulario":80,"segundoIdioma":150,"total":580,"moneda":"EUR"}` |
| 4 | `{"tipo":"landing","paginas":20,"formulario":false,"segundoIdioma":false}` | 200 · Total: 1.250 € | ✅ 200 · `{"base":300,"paginasAdicionales":950,"formulario":0,"segundoIdioma":0,"total":1250,"moneda":"EUR"}` |
| 5 | `{"tipo":"landing","paginas":0,"formulario":false,"segundoIdioma":false}` | 400 | ✅ 400 · `"paginas" debe estar entre 1 y 20 (recibido: 0).` |
| 6 | `{"tipo":"landing","paginas":21,"formulario":false,"segundoIdioma":false}` | 400 | ✅ 400 · `"paginas" debe estar entre 1 y 20 (recibido: 21).` |
| 7 | `{"tipo":"landing","paginas":2.5,"formulario":false,"segundoIdioma":false}` | 400 | ✅ 400 · `"paginas" debe ser un número entero (recibido: 2.5).` |
| 8 | `{"tipo":"tienda","paginas":1,"formulario":false,"segundoIdioma":false}` | 400 | ✅ 400 · `"tipo" debe ser "landing" o "corporativa" (recibido: "tienda").` |
| 9 | `{"tipo":"landing","paginas":1,"formulario":"false","segundoIdioma":false}` | 400 | ✅ 400 · `"formulario" debe ser true o false (recibido: "false").` |

**Casos adicionales**

| Solicitud enviada | Resultado esperado | Resultado obtenido |
|---|---|---|
| `"paginas":"4"` (cadena) | 400 | ✅ 400 · `"paginas" debe ser un número entero (recibido: "4").` |
| Falta `segundoIdioma` | 400 | ✅ 400 · `Falta el campo obligatorio "segundoIdioma".` |
| Caso 1 + `"total":1` (el cliente intenta imponer un total) | 200 · Total: 300 € (se ignora) | ✅ 200 · `"total":300` |
| JSON mal formado `{"tipo":"landing",` | 400 | ✅ 400 · `El cuerpo no es un JSON válido.` |
| Cuerpo array `[1,2]` | 400 | ✅ 400 · `El cuerpo de la solicitud debe ser un objeto JSON.` |
| Caso 1 sin cabecera `Content-Type: application/json` | 400 | ✅ 400 · `La cabecera Content-Type debe ser application/json.` |

### 7.2 Pruebas automáticas

Las mismas pruebas, y algunas más, están automatizadas en [backend/test/api.test.js](backend/test/api.test.js) con el test runner nativo de Node. No hace falta arrancar la API: el test la levanta en un puerto libre.

```bash
cd backend
npm test
```

Resultado obtenido:

```
✔ GET /api/estado → 200 { status: "ok" }
✔ GET /api/tarifas → 200 con las cinco tarifas identificadas
✔ Caso 1 · Landing, 1 página, sin extras → 200 · 300 €
✔ Caso 2 · Corporativa, 4 páginas, formulario, sin segundo idioma → 200 · 830 €
✔ Caso 3 · Landing, 2 páginas, ambos extras → 200 · 580 €
✔ Caso 4 · Landing, 20 páginas, sin extras → 200 · 1.250 €
✔ Caso 5 · paginas: 0 → 400
✔ Caso 6 · paginas: 21 → 400
✔ Caso 7 · paginas: 2.5 → 400
✔ Caso 8 · tipo: "tienda" → 400
✔ Caso 9 · formulario: "false" → 400
✔ Extra · paginas como cadena "4" → 400
✔ Extra · segundoIdioma como cadena "false" → 400
✔ Extra · tipo "paginaAdicional" (es una tarifa, no un tipo) → 400
✔ Extra · falta un campo obligatorio → 400
✔ Extra · cuerpo vacío {} → 400
✔ Extra · el cuerpo es un array → 400
✔ Extra · JSON mal formado → 400 en JSON
✔ Extra · sin Content-Type: application/json → 400
✔ Extra · propiedades adicionales (total, precio, tarifas) se ignoran
✔ Extra · __proto__ en el cuerpo no altera nada
✔ Extra · ruta inexistente → 404 en JSON
✔ calcularPresupuesto funciona sin Express
ℹ tests 23
ℹ pass 23
ℹ fail 0
```

## 8. Interfaz React (frontend)

Formulario hecho con Next.js, React y shadcn/ui que:

- comprueba `GET /api/estado` y muestra si la API está conectada;
- muestra los precios que devuelve `GET /api/tarifas` (no hay precios escritos en el cliente);
- envía `POST /api/presupuesto` con `Content-Type: application/json` y enseña el **desglose devuelto por el servidor** o los **errores 400** que devuelve. El cliente no calcula nada. El campo de páginas deja escribir valores fuera de rango (0, 25, 2.5…) para ver cómo responde el servidor;
- incluye un **banco de pruebas** que ejecuta los nueve casos del enunciado y compara lo esperado con lo obtenido.

**Ejecución** (con la API ya arrancada en otra terminal):

```bash
cd frontend
npm install
npm run dev
```

Abrir **http://localhost:3001**.

El frontend usa el puerto **3001** porque el 3000 es de la API. Next.js reenvía las peticiones `/api/*` a `http://localhost:3000` (rewrites en [frontend/next.config.ts](frontend/next.config.ts)), así que no hace falta CORS. Si la API está en otra URL: `API_URL=http://localhost:4000 npm run dev`.

En la interfaz, la tecla `d` alterna entre modo claro y oscuro.
