import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Next.js aceptará cualquier hostname cuando esté detrás de un proxy (Easypanel)
  // No necesitamos configuración adicional de hostname
};

export default nextConfig;
