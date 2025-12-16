-- Script SQL para crear las tablas en Supabase
-- Ejecutar este script en el SQL Editor de Supabase

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios (extiende auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  rut TEXT UNIQUE NOT NULL,
  contact TEXT,
  email TEXT,
  phone TEXT,
  region TEXT,
  city TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabla de costeos
CREATE TABLE IF NOT EXISTS public.costings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  costing_number INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('Fabricación', 'Montaje', 'Obras Civiles', 'Reparación', 'Eventos')),
  modality TEXT NOT NULL CHECK (modality IN ('Cerrado', 'HH+Mat', 'Mixto')),
  client_id UUID REFERENCES public.clients(id),
  
  -- Items de costeo (JSONB para flexibilidad)
  items_mo JSONB DEFAULT '[]'::jsonb,
  items_materials JSONB DEFAULT '[]'::jsonb,
  items_equipment JSONB DEFAULT '[]'::jsonb,
  items_logistics JSONB DEFAULT '{}'::jsonb,
  items_indirects JSONB DEFAULT '[]'::jsonb,
  
  -- Configuración
  gg_percentage NUMERIC DEFAULT 12,
  contingency_items JSONB DEFAULT '[]'::jsonb,
  utility_percentage NUMERIC DEFAULT 55,
  
  -- Totales calculados
  totals JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabla de cotizaciones
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  status TEXT NOT NULL DEFAULT 'Borrador' CHECK (status IN ('Borrador', 'Enviada', 'Aprobada', 'Perdida')),
  version INTEGER DEFAULT 1,
  parent_quote_id UUID REFERENCES public.quotes(id),
  quote_number INTEGER,
  
  -- Datos del proyecto
  project_name TEXT NOT NULL,
  location TEXT,
  region TEXT,
  city TEXT,
  type TEXT CHECK (type IN ('Fabricación', 'Montaje', 'Obras Civiles', 'Reparación', 'Eventos')),
  modality TEXT CHECK (modality IN ('Cerrado', 'HH+Mat', 'Mixto')),
  scope TEXT DEFAULT '',
  exclusions TEXT DEFAULT '',
  assumptions TEXT DEFAULT '',
  execution_deadline INTEGER DEFAULT 30,
  validity INTEGER DEFAULT 30,
  payment_terms TEXT DEFAULT '',
  warranties TEXT DEFAULT '',
  
  -- Items y referencias
  quote_items JSONB DEFAULT '[]'::jsonb,
  costing_references JSONB DEFAULT '[]'::jsonb,
  utility_percentage NUMERIC,
  
  -- Totales
  totals JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabla de catálogos de materiales
CREATE TABLE IF NOT EXISTS public.material_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  default_cost NUMERIC DEFAULT 0,
  default_merma NUMERIC DEFAULT 0,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de catálogos de equipos
CREATE TABLE IF NOT EXISTS public.equipment_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('día', 'hora')),
  default_rate NUMERIC DEFAULT 0,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de configuración de la empresa
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  rut TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_clients_rut ON public.clients(rut);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON public.quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_costings_client_id ON public.costings(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes(created_at DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_costings_updated_at BEFORE UPDATE ON public.costings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Políticas de seguridad
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.costings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Políticas: Usuarios autenticados pueden leer/escribir todo
CREATE POLICY "Users can read all clients" ON public.clients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert clients" ON public.clients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update clients" ON public.clients
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete clients" ON public.clients
  FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para quotes
CREATE POLICY "Users can read all quotes" ON public.quotes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert quotes" ON public.quotes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update quotes" ON public.quotes
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete quotes" ON public.quotes
  FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para costings
CREATE POLICY "Users can read all costings" ON public.costings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert costings" ON public.costings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update costings" ON public.costings
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete costings" ON public.costings
  FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para catálogos (lectura pública, escritura autenticada)
CREATE POLICY "Anyone can read catalogs" ON public.material_catalog
  FOR SELECT USING (true);

CREATE POLICY "Users can manage material catalog" ON public.material_catalog
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can read equipment catalog" ON public.equipment_catalog
  FOR SELECT USING (true);

CREATE POLICY "Users can manage equipment catalog" ON public.equipment_catalog
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para users
CREATE POLICY "Users can read all users" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para company_settings
CREATE POLICY "Users can read settings" ON public.company_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage settings" ON public.company_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
