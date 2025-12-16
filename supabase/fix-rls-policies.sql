-- Script para corregir las políticas RLS y permitir acceso a super admins
-- Ejecutar este script en Supabase SQL Editor

-- ============================================
-- POLÍTICAS PARA SUPER ADMINS
-- ============================================

-- Eliminar políticas existentes de tenants si existen
DROP POLICY IF EXISTS "Super admins can view all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can manage all tenants" ON public.tenants;

-- Super admins pueden ver TODOS los tenants
CREATE POLICY "Super admins can view all tenants" ON public.tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Super admins pueden crear, actualizar y eliminar tenants
CREATE POLICY "Super admins can manage all tenants" ON public.tenants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- POLÍTICAS PARA MEMBERSHIPS
-- ============================================

DROP POLICY IF EXISTS "Super admins can view all memberships" ON public.memberships;
DROP POLICY IF EXISTS "Super admins can manage all memberships" ON public.memberships;

CREATE POLICY "Super admins can view all memberships" ON public.memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Super admins can manage all memberships" ON public.memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- POLÍTICAS PARA ACCESS_REQUESTS
-- ============================================

DROP POLICY IF EXISTS "Super admins can view all access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Super admins can manage all access requests" ON public.access_requests;

CREATE POLICY "Super admins can view all access requests" ON public.access_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Super admins can manage all access requests" ON public.access_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- POLÍTICAS PARA USERS (asegurar que admins puedan leer todos)
-- ============================================

-- La política existente "Users can read all users" ya debería funcionar
-- pero verificamos que los admins puedan actualizar roles

DROP POLICY IF EXISTS "Super admins can update user roles" ON public.users;

CREATE POLICY "Super admins can update user roles" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('tenants', 'memberships', 'access_requests', 'users')
  AND policyname LIKE '%Super admin%'
ORDER BY tablename, policyname;

-- Si ves las políticas listadas, todo está correcto

