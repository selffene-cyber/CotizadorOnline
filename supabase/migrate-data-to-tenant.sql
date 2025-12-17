-- Script para migrar datos existentes a un tenant por defecto
-- Ejecutar este script en Supabase SQL Editor
--
-- IMPORTANTE: Este script:
-- 1. Busca un tenant existente (por nombre "Empresa Principal" o slug "default")
-- 2. Si no existe, crea uno automáticamente
-- 3. Migra todos los datos existentes (sin tenant_id) a ese tenant
--
-- INSTRUCCIONES:
-- 1. Ejecuta este script directamente en Supabase SQL Editor
-- 2. El script creará un tenant por defecto si no existe
-- 3. Todos los datos se migrarán automáticamente

-- ============================================
-- CONFIGURACIÓN
-- ============================================

-- Este script:
-- 1. Busca un tenant existente
-- 2. Si no existe, crea uno por defecto automáticamente
-- 3. Migra todos los datos a ese tenant

DO $$
DECLARE
  default_tenant_id UUID;
  default_tenant_slug TEXT := 'default';
  default_tenant_name TEXT := 'Empresa Principal';
  admin_user_id UUID;
BEGIN
  -- Buscar el tenant por defecto (puedes cambiar el nombre o slug)
  -- Opción 1: Por nombre o slug
  SELECT id INTO default_tenant_id
  FROM public.tenants
  WHERE name = default_tenant_name OR slug = default_tenant_slug
  LIMIT 1;

  -- Si no existe, usar el primer tenant
  IF default_tenant_id IS NULL THEN
    SELECT id INTO default_tenant_id
    FROM public.tenants
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  -- Si aún no existe, crear uno automáticamente
  IF default_tenant_id IS NULL THEN
    RAISE NOTICE 'No se encontró ningún tenant. Creando tenant por defecto...';
    
    -- Buscar un usuario admin para asignarlo como creador
    SELECT id INTO admin_user_id
    FROM public.users
    WHERE role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1;

    -- Si no hay admin, usar el primer usuario
    IF admin_user_id IS NULL THEN
      SELECT id INTO admin_user_id
      FROM public.users
      ORDER BY created_at ASC
      LIMIT 1;
    END IF;

    -- Crear el tenant por defecto
    INSERT INTO public.tenants (name, slug, created_by)
    VALUES (default_tenant_name, default_tenant_slug, admin_user_id)
    RETURNING id INTO default_tenant_id;

    RAISE NOTICE '✓ Tenant por defecto creado con ID: %', default_tenant_id;

    -- Si hay un usuario admin, agregarlo como owner del tenant
    IF admin_user_id IS NOT NULL THEN
      INSERT INTO public.memberships (tenant_id, user_id, role)
      VALUES (default_tenant_id, admin_user_id, 'owner')
      ON CONFLICT (tenant_id, user_id) DO NOTHING;
      
      RAISE NOTICE '✓ Usuario admin agregado como owner del tenant';
    END IF;
  ELSE
    RAISE NOTICE 'Usando tenant existente con ID: %', default_tenant_id;
  END IF;

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

