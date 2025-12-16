// Configuración de Supabase
import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// Cargar .env si existe (para Easypanel cuando "Crear archivo .env" está activado)
// Solo en el servidor, no en el cliente
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
            if (!process.env[key.trim()]) {
              process.env[key.trim()] = value;
            }
          }
        }
      });
    }
  } catch (error) {
    // Ignorar errores al cargar .env (puede no existir en desarrollo)
  }
}

// Intentar obtener variables con NEXT_PUBLIC_ primero, luego sin el prefijo (para Easypanel)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

// Verificar si tenemos configuración válida
export const hasValidSupabaseConfig = 
  !!supabaseUrl && 
  supabaseUrl !== '' &&
  !!supabaseAnonKey && 
  supabaseAnonKey !== '';

// Cliente para uso en el servidor (Server Components, API Routes)
// Usar valores dummy si no hay configuración para evitar errores en build
export const supabase = hasValidSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

// Cliente para uso en el navegador (Client Components)
export function createSupabaseClient() {
  if (!hasValidSupabaseConfig) {
    return createBrowserClient('https://placeholder.supabase.co', 'placeholder-key');
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
