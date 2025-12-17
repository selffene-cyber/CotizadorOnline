-- Script para corregir políticas RLS de access_requests
-- Permite a los usuarios crear sus propias solicitudes de acceso
-- Ejecutar este script en Supabase SQL Editor

-- ============================================
-- ELIMINAR POLÍTICAS EXISTENTES
-- ============================================

DROP POLICY IF EXISTS "Super admin can view all access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Super admin can manage access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Super admins can view all access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Super admins can manage all access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Users can view own access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Users can create own access requests" ON public.access_requests;

-- ============================================
-- CREAR POLÍTICAS RLS CORRECTAS
-- ============================================

-- Super admins pueden ver todas las solicitudes
CREATE POLICY "Super admins can view all access requests" ON public.access_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Super admins pueden gestionar todas las solicitudes (UPDATE, DELETE)
CREATE POLICY "Super admins can manage all access requests" ON public.access_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Usuarios pueden ver sus propias solicitudes
CREATE POLICY "Users can view own access requests" ON public.access_requests
  FOR SELECT USING (user_id = auth.uid());

-- IMPORTANTE: Usuarios pueden crear sus propias solicitudes
-- Esto permite que los usuarios nuevos creen solicitudes cuando se registran
CREATE POLICY "Users can create own access requests" ON public.access_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que las políticas se crearon correctamente
SELECT 
  'Políticas RLS access_requests' as verificacion,
  policyname,
  cmd as operacion,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK'
    WHEN qual IS NOT NULL THEN 'USING'
    ELSE 'ALL'
  END as tipo
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'access_requests'
ORDER BY policyname;

-- ============================================
-- NOTAS
-- ============================================

-- Ahora los usuarios pueden:
-- 1. Crear sus propias solicitudes (INSERT con user_id = auth.uid())
-- 2. Ver sus propias solicitudes (SELECT con user_id = auth.uid())
-- 3. Los super admins pueden ver y gestionar todas las solicitudes

