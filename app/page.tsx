'use client';

// Página principal - redirige según autenticación
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/supabase-auth-context';

function HomeContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // PRIORIDAD 1: Si hay un código de OAuth en la URL, redirigir inmediatamente al callback
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    if (code || error) {
      // Construir la URL del callback con todos los parámetros
      const params = new URLSearchParams();
      if (code) params.set('code', code);
      if (error) params.set('error', error);
      const errorDescription = searchParams.get('error_description');
      if (errorDescription) params.set('error_description', errorDescription);
      
      // Redirigir inmediatamente sin esperar nada más
      console.log('[Home] Detectado código OAuth, redirigiendo a /auth/callback');
      router.replace(`/auth/callback?${params.toString()}`);
      return;
    }

    // PRIORIDAD 2: Solo redirigir cuando la carga esté completa y tengamos una respuesta válida
    if (!loading) {
      // Si hay un usuario autenticado, ir al dashboard
      if (user) {
        router.push('/dashboard');
      } else {
        // Si no hay usuario, ir al login
        router.push('/login');
      }
    }
  }, [user, loading, router, searchParams]);

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

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
