-- Script para crear usuario admin en Supabase
-- Ejecutar este script en el SQL Editor de Supabase
-- 
-- IMPORTANTE: Este script asume que el usuario ya existe en auth.users
-- Si no existe, créalo primero desde:
-- 1. Supabase Dashboard > Authentication > Users > Add User
-- 2. O desde la aplicación usando signUp()
--
-- Email: jeans.selfene@outlook.com
-- Password: selfene1994AS#

-- ============================================
-- PASO 1: Verificar que el usuario existe en auth.users
-- ============================================

-- Buscar el usuario por email
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
    RAISE NOTICE 'Usuario % no encontrado en auth.users. Por favor, créalo primero desde el Dashboard de Supabase o desde la aplicación.', user_email;
    RAISE EXCEPTION 'Usuario no encontrado en auth.users';
  END IF;

  RAISE NOTICE 'Usuario encontrado con ID: %', user_id;

  -- ============================================
  -- PASO 2: Crear o actualizar el registro en public.users con rol admin
  -- ============================================
  
  INSERT INTO public.users (id, email, display_name, role)
  VALUES (
    user_id,
    user_email,
    user_email,  -- Usa el email como display_name por defecto
    'admin'      -- Rol de administrador
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, public.users.display_name),
    role = 'admin',  -- Asegurar que tenga rol admin
    updated_at = NOW();

  RAISE NOTICE 'Usuario creado/actualizado en public.users con rol admin';
  
  -- ============================================
  -- PASO 3: Verificar que se creó correctamente
  -- ============================================
  
  PERFORM 1 FROM public.users WHERE id = user_id AND role = 'admin';
  
  IF FOUND THEN
    RAISE NOTICE '✓ Usuario admin creado exitosamente';
    RAISE NOTICE '  Email: %', user_email;
    RAISE NOTICE '  ID: %', user_id;
    RAISE NOTICE '  Rol: admin';
  ELSE
    RAISE EXCEPTION 'Error: No se pudo verificar que el usuario tiene rol admin';
  END IF;

END $$;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Mostrar el usuario creado
SELECT 
  id,
  email,
  display_name,
  role,
  created_at,
  updated_at
FROM public.users
WHERE email = 'jeans.selfene@outlook.com';

