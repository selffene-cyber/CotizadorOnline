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
}

// Crear un contexto con valores por defecto para evitar errores durante la hidratación
const defaultContextValue: AuthContextType = {
  user: null,
  loading: true,
  signIn: async () => { throw new Error('AuthProvider no está inicializado'); },
  signUp: async () => { throw new Error('AuthProvider no está inicializado'); },
  signOut: async () => {},
  signInWithGithub: async () => { throw new Error('AuthProvider no está inicializado'); },
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
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  // El contexto siempre tiene un valor por defecto, así que nunca debería ser undefined
  // Pero para ser extra seguro, usamos una función helper que maneja errores
  const context = useContext(AuthContext);
  
  // Si el contexto es undefined o null (no debería pasar), usar el valor por defecto
  if (context === undefined || context === null) {
    console.warn('[useAuth] Contexto no disponible, usando valores por defecto');
    return defaultContextValue;
  }
  
  return context;
}

