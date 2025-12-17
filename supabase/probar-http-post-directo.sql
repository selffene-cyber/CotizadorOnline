-- Script para probar net.http_post directamente
-- Ejecutar este script en Supabase SQL Editor
-- Esto verifica la sintaxis correcta de net.http_post

-- ============================================
-- VERIFICAR FIRMA DE LA FUNCIÓN
-- ============================================

SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'net'
  AND p.proname LIKE '%http%'
ORDER BY p.proname;

-- ============================================
-- PROBAR LLAMADA SIMPLE
-- ============================================

DO $$
DECLARE
  test_result BIGINT;
BEGIN
  -- Intentar llamar a net.http_post con sintaxis simple
  -- Nota: net.http_post retorna un BIGINT (request_id), no void
  
  SELECT net.http_post(
    url := 'https://httpbin.org/post',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"test": "data"}'::text
  ) INTO test_result;
  
  RAISE NOTICE '✅ net.http_post funciona! Request ID: %', test_result;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '✗ Error: %', SQLERRM;
  RAISE NOTICE 'Código: %', SQLSTATE;
END $$;

