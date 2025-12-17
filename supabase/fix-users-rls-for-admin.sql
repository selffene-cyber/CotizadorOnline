-- Script para asegurar que los super admins puedan leer todos los usuarios
-- Ejecutar este script en Supabase SQL Editor
--
-- PROBLEMA: Los super admins pueden no poder leer usuarios para mostrar en el panel admin
--
-- SOLUCIÓN: Agregar política específica para super admins

-- ============================================
-- POLÍTICAS PARA USERS
-- ============================================

-- Eliminar políticas existentes si es necesario (solo si causan conflictos)
-- NO eliminar "Users can read all users" si funciona correctamente

-- Agregar política específica para super admins (tiene prioridad)
DROP POLICY IF EXISTS "Super admins can read all users" ON public.users;

CREATE POLICY "Super admins can read all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
    OR
    -- También permitir a usuarios autenticados leer todos (política original)
    auth.role() = 'authenticated'
  );

-- Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'users'
ORDER BY policyname;

-- Si ves las políticas listadas, todo está correcto

