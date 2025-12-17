-- ============================================
-- CORREGIR POLÍTICAS RLS PARA QUOTES (MULTI-TENANT)
-- ============================================

-- Eliminar políticas existentes antes de crear
DROP POLICY IF EXISTS "Users can read all quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can read quotes of their tenants" ON public.quotes;
DROP POLICY IF EXISTS "Users can insert quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can insert quotes in their tenants" ON public.quotes;
DROP POLICY IF EXISTS "Users can update quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update quotes of their tenants" ON public.quotes;
DROP POLICY IF EXISTS "Users can delete quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can delete quotes of their tenants" ON public.quotes;
DROP POLICY IF EXISTS "Super admin can manage all quotes" ON public.quotes;

-- Función helper para verificar si el usuario es super admin
CREATE OR REPLACE FUNCTION public.check_user_is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función helper para verificar si el usuario pertenece al tenant de la quote
CREATE OR REPLACE FUNCTION public.check_user_quote_tenant_membership(quote_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memberships
    WHERE tenant_id = quote_tenant_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Super admin puede ver todas las quotes
CREATE POLICY "Super admin can view all quotes" ON public.quotes
  FOR SELECT USING (public.check_user_is_super_admin());

-- Super admin puede gestionar todas las quotes
CREATE POLICY "Super admin can manage all quotes" ON public.quotes
  FOR ALL USING (public.check_user_is_super_admin());

-- Usuarios pueden ver quotes de sus tenants
CREATE POLICY "Users can read quotes of their tenants" ON public.quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.tenant_id = quotes.tenant_id
      AND memberships.user_id = auth.uid()
    )
  );

-- Usuarios pueden crear quotes en sus tenants
CREATE POLICY "Users can insert quotes in their tenants" ON public.quotes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.tenant_id = quotes.tenant_id
      AND memberships.user_id = auth.uid()
    )
  );

-- Usuarios pueden actualizar quotes de sus tenants
CREATE POLICY "Users can update quotes of their tenants" ON public.quotes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.tenant_id = quotes.tenant_id
      AND memberships.user_id = auth.uid()
    )
  );

-- Usuarios pueden eliminar quotes de sus tenants
CREATE POLICY "Users can delete quotes of their tenants" ON public.quotes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.tenant_id = quotes.tenant_id
      AND memberships.user_id = auth.uid()
    )
  );

