-- Script para corregir políticas RLS de catálogos (material_catalog y equipment_catalog)
-- Ejecutar este script en Supabase SQL Editor
--
-- Este script:
-- 1. Verifica las políticas RLS actuales
-- 2. Crea/actualiza las funciones helper necesarias
-- 3. Corrige las políticas RLS para permitir que los miembros del tenant gestionen sus catálogos

-- ============================================
-- PASO 1: VERIFICAR ESTADO ACTUAL
-- ============================================

-- Ver políticas actuales de material_catalog
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('material_catalog', 'equipment_catalog')
ORDER BY tablename, policyname;

-- Verificar si las tablas tienen tenant_id
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('material_catalog', 'equipment_catalog')
  AND column_name = 'tenant_id'
ORDER BY table_name;

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

-- Material Catalog
DROP POLICY IF EXISTS "Anyone can read catalogs" ON public.material_catalog;
DROP POLICY IF EXISTS "Users can manage material catalog" ON public.material_catalog;
DROP POLICY IF EXISTS "Users can read material catalog of their tenants" ON public.material_catalog;
DROP POLICY IF EXISTS "Users can manage material catalog of their tenants" ON public.material_catalog;
DROP POLICY IF EXISTS "Super admins can manage all material catalog" ON public.material_catalog;

-- Equipment Catalog
DROP POLICY IF EXISTS "Anyone can read equipment catalog" ON public.equipment_catalog;
DROP POLICY IF EXISTS "Users can manage equipment catalog" ON public.equipment_catalog;
DROP POLICY IF EXISTS "Users can read equipment catalog of their tenants" ON public.equipment_catalog;
DROP POLICY IF EXISTS "Users can manage equipment catalog of their tenants" ON public.equipment_catalog;
DROP POLICY IF EXISTS "Super admins can manage all equipment catalog" ON public.equipment_catalog;

-- ============================================
-- PASO 4: CREAR POLÍTICAS CORREGIDAS
-- ============================================

-- ============================================
-- MATERIAL_CATALOG
-- ============================================

-- Super admins pueden ver/gestionar todos los catálogos de materiales
CREATE POLICY "Super admins can manage all material catalog" ON public.material_catalog
  FOR ALL USING (
    public.check_user_is_admin(auth.uid())
  );

-- Usuarios pueden leer catálogos de materiales de sus tenants
CREATE POLICY "Users can read material catalog of their tenants" ON public.material_catalog
  FOR SELECT USING (
    -- Super admin puede ver todo (ya cubierto arriba)
    public.check_user_is_admin(auth.uid())
    OR
    -- O es miembro del tenant
    public.check_user_tenant_membership(tenant_id, auth.uid())
  );

-- Usuarios pueden gestionar catálogos de materiales de sus tenants
CREATE POLICY "Users can manage material catalog of their tenants" ON public.material_catalog
  FOR ALL USING (
    -- Super admin puede gestionar todo (ya cubierto arriba)
    public.check_user_is_admin(auth.uid())
    OR
    -- O es miembro del tenant
    public.check_user_tenant_membership(tenant_id, auth.uid())
  )
  WITH CHECK (
    -- Super admin puede gestionar todo (ya cubierto arriba)
    public.check_user_is_admin(auth.uid())
    OR
    -- O es miembro del tenant
    public.check_user_tenant_membership(tenant_id, auth.uid())
  );

-- ============================================
-- EQUIPMENT_CATALOG
-- ============================================

-- Super admins pueden ver/gestionar todos los catálogos de equipos
CREATE POLICY "Super admins can manage all equipment catalog" ON public.equipment_catalog
  FOR ALL USING (
    public.check_user_is_admin(auth.uid())
  );

-- Usuarios pueden leer catálogos de equipos de sus tenants
CREATE POLICY "Users can read equipment catalog of their tenants" ON public.equipment_catalog
  FOR SELECT USING (
    -- Super admin puede ver todo (ya cubierto arriba)
    public.check_user_is_admin(auth.uid())
    OR
    -- O es miembro del tenant
    public.check_user_tenant_membership(tenant_id, auth.uid())
  );

-- Usuarios pueden gestionar catálogos de equipos de sus tenants
CREATE POLICY "Users can manage equipment catalog of their tenants" ON public.equipment_catalog
  FOR ALL USING (
    -- Super admin puede gestionar todo (ya cubierto arriba)
    public.check_user_is_admin(auth.uid())
    OR
    -- O es miembro del tenant
    public.check_user_tenant_membership(tenant_id, auth.uid())
  )
  WITH CHECK (
    -- Super admin puede gestionar todo (ya cubierto arriba)
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
WHERE tablename IN ('material_catalog', 'equipment_catalog')
ORDER BY tablename, policyname;

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
-- 2. Super admins (role = 'admin' en users) pueden gestionar todos los catálogos
-- 3. Miembros de tenants pueden leer y gestionar catálogos de sus tenants
-- 4. Si aún tienes problemas, verifica:
--    - Que material_catalog y equipment_catalog tengan la columna tenant_id
--    - Que tu usuario tenga un membership en el tenant
--    - Que el tenant_id se esté pasando correctamente al crear/actualizar catálogos

