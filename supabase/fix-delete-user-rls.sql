-- Script para corregir políticas RLS que permitan a super admins eliminar usuarios y sus memberships
-- Ejecutar este script en Supabase SQL Editor
--
-- PROBLEMA: Error 406 al intentar eliminar usuarios porque las políticas RLS no permiten
-- consultar/eliminar memberships correctamente.
--
-- SOLUCIÓN: Asegurar que las políticas RLS permitan a super admins eliminar memberships
-- usando la función check_user_is_admin() con SECURITY DEFINER.

-- ============================================
-- PASO 1: Asegurar que existe la función check_user_is_admin
-- ============================================

-- Eliminar función existente si existe
DROP FUNCTION IF EXISTS public.check_user_is_admin();

-- Crear función para verificar si el usuario actual es admin (sin RLS)
CREATE OR REPLACE FUNCTION public.check_user_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANTE: Permite a esta función ignorar RLS
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO is_admin;
  RETURN is_admin;
END;
$$;

-- ============================================
-- PASO 2: CORREGIR POLÍTICAS RLS PARA MEMBERSHIPS
-- ============================================

-- Eliminar políticas existentes para memberships
DROP POLICY IF EXISTS "Super admins can view all memberships" ON public.memberships;
DROP POLICY IF EXISTS "Super admins can manage all memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can view memberships of their tenants" ON public.memberships;
DROP POLICY IF EXISTS "Admins can create memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins can update memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins can delete memberships" ON public.memberships;

-- Super admins pueden ver todos los memberships (usando función SECURITY DEFINER)
CREATE POLICY "Super admins can view all memberships" ON public.memberships
  FOR SELECT USING (public.check_user_is_admin());

-- Super admins pueden gestionar (INSERT, UPDATE, DELETE) todos los memberships
CREATE POLICY "Super admins can manage all memberships" ON public.memberships
  FOR ALL USING (public.check_user_is_admin());

-- Usuarios pueden ver memberships de sus tenants
-- (Solo si no son super admin, para evitar conflictos)
CREATE POLICY "Users can view memberships of their tenants" ON public.memberships
  FOR SELECT USING (
    NOT public.check_user_is_admin() AND -- No super admin
    EXISTS (
      SELECT 1 FROM public.memberships m2
      WHERE m2.tenant_id = memberships.tenant_id
      AND m2.user_id = auth.uid()
    )
  );

-- Solo owners/admins pueden crear memberships en sus tenants (o super admin)
CREATE POLICY "Admins can create memberships" ON public.memberships
  FOR INSERT WITH CHECK (
    public.check_user_is_admin() OR -- Super admin puede crear
    EXISTS (
      SELECT 1 FROM public.memberships m2
      WHERE m2.tenant_id = memberships.tenant_id
      AND m2.user_id = auth.uid()
      AND m2.role IN ('owner', 'admin')
    )
    OR
    -- O es el creador del tenant (permite crear el primer membership)
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE id = memberships.tenant_id
      AND created_by = auth.uid()
    )
  );

-- Solo owners/admins pueden actualizar memberships en sus tenants (o super admin)
CREATE POLICY "Admins can update memberships" ON public.memberships
  FOR UPDATE USING (
    public.check_user_is_admin() OR -- Super admin puede actualizar
    EXISTS (
      SELECT 1 FROM public.memberships m2
      WHERE m2.tenant_id = memberships.tenant_id
      AND m2.user_id = auth.uid()
      AND m2.role IN ('owner', 'admin')
    )
  );

-- Solo owners/admins pueden eliminar memberships en sus tenants (o super admin)
CREATE POLICY "Admins can delete memberships" ON public.memberships
  FOR DELETE USING (
    public.check_user_is_admin() OR -- Super admin puede eliminar
    EXISTS (
      SELECT 1 FROM public.memberships m2
      WHERE m2.tenant_id = memberships.tenant_id
      AND m2.user_id = auth.uid()
      AND m2.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- PASO 3: CORREGIR POLÍTICAS RLS PARA USERS
-- ============================================

-- Eliminar políticas existentes para users
DROP POLICY IF EXISTS "Super admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Super admins can update user roles" ON public.users;
DROP POLICY IF EXISTS "Super admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Super admins pueden leer todos los usuarios
CREATE POLICY "Super admins can read all users" ON public.users
  FOR SELECT USING (public.check_user_is_admin());

-- Super admins pueden actualizar roles de usuarios
CREATE POLICY "Super admins can update user roles" ON public.users
  FOR UPDATE USING (public.check_user_is_admin());

-- Super admins pueden eliminar usuarios
CREATE POLICY "Super admins can delete users" ON public.users
  FOR DELETE USING (public.check_user_is_admin());

-- Usuarios pueden leer su propio perfil
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (id = auth.uid());

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'SELECT/UPDATE/DELETE'
    WHEN with_check IS NOT NULL THEN 'INSERT'
    ELSE 'ALL'
  END as operation
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('memberships', 'users')
ORDER BY tablename, policyname;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'POLÍTICAS RLS CORREGIDAS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Super admins ahora pueden:';
  RAISE NOTICE '- Ver y gestionar todos los memberships';
  RAISE NOTICE '- Eliminar usuarios y sus memberships';
  RAISE NOTICE '========================================';
END $$;

