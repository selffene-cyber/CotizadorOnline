-- Script para verificar y habilitar pg_net
-- Ejecutar este script en Supabase SQL Editor

-- ============================================
-- PASO 1: VERIFICAR ESTADO ACTUAL
-- ============================================

SELECT 
  'Estado actual de pg_net' as verificacion,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net')
    THEN '✓ Extensión instalada'
    ELSE '✗ Extensión NO instalada'
  END as estado;

-- ============================================
-- PASO 2: INTENTAR HABILITAR
-- ============================================

-- Intentar crear la extensión
DO $$
BEGIN
  -- Intentar crear extensión
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA net;
    RAISE NOTICE '✓ Extensión pg_net creada exitosamente';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '✗ No se pudo crear extensión automáticamente: %', SQLERRM;
    RAISE WARNING 'Debes habilitarla manualmente desde Supabase Dashboard → Database → Extensions';
  END;
END $$;

-- ============================================
-- PASO 3: VERIFICAR DESPUÉS DE INTENTAR HABILITAR
-- ============================================

SELECT 
  'Verificación final' as verificacion,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net')
    THEN '✓ pg_net está habilitada - Puedes usar net.http_post'
    ELSE '✗ pg_net NO está habilitada - Habilítala manualmente'
  END as estado;

-- Verificar que el esquema net existe
SELECT 
  'Esquema net' as verificacion,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'net')
    THEN '✓ Existe'
    ELSE '✗ NO existe'
  END as estado;

-- Verificar función http_post
SELECT 
  'Función net.http_post' as verificacion,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'net' 
      AND p.proname = 'http_post'
    )
    THEN '✓ Existe - Lista para usar'
    ELSE '✗ NO existe - pg_net no está completamente habilitada'
  END as estado;

-- ============================================
-- INSTRUCCIONES SI NO FUNCIONA
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'INSTRUCCIONES MANUALES:';
    RAISE NOTICE '========================================';
    RAISE NOTICE '1. Ve a Supabase Dashboard';
    RAISE NOTICE '2. Database → Extensions';
    RAISE NOTICE '3. Busca "pg_net"';
    RAISE NOTICE '4. Haz clic en "Enable" o "Habilitar"';
    RAISE NOTICE '5. Asegúrate de que esté en schema "net"';
    RAISE NOTICE '6. Ejecuta este script nuevamente para verificar';
    RAISE NOTICE '========================================';
  END IF;
END $$;

