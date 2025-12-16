'use client';

// Página principal - redirige según autenticación
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase-auth-context';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Solo redirigir cuando la carga esté completa y tengamos una respuesta válida
    if (!loading) {
      // Si hay un usuario autenticado, ir al dashboard
      if (user) {
        router.push('/dashboard');
      } else {
        // Si no hay usuario, ir al login
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  // Mostrar loading mientras se verifica la autenticación
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando...</p>
      </div>
    </div>
  );
}
