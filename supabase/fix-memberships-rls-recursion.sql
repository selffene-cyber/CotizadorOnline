-- Script para corregir recursión infinita en políticas RLS de memberships
-- Ejecutar este script en Supabase SQL Editor
--
-- PROBLEMA: Las políticas RLS de memberships consultan memberships dentro de su verificación,
-- causando recursión infinita.
--
-- SOLUCIÓN: Usar políticas que no consulten memberships para verificar permisos,
-- o usar funciones SECURITY DEFINER.

-- ============================================
-- ELIMINAR POLÍTICAS PROBLEMÁTICAS
-- ============================================

DROP POLICY IF EXISTS "Users can view memberships of their tenants" ON public.memberships;
DROP POLICY IF EXISTS "Admins can create memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins can update memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins can delete memberships" ON public.memberships;
DROP POLICY IF EXISTS "Super admins can view all memberships" ON public.memberships;
DROP POLICY IF EXISTS "Super admins can manage all memberships" ON public.memberships;

-- ============================================
-- FUNCIÓN HELPER PARA VERIFICAR MEMBERSHIP (EVITA RECURSIÓN)
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
-- POLÍTICAS CORREGIDAS PARA MEMBERSHIPS
-- ============================================

-- Super admins pueden ver/gestionar todos los memberships
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

-- Usuarios pueden ver memberships de sus tenants (usando función para evitar recursión)
CREATE POLICY "Users can view memberships of their tenants" ON public.memberships
  FOR SELECT USING (
    -- Super admin puede ver todo (ya cubierto arriba)
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- O es miembro del tenant
    public.check_user_tenant_membership(tenant_id, auth.uid())
  );

-- Crear memberships: Super admin O admin/owner del tenant O creador del tenant
CREATE POLICY "Admins can create memberships" ON public.memberships
  FOR INSERT WITH CHECK (
    -- Super admin puede crear cualquier membership
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- O es admin/owner del tenant (usando función para evitar recursión)
    public.check_user_tenant_membership(tenant_id, auth.uid(), 'admin')
    OR
    public.check_user_tenant_membership(tenant_id, auth.uid(), 'owner')
    OR
    -- O es el creador del tenant (permite crear el primer membership)
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE id = tenant_id
      AND created_by = auth.uid()
    )
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
    -- O es admin/owner del tenant (usando función para evitar recursión)
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
    -- O es admin/owner del tenant (usando función para evitar recursión)
    public.check_user_tenant_membership(tenant_id, auth.uid(), 'admin')
    OR
    public.check_user_tenant_membership(tenant_id, auth.uid(), 'owner')
  );

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'memberships'
ORDER BY policyname;

-- Si ves las políticas listadas, todo está correcto

