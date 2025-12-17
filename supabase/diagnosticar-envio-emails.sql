-- Script para diagnosticar problemas con el envío de emails
-- Ejecutar este script en Supabase SQL Editor después de intentar enviar una invitación

-- ============================================
-- 1. VERIFICAR CONFIGURACIÓN BÁSICA
-- ============================================

-- Verificar tabla app_config
SELECT 
  '1. Tabla app_config' as verificacion,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_config')
    THEN '✓ Existe'
    ELSE '✗ NO EXISTE'
  END as estado;

-- Verificar API key
SELECT 
  '2. API Key' as verificacion,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.app_config WHERE key = 'resend_api_key' AND value IS NOT NULL AND value != '')
    THEN '✓ Configurada: ' || LEFT((SELECT value FROM public.app_config WHERE key = 'resend_api_key'), 15) || '...'
    ELSE '✗ NO CONFIGURADA'
  END as estado;

-- Verificar funciones
SELECT 
  '3. Funciones de email' as verificacion,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'send_invitation_email')
    THEN '✓ send_invitation_email existe'
    ELSE '✗ send_invitation_email NO EXISTE'
  END as estado;

-- Verificar pg_net
SELECT 
  '4. Extensión pg_net' as verificacion,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net')
    THEN '✓ Habilitada'
    ELSE '✗ NO HABILITADA'
  END as estado;

-- ============================================
-- 2. PROBAR FUNCIÓN DE ENVÍO MANUALMENTE
-- ============================================

-- Obtener API key para verificar
SELECT 
  '5. API Key (primeros 20 caracteres)' as verificacion,
  LEFT(value, 20) || '...' as api_key_preview
FROM public.app_config
WHERE key = 'resend_api_key';

-- ============================================
-- 3. VERIFICAR INVITACIONES RECIENTES
-- ============================================

SELECT 
  '6. Invitaciones recientes' as verificacion,
  COUNT(*) as total_invitaciones,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendientes,
  COUNT(CASE WHEN status = 'accepted' THEN 1 END) as aceptadas,
  MAX(created_at) as ultima_invitacion
FROM public.invitations;

-- ============================================
-- 4. PROBAR ENVÍO DE EMAIL (TEST)
-- ============================================
-- Descomenta las siguientes líneas para probar el envío manualmente
-- Reemplaza 'tu-email@ejemplo.com' con tu email real

/*
DO $$
DECLARE
  test_result TEXT;
BEGIN
  -- Probar envío de email de invitación
  PERFORM public.send_invitation_email(
    'tu-email@ejemplo.com',  -- Reemplaza con tu email
    'test-token-123',
    'Empresa de Prueba',
    'user',
    'https://cot.piwisuite.cl/invite/test-token-123',
    'Admin de Prueba'
  );
  
  RAISE NOTICE '✓ Email de prueba enviado. Revisa tu bandeja de entrada.';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '✗ Error al enviar email: %', SQLERRM;
END $$;
*/

-- ============================================
-- 5. VERIFICAR LOGS DE pg_net
-- ============================================
-- Los logs de pg_net pueden estar en la tabla net.http_request_queue
-- (si está disponible)

SELECT 
  '7. Verificar logs de pg_net' as verificacion,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'net' AND table_name = 'http_request_queue')
    THEN '✓ Tabla de logs disponible'
    ELSE '✗ Tabla de logs no disponible (normal si no hay requests)'
  END as estado;

-- Si la tabla existe, mostrar requests recientes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'net' AND table_name = 'http_request_queue') THEN
    RAISE NOTICE 'Revisa la tabla net.http_request_queue para ver requests HTTP recientes';
  END IF;
END $$;

