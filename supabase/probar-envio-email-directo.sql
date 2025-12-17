-- Script para probar el envío de email directamente
-- Ejecutar este script en Supabase SQL Editor
-- IMPORTANTE: Reemplaza 'TU-EMAIL@ejemplo.com' con tu email real

DO $$
DECLARE
  test_email TEXT := 'TU-EMAIL@ejemplo.com';  -- <<<<<<< CAMBIA ESTO A TU EMAIL
  test_result TEXT;
  api_key TEXT;
BEGIN
  -- 1. Verificar que la API key existe
  SELECT value INTO api_key
  FROM public.app_config
  WHERE key = 'resend_api_key';
  
  IF api_key IS NULL OR api_key = '' THEN
    RAISE EXCEPTION '✗ API Key no configurada. Ejecuta configurar-resend-api-key.sql primero.';
  ELSE
    RAISE NOTICE '✓ API Key encontrada: %...', LEFT(api_key, 15);
  END IF;
  
  -- 2. Verificar que pg_net está habilitado
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    RAISE EXCEPTION '✗ Extensión pg_net no habilitada. Habilítala en Database → Extensions.';
  ELSE
    RAISE NOTICE '✓ Extensión pg_net habilitada';
  END IF;
  
  -- 3. Probar envío de email
  RAISE NOTICE 'Enviando email de prueba a: %', test_email;
  
  BEGIN
    PERFORM public.send_invitation_email(
      test_email,
      'test-token-' || EXTRACT(EPOCH FROM NOW())::TEXT,
      'Empresa de Prueba',
      'user',
      'https://cot.piwisuite.cl/invite/test-token',
      'Admin de Prueba'
    );
    
    RAISE NOTICE '✅ Email enviado exitosamente!';
    RAISE NOTICE 'Revisa tu bandeja de entrada en: %', test_email;
    RAISE NOTICE 'También revisa Resend Dashboard: https://resend.com/emails';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '✗ Error al enviar email: % (Código: %)', SQLERRM, SQLSTATE;
  END;
  
END $$;

-- ============================================
-- VERIFICAR RESULTADO EN RESEND
-- ============================================
-- Después de ejecutar, ve a:
-- https://resend.com/emails
-- Deberías ver el email en la lista de "Emails sent"

