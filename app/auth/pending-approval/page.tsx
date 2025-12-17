'use client';

import { useAuth } from '@/lib/supabase-auth-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PendingApprovalPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const checkAccess = async () => {
      if (!authLoading && user) {
        // Verificar si el usuario ya tiene acceso aprobado
        const { createSupabaseClient } = await import('@/supabase/config');
        const supabase = createSupabaseClient();
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        // Si hay error o el usuario existe en public.users, tiene acceso aprobado
        if (userData && !userError) {
          // Usuario tiene acceso, verificar si tiene empresa
          const { data: membershipData } = await supabase
            .from('memberships')
            .select('tenant_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();

          if (!mounted) return;

          if (membershipData) {
            // Tiene empresa, redirigir al dashboard
            router.replace('/dashboard');
          } else {
            // No tiene empresa, redirigir a onboarding
            router.replace('/onboarding');
          }
          return;
        }

        // Verificar estado de la solicitud
        const { data: requestData, error: requestError } = await supabase
          .from('access_requests')
          .select('status, id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!mounted) return;

        // Si hay error al consultar (tabla no existe, permisos, etc.)
        if (requestError) {
          console.error('[PendingApproval] Error consultando solicitud:', {
            code: requestError.code,
            message: requestError.message,
            details: requestError.details,
            hint: requestError.hint,
          });
          
          // Si la tabla no existe, mostrar mensaje de error
          if (requestError.code === 'PGRST116' || requestError.code === '42P01' || requestError.message?.includes('does not exist')) {
            console.error('[PendingApproval] Tabla access_requests no existe. Ejecuta el script schema-multi-tenant.sql en Supabase.');
            setChecking(false);
            return;
          }
          
          // Si es error de permisos, intentar crear la solicitud de todas formas
          // (puede que el usuario tenga permisos para insertar pero no para leer)
        }

        if (requestData) {
          // Hay una solicitud existente
          if (requestData.status === 'approved') {
            // Solicitud aprobada pero usuario no creado aún (raro)
            router.replace('/onboarding');
            return;
          } else if (requestData.status === 'rejected') {
            // Solicitud rechazada
            router.replace('/login?error=access_rejected');
            return;
          } else if (requestData.status === 'pending') {
            // Solicitud pendiente, mostrar página de espera
            setChecking(false);
            return;
          }
        }

        // No hay solicitud o hay un error, intentar crear una
        if (!requestData) {
          console.log('[PendingApproval] No hay solicitud, creando una nueva...');
          const { data: insertData, error: insertError } = await supabase
            .from('access_requests')
            .insert({
              user_id: user.id,
              email: user.email || '',
              status: 'pending',
            })
            .select()
            .single();

          if (!mounted) return;

          if (insertError) {
            // Error al crear solicitud
            console.error('[PendingApproval] Error creando solicitud:', {
              code: insertError.code,
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
              fullError: JSON.stringify(insertError, null, 2),
            });
            
            // Si el error es "ya existe" (23505), la solicitud ya fue creada
            // Probablemente por el trigger o por otra petición simultánea
            if (insertError.code === '23505' || insertError.message?.includes('duplicate') || insertError.message?.includes('unique')) {
              console.log('[PendingApproval] Solicitud ya existe (probablemente creada por trigger), verificando nuevamente...');
              // Esperar un poco y verificar de nuevo
              setTimeout(async () => {
                if (!mounted) return;
                const { data: retryData } = await supabase
                  .from('access_requests')
                  .select('status')
                  .eq('user_id', user.id)
                  .maybeSingle();
                
                if (retryData?.status === 'pending') {
                  setChecking(false);
                } else {
                  // Si aún no hay solicitud, mostrar página de todas formas
                  setChecking(false);
                }
              }, 1000);
              return;
            }
            
            // Si el error es de permisos o tabla no existe, mostrar página de todas formas
            // (puede que el usuario tenga permisos limitados pero la solicitud se creó)
            if (insertError.code === '42501' || insertError.code === '42P01' || insertError.message?.includes('permission denied')) {
              console.warn('[PendingApproval] Error de permisos al crear solicitud, pero mostrando página de espera de todas formas');
            }
          } else if (insertData) {
            console.log('[PendingApproval] Solicitud creada exitosamente:', insertData.id);
          } else {
            // No hay error pero tampoco hay data (raro)
            console.warn('[PendingApproval] Inserción completada pero no se recibió data');
          }
        }
        
        // Mostrar página de espera de todas formas
        setChecking(false);
      } else if (!authLoading && !user) {
        // No autenticado, redirigir al login
        if (mounted) {
          router.replace('/login');
        }
      }
    };

    checkAccess();

    return () => {
      mounted = false;
    };
  }, [user, authLoading, router]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Solicitud Pendiente
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Tu solicitud de acceso está siendo revisada
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-700 mb-4">
            Hemos recibido tu solicitud de acceso. Un administrador la revisará y te notificará cuando sea aprobada.
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Recibirás un email en <strong>{user?.email}</strong> cuando tu solicitud sea aprobada.
          </p>
          <p className="text-xs text-gray-500">
            Una vez aprobada, podrás crear tu empresa y comenzar a usar la aplicación.
          </p>
        </div>

        <div className="text-sm text-gray-500">
          <p>¿Necesitas ayuda? Contacta al administrador del sistema.</p>
        </div>
      </div>
    </div>
  );
}

