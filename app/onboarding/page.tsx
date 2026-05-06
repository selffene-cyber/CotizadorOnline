'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/jwt-auth-context';
import { createTenant } from '@/supabase/tenants';
import { api } from '@/lib/api-client';
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
        try {
          const data = await api.auth.me();
          const accessStatus = data.access_request_status;

          if (accessStatus === 'pending') {
            router.push('/auth/pending-approval');
            return;
          } else if (accessStatus === 'rejected') {
            router.push('/login?error=access_rejected');
            return;
          }

          if (data.membership) {
            router.push('/dashboard');
            return;
          }

          setChecking(false);
        } catch {
          setChecking(false);
        }
      } else if (!authLoading && !user) {
        router.push('/login');
      }
    };

    checkAccess();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (companyName) {
      const slug = companyName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setCompanySlug(slug);
    }
  }, [companyName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!user) {
      setError('Debes iniciar sesión primero');
      setLoading(false);
      return;
    }

    if (!companyName.trim()) {
      setError('El nombre de la empresa es obligatorio');
      setLoading(false);
      return;
    }

    if (!companySlug.trim()) {
      setError('El slug no puede estar vacío');
      setLoading(false);
      return;
    }

    try {
      await createTenant(companyName, companySlug, user.id);
      router.push(`/${companySlug}/dashboard`);
    } catch (err: any) {
      setError(err.message || 'Error al crear la empresa. Intenta de nuevo.');
    } finally {
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
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Crear Empresa
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Configura tu empresa para comenzar a usar el sistema
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Empresa
              </label>
              <Input
                id="company-name"
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ej: Mi Empresa SpA"
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10"
              />
            </div>

            <div>
              <label htmlFor="company-slug" className="block text-sm font-medium text-gray-700 mb-1">
                Slug (URL identifier)
              </label>
              <div className="flex items-center">
                <span className="text-gray-500 text-sm mr-2">cot.piwisuite.cl/</span>
                <Input
                  id="company-slug"
                  type="text"
                  required
                  value={companySlug}
                  onChange={(e) => setCompanySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="mi-empresa"
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Empresa'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}