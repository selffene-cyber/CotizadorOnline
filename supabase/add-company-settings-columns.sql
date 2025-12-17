-- ============================================
-- AGREGAR COLUMNAS FALTANTES A company_settings
-- ============================================

-- Agregar columnas para datos completos de la empresa
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS company_giro TEXT,
  ADD COLUMN IF NOT EXISTS company_city TEXT,
  ADD COLUMN IF NOT EXISTS company_region TEXT,
  ADD COLUMN IF NOT EXISTS company_social_media TEXT,
  ADD COLUMN IF NOT EXISTS quoter_name TEXT,
  ADD COLUMN IF NOT EXISTS quoter_position TEXT,
  ADD COLUMN IF NOT EXISTS quoter_email TEXT,
  ADD COLUMN IF NOT EXISTS quoter_phone TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_rut TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_type TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_email TEXT;

