// Configuración de Supabase
import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
