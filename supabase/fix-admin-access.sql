-- Script para verificar y corregir el acceso del super admin
-- Ejecutar este script en Supabase SQL Editor
--
-- PROBLEMA: El usuario no puede acceder a /admin porque:
-- 1. No tiene rol 'admin' en public.users
-- 2. Las políticas RLS están bloqueando el acceso
--
-- SOLUCIÓN: Verificar y corregir ambos problemas

-- ============================================
-- PASO 1: VERIFICAR USUARIO ACTUAL
-- ============================================

-- Ver qué usuario está autenticado (ejecutar esto mientras estás logueado)
-- SELECT auth.uid() as current_user_id;

-- ============================================
-- PASO 2: VERIFICAR SI EL USUARIO EXISTE EN public.users
-- ============================================

-- Reemplaza 'TU_USER_ID_AQUI' con el ID de tu usuario de auth.users
-- Puedes obtenerlo desde Supabase Auth > Users o desde la consola del navegador (user.id)

-- Ver todos los usuarios en auth.users
SELECT 
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- Ver todos los usuarios en public.users
SELECT 
  id,
  email,
  role,
  display_name,
  created_at
FROM public.users
ORDER BY created_at DESC;

-- ============================================
-- PASO 3: CREAR/ACTUALIZAR USUARIO ADMIN
-- ============================================

-- IMPORTANTE: Reemplaza 'TU_EMAIL_AQUI' con tu email real
-- Ejemplo: 'selffene@gmail.com' o 'jeans.selfene@outlook.com'

DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT := 'TU_EMAIL_AQUI'; -- ⚠️ CAMBIAR ESTO
BEGIN
  -- Buscar el usuario en auth.users por email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_user_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario con email % no encontrado en auth.users. Verifica el email.', v_user_email;
  END IF;

  RAISE NOTICE 'Usuario encontrado: % (ID: %)', v_user_email, v_user_id;

  -- Insertar o actualizar en public.users con rol admin
  INSERT INTO public.users (id, email, role, display_name)
  VALUES (v_user_id, v_user_email, 'admin', 'Super Admin')
  ON CONFLICT (id) 
  DO UPDATE SET 
    role = 'admin',
    email = v_user_email,
    updated_at = NOW();

  RAISE NOTICE '✓ Usuario actualizado a rol admin en public.users';
END $$;

-- ============================================
-- PASO 4: VERIFICAR POLÍTICAS RLS
-- ============================================

-- Verificar que las políticas RLS permitan a los admins leer users
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'users'
  AND (policyname LIKE '%admin%' OR policyname LIKE '%Super admin%' OR policyname LIKE '%read all%')
ORDER BY policyname;

-- Si no ves políticas que permitan a admins leer users, ejecuta esto:
DROP POLICY IF EXISTS "Super admins can read all users" ON public.users;

CREATE POLICY "Super admins can read all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
    OR
    -- También permitir a usuarios autenticados leer todos (política original)
    auth.role() = 'authenticated'
  );

-- ============================================
-- PASO 5: VERIFICAR QUE TODO FUNCIONE
-- ============================================

-- Verificar que el usuario tenga rol admin
SELECT 
  id,
  email,
  role,
  display_name
FROM public.users
WHERE role = 'admin';

-- Si ves tu usuario con role = 'admin', todo está correcto
-- Si no, ejecuta el PASO 3 nuevamente con el email correcto

