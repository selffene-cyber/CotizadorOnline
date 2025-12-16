// Configuración de Supabase
import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// Función para cargar .env si existe (para Easypanel cuando "Crear archivo .env" está activado)
// En desarrollo local, Next.js carga automáticamente .env.local, pero esta función ayuda en producción
function loadEnvFile() {
  if (typeof window === 'undefined') {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Intentar cargar .env.local primero (desarrollo local)
      const envLocalPath = path.join(process.cwd(), '.env.local');
      if (fs.existsSync(envLocalPath)) {
        const envContent = fs.readFileSync(envLocalPath, 'utf8');
        envContent.split('\n').forEach((line: string) => {
          const trimmedLine = line.trim();
          if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=').trim();
              process.env[key.trim()] = value;
            }
          }
        });
      }
      
      // También intentar .env (para Easypanel)
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach((line: string) => {
          const trimmedLine = line.trim();
          if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=').trim();
              // Solo sobrescribir si no existe ya (prioridad a .env.local)
              if (!process.env[key.trim()]) {
                process.env[key.trim()] = value;
              }
            }
          }
        });
      }
    } catch (error) {
      // Ignorar errores al cargar .env (puede no existir en desarrollo)
      console.error('Error loading .env file:', error);
    }
  }
}

// Cargar .env inmediatamente (de forma segura)
try {
  loadEnvFile();
} catch (error) {
  // Ignorar errores al cargar .env en build time
  if (typeof window === 'undefined') {
    console.warn('[Supabase Config] No se pudo cargar .env en build time (esto es normal)');
  }
}

// Función para obtener las variables de Supabase (se evalúa dinámicamente)
function getSupabaseConfig() {
  try {
    // Cargar .env nuevamente por si acaso (para runtime)
    loadEnvFile();
  } catch (error) {
    // Ignorar errores
  }
  
  // En el cliente, intentar leer desde window.__ENV__ (inyectado por el servidor)
  let supabaseUrl = '';
  let supabaseAnonKey = '';
  
  if (typeof window !== 'undefined') {
    // En el cliente, leer desde window.__ENV__ o process.env
    // @ts-ignore
    const windowEnv = (window as any).__ENV__ || {};
    supabaseUrl = 
      process.env.NEXT_PUBLIC_SUPABASE_URL || 
      windowEnv.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL || 
      windowEnv.SUPABASE_URL || 
      '';
    supabaseAnonKey = 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
      windowEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY || 
      windowEnv.SUPABASE_ANON_KEY || 
      '';
  } else {
    // En el servidor, leer desde process.env
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  }
  
  // Log para debugging (solo en servidor)
  if (typeof window === 'undefined') {
    try {
      console.log('[Supabase Config] Variables cargadas:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        urlLength: supabaseUrl.length,
        keyLength: supabaseAnonKey.length,
        urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NO URL',
      });
    } catch (error) {
      // Ignorar errores de logging
    }
  }
  
  return { supabaseUrl, supabaseAnonKey };
}

// Verificar si tenemos configuración válida (función que se evalúa dinámicamente)
export function hasValidSupabaseConfig() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  return !!supabaseUrl && supabaseUrl !== '' && !!supabaseAnonKey && supabaseAnonKey !== '';
}

// Cliente para uso en el servidor (Server Components, API Routes)
// Usar valores dummy si no hay configuración para evitar errores en build
export const supabase = (() => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co') {
      return createClient(supabaseUrl, supabaseAnonKey);
    }
    // Retornar cliente dummy que no fallará
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  } catch (error) {
    console.error('[Supabase] Error creando cliente servidor:', error);
    // Retornar cliente dummy en caso de error
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }
})();

// Cliente para uso en el navegador (Client Components)
export function createSupabaseClient() {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co') {
      return createBrowserClient(supabaseUrl, supabaseAnonKey);
    }
    // Retornar cliente dummy que no fallará
    return createBrowserClient('https://placeholder.supabase.co', 'placeholder-key');
  } catch (error) {
    console.error('[Supabase] Error creando cliente navegador:', error);
    // Retornar cliente dummy en caso de error
    return createBrowserClient('https://placeholder.supabase.co', 'placeholder-key');
  }
}
