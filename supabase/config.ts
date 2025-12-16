// Configuración de Supabase
import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// Función para cargar .env si existe (para Easypanel cuando "Crear archivo .env" está activado)
function loadEnvFile() {
  if (typeof window === 'undefined') {
    try {
      const fs = require('fs');
      const path = require('path');
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach((line: string) => {
          const trimmedLine = line.trim();
          if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=').trim();
              // Siempre sobrescribir para asegurar que las variables del .env se usen
              process.env[key.trim()] = value;
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

// Cargar .env inmediatamente
loadEnvFile();

// Función para obtener las variables de Supabase (se evalúa dinámicamente)
function getSupabaseConfig() {
  // Cargar .env nuevamente por si acaso (para runtime)
  loadEnvFile();
  
  // Intentar obtener variables con NEXT_PUBLIC_ primero, luego sin el prefijo (para Easypanel)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  
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
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  if (supabaseUrl && supabaseAnonKey) {
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  return createClient('https://placeholder.supabase.co', 'placeholder-key');
})();

// Cliente para uso en el navegador (Client Components)
export function createSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  if (supabaseUrl && supabaseAnonKey) {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return createBrowserClient('https://placeholder.supabase.co', 'placeholder-key');
}
