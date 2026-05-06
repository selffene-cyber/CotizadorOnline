'use client';

import { useAuth } from '@/lib/jwt-auth-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

export default function PendingApprovalPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAccess = async () => {
      if (!authLoading && user) {
        try {
          const data = await api.auth.me();
          const accessStatus = data.access_request_status;

          if (!mounted) return;

          if (accessStatus === 'approved') {
            if (data.membership) {
              router.replace('/dashboard');
            } else {
              router.replace('/onboarding');
            }
            return;
          } else if (accessStatus === 'rejected') {
            router.replace('/login?error=access_rejected');
            return;
          }
        } catch (error) {
          console.error('[PendingApproval] Error checking access:', error);
        }

        setChecking(false);
      } else if (!authLoading && !user) {
        if (mounted) router.replace('/login');
      }
    };

    checkAccess();
    return () => { mounted = false; };
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