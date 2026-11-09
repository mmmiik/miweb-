# Presupuesta mi web

El cliente describe su proyecto con sus palabras, una **IA propone servicios del catálogo**, el usuario los revisa y edita, el **servidor calcula todos los importes** y se descarga un **PDF** con el presupuesto.

Un único proyecto: interfaz **Next.js** + API **Node.js / Express (JavaScript)**, desplegable en Vercel en una sola URL.

> Actividad 0613 · Desarrollo web en entorno servidor · RA7 (CE 7.4 y 7.6)

## Índice

1. [Cómo funciona](#1-cómo-funciona)
2. [Estructura del proyecto](#2-estructura-del-proyecto)
3. [Variables de entorno](#3-variables-de-entorno)
4. [Ejecución local](#4-ejecución-local)
5. [Rutas de la API](#5-rutas-de-la-api)
6. [Reglas de seguridad y cómo se cumplen](#6-reglas-de-seguridad-y-cómo-se-cumplen)
7. [Catálogo y cálculo](#7-catálogo-y-cálculo)
8. [El PDF y la decisión de librería](#8-el-pdf-y-la-decisión-de-librería)
9. [Pruebas](#9-pruebas)
10. [Despliegue en Vercel](#10-despliegue-en-vercel)
11. [Interfaz](#11-interfaz)

---

## 1. Cómo funciona

```
 1 Solicitud ──► 2 Propuesta ──► 3 Presupuesto
 nombre +        la IA propone    el servidor calcula importes y total
 descripción     ids del          y genera el PDF; la vista previa es
 (≤ 1500 car.)   catálogo;        ese mismo PDF y "Aceptar y descargar"
                 el usuario       descarga ese mismo archivo
                 acepta/quita/añade
```

**La IA solo propone y redacta.** Devuelve ids del catálogo, una justificación por servicio y una lista de «pendientes de aclarar». No decide precios, plazos ni compromisos: el servidor valida cada id y calcula todos los importes. Cualquier cambio de servicios invalida la vista previa y se vuelve a calcular.

## 2. Estructura del proyecto

```
├── app/ components/ lib/ public/     ← interfaz (Next.js + Tailwind v4 + shadcn/ui)
├── server/                           ← API (Node.js + Express + JavaScript, ESM)
│   ├── app.js                        ← crearApp(): rutas y manejo de errores (exporta `app`)
│   ├── server.js                     ← arranque SOLO local (app.listen en :3000)
│   ├── tarifas.js                    ← única fuente de precios (congelada)
│   ├── catalogo.js                   ← servicios, derivados de tarifas.js
│   ├── validacion.js · presupuesto.js · limite.js
│   ├── ia/                           ← cliente.js · instrucciones.js · esquema.js ·
│   │                                    proponer.js · validarRespuesta.js · errores.js
│   ├── pdf/                          ← plantilla.js · generar.js · fuentes.js
│   ├── test/                         ← api · propuesta · pdf (.test.js, node:test)
│   └── pruebas.http                  ← peticiones para la extensión REST Client
├── api/index.js                      ← función de Vercel: `export default app`
├── vercel.json                       ← rewrite /api/* → función, maxDuration 30 s
├── .env.example · package.json       ← un único proyecto
```

El backend sigue siendo **Node + Express + JavaScript** (no se usan route handlers de Next). `app.js` exporta la app; `server.js` solo existe para local.

## 3. Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `OPENAI_API_KEY` | Sí (para `/api/propuesta`) | Clave de OpenAI. **Solo se lee en el servidor**; nunca llega al navegador ni se versiona. |
| `OPENAI_MODEL` | No | Modelo. Por defecto `gpt-4.1-mini`. |

- **Local:** copia `.env.example` como `.env.local` y rellénalo. `npm run dev` lo carga (`node --env-file-if-exists`). `.env.local` está en `.gitignore`.
- **Vercel:** *Project → Settings → Environment Variables*. La clave no va nunca en el repositorio.
- Sin clave, `/api/propuesta` responde `502` con «El servicio de IA no está configurado»; el resto de la API funciona igual.

## 4. Ejecución local

Requiere **Node 22 o superior** y npm.

```bash
npm install
cp .env.example .env.local      # y pon tu OPENAI_API_KEY
npm run dev                     # API en :3000 + interfaz en :3001
```

Abre **http://localhost:3001**. Next reenvía `/api/*` a Express (`rewrites` de [next.config.ts](next.config.ts), **solo en desarrollo**).

| Script | Qué hace |
|---|---|
| `npm run dev` | Express (`node --watch`, :3000) y Next (:3001) a la vez |
| `npm run build` / `npm start` | Compila / sirve la interfaz |
| `npm test` | Pruebas del servidor (`node --test`); no gastan nada de OpenAI (usan un modelo simulado) |
| `npm run typecheck` / `npm run lint` | TypeScript y ESLint |

## 5. Rutas de la API

| Método | Ruta | Descripción | Respuestas |
|---|---|---|---|
| GET | `/api/estado` | Comprueba el servicio | `200 {status:"ok"}` |
| GET | `/api/tarifas` | Tarifas del servidor | `200` |
| POST | `/api/presupuesto` | Presupuesto de una solicitud directa (contrato original) | `200` · `400` |
| GET | `/api/catalogo` | Servicios disponibles | `200 {moneda, servicios[]}` |
| POST | `/api/propuesta` | `{cliente, descripcion}` → la IA propone servicios | `200` · `400` · `429` · `502` · `504` |
| POST | `/api/presupuesto/confirmar` | `{servicios:[{id}], paginas?}` → líneas y total | `200` · `400` |
| POST | `/api/presupuesto/pdf` | `{cliente, resumen, servicios, paginas, pendientes}` → PDF | `200 application/pdf` · `400` |

Los errores son siempre JSON `{ "error": "...", "detalles": ["..."] }`. Cualquier otra ruta devuelve `404` JSON.

- **`/api/propuesta`** — `400` si `cliente` o `descripcion` están vacíos o la descripción supera 1500 caracteres; `429` si una IP supera 10 solicitudes en 10 minutos; `502` si falla OpenAI (o no hay clave); `504` si no responde en 20 s. Respuesta `200`: `{cliente, resumen, servicios:[{id, nombre, justificacion, parametros}], pendientes, avisos}`; **nunca lleva importes**. `avisos` informa de lo que se descartó (ids inventados, precios o plazos colados por el modelo…).
- **`/api/presupuesto/confirmar`** — `400` si hay ids desconocidos o repetidos, dos servicios base a la vez, ninguno, o falta/es inválido `paginas` (entero de 1 a 20) cuando se piden páginas adicionales. Devuelve `{lineas:[{id, nombre, descripcion, importe}], total, moneda}`. Da los mismos totales que `POST /api/presupuesto` para selecciones equivalentes (hay un test que recorre 32 combinaciones).
- **`/api/presupuesto/pdf`** — el servidor **recalcula** los importes y pone él la fecha y el nº `PM-AAAAMMDD-XXXX`; ignora cualquier importe recibido.

Ejemplo:

```bash
curl -X POST http://localhost:3000/api/presupuesto/confirmar \
  -H "Content-Type: application/json" \
  -d '{"servicios":[{"id":"corporativa"},{"id":"paginasAdicionales"},{"id":"formulario"}],"paginas":4}'
# → {"lineas":[…],"total":830,"moneda":"EUR"}
```

## 6. Reglas de seguridad y cómo se cumplen

| Regla | Cómo se cumple |
|---|---|
| El servidor calcula todos los importes | `calcularSeleccion()` (server/presupuesto.js) usa solo los ids validados y el catálogo. De `confirmar` y `pdf` solo se leen los ids y `paginas`; `importe`, `precio` o `total` enviados se ignoran (tests). |
| La IA no inventa servicios, precios ni plazos | Salida estructurada con JSON Schema estricto y `id` con `enum` del catálogo **y** una segunda validación en código propio (`ia/validarRespuesta.js`): descarta ids desconocidos, repetidos y un segundo servicio base, y elimina frases con importes o plazos. Las instrucciones tampoco incluyen precios. |
| La descripción del cliente es dato no confiable | Va entre `<descripcion_cliente>…</descripcion_cliente>` (se eliminan etiquetas que intenten cerrarla), las instrucciones indican ignorar órdenes dentro de ella, y aunque el modelo obedeciera, la respuesta pasa por la validación anterior: lo máximo que puede ocurrir es una propuesta de servicios del catálogo. |
| `OPENAI_API_KEY` solo en entorno | Se lee de `process.env` en el servidor. `.env*` está ignorado salvo `.env.example` (`!.env.example`). Se revisó el historial git completo: sin claves. |
| Coste controlado | `gpt-4.1-mini`, temperatura 0,1, máx. 600 tokens de salida, descripción ≤ 1500 caracteres, sin reintentos, timeout 20 s y límite de 10 propuestas por IP cada 10 min (en memoria: en Vercel cuenta por instancia, así que **el tope de gasto del panel de OpenAI es la protección real**). |
| Errores sin filtrar detalles | Un fallo de OpenAI se registra en el log del servidor y al cliente solo llega un mensaje genérico (test con una clave falsa en el error). |

## 7. Catálogo y cálculo

[server/catalogo.js](server/catalogo.js) se **deriva de [server/tarifas.js](server/tarifas.js)** (no hay precios escritos a mano). Hay tres clases de servicio:

| Clase | Servicios | Precio | Notas |
|---|---|---|---|
| `base` (mutuamente excluyentes) | `landing` · `corporativa` | 300 € · 600 € | Incluyen la primera página |
| `paginas` | `paginasAdicionales` | 50 € por página adicional | Necesita `paginas` (total, entero de 1 a 20) |
| `extra` | `formulario` · `segundoIdioma` | 80 € · 150 € | Precio fijo |

Si falta un parámetro, se pide al usuario; **nunca se inventa**. Sin impuestos ni descuentos.

**Ejemplo:** `corporativa` + `paginasAdicionales` (`paginas: 4`) + `formulario` → 600 + (4 − 1) × 50 + 80 = **830 €**.

`POST /api/presupuesto` conserva su contrato original (cuatro campos obligatorios, 400 con un mensaje por error, propiedades extra ignoradas, `__proto__` inofensivo).

## 8. El PDF y la decisión de librería

Se genera **en el servidor** con [`pdfmake`](https://pdfmake.github.io/docs/) (plantilla en [server/pdf/plantilla.js](server/pdf/plantilla.js)): A4, fondo blanco, márgenes amplios, Roboto (con tildes), tinta casi negra y grises, líneas de 0,5 pt y un único acento azul `#0A84FF` en la línea bajo la cabecera y en el total. Sin logos ni rellenos. Incluye cabecera (marca, «PRESUPUESTO», nº y fecha), cliente, resumen, tabla de servicios con importes a la derecha, total, «Aclaraciones y aspectos pendientes de concretar» (o «Sin aspectos pendientes») y pie «Importes calculados por el servidor. Sin impuestos aplicados.» con paginación x/y. No contiene plazos, validez ni condiciones que no existan.

| Opción | A favor | En contra | Decisión |
|---|---|---|---|
| **pdfmake** | Descriptivo (tablas, pie con paginación, saltos de página), JS puro, sin navegador | Peso de las fuentes incluidas | ✅ Elegida |
| PDFKit | Más bajo nivel y ligero | Tablas y paginación a mano | Plan B si pdfmake fallara en Vercel |
| `@react-pdf/renderer` | JSX | Peor ajuste a una función Express; layout más frágil | Descartada |
| Puppeteer / HTML→PDF | Maquetación libre con CSS | Un Chromium dentro de una función serverless: pesado, lento y frágil | Descartada |

Las tipografías se leen a memoria con `require.resolve` y se incluyen explícitamente en la función (`includeFiles` en `vercel.json`). pdfmake tiene desactivado el acceso a URLs y a archivos locales.

## 9. Pruebas

```bash
npm test      # 55 pruebas, sin red ni clave (el modelo está simulado)
```

```
ℹ tests 55
ℹ pass 55
ℹ fail 0
```

### 9.1 Los seis escenarios de la propuesta con IA

«Obtenido» es lo que comprueban las pruebas automáticas ([server/test/propuesta.test.js](server/test/propuesta.test.js), [server/test/pdf.test.js](server/test/pdf.test.js)) con un cliente OpenAI simulado, para que cada escenario sea reproducible y gratuito.

| # | Enviado | Esperado | Obtenido |
|---|---|---|---|
| 1 | Restaurante: «carta, sistema de reservas, español e inglés» | `200` con `corporativa`, `paginasAdicionales`, `formulario`, `segundoIdioma`; sin importes en la respuesta | ✅ `200`; los cuatro servicios; `paginasAdicionales` pide el parámetro `paginas`; sin `importe`/`precio` |
| 2 | «Quiero algo en internet para mi negocio» (ambigua) | `200` sin inventar: las dudas van a `pendientes` | ✅ `200`; `servicios: []`; 2 dudas en `pendientes` |
| 3 | «Tienda online con pago con tarjeta» (no ofrecido) | Va a `pendientes`, no a `servicios` | ✅ solo `corporativa` en servicios; la tienda online en `pendientes` |
| 4 | `descripcion` vacía o solo espacios (también `undefined` y `42`) | `400` y **no** se llama a OpenAI | ✅ `400 "Describe tu proyecto…"`; 0 llamadas al modelo |
| 5 | El modelo falla / no responde | `502` / `504` en JSON y la API sigue funcionando | ✅ `502` (sin filtrar el detalle del proveedor) y `504` en < 2 s; `/api/estado` y `/confirmar` siguen en `200`; la propuesta se recupera después |
| 6 | Propuesta de 4 servicios; el usuario quita `segundoIdioma`, cambia a `landing`, pone 3 páginas | `confirmar` y PDF reflejan la selección final: 300 + 2×50 + 80 = **480 €** | ✅ el PDF (texto extraído con pdfjs) contiene *Landing page*, «2 páginas adicionales (3 en total)», *Formulario* y **480,00 €**; no aparecen *Segundo idioma*, *Web corporativa* ni 1.030,00 € |

Pruebas adicionales de la IA y el PDF: id inventado (`seoAvanzado`, `__proto__`) descartado con aviso; dos bases o duplicados → una sola base; precios y plazos colados por el modelo eliminados; cliente vacío / descripción de 1501 caracteres → `400`; respuesta no JSON, vacía, rechazada o incompleta → `502`; sin clave → `502` claro; `429` tras 10 solicitudes por IP; descripción que intenta cerrar la etiqueta delimitadora; importes enviados por el cliente a `/confirmar` y `/pdf` → ignorados; id desconocido en `/confirmar` → `400`; PDF paginado con pie `x/y`; tildes y «¿…?» correctos en el PDF.

### 9.2 Casos reales con OpenAI

Ejecutados con `gpt-4.1-mini` contra la API real (3 llamadas, una por caso). Datos ficticios. Importes: ninguno en la respuesta, como corresponde.

| # | Enviado | Esperado | Obtenido (`200`, ~1,5–1,9 s) |
|---|---|---|---|
| 1 | «Restaurante familiar… carta, formulario para reservar mesa, español e inglés. Con unas 5 páginas.» | Los cuatro servicios del restaurante | ✅ `corporativa`, `paginasAdicionales`, `formulario`, `segundoIdioma`, con justificación en español. `pendientes`: «Confirmar el número exacto de páginas adicionales…» (el número lo completa el usuario). |
| 2 | «Quiero algo en internet para que me encuentren más clientes.» | Preguntar en `pendientes`, no adivinar | ✅ Propone solo `landing` y plantea 3 dudas: ¿una página o varias?, ¿formulario o contenido adicional?, ¿segundo idioma? |
| 3 | «Tienda online con pago con tarjeta, gestión de stock, SEO y una app móvil.» | Nada de eso es del catálogo | ✅ `servicios: []` y 4 `pendientes`, cada uno marcado como «no contemplado en el catálogo». |

### 9.3 Los nueve casos originales de `POST /api/presupuesto`

El contrato original no ha cambiado (los 23 tests de entonces siguen en verde). Los nueve casos también se pueden ejecutar desde la pestaña **Pruebas** de la interfaz.

| Caso | Solicitud | Esperado | Obtenido |
|---|---|---|---|
| 1 | landing, 1 pág., sin extras | 200 · 300 € | ✅ 200 · 300 |
| 2 | corporativa, 4 pág., formulario | 200 · 830 € | ✅ 200 · 830 |
| 3 | landing, 2 pág., formulario y 2.º idioma | 200 · 580 € | ✅ 200 · 580 |
| 4 | landing, 20 pág. | 200 · 1.250 € | ✅ 200 · 1250 |
| 5 | `paginas: 0` | 400 | ✅ 400 · `"paginas" debe estar entre 1 y 20 (recibido: 0).` |
| 6 | `paginas: 21` | 400 | ✅ 400 · `… (recibido: 21).` |
| 7 | `paginas: 2.5` | 400 | ✅ 400 · `"paginas" debe ser un número entero (recibido: 2.5).` |
| 8 | `tipo: "tienda"` | 400 | ✅ 400 · `"tipo" debe ser "landing" o "corporativa"…` |
| 9 | `formulario: "false"` | 400 | ✅ 400 · `"formulario" debe ser true o false (recibido: "false").` |

## 10. Despliegue en Vercel

Un solo proyecto y una sola URL: Next.js se sirve como siempre y `api/index.js` es la función de Vercel que ejecuta Express (`vercel.json` reescribe `/api/(.*)` hacia ella y fija `maxDuration` en 30 s). En producción no hay CORS ni `API_URL`: todo va por el mismo origen.

1. Sube el repositorio a GitHub (público).
2. En Vercel: **Add New → Project** e importa el repositorio. El preset es *Next.js*; no cambies nada.
3. **Environment Variables:** añade `OPENAI_API_KEY` (y, si quieres, `OPENAI_MODEL`) para *Production* y *Preview*.
4. **Deploy.** Comprueba:
   ```bash
   curl https://TU-URL.vercel.app/api/estado
   curl https://TU-URL.vercel.app/api/catalogo
   ```
5. En el panel de OpenAI, usa un proyecto con **límite de gasto mensual** bajo.

**Plan B** (si la función Express en `api/` no conviviera con Next en un mismo proyecto): `output: "export"` en Next y servir los estáticos desde Express, como un único proyecto Express en Vercel.

## 11. Interfaz

Interfaz estilo iOS: vidrio sutil sobre un fondo de manchas difuminadas, tipografía Geist, iconos Phosphor, modo claro y oscuro (botón o tecla `d`) y un único acento azul. Tres secciones:

| Sección | Qué muestra |
|---|---|
| **Presupuesto** | El flujo de tres pasos (§1): solicitud con contador de caracteres y errores 400 del servidor; propuesta con interruptores, «añadir servicio», parámetros que faltan (bloquean «Continuar») y pendientes en aviso ámbar; presupuesto con totales del servidor y vista previa del PDF. Si falla la IA hay un estado de error con «Reintentar» que conserva lo escrito. |
| **Catálogo** | `GET /api/catalogo`: servicios, qué incluyen y su precio. |
| **Pruebas** | Marcador X/9 y una tarjeta por cada caso de `POST /api/presupuesto`. |

El navegador **no calcula ningún importe**: solo muestra lo que devuelve el servidor.
