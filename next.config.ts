import type { NextConfig } from "next"

// En desarrollo, el navegador habla con Next (:3001) y Next reenvía /api/* al
// servidor Express local (:3000). En producción no hay rewrite: /api/* lo sirve
// la función de Vercel (api/index.js) en el mismo origen, sin CORS.
const nextConfig: NextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return []
    const destino = process.env.API_URL ?? "http://localhost:3000"
    return [{ source: "/api/:path*", destination: `${destino}/api/:path*` }]
  },
}

export default nextConfig
