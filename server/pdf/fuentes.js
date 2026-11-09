// Tipografía del PDF: Roboto (viene con pdfmake, con tildes y ñ). Se leen los .ttf a memoria
// con require.resolve + literal, de modo que el empaquetado de Vercel los detecta y los incluye.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);

let cache;

export function fuentesRoboto() {
  if (cache) return cache;
  const leer = (ruta) => readFileSync(ruta);
  cache = {
    Roboto: {
      normal: leer(require.resolve('pdfmake/fonts/Roboto/Roboto-Regular.ttf')),
      bold: leer(require.resolve('pdfmake/fonts/Roboto/Roboto-Medium.ttf')),
      italics: leer(require.resolve('pdfmake/fonts/Roboto/Roboto-Italic.ttf')),
      bolditalics: leer(require.resolve('pdfmake/fonts/Roboto/Roboto-MediumItalic.ttf')),
    },
  };
  return cache;
}
