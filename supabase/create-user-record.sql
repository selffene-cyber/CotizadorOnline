-- Script para crear el registro del usuario en public.users
-- Ejecutar este script DESPUÉS de crear el usuario en Authentication
-- Reemplaza 'USER_ID_AQUI' con el ID del usuario de auth.users

-- Primero, obtén el ID del usuario:
-- Ve a Supabase Dashboard > Authentication > Users
-- Copia el UUID del usuario (ej: selffene@gmail.com)

-- Luego ejecuta este script reemplazando USER_ID_AQUI con el UUID:

INSERT INTO public.users (id, email, display_name, role)
VALUES (
  'USER_ID_AQUI',  -- Reemplaza con el UUID del usuario de auth.users
  'selffene@gmail.com',
  'selffene@gmail.com',  -- O el nombre que quieras
  'admin'  -- O 'user' si prefieres
)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role;

-- Alternativa: Si no conoces el UUID, puedes buscarlo por email:
-- 
-- SELECT id FROM auth.users WHERE email = 'selffene@gmail.com';
-- 
-- Luego usa ese ID en el INSERT de arriba

