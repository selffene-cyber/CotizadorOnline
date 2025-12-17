-- Script para corregir políticas RLS de memberships para INSERT
-- Ejecutar este script en Supabase SQL Editor
--
-- Este script asegura que:
-- 1. Super admins pueden crear cualquier membership
-- 2. Creadores de tenants pueden crear memberships en sus tenants
-- 3. Admins/owners de tenants pueden crear memberships en sus tenants
-- 4. Se usa una función SECURITY DEFINER para evitar recursión

-- ============================================
-- PASO 1: CREAR/VERIFICAR FUNCIÓN HELPER
-- ============================================

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
-- PASO 2: CREAR FUNCIÓN PARA VERIFICAR SUPER ADMIN
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

-- ============================================
-- PASO 3: ELIMINAR POLÍTICAS EXISTENTES
-- ============================================

DROP POLICY IF EXISTS "Admins can create memberships" ON public.memberships;
DROP POLICY IF EXISTS "Super admins can create memberships" ON public.memberships;
DROP POLICY IF EXISTS "Tenant creators can create memberships" ON public.memberships;

-- ============================================
-- PASO 4: CREAR POLÍTICA CORREGIDA PARA INSERT
-- ============================================

-- Política que permite crear memberships si:
-- 1. El usuario es super admin
-- 2. El usuario es el creador del tenant
-- 3. El usuario es admin/owner del tenant (usando función para evitar recursión)
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

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que la política se creó correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'memberships'
  AND policyname = 'Admins can create memberships';

-- Verificar que las funciones existen
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name IN ('check_user_tenant_membership', 'check_user_is_admin')
ORDER BY routine_name;

