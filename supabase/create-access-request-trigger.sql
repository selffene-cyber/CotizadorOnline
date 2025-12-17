-- Trigger para crear automáticamente access_request cuando un nuevo usuario se registra
-- Ejecutar este script en Supabase SQL Editor
--
-- Este trigger se ejecuta automáticamente cuando un nuevo usuario se crea en auth.users
-- y crea una solicitud de acceso en public.access_requests

-- ============================================
-- FUNCIÓN PARA CREAR ACCESS REQUEST
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insertar en public.users
  INSERT INTO public.users (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user' -- Rol por defecto
  )
  ON CONFLICT (id) DO NOTHING;

  -- Crear solicitud de acceso solo si el usuario no es admin
  -- (Los admins se crean manualmente)
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = NEW.id AND role = 'admin'
  ) THEN
    INSERT INTO public.access_requests (user_id, email, status)
    VALUES (NEW.id, NEW.email, 'pending')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGER
-- ============================================

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear trigger que se ejecuta cuando se crea un nuevo usuario en auth.users
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

-- Si ves el trigger listado, todo está correcto

