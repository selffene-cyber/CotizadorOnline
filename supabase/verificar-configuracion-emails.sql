-- Script para verificar que la configuración de emails está completa
-- Ejecutar este script en Supabase SQL Editor antes de probar el envío de emails

-- ============================================
-- 1. VERIFICAR TABLA app_config
-- ============================================
SELECT 
  '1. Tabla app_config' as verificacion,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_config')
    THEN '✓ Existe'
    ELSE '✗ NO EXISTE - Ejecuta configurar-resend-api-key.sql'
  END as estado;

-- ============================================
-- 2. VERIFICAR API KEY CONFIGURADA
-- ============================================
SELECT 
  '2. API Key de Resend' as verificacion,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.app_config 
      WHERE key = 'resend_api_key' 
      AND value IS NOT NULL 
      AND value != ''
    )
    THEN '✓ Configurada (' || LEFT((SELECT value FROM public.app_config WHERE key = 'resend_api_key'), 10) || '...)'
    ELSE '✗ NO CONFIGURADA - Ejecuta configurar-resend-api-key.sql'
  END as estado;

-- ============================================
-- 3. VERIFICAR FUNCIONES DE EMAIL
-- ============================================
SELECT 
  '3. Funciones de email' as verificacion,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name IN ('send_approval_email', 'send_rejection_email', 'send_invitation_email')
    )
    THEN '✓ Creadas'
    ELSE '✗ NO CREADAS - Ejecuta setup-email-functions-ACTIVO.sql'
  END as estado;

-- ============================================
-- 4. VERIFICAR EXTENSIÓN pg_net
-- ============================================
SELECT 
  '4. Extensión pg_net' as verificacion,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_extension WHERE extname = 'pg_net'
    )
    THEN '✓ Habilitada'
    ELSE '✗ NO HABILITADA - Habilítala en Database → Extensions'
  END as estado;

-- ============================================
-- RESUMEN
-- ============================================
SELECT 
  CASE 
    WHEN 
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_config')
      AND EXISTS (SELECT 1 FROM public.app_config WHERE key = 'resend_api_key' AND value IS NOT NULL AND value != '')
      AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'send_invitation_email')
      AND EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net')
    THEN '✅ TODO LISTO - Puedes probar crear una invitación'
    ELSE '⚠️ FALTAN CONFIGURACIONES - Revisa los resultados arriba'
  END as estado_final;

