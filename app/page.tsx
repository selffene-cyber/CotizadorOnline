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
    // Esto es crítico porque Supabase a veces redirige a la raíz en lugar de /auth/callback
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
      console.log('[Home] Detectado código OAuth en raíz, redirigiendo a /auth/callback', { code: code ? 'presente' : 'ausente', error });
      
      // Usar window.location para redirección inmediata (más confiable que router)
      // Usar replace para no dejar historial
      window.location.replace(`/auth/callback?${params.toString()}`);
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
  // Script inline para detectar código OAuth ANTES de que React se monte
  // Esto asegura que la redirección ocurra lo más rápido posible
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (code || error) {
      const params = new URLSearchParams();
      if (code) params.set('code', code);
      if (error) params.set('error', error);
      const errorDescription = urlParams.get('error_description');
      if (errorDescription) params.set('error_description', errorDescription);
      
      console.log('[Home] Script inline detectó código OAuth, redirigiendo inmediatamente');
      window.location.replace(`/auth/callback?${params.toString()}`);
    }
  }

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
