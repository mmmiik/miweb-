// Función de Vercel que sirve toda la API (/api/*). vercel.json reescribe
// cualquier /api/... hacia aquí y Express hace el enrutado.
import { app } from '../server/app.js';

export default app;
