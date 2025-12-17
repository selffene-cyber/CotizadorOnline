-- Script para corregir el trigger handle_new_user
-- Ejecutar este script en Supabase SQL Editor
--
-- PROBLEMA: El trigger falla al intentar insertar en public.users
-- SOLUCIÓN: Mejorar el manejo de errores y la lógica del trigger

-- ============================================
-- ELIMINAR TRIGGER Y FUNCIÓN EXISTENTES
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================
-- CREAR FUNCIÓN MEJORADA
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- NO crear usuario en public.users automáticamente
  -- Solo crear access_request para que el super admin apruebe primero
  -- El usuario se creará en public.users cuando se apruebe la solicitud
  
  -- Crear solicitud de acceso (status: pending)
  -- El super admin debe aprobar antes de crear el usuario en public.users
  BEGIN
    INSERT INTO public.access_requests (user_id, email, status)
    VALUES (NEW.id, COALESCE(NEW.email, ''), 'pending')
    ON CONFLICT (user_id) DO UPDATE
    SET 
      email = COALESCE(EXCLUDED.email, public.access_requests.email),
      status = 'pending', -- Si ya existe, mantener como pending
      requested_at = NOW();
  EXCEPTION WHEN OTHERS THEN
    -- Si falla la inserción, loguear el error pero no fallar el trigger
    RAISE WARNING 'Error insertando access_request: %', SQLERRM;
    -- Continuar de todas formas
  END;

  RETURN NEW;
END;
$$;

-- ============================================
-- CREAR TRIGGER
-- ============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que el trigger se creó
SELECT 
  '✓ Trigger creado' as verificacion,
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
  AND trigger_name = 'on_auth_user_created';

-- Verificar que la función se creó
SELECT 
  '✓ Función creada' as verificacion,
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'handle_new_user';

-- Si ves ambos listados, todo está correcto

