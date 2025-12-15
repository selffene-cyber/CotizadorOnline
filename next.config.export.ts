// Configuración alternativa para Firebase Hosting (export estático)
// NOTA: Esta configuración tiene limitaciones (no SSR, no API Routes)
// Para usar: renombra este archivo a next.config.ts (haz backup del original primero)
// O usa Easypanel/Docker para funcionalidad completa

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Export estático para Firebase Hosting
  images: {
    unoptimized: true, // Necesario para export estático
  },
  /* config options here */
};

export default nextConfig;

