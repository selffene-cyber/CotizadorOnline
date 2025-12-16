-- Script SQL para migrar a modelo multi-tenant SaaS
-- Ejecutar este script en el SQL Editor de Supabase DESPUÉS del schema.sql base

-- ============================================
-- TABLAS MULTI-TENANT
-- ============================================

-- Tabla de tenants (empresas)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- Para la URL: cot.piwisuite.cl/{slug}
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de memberships (relación usuarios-empresas con roles)
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id) -- Un usuario solo puede tener un rol por tenant
);

-- Tabla de invitaciones
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'user')),
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  invited_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de solicitudes de acceso (para aprobar/rechazar)
CREATE TABLE IF NOT EXISTS public.access_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT
);

-- ============================================
-- AGREGAR tenant_id A TABLAS EXISTENTES
-- ============================================

-- Agregar tenant_id a clients
ALTER TABLE public.clients 
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Agregar tenant_id a quotes
ALTER TABLE public.quotes 
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Agregar tenant_id a costings
ALTER TABLE public.costings 
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Agregar tenant_id a material_catalog
ALTER TABLE public.material_catalog 
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Agregar tenant_id a equipment_catalog
ALTER TABLE public.equipment_catalog 
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Agregar tenant_id a company_settings
ALTER TABLE public.company_settings 
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_id ON public.memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON public.access_requests(status);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON public.clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotes_tenant_id ON public.quotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_costings_tenant_id ON public.costings(tenant_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para actualizar updated_at en tenants
DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en memberships
DROP TRIGGER IF EXISTS update_memberships_updated_at ON public.memberships;
CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en invitations
DROP TRIGGER IF EXISTS update_invitations_updated_at ON public.invitations;
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en nuevas tablas
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS PARA TENANTS
-- ============================================

-- Eliminar políticas existentes antes de crear
DROP POLICY IF EXISTS "Users can view their tenants" ON public.tenants;
DROP POLICY IF EXISTS "Owners can create tenants" ON public.tenants;
DROP POLICY IF EXISTS "Owners can update their tenants" ON public.tenants;

-- Usuarios solo pueden ver tenants donde tienen membership
CREATE POLICY "Users can view their tenants" ON public.tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.tenant_id = tenants.id
      AND memberships.user_id = auth.uid()
    )
  );

-- Solo owners pueden crear tenants (o super admin)
CREATE POLICY "Owners can create tenants" ON public.tenants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Solo owners pueden actualizar sus tenants
CREATE POLICY "Owners can update their tenants" ON public.tenants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.tenant_id = tenants.id
      AND memberships.user_id = auth.uid()
      AND memberships.role = 'owner'
    )
  );

-- ============================================
-- POLÍTICAS RLS PARA MEMBERSHIPS
-- ============================================

-- Eliminar políticas existentes antes de crear
DROP POLICY IF EXISTS "Users can view memberships of their tenants" ON public.memberships;
DROP POLICY IF EXISTS "Admins can create memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins can update memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins can delete memberships" ON public.memberships;

-- Usuarios pueden ver memberships de sus tenants
CREATE POLICY "Users can view memberships of their tenants" ON public.memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships m2
      WHERE m2.tenant_id = memberships.tenant_id
      AND m2.user_id = auth.uid()
    )
  );

-- Solo owners/admins pueden crear memberships
CREATE POLICY "Admins can create memberships" ON public.memberships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m2
      WHERE m2.tenant_id = memberships.tenant_id
      AND m2.user_id = auth.uid()
      AND m2.role IN ('owner', 'admin')
    )
  );

-- Solo owners/admins pueden actualizar memberships
CREATE POLICY "Admins can update memberships" ON public.memberships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.memberships m2
      WHERE m2.tenant_id = memberships.tenant_id
      AND m2.user_id = auth.uid()
      AND m2.role IN ('owner', 'admin')
    )
  );

-- Solo owners/admins pueden eliminar memberships
CREATE POLICY "Admins can delete memberships" ON public.memberships
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.memberships m2
      WHERE m2.tenant_id = memberships.tenant_id
      AND m2.user_id = auth.uid()
      AND m2.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- POLÍTICAS RLS PARA INVITATIONS
-- ============================================

-- Eliminar políticas existentes antes de crear
DROP POLICY IF EXISTS "Users can view invitations of their tenants" ON public.invitations;
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.invitations;

-- Usuarios pueden ver invitaciones de sus tenants
CREATE POLICY "Users can view invitations of their tenants" ON public.invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.tenant_id = invitations.tenant_id
      AND memberships.user_id = auth.uid()
    )
  );

-- Solo admins pueden gestionar invitaciones
CREATE POLICY "Admins can manage invitations" ON public.invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.tenant_id = invitations.tenant_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- POLÍTICAS RLS PARA ACCESS_REQUESTS
-- ============================================

-- Eliminar políticas existentes antes de crear
DROP POLICY IF EXISTS "Super admin can view all access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Super admin can manage access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Users can view own access requests" ON public.access_requests;

-- Super admin puede ver todas las solicitudes
CREATE POLICY "Super admin can view all access requests" ON public.access_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Super admin puede gestionar solicitudes
CREATE POLICY "Super admin can manage access requests" ON public.access_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Usuarios pueden ver sus propias solicitudes
CREATE POLICY "Users can view own access requests" ON public.access_requests
  FOR SELECT USING (user_id = auth.uid());

-- ============================================
-- ACTUALIZAR POLÍTICAS RLS EXISTENTES PARA MULTI-TENANT
-- ============================================

-- Actualizar políticas de clients para incluir tenant_id
-- Eliminar políticas existentes antes de crear
DROP POLICY IF EXISTS "Users can read all clients" ON public.clients;
DROP POLICY IF EXISTS "Users can read clients of their tenants" ON public.clients;
DROP POLICY IF EXISTS "Users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert clients in their tenants" ON public.clients;
DROP POLICY IF EXISTS "Users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update clients of their tenants" ON public.clients;
DROP POLICY IF EXISTS "Users can delete clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete clients of their tenants" ON public.clients;

CREATE POLICY "Users can read clients of their tenants" ON public.clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.tenant_id = clients.tenant_id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert clients in their tenants" ON public.clients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.tenant_id = clients.tenant_id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update clients of their tenants" ON public.clients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.tenant_id = clients.tenant_id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete clients of their tenants" ON public.clients
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.tenant_id = clients.tenant_id
      AND memberships.user_id = auth.uid()
    )
  );

-- Similar para quotes, costings, etc. (se pueden agregar después)

-- ============================================
-- FUNCIÓN HELPER PARA OBTENER TENANT_ID DEL USUARIO ACTUAL
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_tenants()
RETURNS TABLE(tenant_id UUID, role TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT m.tenant_id, m.role
  FROM public.memberships m
  WHERE m.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

