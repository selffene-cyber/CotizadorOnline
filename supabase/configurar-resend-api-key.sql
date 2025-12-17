-- Script para configurar la API key de Resend en Supabase
-- Ejecutar este script en Supabase SQL Editor DESPUÉS de tener la API key
--
-- IMPORTANTE: Este script crea una tabla de configuración y almacena la API key
-- para que las funciones de email puedan usarla

-- ============================================
-- CREAR TABLA DE CONFIGURACIÓN (si no existe)
-- ============================================

CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en la tabla de configuración
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Política: Solo super admins pueden leer/escribir configuración
DROP POLICY IF EXISTS "Super admins can manage app config" ON public.app_config;
CREATE POLICY "Super admins can manage app config" ON public.app_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- CONFIGURAR API KEY DE RESEND
-- ============================================
-- Reemplaza 'TU_API_KEY_AQUI' con tu API key real de Resend

INSERT INTO public.app_config (key, value, description)
VALUES (
  'resend_api_key',
  're_MrCk22RD_LuXWsiJ47Vp6c9tNx1pMzRmP',
  'API Key de Resend para envío de emails'
)
ON CONFLICT (key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que la API key se configuró
SELECT 
  key,
  CASE 
    WHEN value IS NOT NULL AND value != '' THEN '✓ Configurada (' || LEFT(value, 10) || '...)'
    ELSE '✗ No configurada'
  END as status,
  description
FROM public.app_config
WHERE key = 'resend_api_key';

-- Si ves "✓ Configurada", está lista para usar
-- Si ves "✗ No configurada", revisa el INSERT anterior

-- ============================================
-- NOTAS
-- ============================================
--
-- Esta configuración se almacena en la tabla app_config
-- Para cambiarla, ejecuta el INSERT nuevamente con la nueva key
-- O actualiza directamente:
--   UPDATE public.app_config SET value = 'nueva_key' WHERE key = 'resend_api_key';
--
-- IMPORTANTE: Solo los super admins pueden ver/modificar esta configuración
-- gracias a las políticas RLS
