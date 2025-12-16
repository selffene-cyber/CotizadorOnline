import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Configuración para funcionar detrás de un proxy (Easypanel/Traefik)
  // Acepta cualquier hostname cuando está detrás de un proxy
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Forwarded-Host',
            value: 'cot.piwisuite.cl',
          },
          {
            key: 'X-Forwarded-Proto',
            value: 'https',
          },
        ],
      },
    ];
  },
  experimental: {
    // Asegurar que funcione correctamente con proxies
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
