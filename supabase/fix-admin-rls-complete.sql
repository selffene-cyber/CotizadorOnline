-- Script COMPLETO para corregir políticas RLS y permitir acceso a super admins
-- Ejecutar este script en Supabase SQL Editor
--
-- Este script asegura que los super admins puedan:
-- 1. Leer y gestionar todos los usuarios
-- 2. Leer y gestionar todas las solicitudes de acceso
-- 3. Leer y gestionar todos los tenants y memberships

-- ============================================
-- PASO 1: VERIFICAR/CORREGIR USUARIO ADMIN
-- ============================================

-- IMPORTANTE: Reemplaza 'TU_EMAIL_AQUI' con tu email real
DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT := 'TU_EMAIL_AQUI'; -- ⚠️ CAMBIAR ESTO (ej: 'selffene@gmail.com')
BEGIN
  -- Buscar el usuario en auth.users por email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_user_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Usuario con email % no encontrado en auth.users. Verifica el email.', v_user_email;
    RAISE NOTICE 'Usuarios disponibles en auth.users:';
    FOR v_user_id IN SELECT id FROM auth.users LIMIT 5 LOOP
      RAISE NOTICE '  - %', v_user_id;
    END LOOP;
  ELSE
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
  END IF;
END $$;

-- ============================================
-- PASO 2: POLÍTICAS RLS PARA USERS
-- ============================================

-- Eliminar políticas conflictivas
DROP POLICY IF EXISTS "Super admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Users can read all users" ON public.users;

-- Política para super admins (tiene prioridad)
CREATE POLICY "Super admins can read all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Política para usuarios autenticados (fallback)
CREATE POLICY "Users can read all users" ON public.users
  FOR SELECT USING (
    auth.role() = 'authenticated'
  );

-- Política para super admins actualizar roles
DROP POLICY IF EXISTS "Super admins can update user roles" ON public.users;
CREATE POLICY "Super admins can update user roles" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ============================================
-- PASO 3: POLÍTICAS RLS PARA ACCESS_REQUESTS
-- ============================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Super admins can view all access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Super admins can manage all access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Users can view own access requests" ON public.access_requests;

-- Super admins pueden ver todas las solicitudes
CREATE POLICY "Super admins can view all access requests" ON public.access_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Super admins pueden gestionar todas las solicitudes
CREATE POLICY "Super admins can manage all access requests" ON public.access_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Usuarios pueden ver sus propias solicitudes
CREATE POLICY "Users can view own access requests" ON public.access_requests
  FOR SELECT USING (user_id = auth.uid());

-- ============================================
-- PASO 4: POLÍTICAS RLS PARA TENANTS
-- ============================================

DROP POLICY IF EXISTS "Super admins can view all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can manage all tenants" ON public.tenants;

CREATE POLICY "Super admins can view all tenants" ON public.tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Super admins can manage all tenants" ON public.tenants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ============================================
-- PASO 5: POLÍTICAS RLS PARA MEMBERSHIPS
-- ============================================

DROP POLICY IF EXISTS "Super admins can view all memberships" ON public.memberships;
DROP POLICY IF EXISTS "Super admins can manage all memberships" ON public.memberships;

CREATE POLICY "Super admins can view all memberships" ON public.memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Super admins can manage all memberships" ON public.memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ============================================
-- PASO 6: VERIFICACIÓN
-- ============================================

-- Verificar que el usuario tenga rol admin
SELECT 
  'Usuario Admin' as verificacion,
  id,
  email,
  role,
  display_name
FROM public.users
WHERE role = 'admin';

-- Verificar políticas creadas
SELECT 
  'Políticas RLS' as verificacion,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'access_requests', 'tenants', 'memberships')
  AND (policyname LIKE '%Super admin%' OR policyname LIKE '%admin%')
ORDER BY tablename, policyname;

-- Si ves tu usuario con role = 'admin' y las políticas listadas, todo está correcto

