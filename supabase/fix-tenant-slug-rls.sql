-- Script para permitir que cualquier usuario (autenticado o no) pueda buscar tenants por slug
-- Esto es necesario para acceder a rutas como /mic, /empresa2, etc.
-- Ejecutar este script en Supabase SQL Editor

-- ============================================
-- POLÍTICA PARA PERMITIR BÚSQUEDA POR SLUG
-- ============================================

-- Eliminar política existente si existe
DROP POLICY IF EXISTS "Anyone can view tenants by slug" ON public.tenants;

-- Crear política que permite a CUALQUIER usuario (incluso no autenticado) buscar tenants por slug
-- Esto es necesario para que la página /mic funcione y muestre el mensaje de login si es necesario
-- La política permite SELECT (leer) pero no INSERT, UPDATE o DELETE
CREATE POLICY "Anyone can view tenants by slug" ON public.tenants
  FOR SELECT 
  USING (true);  -- Permitir a todos (autenticados y no autenticados)

-- Nota: Esta política permite a CUALQUIER usuario ver tenants por slug
-- Esto es necesario para que la página /mic funcione antes de autenticarse
-- Las otras operaciones (INSERT, UPDATE, DELETE) siguen protegidas por otras políticas

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que la política fue creada
SELECT 
  'Política creada' as verificacion,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'tenants'
  AND policyname = 'Anyone can view tenants by slug';

