-- Script para corregir políticas RLS de costings
-- Ejecutar este script en Supabase SQL Editor
--
-- Este script:
-- 1. Verifica las políticas RLS actuales
-- 2. Crea/actualiza las funciones helper necesarias
-- 3. Corrige las políticas RLS para permitir que los miembros del tenant gestionen sus costeos

-- ============================================
-- PASO 1: VERIFICAR ESTADO ACTUAL
-- ============================================

-- Ver políticas actuales de costings
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'costings'
ORDER BY policyname;

-- Verificar si costings tiene tenant_id
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'costings'
  AND column_name = 'tenant_id';

-- ============================================
-- PASO 2: CREAR/ACTUALIZAR FUNCIONES HELPER
-- ============================================

-- Función que verifica si un usuario es super admin sin causar recursión
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

-- Función que verifica membership sin causar recursión
CREATE OR REPLACE FUNCTION public.check_user_tenant_membership(
  p_tenant_id UUID,
  p_user_id UUID,
  p_required_role TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Esta función tiene SECURITY DEFINER, por lo que puede leer memberships
  -- sin pasar por las políticas RLS, evitando recursión
  IF p_required_role IS NULL THEN
    -- Solo verificar que sea miembro
    RETURN EXISTS (
      SELECT 1 FROM public.memberships
      WHERE tenant_id = p_tenant_id
      AND user_id = p_user_id
    );
  ELSE
    -- Verificar que sea miembro con el rol específico
    RETURN EXISTS (
      SELECT 1 FROM public.memberships
      WHERE tenant_id = p_tenant_id
      AND user_id = p_user_id
      AND role = p_required_role
    );
  END IF;
END;
$$;

-- ============================================
-- PASO 3: ELIMINAR POLÍTICAS EXISTENTES
-- ============================================

DROP POLICY IF EXISTS "Users can read all costings" ON public.costings;
DROP POLICY IF EXISTS "Users can insert costings" ON public.costings;
DROP POLICY IF EXISTS "Users can update costings" ON public.costings;
DROP POLICY IF EXISTS "Users can delete costings" ON public.costings;
DROP POLICY IF EXISTS "Users can read costings of their tenants" ON public.costings;
DROP POLICY IF EXISTS "Users can insert costings in their tenants" ON public.costings;
DROP POLICY IF EXISTS "Users can update costings of their tenants" ON public.costings;
DROP POLICY IF EXISTS "Users can delete costings of their tenants" ON public.costings;
DROP POLICY IF EXISTS "Super admins can manage all costings" ON public.costings;

-- ============================================
-- PASO 4: CREAR POLÍTICAS CORREGIDAS
-- ============================================

-- Super admins pueden ver/gestionar todos los costeos
CREATE POLICY "Super admins can manage all costings" ON public.costings
  FOR ALL USING (
    public.check_user_is_admin(auth.uid())
  );

-- Usuarios pueden leer costeos de sus tenants
CREATE POLICY "Users can read costings of their tenants" ON public.costings
  FOR SELECT USING (
    -- Super admin puede ver todo (ya cubierto arriba)
    public.check_user_is_admin(auth.uid())
    OR
    -- O es miembro del tenant
    public.check_user_tenant_membership(tenant_id, auth.uid())
  );

-- Usuarios pueden crear costeos en sus tenants
CREATE POLICY "Users can insert costings in their tenants" ON public.costings
  FOR INSERT WITH CHECK (
    -- Super admin puede crear cualquier costeo (ya cubierto arriba)
    public.check_user_is_admin(auth.uid())
    OR
    -- O es miembro del tenant
    public.check_user_tenant_membership(tenant_id, auth.uid())
  );

-- Usuarios pueden actualizar costeos de sus tenants
CREATE POLICY "Users can update costings of their tenants" ON public.costings
  FOR UPDATE USING (
    -- Super admin puede actualizar cualquier costeo (ya cubierto arriba)
    public.check_user_is_admin(auth.uid())
    OR
    -- O es miembro del tenant
    public.check_user_tenant_membership(tenant_id, auth.uid())
  )
  WITH CHECK (
    -- Super admin puede actualizar cualquier costeo (ya cubierto arriba)
    public.check_user_is_admin(auth.uid())
    OR
    -- O es miembro del tenant
    public.check_user_tenant_membership(tenant_id, auth.uid())
  );

-- Usuarios pueden eliminar costeos de sus tenants
CREATE POLICY "Users can delete costings of their tenants" ON public.costings
  FOR DELETE USING (
    -- Super admin puede eliminar cualquier costeo (ya cubierto arriba)
    public.check_user_is_admin(auth.uid())
    OR
    -- O es miembro del tenant
    public.check_user_tenant_membership(tenant_id, auth.uid())
  );

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Lectura'
    WHEN cmd = 'INSERT' THEN 'Inserción'
    WHEN cmd = 'UPDATE' THEN 'Actualización'
    WHEN cmd = 'DELETE' THEN 'Eliminación'
    WHEN cmd = 'ALL' THEN 'Todas las operaciones'
    ELSE cmd
  END as operacion
FROM pg_policies
WHERE tablename = 'costings'
ORDER BY policyname;

-- Verificar que las funciones existen
SELECT 
  '✓ Funciones helper creadas' as verificacion,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name IN ('check_user_tenant_membership', 'check_user_is_admin')
ORDER BY routine_name;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 
-- 1. Las funciones helper usan SECURITY DEFINER para evitar recursión en RLS
-- 2. Super admins (role = 'admin' en users) pueden gestionar todos los costeos
-- 3. Miembros de tenants pueden leer y gestionar costeos de sus tenants
-- 4. Si aún tienes problemas, verifica:
--    - Que costings tenga la columna tenant_id
--    - Que tu usuario tenga un membership en el tenant
--    - Que el tenant_id se esté pasando correctamente al crear costeos

