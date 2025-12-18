'use client';

// Página para aceptar invitaciones
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/supabase-auth-context';
import { getInvitationByToken, acceptInvitation, rejectInvitation, type Invitation } from '@/supabase/invitations';
import Button from '@/components/ui/Button';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Decodificar el token de la URL (por si viene codificado)
  const rawToken = params?.token as string;
  const token = rawToken ? decodeURIComponent(rawToken) : null;

  useEffect(() => {
    if (!token) {
      setError('Token de invitación no válido');
      setLoading(false);
      return;
    }

    const loadInvitation = async () => {
      try {
        const inv = await getInvitationByToken(token);
        if (!inv) {
          setError('Invitación no encontrada o expirada');
        } else {
          setInvitation(inv);
        }
      } catch (err: any) {
        console.error('Error loading invitation:', err);
        setError(err.message || 'Error al cargar la invitación');
      } finally {
        setLoading(false);
      }
    };

    loadInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!user || !invitation || !token) return;

    setProcessing(true);
    setError(null);

    try {
      await acceptInvitation(token, user.id);
      alert('¡Invitación aceptada! Serás redirigido al dashboard.');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Error al aceptar la invitación');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!token) return;
    
    if (!confirm('¿Estás seguro de que quieres rechazar esta invitación?')) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await rejectInvitation(token);
      alert('Invitación rechazada');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error rejecting invitation:', err);
      setError(err.message || 'Error al rechazar la invitación');
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">✕</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/dashboard')}>Ir al Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invitación Requiere Autenticación</h1>
            <p className="text-gray-600 mb-6">
              Necesitas iniciar sesión para aceptar esta invitación.
            </p>
            <Button onClick={() => router.push(`/login?redirect=/invite/${token || ''}`)}>
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  // Verificar que el email del usuario coincida (case-insensitive)
  const userEmail = user.email?.toLowerCase().trim() || '';
  const invitationEmail = invitation.email.toLowerCase().trim();
  
  if (userEmail !== invitationEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-yellow-600 text-5xl mb-4">⚠</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email No Coincide</h1>
            <p className="text-gray-600 mb-2">
              Esta invitación fue enviada a: <strong>{invitation.email}</strong>
            </p>
            <p className="text-gray-600 mb-4">
              Tu email actual es: <strong>{user.email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Por favor, cierra sesión e inicia sesión con el email correcto para aceptar esta invitación.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={async () => {
                  await signOut();
                  router.push(`/login?redirect=/invite/${token}`);
                }}
                className="w-full"
              >
                Cerrar Sesión e Iniciar con Email Correcto
              </Button>
              <Button 
                onClick={() => router.push('/dashboard')}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800"
              >
                Ir al Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center">
          <div className="text-blue-600 text-5xl mb-4">✉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitación a Empresa</h1>
          <p className="text-gray-600 mb-6">
            Has sido invitado a unirte a una empresa con el rol de <strong>{invitation.role}</strong>
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleAccept}
              disabled={processing}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {processing ? 'Procesando...' : 'Aceptar Invitación'}
            </Button>
            <Button
              onClick={handleReject}
              disabled={processing}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              Rechazar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

