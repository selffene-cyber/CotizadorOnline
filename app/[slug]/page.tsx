'use client';

// Página para rutas de tenant por slug (ej: /mic, /empresa2)
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/supabase-auth-context';
import { getTenantBySlug, getTenantMembers, type Tenant } from '@/supabase/tenants';
import Button from '@/components/ui/Button';

export default function TenantSlugPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);

  const slug = params?.slug as string;

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const loadTenant = async () => {
      try {
        setLoading(true);
        const foundTenant = await getTenantBySlug(slug);

        if (!foundTenant) {
          setTenant(null);
          setLoading(false);
          return;
        }

        setTenant(foundTenant);

        // Si hay usuario autenticado, verificar acceso
        if (user) {
          setCheckingAccess(true);
          try {
            const members = await getTenantMembers(foundTenant.id);
            const userMembership = members.find((m: any) => m.user_id === user.id);
            setHasAccess(!!userMembership);
          } catch (error) {
            console.error('Error checking access:', error);
            setHasAccess(false);
          } finally {
            setCheckingAccess(false);
          }
        }
      } catch (error) {
        console.error('Error loading tenant:', error);
        setTenant(null);
      } finally {
        setLoading(false);
      }
    };

    loadTenant();
  }, [slug, user]);

  // Mostrar loading mientras se carga
  if (loading || authLoading || checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no se encontró el tenant, mostrar 404
  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">404</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Empresa No Encontrada</h1>
            <p className="text-gray-600 mb-6">
              No se encontró una empresa con el slug: <strong>{slug}</strong>
            </p>
            <Button onClick={() => router.push('/login')}>Ir al Login</Button>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, redirigir al login con el slug
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{tenant.name}</h1>
            <p className="text-gray-600 mb-6">
              Necesitas iniciar sesión para acceder a esta empresa.
            </p>
            <Button onClick={() => router.push(`/login?redirect=/${slug}`)}>
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Si el usuario no tiene acceso, mostrar mensaje
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-yellow-600 text-5xl mb-4">⚠</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sin Acceso</h1>
            <p className="text-gray-600 mb-2">
              No tienes acceso a la empresa: <strong>{tenant.name}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Contacta al administrador de la empresa para solicitar acceso.
            </p>
            <Button onClick={() => router.push('/dashboard')}>Ir al Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  // Si tiene acceso, redirigir al dashboard (el contexto del tenant ya está configurado por el middleware)
  useEffect(() => {
    if (hasAccess && tenant) {
      // El middleware ya estableció la cookie del tenant, así que podemos ir al dashboard normal
      router.replace('/dashboard');
    }
  }, [hasAccess, tenant, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirigiendo...</p>
      </div>
    </div>
  );
}
