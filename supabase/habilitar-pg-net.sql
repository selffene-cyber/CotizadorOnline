-- Script para habilitar la extensión pg_net en Supabase
-- Ejecutar este script en Supabase SQL Editor
--
-- IMPORTANTE: Esta extensión permite hacer requests HTTP desde PostgreSQL
-- Necesaria para enviar emails usando Resend API

-- ============================================
-- HABILITAR EXTENSIÓN pg_net
-- ============================================

-- Crear extensión si no existe
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA net;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que la extensión está habilitada
SELECT 
  '1. Extensión pg_net' as verificacion,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net')
    THEN '✓ Habilitada'
    ELSE '✗ NO HABILITADA'
  END as estado;

-- Verificar que el esquema net existe
SELECT 
  '2. Esquema net' as verificacion,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'net')
    THEN '✓ Existe'
    ELSE '✗ NO EXISTE'
  END as estado;

-- Verificar que la función http_post existe
SELECT 
  '3. Función net.http_post' as verificacion,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'net' 
      AND p.proname = 'http_post'
    )
    THEN '✓ Existe'
    ELSE '✗ NO EXISTE - La extensión puede no estar completamente instalada'
  END as estado;

-- ============================================
-- NOTAS
-- ============================================
--
-- Si después de ejecutar este script aún ves errores:
-- 1. Ve a Supabase Dashboard → Database → Extensions
-- 2. Busca "pg_net" manualmente
-- 3. Habilítala desde la interfaz
-- 4. Asegúrate de que esté en el schema "net" o "public"
--
-- Si la extensión no está disponible en tu plan de Supabase:
-- - Algunos planes de Supabase no incluyen pg_net
-- - Considera usar Edge Functions de Supabase en su lugar
-- - O usar un servicio externo para enviar emails

