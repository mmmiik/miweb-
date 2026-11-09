// Arranque SOLO para desarrollo local. En Vercel no se usa: la función
// api/index.js importa la app de app.js y Vercel se encarga de escuchar.
import { app } from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API "Presupuesta mi web" escuchando en http://localhost:${PORT}`);
});
