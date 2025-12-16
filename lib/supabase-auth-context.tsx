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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Intentar inicializar Supabase de forma segura
    let mounted = true;
    
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
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          if (mounted) {
            setUser(session?.user ?? null);
            setLoading(false);
          }
        });

        return () => {
          if (subscription) {
            subscription.unsubscribe();
          }
        };
      } catch (error) {
        console.error('[AuthProvider] Error initializing Supabase client:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
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

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, signInWithGithub }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

