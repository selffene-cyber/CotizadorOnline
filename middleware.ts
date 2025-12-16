import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    
    // Log para debugging
    console.log('[Middleware] Petición recibida:', {
      pathname,
      method: request.method,
      url: request.url,
    });

    // Permitir todas las peticiones por ahora
    return NextResponse.next();
  } catch (error) {
    console.error('[Middleware] Error:', error);
    // En caso de error, permitir la petición de todas formas
    return NextResponse.next();
  }
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



