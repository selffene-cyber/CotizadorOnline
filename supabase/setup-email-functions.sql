-- Script para configurar funciones de envío de emails
-- Ejecutar este script en Supabase SQL Editor
--
-- IMPORTANTE: Este script crea funciones SQL que pueden enviar emails
-- usando el servicio de email de Supabase o un servicio externo
--
-- Opción 1: Usar Supabase Auth para enviar emails (recomendado)
-- Opción 2: Usar pg_net para llamar a un servicio externo (Resend, SendGrid, etc.)

-- ============================================
-- OPCIÓN 1: FUNCIÓN SIMPLE QUE REGISTRA EL EMAIL
-- ============================================
-- Por ahora, crearemos funciones que solo registran el intento
-- Puedes integrar un servicio de email después (Resend, SendGrid, etc.)

-- Función para enviar email de aprobación
CREATE OR REPLACE FUNCTION public.send_approval_email(
  user_email TEXT,
  user_name TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Por ahora, solo registramos el intento
  -- Puedes integrar un servicio de email aquí
  -- Ejemplo con pg_net (requiere extensión):
  /*
  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.resend_api_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Cotizador Pro <noreply@cot.piwisuite.cl>',
      'to', ARRAY[user_email],
      'subject', '¡Tu solicitud de acceso ha sido aprobada!',
      'html', '<h1>¡Bienvenido a Cotizador Pro!</h1><p>Tu solicitud de acceso ha sido aprobada. Puedes iniciar sesión y crear tu empresa.</p>'
    )
  );
  */
  
  -- Por ahora, solo logueamos (puedes ver esto en los logs de Supabase)
  RAISE NOTICE 'Email de aprobación debería enviarse a: %', user_email;
END;
$$;

-- Función para enviar email de rechazo
CREATE OR REPLACE FUNCTION public.send_rejection_email(
  user_email TEXT,
  user_name TEXT DEFAULT NULL,
  rejection_notes TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  email_subject TEXT := 'Solicitud de acceso rechazada - Cotizador Pro';
  email_body TEXT;
BEGIN
  -- Construir el cuerpo del email
  email_body := format(
    '<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Solicitud de Acceso Rechazada</h1>
        </div>
        <div class="content">
          <p>Hola %s,</p>
          <p>Lamentamos informarte que tu solicitud de acceso a <strong>Cotizador Pro</strong> ha sido rechazada.</p>
          %s
          <p>Si crees que esto es un error o tienes alguna pregunta, puedes contactarnos.</p>
          <p>Saludos,<br>El equipo de Cotizador Pro</p>
        </div>
      </div>
    </body>
    </html>',
    COALESCE(user_name, user_email),
    CASE 
      WHEN rejection_notes IS NOT NULL AND rejection_notes != '' THEN
        format('<p><strong>Notas del administrador:</strong></p><p>%s</p>', rejection_notes)
      ELSE ''
    END
  );

  -- Por ahora, solo registramos el intento
  -- Para enviar realmente, descomenta el código abajo y configura Resend
  
  /*
  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.resend_api_key', true),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Cotizador Pro <noreply@cot.piwisuite.cl>',
      'to', ARRAY[user_email],
      'subject', email_subject,
      'html', email_body
    )::text
  );
  */
  
  RAISE NOTICE 'Email de rechazo preparado para: % (Subject: %)', user_email, email_subject;
END;
$$;

-- Función para enviar email de invitación
CREATE OR REPLACE FUNCTION public.send_invitation_email(
  user_email TEXT,
  invitation_token TEXT,
  tenant_name TEXT,
  invitation_role TEXT,
  invitation_url TEXT,
  inviter_name TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  email_subject TEXT := format('Invitación a %s - Cotizador Pro', tenant_name);
  email_body TEXT;
  role_display TEXT;
BEGIN
  -- Traducir rol a español
  role_display := CASE invitation_role
    WHEN 'owner' THEN 'Propietario'
    WHEN 'admin' THEN 'Administrador'
    WHEN 'user' THEN 'Usuario'
    ELSE invitation_role
  END;

  -- Construir el cuerpo del email
  email_body := format(
    '<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .info-box { background-color: #EFF6FF; border-left: 4px solid #4F46E5; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Invitación a Cotizador Pro</h1>
        </div>
        <div class="content">
          <p>Hola,</p>
          <p>%s te ha invitado a unirte a <strong>%s</strong> en Cotizador Pro con el rol de <strong>%s</strong>.</p>
          <div class="info-box">
            <p><strong>Empresa:</strong> %s</p>
            <p><strong>Rol:</strong> %s</p>
            <p><strong>Invitado por:</strong> %s</p>
          </div>
          <p>Para aceptar esta invitación, haz clic en el botón de abajo:</p>
          <p style="text-align: center;">
            <a href="%s" class="button">Aceptar Invitación</a>
          </p>
          <p>O copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #4F46E5;">%s</p>
          <p><strong>Nota:</strong> Esta invitación expirará en 7 días.</p>
          <p>Si no esperabas esta invitación, puedes ignorar este email.</p>
          <p>Saludos,<br>El equipo de Cotizador Pro</p>
        </div>
      </div>
    </body>
    </html>',
    COALESCE(inviter_name, 'Un administrador'),
    tenant_name,
    role_display,
    tenant_name,
    role_display,
    COALESCE(inviter_name, 'Un administrador'),
    invitation_url,
    invitation_url
  );

  -- Por ahora, solo registramos el intento
  -- Para enviar realmente, descomenta el código abajo y configura Resend
  
  /*
  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.resend_api_key', true),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Cotizador Pro <noreply@cot.piwisuite.cl>',
      'to', ARRAY[user_email],
      'subject', email_subject,
      'html', email_body
    )::text
  );
  */
  
  RAISE NOTICE 'Email de invitación preparado para: % (Subject: %)', user_email, email_subject;
END;
$$;

-- ============================================
-- OPCIÓN 2: USAR SUPABASE AUTH PARA ENVIAR EMAILS
-- ============================================
-- Supabase Auth tiene funciones para enviar emails, pero son limitadas
-- Mejor usar un servicio externo como Resend

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que las funciones se crearon
SELECT 
  '✓ Funciones de email creadas' as verificacion,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name IN ('send_approval_email', 'send_rejection_email', 'send_invitation_email')
ORDER BY routine_name;

-- ============================================
-- NOTAS PARA INTEGRAR SERVICIO DE EMAIL REAL
-- ============================================
-- 
-- Para usar Resend (recomendado):
-- 1. Crea una cuenta en https://resend.com
-- 2. Obtén tu API key
-- 3. Configúrala como variable de entorno en Supabase: RESEND_API_KEY
-- 4. Habilita la extensión pg_net en Supabase
-- 5. Descomenta el código en las funciones arriba
-- 6. Reemplaza 'Bearer ' || current_setting('app.resend_api_key') con tu API key
--
-- Alternativa: Usar Supabase Edge Functions para enviar emails
-- Esto es más flexible y permite usar cualquier servicio de email

