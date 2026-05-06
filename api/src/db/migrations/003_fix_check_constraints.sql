-- Fix: Replace CHECK constraints with special chars to ASCII-safe versions
-- SQLite/D1 has issues with non-ASCII chars in CHECK constraints

-- Drop and recreate costings table with fixed constraints
DROP TABLE IF EXISTS costings;

CREATE TABLE costings (
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

-- Drop and recreate quotes table with fixed constraints
DROP TABLE IF EXISTS quotes;

CREATE TABLE quotes (
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

-- Drop and recreate equipment_catalog with fixed constraint
DROP TABLE IF EXISTS equipment_catalog;

CREATE TABLE equipment_catalog (
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

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_costings_tenant ON costings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_costings_client ON costings(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_tenant ON quotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_number ON quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_equipment_catalog_tenant ON equipment_catalog(tenant_id);