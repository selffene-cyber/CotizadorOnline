import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Las rutas públicas que no requieren autenticación
  const publicPaths = ['/login'];
  const { pathname } = request.nextUrl;

  // Si es una ruta pública, permitir acceso
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Para rutas protegidas, el cliente manejará la redirección
  // Firebase Auth requiere verificación del lado del cliente
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};



