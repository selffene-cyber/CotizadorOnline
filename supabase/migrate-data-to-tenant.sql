-- Script para migrar datos existentes a un tenant por defecto
-- Ejecutar este script en Supabase SQL Editor DESPUÉS de crear el tenant por defecto
--
-- IMPORTANTE: Este script asume que:
-- 1. Ya existe un tenant por defecto (creado desde el panel admin o manualmente)
-- 2. Los datos existentes no tienen tenant_id asignado (son NULL)
--
-- INSTRUCCIONES:
-- 1. Crea un tenant por defecto desde el panel admin o manualmente
-- 2. Obtén el ID del tenant por defecto
-- 3. Reemplaza 'TENANT_ID_AQUI' con el ID real del tenant
-- 4. Ejecuta este script

-- ============================================
-- CONFIGURACIÓN
-- ============================================

-- Reemplaza esto con el ID del tenant por defecto
DO $$
DECLARE
  default_tenant_id UUID;
BEGIN
  -- Buscar el tenant por defecto (puedes cambiar el nombre o slug)
  -- Opción 1: Por nombre
  SELECT id INTO default_tenant_id
  FROM public.tenants
  WHERE name = 'Empresa Principal' OR slug = 'default'
  LIMIT 1;

  -- Si no existe, usar el primer tenant
  IF default_tenant_id IS NULL THEN
    SELECT id INTO default_tenant_id
    FROM public.tenants
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF default_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró ningún tenant. Crea uno primero desde el panel admin.';
  END IF;

  RAISE NOTICE 'Usando tenant por defecto con ID: %', default_tenant_id;

  -- ============================================
  -- MIGRAR DATOS
  -- ============================================

  -- Migrar clients
  UPDATE public.clients
  SET tenant_id = default_tenant_id
  WHERE tenant_id IS NULL;

  RAISE NOTICE '✓ Clients migrados';

  -- Migrar quotes
  UPDATE public.quotes
  SET tenant_id = default_tenant_id
  WHERE tenant_id IS NULL;

  RAISE NOTICE '✓ Quotes migrados';

  -- Migrar costings
  UPDATE public.costings
  SET tenant_id = default_tenant_id
  WHERE tenant_id IS NULL;

  RAISE NOTICE '✓ Costings migrados';

  -- Migrar material_catalog
  UPDATE public.material_catalog
  SET tenant_id = default_tenant_id
  WHERE tenant_id IS NULL;

  RAISE NOTICE '✓ Material catalog migrado';

  -- Migrar equipment_catalog
  UPDATE public.equipment_catalog
  SET tenant_id = default_tenant_id
  WHERE tenant_id IS NULL;

  RAISE NOTICE '✓ Equipment catalog migrado';

  -- Migrar company_settings
  UPDATE public.company_settings
  SET tenant_id = default_tenant_id
  WHERE tenant_id IS NULL;

  RAISE NOTICE '✓ Company settings migrados';

  -- ============================================
  -- VERIFICACIÓN
  -- ============================================

  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRACIÓN COMPLETADA';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tenant ID usado: %', default_tenant_id;
  RAISE NOTICE '========================================';

END $$;

-- ============================================
-- VERIFICAR MIGRACIÓN
-- ============================================

-- Contar registros por tenant
SELECT 
  'clients' as tabla,
  tenant_id,
  COUNT(*) as total
FROM public.clients
GROUP BY tenant_id
UNION ALL
SELECT 
  'quotes' as tabla,
  tenant_id,
  COUNT(*) as total
FROM public.quotes
GROUP BY tenant_id
UNION ALL
SELECT 
  'costings' as tabla,
  tenant_id,
  COUNT(*) as total
FROM public.costings
GROUP BY tenant_id
ORDER BY tabla, tenant_id;

-- Si ves registros con tenant_id, la migración fue exitosa
-- Si ves registros con tenant_id = NULL, esos no se migraron (pueden ser nuevos)

