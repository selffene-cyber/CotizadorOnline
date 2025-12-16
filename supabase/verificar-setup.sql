-- Script para verificar que todo está configurado correctamente
-- Ejecutar este script después de crear el usuario admin

-- ============================================
-- VERIFICACIÓN DE TABLAS
-- ============================================

SELECT 
  'Tablas base' as categoria,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN '✓ users'
    ELSE '✗ users NO EXISTE'
  END as estado
UNION ALL
SELECT 
  'Tablas base',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN '✓ clients'
    ELSE '✗ clients NO EXISTE'
  END
UNION ALL
SELECT 
  'Tablas multi-tenant',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants') THEN '✓ tenants'
    ELSE '✗ tenants NO EXISTE - Ejecuta schema-multi-tenant.sql'
  END
UNION ALL
SELECT 
  'Tablas multi-tenant',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'memberships') THEN '✓ memberships'
    ELSE '✗ memberships NO EXISTE - Ejecuta schema-multi-tenant.sql'
  END;

-- ============================================
-- VERIFICACIÓN DE USUARIO ADMIN
-- ============================================

SELECT 
  'Verificación de usuario' as categoria,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM auth.users WHERE email = 'jeans.selfene@outlook.com'
    ) THEN '✓ Usuario existe en auth.users'
    ELSE '✗ Usuario NO existe en auth.users - Créalo primero'
  END as estado
UNION ALL
SELECT 
  'Verificación de usuario',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.users 
      WHERE email = 'jeans.selfene@outlook.com' AND role = 'admin'
    ) THEN '✓ Usuario tiene rol admin en public.users'
    ELSE '✗ Usuario NO tiene rol admin - Ejecuta setup-admin-user.sql'
  END;

-- ============================================
-- DETALLES DEL USUARIO
-- ============================================

SELECT 
  u.id,
  u.email,
  u.display_name,
  u.role,
  u.created_at,
  CASE 
    WHEN u.role = 'admin' THEN '✓ Es admin'
    ELSE '✗ NO es admin'
  END as estado_admin
FROM public.users u
WHERE u.email = 'jeans.selfene@outlook.com';

-- ============================================
-- VERIFICACIÓN DE POLÍTICAS RLS
-- ============================================

SELECT 
  'Políticas RLS' as categoria,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'users' 
      AND policyname = 'Users can read all users'
    ) THEN '✓ Política de lectura para users existe'
    ELSE '✗ Política de lectura para users NO existe'
  END as estado;

-- ============================================
-- RESUMEN
-- ============================================

DO $$
DECLARE
  user_exists_auth BOOLEAN;
  user_exists_public BOOLEAN;
  user_is_admin BOOLEAN;
BEGIN
  -- Verificar usuario en auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'jeans.selfene@outlook.com'
  ) INTO user_exists_auth;
  
  -- Verificar usuario en public.users
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE email = 'jeans.selfene@outlook.com'
  ) INTO user_exists_public;
  
  -- Verificar que sea admin
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE email = 'jeans.selfene@outlook.com' AND role = 'admin'
  ) INTO user_is_admin;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RESUMEN DE VERIFICACIÓN';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Usuario en auth.users: %', CASE WHEN user_exists_auth THEN '✓ SÍ' ELSE '✗ NO' END;
  RAISE NOTICE 'Usuario en public.users: %', CASE WHEN user_exists_public THEN '✓ SÍ' ELSE '✗ NO' END;
  RAISE NOTICE 'Usuario es admin: %', CASE WHEN user_is_admin THEN '✓ SÍ' ELSE '✗ NO' END;
  RAISE NOTICE '========================================';
  
  IF user_exists_auth AND user_exists_public AND user_is_admin THEN
    RAISE NOTICE '✓ TODO ESTÁ CONFIGURADO CORRECTAMENTE';
    RAISE NOTICE 'Puedes iniciar sesión y acceder a /admin';
  ELSE
    RAISE NOTICE '✗ HAY PROBLEMAS QUE RESOLVER:';
    IF NOT user_exists_auth THEN
      RAISE NOTICE '  - Crea el usuario en Supabase Dashboard > Authentication > Users';
    END IF;
    IF NOT user_exists_public THEN
      RAISE NOTICE '  - Ejecuta setup-admin-user.sql para crear el registro en public.users';
    END IF;
    IF NOT user_is_admin THEN
      RAISE NOTICE '  - Ejecuta setup-admin-user.sql para asignar rol admin';
    END IF;
  END IF;
END $$;

