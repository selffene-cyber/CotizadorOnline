import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Obtener la URL base correcta (producción o desarrollo)
  // Priorizar variables de entorno, luego headers de la petición, luego origin de la URL
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl && process.env.VERCEL_URL) {
    siteUrl = `https://${process.env.VERCEL_URL}`;
  }
  if (!siteUrl) {
    const forwardedHost = request.headers.get('x-forwarded-host');
    if (forwardedHost) {
      siteUrl = `https://${forwardedHost}`;
    }
  }
  if (!siteUrl) {
    siteUrl = requestUrl.origin;
  }

  console.log('[Auth Callback] Llamado con:', { 
    code: code ? 'presente' : 'ausente', 
    error,
    errorDescription,
    origin: requestUrl.origin,
    siteUrl,
    pathname: requestUrl.pathname,
    allParams: Object.fromEntries(requestUrl.searchParams),
  });

  // Si hay un error de OAuth (incluyendo cancelación), limpiar sesión y redirigir al login
  if (error) {
    console.error('[Auth Callback] Error de OAuth:', error, errorDescription);
    
    // Limpiar cualquier sesión que pueda existir
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
      
      if (supabaseUrl && supabaseKey) {
        const cookieStore = await cookies();
        const supabase = createServerClient(supabaseUrl, supabaseKey, {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: any) {
              try {
                cookieStore.set({ name, value, ...options });
              } catch (error) {
                // Ignorar errores de cookies
              }
            },
            remove(name: string, options: any) {
              try {
                cookieStore.set({ name, value: '', ...options });
              } catch (error) {
                // Ignorar errores de cookies
              }
            },
          },
        });
        
        // Cerrar sesión si existe
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('[Auth Callback] Error limpiando sesión:', err);
    }
    
    // Redirigir al login con mensaje de error apropiado
    const errorMessage = error === 'access_denied' || errorDescription?.includes('cancel') 
      ? 'Inicio de sesión cancelado' 
      : error;
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorMessage)}`, siteUrl));
  }

  // Si no hay código, también puede ser una cancelación o error
  if (!code) {
    console.warn('[Auth Callback] No se recibió código de autorización');
    
    // Limpiar cualquier sesión que pueda existir
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
      
      if (supabaseUrl && supabaseKey) {
        const cookieStore = await cookies();
        const supabase = createServerClient(supabaseUrl, supabaseKey, {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: any) {
              try {
                cookieStore.set({ name, value, ...options });
              } catch (error) {
                // Ignorar errores de cookies
              }
            },
            remove(name: string, options: any) {
              try {
                cookieStore.set({ name, value: '', ...options });
              } catch (error) {
                // Ignorar errores de cookies
              }
            },
          },
        });
        
        // Cerrar sesión si existe
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('[Auth Callback] Error limpiando sesión:', err);
    }
    
    return NextResponse.redirect(new URL('/login?error=no_code', siteUrl));
  }

  if (code) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

      if (!supabaseUrl || !supabaseKey) {
        console.error('[Auth Callback] Variables de entorno de Supabase no configuradas');
        return NextResponse.redirect(new URL('/login?error=config_error', siteUrl));
      }

      // Crear cliente de servidor con manejo de cookies
      const cookieStore = await cookies();
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Las cookies pueden fallar en algunos casos, continuar de todas formas
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // Las cookies pueden fallar en algunos casos, continuar de todas formas
            }
          },
        },
      });

      // Intercambiar el código por una sesión
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('[Auth Callback] Error intercambiando código:', exchangeError);
        return NextResponse.redirect(new URL('/login?error=auth_failed', siteUrl));
      }

      if (!data.user) {
        console.error('[Auth Callback] No se obtuvo usuario después del intercambio');
        return NextResponse.redirect(new URL('/login?error=no_user', siteUrl));
      }

      // Verificar si el usuario tiene acceso aprobado
      // Primero verificar si existe en public.users (tiene acceso)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (userData) {
        // Usuario existe en public.users, tiene acceso aprobado
        console.log('[Auth Callback] Usuario tiene acceso aprobado, redirigiendo al dashboard');
        
        // Verificar si tiene empresa (tenant)
        const { data: membershipData } = await supabase
          .from('memberships')
          .select('tenant_id')
          .eq('user_id', data.user.id)
          .limit(1)
          .single();

        if (!membershipData) {
          // Usuario no tiene empresa, redirigir a onboarding
          console.log('[Auth Callback] Usuario no tiene empresa, redirigiendo a onboarding');
          return NextResponse.redirect(new URL('/onboarding', siteUrl));
        }

        // Usuario tiene empresa, redirigir al dashboard
        return NextResponse.redirect(new URL('/dashboard', siteUrl));
      }

      // Usuario no existe en public.users, verificar si tiene solicitud pendiente
      const { data: requestData } = await supabase
        .from('access_requests')
        .select('status')
        .eq('user_id', data.user.id)
        .single();

      if (requestData) {
        if (requestData.status === 'approved') {
          // Solicitud aprobada pero usuario no creado (raro, pero puede pasar)
          console.log('[Auth Callback] Solicitud aprobada pero usuario no creado, redirigiendo a onboarding');
          return NextResponse.redirect(new URL('/onboarding', siteUrl));
        } else if (requestData.status === 'pending') {
          // Solicitud pendiente, redirigir a página de espera
          console.log('[Auth Callback] Solicitud pendiente de aprobación');
          return NextResponse.redirect(new URL('/auth/pending-approval', siteUrl));
        } else if (requestData.status === 'rejected') {
          // Solicitud rechazada, redirigir a login con mensaje
          console.log('[Auth Callback] Solicitud rechazada');
          return NextResponse.redirect(new URL('/login?error=access_rejected', siteUrl));
        }
      }

      // No hay solicitud, crear una nueva (por si el trigger falló)
      console.log('[Auth Callback] No hay solicitud, creando una nueva');
      try {
        const { data: insertData, error: requestError } = await supabase
          .from('access_requests')
          .insert({
            user_id: data.user.id,
            email: data.user.email || '',
            status: 'pending',
          })
          .select()
          .single();

        if (requestError) {
          // Si el error es "ya existe" (23505), la solicitud ya fue creada por el trigger
          if (requestError.code === '23505' || requestError.message?.includes('duplicate') || requestError.message?.includes('unique')) {
            console.log('[Auth Callback] Solicitud ya existe (probablemente creada por trigger)');
          } else {
            console.error('[Auth Callback] Error creando access_request:', {
              code: requestError.code,
              message: requestError.message,
              details: requestError.details,
              hint: requestError.hint,
            });
          }
        } else if (insertData) {
          console.log('[Auth Callback] Solicitud creada exitosamente:', insertData.id);
        }
      } catch (err: any) {
        console.error('[Auth Callback] Error inesperado creando access_request:', {
          message: err?.message || 'Error desconocido',
          error: err,
        });
      }

      // Redirigir a página de espera de aprobación
      return NextResponse.redirect(new URL('/auth/pending-approval', siteUrl));
    } catch (err: any) {
      console.error('[Auth Callback] Error inesperado:', err);
      return NextResponse.redirect(new URL('/login?error=unexpected_error', siteUrl));
    }
  }

  // Si no hay código, redirigir al login
  console.warn('[Auth Callback] No se recibió código de autorización');
  return NextResponse.redirect(new URL('/login?error=no_code', siteUrl));
}

