import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/jwt-auth-context";
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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const githubClientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '';

  return (
    <html lang="es">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__ENV__ = {
                NEXT_PUBLIC_API_URL: ${JSON.stringify(apiUrl)},
                NEXT_PUBLIC_GOOGLE_CLIENT_ID: ${JSON.stringify(googleClientId)},
                NEXT_PUBLIC_GITHUB_CLIENT_ID: ${JSON.stringify(githubClientId)}
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