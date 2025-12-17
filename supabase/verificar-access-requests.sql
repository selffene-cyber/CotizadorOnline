-- Script para verificar que las solicitudes de acceso se están creando correctamente
-- Ejecutar este script en Supabase SQL Editor

-- ============================================
-- VERIFICAR TABLA ACCESS_REQUESTS
-- ============================================

-- Verificar que la tabla existe
SELECT 
  'Tabla access_requests' as verificacion,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'access_requests'
    ) THEN '✓ Existe'
    ELSE '✗ No existe'
  END as estado;

-- ============================================
-- VERIFICAR TRIGGER
-- ============================================

-- Verificar que el trigger existe
SELECT 
  'Trigger on_auth_user_created' as verificacion,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_schema = 'auth' AND trigger_name = 'on_auth_user_created'
    ) THEN '✓ Existe'
    ELSE '✗ No existe'
  END as estado;

-- ============================================
-- VERIFICAR FUNCIÓN
-- ============================================

-- Verificar que la función existe
SELECT 
  'Función handle_new_user' as verificacion,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_name = 'handle_new_user'
    ) THEN '✓ Existe'
    ELSE '✗ No existe'
  END as estado;

-- ============================================
-- VERIFICAR POLÍTICAS RLS
-- ============================================

-- Verificar políticas RLS para access_requests
SELECT 
  'Políticas RLS access_requests' as verificacion,
  policyname,
  cmd as operacion
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'access_requests'
ORDER BY policyname;

-- ============================================
-- LISTAR SOLICITUDES EXISTENTES
-- ============================================

-- Listar todas las solicitudes de acceso
SELECT 
  id,
  user_id,
  email,
  status,
  requested_at,
  reviewed_by,
  reviewed_at,
  notes
FROM public.access_requests
ORDER BY requested_at DESC
LIMIT 20;

-- ============================================
-- CONTAR SOLICITUDES POR ESTADO
-- ============================================

SELECT 
  status,
  COUNT(*) as total
FROM public.access_requests
GROUP BY status
ORDER BY status;

-- ============================================
-- VERIFICAR USUARIOS SIN SOLICITUD
-- ============================================

-- Usuarios en auth.users que no tienen solicitud de acceso
SELECT 
  au.id,
  au.email,
  au.created_at,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.users WHERE id = au.id) THEN '✓ En public.users'
    ELSE '✗ No en public.users'
  END as en_public_users,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.access_requests WHERE user_id = au.id) THEN '✓ Tiene solicitud'
    ELSE '✗ Sin solicitud'
  END as tiene_solicitud
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.access_requests WHERE user_id = au.id
)
ORDER BY au.created_at DESC
LIMIT 10;

-- ============================================
-- NOTAS
-- ============================================

-- Si ves usuarios sin solicitud, el trigger puede no estar funcionando
-- Ejecuta: supabase/create-access-request-trigger.sql para recrear el trigger

