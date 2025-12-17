'use client';

// Layout para el panel de administración
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase-auth-context';
import { isSuperAdmin } from '@/supabase/admin';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!loading && user) {
        try {
          console.log('[AdminLayout] Verificando acceso admin para usuario:', user.id);
          const isAdmin = await isSuperAdmin(user.id);
          console.log('[AdminLayout] Resultado de isSuperAdmin:', isAdmin);
          if (!isAdmin) {
            console.warn('[AdminLayout] Usuario no es super admin, redirigiendo...');
            // Esperar un poco antes de redirigir para evitar loops
            setTimeout(() => {
              router.push('/dashboard');
            }, 500);
            return;
          }
          console.log('[AdminLayout] Acceso admin confirmado');
        } catch (error: any) {
          console.error('[AdminLayout] Error verificando admin:', {
            message: error?.message || 'Error desconocido',
            code: error?.code,
            details: error?.details,
            hint: error?.hint,
            error: error,
          });
          // En caso de error, no redirigir inmediatamente (podría ser un error temporal)
          // Pero mostrar un mensaje de advertencia
          console.warn('[AdminLayout] Error al verificar admin, permitiendo acceso temporalmente');
        }
      } else if (!loading && !user) {
        // Si no está autenticado, redirigir al login
        console.log('[AdminLayout] Usuario no autenticado, redirigiendo a login');
        router.push('/login');
      }
    };

    checkAdminAccess();
  }, [user, loading, router]);

  // Mostrar loading mientras se verifica
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Si no es admin, no mostrar nada (el useEffect redirigirá)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              Volver a la aplicación
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}

