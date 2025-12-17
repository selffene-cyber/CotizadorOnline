-- Script FINAL para corregir recursión infinita en políticas RLS de memberships
-- Ejecutar este script en Supabase SQL Editor
--
-- Este script reemplaza todas las políticas problemáticas y usa funciones SECURITY DEFINER
-- para evitar recursión infinita.

-- ============================================
-- PASO 1: ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- ============================================

DROP POLICY IF EXISTS "Users can view memberships of their tenants" ON public.memberships;
DROP POLICY IF EXISTS "Admins can create memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins can update memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins can delete memberships" ON public.memberships;
DROP POLICY IF EXISTS "Super admins can view all memberships" ON public.memberships;
DROP POLICY IF EXISTS "Super admins can manage all memberships" ON public.memberships;
DROP POLICY IF EXISTS "Super admin can view all memberships" ON public.memberships;
DROP POLICY IF EXISTS "Super admin can manage all memberships" ON public.memberships;

-- ============================================
-- PASO 2: CREAR/ACTUALIZAR FUNCIÓN HELPER (SECURITY DEFINER)
-- ============================================

-- Función que verifica membership sin causar recursión (usa SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.check_user_tenant_membership(
  p_tenant_id UUID,
  p_user_id UUID,
  p_required_role TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANTE: Permite leer memberships sin pasar por RLS
SET search_path = public, auth, pg_temp
STABLE
AS $$
BEGIN
  -- Esta función tiene SECURITY DEFINER, por lo que puede leer memberships
  -- sin pasar por las políticas RLS, evitando recursión infinita
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
-- PASO 3: CREAR POLÍTICAS CORREGIDAS
-- ============================================

-- Super admins pueden ver todos los memberships (usando check_user_is_admin)
CREATE POLICY "Super admins can view all memberships" ON public.memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Super admins pueden gestionar (INSERT, UPDATE, DELETE) todos los memberships
CREATE POLICY "Super admins can manage all memberships" ON public.memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Usuarios pueden ver memberships de sus tenants (usando función para evitar recursión)
CREATE POLICY "Users can view memberships of their tenants" ON public.memberships
  FOR SELECT USING (
    -- Super admin puede ver todo (ya cubierto arriba)
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- O es miembro del tenant (usando función SECURITY DEFINER)
    public.check_user_tenant_membership(tenant_id, auth.uid())
  );

-- IMPORTANTE: Crear memberships - permite al creador del tenant crear el primer membership
CREATE POLICY "Admins can create memberships" ON public.memberships
  FOR INSERT WITH CHECK (
    -- Super admin puede crear cualquier membership
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- O es el creador del tenant (permite crear el primer membership sin recursión)
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE id = memberships.tenant_id
      AND created_by = auth.uid()
    )
    OR
    -- O es admin/owner del tenant (usando función SECURITY DEFINER para evitar recursión)
    public.check_user_tenant_membership(memberships.tenant_id, auth.uid(), 'admin')
    OR
    public.check_user_tenant_membership(memberships.tenant_id, auth.uid(), 'owner')
  );

-- Actualizar memberships: Super admin O admin/owner del tenant
CREATE POLICY "Admins can update memberships" ON public.memberships
  FOR UPDATE USING (
    -- Super admin puede actualizar cualquier membership
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- O es admin/owner del tenant (usando función SECURITY DEFINER)
    public.check_user_tenant_membership(tenant_id, auth.uid(), 'admin')
    OR
    public.check_user_tenant_membership(tenant_id, auth.uid(), 'owner')
  );

-- Eliminar memberships: Super admin O admin/owner del tenant
CREATE POLICY "Admins can delete memberships" ON public.memberships
  FOR DELETE USING (
    -- Super admin puede eliminar cualquier membership
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- O es admin/owner del tenant (usando función SECURITY DEFINER)
    public.check_user_tenant_membership(tenant_id, auth.uid(), 'admin')
    OR
    public.check_user_tenant_membership(tenant_id, auth.uid(), 'owner')
  );

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que las políticas se crearon correctamente
SELECT 
  'Políticas RLS memberships' as verificacion,
  policyname,
  cmd as operacion
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'memberships'
ORDER BY policyname;

-- Verificar que la función existe
SELECT 
  'Función check_user_tenant_membership' as verificacion,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_name = 'check_user_tenant_membership'
    ) THEN '✓ Existe'
    ELSE '✗ No existe'
  END as estado;

-- ============================================
-- NOTAS
-- ============================================

-- La política "Admins can create memberships" ahora permite:
-- 1. Super admins crear cualquier membership
-- 2. El creador del tenant crear el primer membership (sin necesidad de tener membership previo)
-- 3. Admins/owners del tenant crear memberships adicionales (usando función SECURITY DEFINER)

-- Esto resuelve el problema de recursión infinita porque:
-- - La función check_user_tenant_membership usa SECURITY DEFINER, evitando RLS
-- - El creador del tenant puede crear el primer membership sin verificar memberships existentes

