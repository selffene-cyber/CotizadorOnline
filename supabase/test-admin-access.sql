-- Script para probar el acceso del admin directamente en Supabase
-- Ejecutar este script en Supabase SQL Editor DESPUÉS de iniciar sesión como admin
--
-- Este script verifica:
-- 1. Si el usuario actual tiene rol 'admin'
-- 2. Si puede leer de las tablas users y access_requests
-- 3. Si las políticas RLS están funcionando correctamente

-- ============================================
-- PASO 1: VERIFICAR USUARIO ACTUAL
-- ============================================

-- Ver el ID del usuario actual (debe estar autenticado)
SELECT 
  'Usuario actual' as verificacion,
  auth.uid() as user_id,
  auth.email() as email;

-- ============================================
-- PASO 2: VERIFICAR ROL DEL USUARIO
-- ============================================

-- Verificar si el usuario actual tiene rol 'admin' en public.users
SELECT 
  'Rol del usuario' as verificacion,
  id,
  email,
  role,
  display_name
FROM public.users
WHERE id = auth.uid();

-- ============================================
-- PASO 3: PROBAR LECTURA DE USERS
-- ============================================

-- Intentar leer todos los usuarios (debería funcionar si eres admin)
SELECT 
  'Lectura de users' as verificacion,
  COUNT(*) as total_usuarios
FROM public.users;

-- Ver algunos usuarios
SELECT 
  id,
  email,
  role,
  display_name,
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- PASO 4: PROBAR LECTURA DE ACCESS_REQUESTS
-- ============================================

-- Intentar leer todas las solicitudes (debería funcionar si eres admin)
SELECT 
  'Lectura de access_requests' as verificacion,
  COUNT(*) as total_solicitudes
FROM public.access_requests;

-- Ver algunas solicitudes
SELECT 
  id,
  user_id,
  email,
  status,
  requested_at,
  reviewed_by,
  reviewed_at
FROM public.access_requests
ORDER BY requested_at DESC
LIMIT 5;

-- ============================================
-- PASO 5: VERIFICAR POLÍTICAS RLS
-- ============================================

-- Ver todas las políticas RLS para users
SELECT 
  'Políticas RLS para users' as verificacion,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'users'
ORDER BY policyname;

-- Ver todas las políticas RLS para access_requests
SELECT 
  'Políticas RLS para access_requests' as verificacion,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'access_requests'
ORDER BY policyname;

-- ============================================
-- INTERPRETACIÓN DE RESULTADOS
-- ============================================

-- Si ves:
-- 1. Tu usuario con role = 'admin' → ✅ Usuario correcto
-- 2. Puedes leer de users → ✅ Política RLS funciona
-- 3. Puedes leer de access_requests → ✅ Política RLS funciona
-- 4. Políticas listadas → ✅ Políticas creadas
--
-- Si NO ves:
-- - Tu usuario con role = 'admin' → Ejecuta fix-admin-rls-complete.sql
-- - No puedes leer de users → Las políticas RLS están bloqueando
-- - No puedes leer de access_requests → Las políticas RLS están bloqueando
-- - No hay políticas → Ejecuta fix-admin-rls-complete.sql

