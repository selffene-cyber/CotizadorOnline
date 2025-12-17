-- Script COMPLETO para corregir acceso de admin
-- Ejecutar este script en Supabase SQL Editor
-- Email: jeans.selfene@outlook.com

-- ============================================
-- PASO 1: LIMPIAR POLÍTICAS DUPLICADAS
-- ============================================

-- Eliminar TODAS las políticas de access_requests
DROP POLICY IF EXISTS "Super admin can manage access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Super admin can view all access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Super admins can manage all access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Super admins can view all access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Users can view own access requests" ON public.access_requests;

-- Eliminar TODAS las políticas de users
DROP POLICY IF EXISTS "Super admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Users can read all users" ON public.users;
DROP POLICY IF EXISTS "Super admins can update user roles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- ============================================
-- PASO 2: CREAR/ACTUALIZAR USUARIO ADMIN
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT := 'jeans.selfene@outlook.com';
BEGIN
  -- Buscar el usuario en auth.users por email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_user_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario con email % no encontrado en auth.users. Verifica que hayas iniciado sesión al menos una vez.', v_user_email;
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
-- PASO 3: CREAR FUNCIÓN HELPER (EVITA RECURSIÓN)
-- ============================================

-- Función que verifica si un usuario es admin sin causar recursión
CREATE OR REPLACE FUNCTION public.check_user_is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Esta función tiene SECURITY DEFINER, por lo que puede leer users
  -- sin pasar por las políticas RLS, evitando recursión
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_user_id AND role = 'admin'
  );
END;
$$;

-- ============================================
-- PASO 4: CREAR POLÍTICAS RLS PARA USERS
-- ============================================

-- Super admins pueden leer todos los usuarios (usando función para evitar recursión)
CREATE POLICY "Super admins can read all users" ON public.users
  FOR SELECT USING (
    public.check_user_is_admin(auth.uid())
  );

-- Política para usuarios autenticados leer todos (fallback)
CREATE POLICY "Users can read all users" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Super admins pueden actualizar roles (usando función para evitar recursión)
CREATE POLICY "Super admins can update user roles" ON public.users
  FOR UPDATE USING (
    public.check_user_is_admin(auth.uid())
  );

-- Política para usuarios actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- PASO 5: CREAR POLÍTICAS RLS PARA ACCESS_REQUESTS
-- ============================================

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
-- PASO 6: VERIFICACIÓN
-- ============================================

-- Verificar que el usuario tenga rol admin
SELECT 
  '✓ Usuario Admin' as verificacion,
  id,
  email,
  role,
  display_name
FROM public.users
WHERE email = 'jeans.selfene@outlook.com' AND role = 'admin';

-- Verificar que la función se creó
SELECT 
  '✓ Función creada' as verificacion,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'check_user_is_admin';

-- Verificar políticas creadas
SELECT 
  '✓ Políticas RLS' as verificacion,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'access_requests')
  AND (policyname LIKE '%Super admin%' OR policyname LIKE '%admin%' OR policyname LIKE '%Users can%')
ORDER BY tablename, policyname;

