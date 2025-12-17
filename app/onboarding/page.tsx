'use client';

// Página de onboarding para crear empresa después de aprobación
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase-auth-context';
import { createTenant } from '@/supabase/tenants';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!authLoading && user) {
        // Verificar si el usuario tiene acceso aprobado
        const { createSupabaseClient } = await import('@/supabase/config');
        const supabase = createSupabaseClient();
        
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!userData) {
          // Usuario no tiene acceso, verificar solicitud
          const { data: requestData } = await supabase
            .from('access_requests')
            .select('status')
            .eq('user_id', user.id)
            .single();

          if (requestData?.status === 'pending') {
            // Solicitud pendiente, redirigir a página de espera
            router.push('/auth/pending-approval');
            return;
          } else if (requestData?.status === 'rejected') {
            // Solicitud rechazada
            router.push('/login?error=access_rejected');
            return;
          } else {
            // No hay solicitud, redirigir a login
            router.push('/login');
            return;
          }
        }

        // Verificar si ya tiene empresa
        const { data: membershipData } = await supabase
          .from('memberships')
          .select('tenant_id')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (membershipData) {
          // Ya tiene empresa, redirigir al dashboard
          router.push('/dashboard');
          return;
        }

        // Usuario tiene acceso pero no tiene empresa, mostrar formulario
        setChecking(false);
      } else if (!authLoading && !user) {
        // No autenticado, redirigir al login
        router.push('/login');
      }
    };

    checkAccess();
  }, [user, authLoading, router]);

  // Generar slug automáticamente desde el nombre
  useEffect(() => {
    if (companyName) {
      const slug = companyName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
        .replace(/[^a-z0-9]+/g, '-') // Reemplazar espacios y caracteres especiales con guiones
        .replace(/^-+|-+$/g, ''); // Eliminar guiones al inicio y final
      setCompanySlug(slug);
    }
  }, [companyName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!user) {
      setError('No estás autenticado');
      setLoading(false);
      return;
    }

    if (!companyName || !companySlug) {
      setError('Por favor completa todos los campos');
      setLoading(false);
      return;
    }

    try {
      // Crear la empresa (tenant)
      await createTenant(companyName, companySlug, user.id);
      
      // Redirigir al dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error creando empresa:', err);
      setError(err.message || 'Error al crear la empresa');
      setLoading(false);
    }
  };

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
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ¡Bienvenido!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Crea tu empresa para comenzar
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Nombre de la empresa"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              placeholder="Ej: Mi Empresa S.A."
              autoComplete="organization"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug de la empresa (URL)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">cot.piwisuite.cl/</span>
                <input
                  type="text"
                  value={companySlug}
                  onChange={(e) => setCompanySlug(e.target.value)}
                  required
                  placeholder="mi-empresa"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  pattern="[a-z0-9-]+"
                  title="Solo letras minúsculas, números y guiones"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Este será el identificador único de tu empresa en la URL
              </p>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !companyName || !companySlug}
          >
            {loading ? 'Creando empresa...' : 'Crear empresa y continuar'}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-500">
          <p>¿Necesitas ayuda? Contacta al administrador del sistema.</p>
        </div>
      </div>
    </div>
  );
}

