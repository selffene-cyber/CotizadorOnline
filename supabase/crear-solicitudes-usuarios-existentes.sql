-- Script para crear solicitudes de acceso para usuarios existentes que no las tienen
-- Ejecutar este script en Supabase SQL Editor
--
-- Este script crea solicitudes de acceso 'pending' para todos los usuarios en auth.users
-- que no tienen una solicitud en access_requests

-- ============================================
-- CREAR SOLICITUDES PARA USUARIOS EXISTENTES
-- ============================================

-- Insertar solicitudes solo para usuarios que no tienen una
-- Ya estamos usando WHERE NOT EXISTS para evitar duplicados, así que no necesitamos ON CONFLICT
INSERT INTO public.access_requests (user_id, email, status, requested_at)
SELECT 
  au.id,
  au.email,
  'pending'::text,
  COALESCE(au.created_at, NOW())
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.access_requests ar WHERE ar.user_id = au.id
)
AND NOT EXISTS (
  -- No crear solicitud si el usuario ya está en public.users con rol admin (ya tiene acceso)
  SELECT 1 FROM public.users u WHERE u.id = au.id AND u.role = 'admin'
);

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Mostrar usuarios que ahora tienen solicitudes
SELECT 
  'Usuarios con solicitudes creadas' as verificacion,
  COUNT(*) as total
FROM public.access_requests
WHERE status = 'pending';

-- Listar las solicitudes creadas
SELECT 
  ar.id,
  ar.email,
  ar.status,
  ar.requested_at,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.users WHERE id = ar.user_id) THEN '✓ En public.users'
    ELSE '✗ No en public.users'
  END as en_public_users
FROM public.access_requests ar
ORDER BY ar.requested_at DESC
LIMIT 10;

-- ============================================
-- NOTAS
-- ============================================

-- Este script crea solicitudes para usuarios que:
-- 1. Están en auth.users
-- 2. NO tienen una solicitud en access_requests
-- 3. NO son admin en public.users (los admins ya tienen acceso)

-- Después de ejecutar este script, los usuarios deberían poder ver
-- sus solicitudes en la página de pending-approval y los admins
-- deberían poder verlas en el panel de administración.

