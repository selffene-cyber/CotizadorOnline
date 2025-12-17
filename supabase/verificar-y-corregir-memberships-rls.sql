-- Script para verificar y corregir políticas RLS de memberships
-- Ejecutar este script en Supabase SQL Editor
--
-- Este script:
-- 1. Verifica las políticas RLS actuales
-- 2. Crea/actualiza las funciones helper necesarias
-- 3. Corrige las políticas RLS para permitir que super admins y creadores de tenants puedan crear memberships

-- ============================================
-- PASO 1: VERIFICAR ESTADO ACTUAL
-- ============================================

-- Ver políticas actuales de memberships
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'memberships'
ORDER BY policyname;

-- Verificar funciones helper
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name IN ('check_user_tenant_membership', 'check_user_is_admin')
ORDER BY routine_name;

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

DROP POLICY IF EXISTS "Admins can create memberships" ON public.memberships;
DROP POLICY IF EXISTS "Super admins can create memberships" ON public.memberships;
DROP POLICY IF EXISTS "Tenant creators can create memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can view memberships of their tenants" ON public.memberships;
DROP POLICY IF EXISTS "Admins can update memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins can delete memberships" ON public.memberships;
DROP POLICY IF EXISTS "Super admins can view all memberships" ON public.memberships;
DROP POLICY IF EXISTS "Super admins can manage all memberships" ON public.memberships;

-- ============================================
-- PASO 4: CREAR POLÍTICAS CORREGIDAS
-- ============================================

-- Super admins pueden ver/gestionar todos los memberships
CREATE POLICY "Super admins can view all memberships" ON public.memberships
  FOR SELECT USING (
    public.check_user_is_admin(auth.uid())
  );

CREATE POLICY "Super admins can manage all memberships" ON public.memberships
  FOR ALL USING (
    public.check_user_is_admin(auth.uid())
  );

-- Usuarios pueden ver memberships de sus tenants
CREATE POLICY "Users can view memberships of their tenants" ON public.memberships
  FOR SELECT USING (
    -- Super admin puede ver todo (ya cubierto arriba)
    public.check_user_is_admin(auth.uid())
    OR
    -- O es miembro del tenant
    public.check_user_tenant_membership(tenant_id, auth.uid())
  );

-- Crear memberships: Super admin O creador del tenant O admin/owner del tenant
CREATE POLICY "Admins can create memberships" ON public.memberships
  FOR INSERT WITH CHECK (
    -- Super admin puede crear cualquier membership
    public.check_user_is_admin(auth.uid())
    OR
    -- O es el creador del tenant (permite crear el primer membership)
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE id = tenant_id
      AND created_by = auth.uid()
    )
    OR
    -- O es admin/owner del tenant (usando función para evitar recursión)
    public.check_user_tenant_membership(tenant_id, auth.uid(), 'admin')
    OR
    public.check_user_tenant_membership(tenant_id, auth.uid(), 'owner')
  );

-- Actualizar memberships: Super admin O admin/owner del tenant
CREATE POLICY "Admins can update memberships" ON public.memberships
  FOR UPDATE USING (
    -- Super admin puede actualizar cualquier membership
    public.check_user_is_admin(auth.uid())
    OR
    -- O es admin/owner del tenant (usando función para evitar recursión)
    public.check_user_tenant_membership(tenant_id, auth.uid(), 'admin')
    OR
    public.check_user_tenant_membership(tenant_id, auth.uid(), 'owner')
  );

-- Eliminar memberships: Super admin O admin/owner del tenant
CREATE POLICY "Admins can delete memberships" ON public.memberships
  FOR DELETE USING (
    -- Super admin puede eliminar cualquier membership
    public.check_user_is_admin(auth.uid())
    OR
    -- O es admin/owner del tenant (usando función para evitar recursión)
    public.check_user_tenant_membership(tenant_id, auth.uid(), 'admin')
    OR
    public.check_user_tenant_membership(tenant_id, auth.uid(), 'owner')
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
WHERE tablename = 'memberships'
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
-- 2. Super admins (role = 'admin' en users) pueden gestionar todos los memberships
-- 3. Creadores de tenants pueden crear memberships en sus tenants
-- 4. Admins/owners de tenants pueden gestionar memberships en sus tenants
-- 5. Si aún tienes problemas, verifica:
--    - Que tu usuario tenga role = 'admin' en public.users
--    - Que el tenant tenga created_by = tu user_id
--    - Que no exista ya un membership para ese usuario en ese tenant

