'use client';

// Auth Context con Supabase
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createSupabaseClient, hasValidSupabaseConfig } from '@/supabase/config';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

// Crear un contexto con valores por defecto para evitar errores durante la hidratación
const defaultContextValue: AuthContextType = {
  user: null,
  loading: true,
  signIn: async () => { throw new Error('AuthProvider no está inicializado'); },
  signUp: async () => { throw new Error('AuthProvider no está inicializado'); },
  signOut: async () => {},
  signInWithGithub: async () => { throw new Error('AuthProvider no está inicializado'); },
  signInWithGoogle: async () => { throw new Error('AuthProvider no está inicializado'); },
};

// Crear el contexto con el valor por defecto para que siempre esté disponible
const AuthContext = createContext<AuthContextType>(defaultContextValue);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Intentar inicializar Supabase de forma segura
    let mounted = true;
    let subscription: any = null;
    
    const initAuth = async () => {
      try {
        // Verificar configuración de forma segura
        if (!hasValidSupabaseConfig()) {
          console.warn('[AuthProvider] Supabase no está configurado correctamente');
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        const supabase = createSupabaseClient();

        // Obtener sesión actual
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.error('[AuthProvider] Error getting session:', error);
          }
          if (mounted) {
            setUser(session?.user ?? null);
            setLoading(false);
          }
        } catch (error) {
          console.error('[AuthProvider] Error in getSession:', error);
          if (mounted) {
            setLoading(false);
          }
        }

        // Escuchar cambios de autenticación
        try {
          const {
            data: { subscription: authSubscription },
          } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
              setUser(session?.user ?? null);
              setLoading(false);
            }
          });
          subscription = authSubscription;
        } catch (error) {
          console.error('[AuthProvider] Error setting up auth state listener:', error);
        }
      } catch (error) {
        console.error('[AuthProvider] Error initializing Supabase client:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Solo inicializar en el cliente
    if (typeof window !== 'undefined') {
      initAuth();
    } else {
      // En el servidor, solo marcar como no cargando
      setLoading(false);
    }

    return () => {
      mounted = false;
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          // Ignorar errores al desuscribirse
        }
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!hasValidSupabaseConfig()) {
      throw new Error('Supabase no está configurado');
    }

    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    setUser(data.user);
  };

  const signUp = async (email: string, password: string) => {
    if (!hasValidSupabaseConfig()) {
      throw new Error('Supabase no está configurado');
    }

    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    setUser(data.user);
  };

  const signInWithGithub = async () => {
    if (!hasValidSupabaseConfig()) {
      throw new Error('Supabase no está configurado');
    }

    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const signInWithGoogle = async () => {
    if (!hasValidSupabaseConfig()) {
      throw new Error('Supabase no está configurado');
    }

    if (typeof window === 'undefined') {
      throw new Error('signInWithGoogle solo puede ser llamado en el cliente');
    }

    const supabase = createSupabaseClient();
    
    console.log('[signInWithGoogle] Iniciando OAuth con Google, redirectTo:', `${window.location.origin}/auth/callback`);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('[signInWithGoogle] Error:', error);
      throw new Error(error.message);
    }

    // La redirección se manejará automáticamente por Supabase
    // No necesitamos hacer nada más aquí
    console.log('[signInWithGoogle] OAuth iniciado correctamente, redirigiendo...');
  };

  const signOut = async () => {
    if (!hasValidSupabaseConfig()) {
      return;
    }

    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  // Asegurar que siempre proporcionemos un contexto válido
  const contextValue: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGithub,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook seguro que nunca lanza errores
// Usa una técnica de "lazy evaluation" para evitar errores durante la hidratación
export function useAuth() {
  // El contexto siempre tiene un valor por defecto, así que nunca debería ser undefined
  // Pero el código compilado anterior puede lanzar un error
  // Usamos una técnica de "safe access" que nunca lanza errores
  
  // Intentar obtener el contexto
  // Si el contexto no está disponible (código compilado anterior), React lanzará un error
  // Pero como el contexto tiene un valor por defecto, esto nunca debería pasar
  const context = useContext(AuthContext);
  
  // Si el contexto es undefined o null (no debería pasar con el código nuevo),
  // usar el valor por defecto
  if (context === undefined || context === null) {
    console.warn('[useAuth] Contexto undefined/null, usando valores por defecto');
    return defaultContextValue;
  }
  
  // Verificar si el contexto tiene las propiedades esperadas
  // Si no las tiene, puede ser un problema con el código compilado
  if (typeof context !== 'object' || !('user' in context) || !('loading' in context)) {
    console.warn('[useAuth] Contexto inválido, usando valores por defecto');
    return defaultContextValue;
  }
  
  return context;
}

