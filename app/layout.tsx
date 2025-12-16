import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/supabase-auth-context";
import { TenantProvider } from "@/lib/tenant-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cotizador Pro",
  description: "Sistema de cotizaciones profesionales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Log para debugging (solo en servidor)
  try {
    console.log('[RootLayout] Renderizando layout en servidor');
    // Verificar variables de entorno
    const hasUrl = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
    const hasKey = !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);
    console.log('[RootLayout] Variables de entorno:', { hasUrl, hasKey });
  } catch (error) {
    console.error('[RootLayout] Error verificando variables:', error);
  }

  // Obtener variables de entorno para inyectar en el cliente
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  return (
    <html lang="es">
      <head>
        {/* Inyectar variables de entorno en el cliente */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__ENV__ = {
                NEXT_PUBLIC_SUPABASE_URL: ${JSON.stringify(supabaseUrl)},
                NEXT_PUBLIC_SUPABASE_ANON_KEY: ${JSON.stringify(supabaseAnonKey)},
                SUPABASE_URL: ${JSON.stringify(supabaseUrl)},
                SUPABASE_ANON_KEY: ${JSON.stringify(supabaseAnonKey)}
              };
            `,
          }}
        />
      </head>
            <body className={inter.className}>
              <AuthProvider>
                <TenantProvider>
                  {children}
                </TenantProvider>
              </AuthProvider>
            </body>
    </html>
  );
}
