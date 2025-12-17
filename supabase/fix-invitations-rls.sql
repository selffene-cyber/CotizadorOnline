-- Script para corregir políticas RLS de invitations
-- Ejecutar este script en Supabase SQL Editor
--
-- PROBLEMA: Las políticas RLS de invitations no permiten INSERT correctamente
-- y pueden causar recursión si consultan memberships directamente.
--
-- SOLUCIÓN: Usar políticas separadas para cada operación y funciones SECURITY DEFINER

-- ============================================
-- PASO 1: ELIMINAR POLÍTICAS EXISTENTES
-- ============================================

DROP POLICY IF EXISTS "Users can view invitations of their tenants" ON public.invitations;
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.invitations;
DROP POLICY IF EXISTS "Super admins can view all invitations" ON public.invitations;
DROP POLICY IF EXISTS "Super admins can manage all invitations" ON public.invitations;

-- ============================================
-- PASO 2: ASEGURAR QUE EXISTE LA FUNCIÓN HELPER
-- ============================================

-- Crear función helper si no existe (para evitar recursión)
CREATE OR REPLACE FUNCTION public.check_user_tenant_membership(
  p_tenant_id UUID,
  p_user_id UUID,
  p_required_role TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
BEGIN
  IF p_required_role IS NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.memberships
      WHERE tenant_id = p_tenant_id
      AND user_id = p_user_id
    );
  ELSE
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

-- Super admins pueden ver todas las invitaciones
CREATE POLICY "Super admins can view all invitations" ON public.invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Super admins pueden gestionar todas las invitaciones
CREATE POLICY "Super admins can manage all invitations" ON public.invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Usuarios pueden ver invitaciones de sus tenants
CREATE POLICY "Users can view invitations of their tenants" ON public.invitations
  FOR SELECT USING (
    -- Super admin puede ver todo (ya cubierto arriba)
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- O es miembro del tenant (usando función para evitar recursión)
    public.check_user_tenant_membership(tenant_id, auth.uid())
  );

-- IMPORTANTE: Owners/admins pueden crear invitaciones en sus tenants
CREATE POLICY "Admins can create invitations" ON public.invitations
  FOR INSERT WITH CHECK (
    -- Super admin puede crear cualquier invitación
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- O es el creador del tenant (permite crear invitaciones sin membership previo)
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE id = invitations.tenant_id
      AND created_by = auth.uid()
    )
    OR
    -- O es admin/owner del tenant (usando función SECURITY DEFINER para evitar recursión)
    public.check_user_tenant_membership(invitations.tenant_id, auth.uid(), 'admin')
    OR
    public.check_user_tenant_membership(invitations.tenant_id, auth.uid(), 'owner')
  );

-- Owners/admins pueden actualizar invitaciones de sus tenants
CREATE POLICY "Admins can update invitations" ON public.invitations
  FOR UPDATE USING (
    -- Super admin puede actualizar cualquier invitación
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

-- Owners/admins pueden eliminar invitaciones de sus tenants
CREATE POLICY "Admins can delete invitations" ON public.invitations
  FOR DELETE USING (
    -- Super admin puede eliminar cualquier invitación
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
  'Políticas RLS invitations' as verificacion,
  policyname,
  cmd as operacion,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK'
    WHEN qual IS NOT NULL THEN 'USING'
    ELSE 'ALL'
  END as tipo
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'invitations'
ORDER BY policyname;

-- ============================================
-- NOTAS
-- ============================================

-- La política "Admins can create invitations" ahora permite:
-- 1. Super admins crear cualquier invitación
-- 2. El creador del tenant crear invitaciones (sin necesidad de tener membership previo)
-- 3. Admins/owners del tenant crear invitaciones (usando función SECURITY DEFINER)

-- Esto resuelve el problema porque:
-- - Usa WITH CHECK para INSERT (no solo USING)
-- - La función check_user_tenant_membership usa SECURITY DEFINER, evitando RLS
-- - El creador del tenant puede crear invitaciones sin verificar memberships existentes

