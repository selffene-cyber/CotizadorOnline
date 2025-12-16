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

    // Detectar tenant desde la URL
    // Formato: /{slug}/... o /{slug}
    const pathParts = pathname.split('/').filter(Boolean);
    const possibleSlug = pathParts[0];

    // Rutas que no son tenants
    const nonTenantRoutes = ['login', 'admin', 'dashboard', 'invite', 'api', '_next', 'favicon.ico'];
    
    const response = NextResponse.next();

    // Si hay un slug que no es una ruta especial, podría ser un tenant
    if (possibleSlug && !nonTenantRoutes.includes(possibleSlug)) {
      // Establecer cookie con el slug (el contexto del cliente lo usará para obtener el tenant)
      response.cookies.set('tenant_slug', possibleSlug, {
        path: '/',
        maxAge: 60 * 60 * 24, // 24 horas
      });
    } else {
      // Limpiar cookie si no hay tenant
      response.cookies.delete('tenant_slug');
    }

    return response;
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



