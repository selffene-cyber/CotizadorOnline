-- Script para verificar si pg_net está disponible y funcionando
-- Ejecutar este script en Supabase SQL Editor

-- ============================================
-- VERIFICAR EXTENSIÓN
-- ============================================

SELECT 
  extname as extension_name,
  extversion as version,
  n.nspname as schema_name
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname = 'pg_net';

-- ============================================
-- VERIFICAR FUNCIONES DISPONIBLES
-- ============================================

SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'net'
  AND p.proname LIKE '%http%'
ORDER BY p.proname;

-- ============================================
-- PROBAR FUNCIÓN (si está disponible)
-- ============================================

-- Si la función existe, probar con un request simple
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'net' 
    AND p.proname = 'http_post'
  ) THEN
    RAISE NOTICE '✓ Función net.http_post está disponible';
    RAISE NOTICE 'Puedes usar net.http_post en tus funciones SQL';
  ELSE
    RAISE WARNING '✗ Función net.http_post NO está disponible';
    RAISE WARNING 'Ejecuta: supabase/habilitar-pg-net.sql';
  END IF;
END $$;

