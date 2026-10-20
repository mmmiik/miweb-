import type { NextConfig } from "next"

// URL de la API Express (backend/). Se puede cambiar con la variable API_URL.
const API_URL = process.env.API_URL ?? "http://localhost:3000"

const nextConfig: NextConfig = {
  // Las peticiones a /api/* se reenvían a la API Express: el navegador habla
  // siempre con el mismo origen, así que no hace falta CORS.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }]
  },
}

export default nextConfig
