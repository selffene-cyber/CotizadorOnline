-- Script para corregir las funciones de email (cambiar body de text a jsonb)
-- Ejecutar este script completo en Supabase SQL Editor
--
-- Este script actualiza las 3 funciones de email para usar body como jsonb

-- ============================================
-- CORREGIR send_approval_email
-- ============================================

CREATE OR REPLACE FUNCTION public.send_approval_email(
  user_email TEXT,
  user_name TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  email_subject TEXT := '¡Tu solicitud de acceso ha sido aprobada! - Cotizador Pro';
  email_body TEXT;
  resend_api_key TEXT;
BEGIN
  -- Obtener API key de Resend desde tabla app_config
  SELECT value INTO resend_api_key
  FROM public.app_config
  WHERE key = 'resend_api_key'
  LIMIT 1;

  -- Si no hay API key, solo loguear y salir
  IF resend_api_key IS NULL OR resend_api_key = '' THEN
    RAISE NOTICE 'RESEND_API_KEY no configurada. Email de aprobación no enviado a: %', user_email;
    RETURN;
  END IF;

  -- Construir el cuerpo del email
  email_body := format(
    '<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #22C55E; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #22C55E; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>¡Solicitud Aprobada!</h1>
        </div>
        <div class="content">
          <p>Hola %s,</p>
          <p>¡Buenas noticias! Tu solicitud de acceso a <strong>Cotizador Pro</strong> ha sido aprobada.</p>
          <p>Ahora puedes iniciar sesión y comenzar a crear tus cotizaciones.</p>
          <p style="text-align: center;">
            <a href="https://cot.piwisuite.cl/login" class="button">Iniciar Sesión</a>
          </p>
          <p>Saludos,<br>El equipo de Cotizador Pro</p>
        </div>
      </div>
    </body>
    </html>',
    COALESCE(user_name, user_email)
  );

  -- Enviar email usando Resend (body como jsonb, NO text)
  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || resend_api_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Cotizador Pro <noreply@cot.piwisuite.cl>',
      'to', ARRAY[user_email],
      'subject', email_subject,
      'html', email_body
    )
  );
  
  RAISE NOTICE 'Email de aprobación enviado a: %', user_email;
END;
$$;

-- ============================================
-- CORREGIR send_rejection_email
-- ============================================

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
  resend_api_key TEXT;
BEGIN
  -- Obtener API key de Resend desde tabla app_config
  SELECT value INTO resend_api_key
  FROM public.app_config
  WHERE key = 'resend_api_key'
  LIMIT 1;

  -- Si no hay API key, solo loguear y salir
  IF resend_api_key IS NULL OR resend_api_key = '' THEN
    RAISE NOTICE 'RESEND_API_KEY no configurada. Email de rechazo no enviado a: %', user_email;
    RETURN;
  END IF;

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

  -- Enviar email usando Resend (body como jsonb, NO text)
  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || resend_api_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Cotizador Pro <noreply@cot.piwisuite.cl>',
      'to', ARRAY[user_email],
      'subject', email_subject,
      'html', email_body
    )
  );
  
  RAISE NOTICE 'Email de rechazo enviado a: %', user_email;
END;
$$;

-- ============================================
-- CORREGIR send_invitation_email
-- ============================================

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
  resend_api_key TEXT;
BEGIN
  -- Obtener API key de Resend desde tabla app_config
  SELECT value INTO resend_api_key
  FROM public.app_config
  WHERE key = 'resend_api_key'
  LIMIT 1;

  -- Si no hay API key, solo loguear y salir
  IF resend_api_key IS NULL OR resend_api_key = '' THEN
    RAISE NOTICE 'RESEND_API_KEY no configurada. Email de invitación no enviado a: %', user_email;
    RETURN;
  END IF;

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

  -- Enviar email usando Resend (body como jsonb, NO text)
  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || resend_api_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Cotizador Pro <noreply@cot.piwisuite.cl>',
      'to', ARRAY[user_email],
      'subject', email_subject,
      'html', email_body
    )
  );
  
  RAISE NOTICE 'Email de invitación enviado a: %', user_email;
END;
$$;

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT 
  '✓ Funciones de email actualizadas' as verificacion,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name IN ('send_approval_email', 'send_rejection_email', 'send_invitation_email')
ORDER BY routine_name;

