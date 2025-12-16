-- Script para corregir el usuario admin
-- Ejecutar este script en Supabase SQL Editor
-- 
-- Este script:
-- 1. Busca el usuario en auth.users
-- 2. Crea/actualiza el registro en public.users con rol admin
-- 3. Verifica que todo esté correcto

-- ============================================
-- PASO 1: Verificar y crear registro en public.users
-- ============================================

DO $$
DECLARE
  user_id UUID;
  user_email TEXT := 'jeans.selfene@outlook.com';
  user_exists BOOLEAN;
BEGIN
  -- Buscar el usuario en auth.users
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario % no encontrado en auth.users. Por favor, créalo primero desde el Dashboard de Supabase (Authentication > Users > Add User).', user_email;
  END IF;

  RAISE NOTICE '✓ Usuario encontrado en auth.users con ID: %', user_id;

  -- Verificar si existe en public.users
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = user_id
  ) INTO user_exists;

  IF user_exists THEN
    -- Actualizar el rol a admin
    UPDATE public.users
    SET 
      role = 'admin',
      email = user_email,
      updated_at = NOW()
    WHERE id = user_id;
    
    RAISE NOTICE '✓ Usuario actualizado en public.users con rol admin';
  ELSE
    -- Crear el registro
    INSERT INTO public.users (id, email, display_name, role)
    VALUES (
      user_id,
      user_email,
      user_email,
      'admin'
    );
    
    RAISE NOTICE '✓ Usuario creado en public.users con rol admin';
  END IF;

  -- Verificar que se creó/actualizó correctamente
  PERFORM 1 FROM public.users WHERE id = user_id AND role = 'admin';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Error: No se pudo verificar que el usuario tiene rol admin';
  END IF;

  RAISE NOTICE '✓ Verificación exitosa';
  RAISE NOTICE '  Email: %', user_email;
  RAISE NOTICE '  ID: %', user_id;
  RAISE NOTICE '  Rol: admin';

END $$;

-- ============================================
-- PASO 2: Verificar que las tablas necesarias existan
-- ============================================

DO $$
BEGIN
  -- Verificar tabla users
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    RAISE EXCEPTION 'La tabla public.users no existe. Ejecuta primero supabase/schema.sql';
  END IF;
  
  -- Verificar tabla tenants (necesaria para el panel admin)
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants') THEN
    RAISE WARNING 'La tabla public.tenants no existe. Ejecuta supabase/schema-multi-tenant.sql para habilitar todas las funcionalidades del panel admin.';
  END IF;
  
  RAISE NOTICE '✓ Tablas verificadas';
END $$;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

SELECT 
  'Verificación' as tipo,
  u.id,
  u.email,
  u.role,
  CASE 
    WHEN u.role = 'admin' THEN '✓ Es admin'
    ELSE '✗ NO es admin'
  END as estado
FROM public.users u
WHERE u.email = 'jeans.selfene@outlook.com';

-- Si ves una fila con "✓ Es admin", todo está correcto

