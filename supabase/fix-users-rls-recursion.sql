-- Script para corregir recursión infinita en políticas RLS de users
-- Ejecutar este script en Supabase SQL Editor
--
-- PROBLEMA: Las políticas RLS de users consultan users dentro de su verificación,
-- causando recursión infinita.
--
-- SOLUCIÓN: Usar una función SECURITY DEFINER que pueda leer users sin pasar por RLS

-- ============================================
-- PASO 1: CREAR FUNCIÓN HELPER (EVITA RECURSIÓN)
-- ============================================

-- Función que verifica si un usuario es admin sin causar recursión
CREATE OR REPLACE FUNCTION public.check_user_is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Esta función tiene SECURITY DEFINER, por lo que puede leer users
  -- sin pasar por las políticas RLS, evitando recursión
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_user_id AND role = 'admin'
  );
END;
$$;

-- ============================================
-- PASO 2: ELIMINAR POLÍTICAS PROBLEMÁTICAS
-- ============================================

DROP POLICY IF EXISTS "Super admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Users can read all users" ON public.users;
DROP POLICY IF EXISTS "Super admins can update user roles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- ============================================
-- PASO 3: CREAR POLÍTICAS CORREGIDAS
-- ============================================

-- Super admins pueden leer todos los usuarios (usando función para evitar recursión)
CREATE POLICY "Super admins can read all users" ON public.users
  FOR SELECT USING (
    public.check_user_is_admin(auth.uid())
  );

-- Usuarios autenticados pueden leer todos los usuarios (fallback)
CREATE POLICY "Users can read all users" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Super admins pueden actualizar roles (usando función para evitar recursión)
CREATE POLICY "Super admins can update user roles" ON public.users
  FOR UPDATE USING (
    public.check_user_is_admin(auth.uid())
  );

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- PASO 4: VERIFICACIÓN
-- ============================================

-- Verificar que la función se creó
SELECT 
  '✓ Función creada' as verificacion,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'check_user_is_admin';

-- Verificar políticas creadas
SELECT 
  '✓ Políticas RLS' as verificacion,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'users'
ORDER BY policyname;

