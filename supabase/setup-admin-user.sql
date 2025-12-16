-- ============================================
-- SCRIPT COMPLETO PARA CREAR USUARIO ADMIN
-- ============================================
-- 
-- INSTRUCCIONES:
-- 1. Primero, ejecuta en orden:
--    - supabase/schema.sql (crea las tablas base)
--    - supabase/schema-multi-tenant.sql (agrega multi-tenancy)
--
-- 2. Crea el usuario en Supabase Auth:
--    Opción A: Desde el Dashboard
--      - Ve a Supabase Dashboard > Authentication > Users
--      - Click en "Add User" > "Create new user"
--      - Email: jeans.selfene@outlook.com
--      - Password: selfene1994AS#
--      - Auto Confirm User: ✅ (activado)
--
--    Opción B: Desde la aplicación
--      - Ve a http://localhost:3000/login
--      - Click en "Registrarse" o "Sign Up"
--      - Ingresa: jeans.selfene@outlook.com / selfene1994AS#
--
-- 3. Ejecuta este script para crear el registro en public.users con rol admin
--
-- ============================================

-- Verificar que las tablas existan
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    RAISE EXCEPTION 'La tabla public.users no existe. Ejecuta primero supabase/schema.sql';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants') THEN
    RAISE EXCEPTION 'La tabla public.tenants no existe. Ejecuta primero supabase/schema-multi-tenant.sql';
  END IF;
  
  RAISE NOTICE '✓ Todas las tablas necesarias existen';
END $$;

-- ============================================
-- CREAR USUARIO ADMIN
-- ============================================

DO $$
DECLARE
  user_id UUID;
  user_email TEXT := 'jeans.selfene@outlook.com';
BEGIN
  -- Buscar el usuario en auth.users
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario % no encontrado en auth.users. Por favor, créalo primero desde el Dashboard de Supabase (Authentication > Users > Add User) o desde la aplicación.', user_email;
  END IF;

  RAISE NOTICE 'Usuario encontrado con ID: %', user_id;

  -- Crear o actualizar el registro en public.users con rol admin
  INSERT INTO public.users (id, email, display_name, role)
  VALUES (
    user_id,
    user_email,
    user_email,
    'admin'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, public.users.display_name),
    role = 'admin',
    updated_at = NOW();

  RAISE NOTICE '✓ Usuario creado/actualizado en public.users con rol admin';
  
  -- Verificar
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
-- VERIFICACIÓN FINAL
-- ============================================

SELECT 
  id,
  email,
  display_name,
  role,
  created_at,
  updated_at
FROM public.users
WHERE email = 'jeans.selfene@outlook.com';

-- Si todo está bien, deberías ver una fila con role = 'admin'

