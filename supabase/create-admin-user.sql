-- Script para crear el usuario administrador super admin
-- Ejecutar este script DESPUÉS de crear el usuario en Supabase Auth

-- Primero, crear el usuario en Supabase Auth manualmente con:
-- Email: piwisuite@gmail.com
-- Password: Admin1994AS#

-- Luego ejecutar este script para actualizar el rol en public.users

-- Actualizar el usuario a rol 'admin' (super admin)
UPDATE public.users
SET role = 'admin'
WHERE email = 'piwisuite@gmail.com';

-- Verificar que se actualizó correctamente
SELECT id, email, role, created_at
FROM public.users
WHERE email = 'piwisuite@gmail.com';

