import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/supabase-auth-context";

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
  if (typeof window === 'undefined') {
    try {
      console.log('[RootLayout] Renderizando layout en servidor');
      // Verificar variables de entorno
      const hasUrl = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
      const hasKey = !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);
      console.log('[RootLayout] Variables de entorno:', { hasUrl, hasKey });
    } catch (error) {
      console.error('[RootLayout] Error verificando variables:', error);
    }
  }

  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
