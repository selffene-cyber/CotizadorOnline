-- CotizadorMIC - Schema for Cloudflare D1 (SQLite)
-- Migrated from PostgreSQL + Supabase to SQLite

-- Users (replaces auth.users + public.users from Supabase)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Refresh tokens for JWT auth
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- OAuth accounts (Google, GitHub)
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'github')),
  provider_account_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(provider, provider_account_id)
);

-- Access requests (signup approval flow)
CREATE TABLE IF NOT EXISTS access_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  notes TEXT
);

-- Tenants (organizations/companies)
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Memberships (user-tenant relationships)
CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'user')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, user_id)
);

-- Invitations
CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'user')),
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  invited_by TEXT REFERENCES users(id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rut TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  phone TEXT,
  region TEXT,
  city TEXT,
  address TEXT,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, rut)
);

-- Costings
CREATE TABLE IF NOT EXISTS costings (
  id TEXT PRIMARY KEY,
  costing_number INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('Fabricacion', 'Montaje', 'Obras Civiles', 'Reparacion', 'Eventos')),
  modality TEXT NOT NULL CHECK (modality IN ('Cerrado', 'HH+Mat', 'Mixto')),
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  items_mo TEXT DEFAULT '[]',
  items_materials TEXT DEFAULT '[]',
  items_equipment TEXT DEFAULT '[]',
  items_logistics TEXT DEFAULT '{}',
  items_indirects TEXT DEFAULT '[]',
  gg_percentage REAL DEFAULT 12,
  contingency_items TEXT DEFAULT '[]',
  utility_percentage REAL DEFAULT 55,
  totals TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Quotes
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Borrador' CHECK (status IN ('Borrador', 'Enviada', 'Aprobada', 'Perdida')),
  version INTEGER DEFAULT 1,
  parent_quote_id TEXT REFERENCES quotes(id),
  quote_number INTEGER,
  project_name TEXT NOT NULL,
  location TEXT,
  region TEXT,
  city TEXT,
  type TEXT CHECK (type IN ('Fabricacion', 'Montaje', 'Obras Civiles', 'Reparacion', 'Eventos')),
  modality TEXT CHECK (modality IN ('Cerrado', 'HH+Mat', 'Mixto')),
  scope TEXT DEFAULT '',
  exclusions TEXT DEFAULT '',
  assumptions TEXT DEFAULT '',
  execution_deadline INTEGER DEFAULT 30,
  validity INTEGER DEFAULT 30,
  payment_terms TEXT DEFAULT '',
  warranties TEXT DEFAULT '',
  quote_items TEXT DEFAULT '[]',
  costing_references TEXT DEFAULT '[]',
  utility_percentage REAL,
  totals TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Material catalog
CREATE TABLE IF NOT EXISTS material_catalog (
  id TEXT PRIMARY KEY,
  code TEXT,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  default_cost REAL DEFAULT 0,
  default_merma REAL DEFAULT 0,
  category TEXT,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Equipment catalog
CREATE TABLE IF NOT EXISTS equipment_catalog (
  id TEXT PRIMARY KEY,
  code TEXT,
  name TEXT NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('dia', 'hora')),
  default_rate REAL DEFAULT 0,
  category TEXT,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Company settings
CREATE TABLE IF NOT EXISTS company_settings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL DEFAULT '',
  rut TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  website TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  company_giro TEXT DEFAULT '',
  company_city TEXT DEFAULT '',
  company_region TEXT DEFAULT '',
  company_social_media TEXT DEFAULT '',
  quoter_name TEXT DEFAULT '',
  quoter_position TEXT DEFAULT '',
  quoter_email TEXT DEFAULT '',
  quoter_phone TEXT DEFAULT '',
  bank_account_name TEXT DEFAULT '',
  bank_account_rut TEXT DEFAULT '',
  bank_name TEXT DEFAULT '',
  bank_account_type TEXT DEFAULT '',
  bank_account_number TEXT DEFAULT '',
  bank_email TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- App settings (key-value store)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant ON memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_rut ON clients(rut);
CREATE INDEX IF NOT EXISTS idx_costings_tenant ON costings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_costings_client ON costings(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_tenant ON quotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_number ON quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_material_catalog_tenant ON material_catalog(tenant_id);
CREATE INDEX IF NOT EXISTS idx_equipment_catalog_tenant ON equipment_catalog(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitations_tenant ON invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_user ON access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);

-- Seed: Create admin user
-- Password: AdminCot2025!
INSERT OR IGNORE INTO users (id, email, password_hash, display_name, role)
VALUES ('admin-00000000-0000-0000-0000-000000000001', 'admin@piwisuite.cl', '$2a$10$Nig62A2eWXkh1CLAbmfWIel9Xi70wgFpv39oSbUzLSbIIv6vD95DW', 'Super Admin', 'admin');

-- Seed: Auto-approve admin access request
INSERT OR IGNORE INTO access_requests (id, user_id, email, status, requested_at)
VALUES ('ar-admin-00000000-0000-0000-000000000001', 'admin-00000000-0000-0000-0000-000000000001', 'admin@piwisuite.cl', 'approved', datetime('now'));

-- Seed: App settings
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('google_oauth_client_id', '');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('google_oauth_client_secret', '');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('github_oauth_client_id', '');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('github_oauth_client_secret', '');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('resend_api_key', '');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('app_url', 'https://cot.piwisuite.cl');