-- Script para verificar la firma exacta de net.http_post
-- Ejecutar este script en Supabase SQL Editor

-- ============================================
-- VERIFICAR FIRMA DE LA FUNCIÓN
-- ============================================

SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  n.nspname as schema_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'net'
  AND p.proname = 'http_post'
ORDER BY p.proname;

-- ============================================
-- PROBAR DIFERENTES SINTAXIS
-- ============================================

-- Probar con body como text
DO $$
DECLARE
  test_result BIGINT;
BEGIN
  RAISE NOTICE 'Probando con body como text...';
  
  SELECT net.http_post(
    url := 'https://httpbin.org/post',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"test": "data"}'::text
  ) INTO test_result;
  
  RAISE NOTICE '✅ Funciona con body como text. Request ID: %', test_result;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '✗ No funciona con body como text: %', SQLERRM;
END $$;

-- Probar con body como jsonb
DO $$
DECLARE
  test_result BIGINT;
BEGIN
  RAISE NOTICE 'Probando con body como jsonb...';
  
  SELECT net.http_post(
    url := 'https://httpbin.org/post',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"test": "data"}'::jsonb
  ) INTO test_result;
  
  RAISE NOTICE '✅ Funciona con body como jsonb. Request ID: %', test_result;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '✗ No funciona con body como jsonb: %', SQLERRM;
END $$;

-- ============================================
-- VERIFICAR OTRAS FUNCIONES HTTP DISPONIBLES
-- ============================================

SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'net'
  AND (p.proname LIKE '%http%' OR p.proname LIKE '%request%')
ORDER BY p.proname;

