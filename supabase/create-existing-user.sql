-- Script para crear el registro del usuario existente en public.users
-- Ejecutar este script en Supabase SQL Editor
-- Este script busca el usuario por email y crea el registro en public.users

-- Opción 1: Buscar el usuario por email y crear el registro
INSERT INTO public.users (id, email, display_name, role)
SELECT 
  id,
  email,
  email as display_name,  -- Usa el email como display_name por defecto
  'admin' as role  -- Cambia a 'user' si prefieres
FROM auth.users
WHERE email = 'selffene@gmail.com'
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, public.users.display_name),
    role = COALESCE(EXCLUDED.role, public.users.role);

-- Si quieres verificar que se creó correctamente:
-- SELECT * FROM public.users WHERE email = 'selffene@gmail.com';

