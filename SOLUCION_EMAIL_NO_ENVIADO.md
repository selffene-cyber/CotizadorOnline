# 🔧 Solución: Email No Se Envía

## 🔍 Diagnóstico Paso a Paso

### Paso 1: Verificar Configuración Básica

Ejecuta en Supabase SQL Editor:
```sql
-- Ejecuta: supabase/diagnosticar-envio-emails.sql
```

Esto verificará:
- ✅ Tabla `app_config` existe
- ✅ API Key configurada
- ✅ Funciones de email creadas
- ✅ Extensión `pg_net` habilitada

### Paso 2: Probar Envío Directo

Ejecuta en Supabase SQL Editor:
```sql
-- Ejecuta: supabase/probar-envio-email-directo.sql
-- IMPORTANTE: Cambia 'TU-EMAIL@ejemplo.com' a tu email real
```

Esto probará el envío directamente y mostrará errores específicos.

### Paso 3: Verificar Logs de Supabase

1. Ve a **Supabase Dashboard** → **Logs** → **Postgres Logs**
2. Busca mensajes que contengan:
   - `Email de invitación enviado a:`
   - `RESEND_API_KEY no configurada`
   - `Error al enviar email`
   - `pg_net`

3. Si ves errores, cópialos y revísalos.

### Paso 4: Verificar en Resend Dashboard

1. Ve a [Resend Dashboard](https://resend.com/emails)
2. Revisa la sección **"Emails sent"**
3. Si no hay emails, significa que no se está llamando a la API de Resend
4. Si hay emails con estado "Failed", revisa el error

## 🐛 Problemas Comunes y Soluciones

### Problema 1: "RESEND_API_KEY no configurada"

**Solución:**
```sql
-- Ejecuta en Supabase SQL Editor:
SELECT * FROM public.app_config WHERE key = 'resend_api_key';

-- Si no hay resultados, ejecuta:
-- supabase/configurar-resend-api-key.sql
```

### Problema 2: "Extensión pg_net no habilitada"

**Solución:**
1. Ve a **Supabase Dashboard** → **Database** → **Extensions**
2. Busca `pg_net`
3. Habilítala en schema: **public**

### Problema 3: "Error al enviar email: function net.http_post does not exist"

**Solución:**
- La extensión `pg_net` no está habilitada
- Sigue los pasos del Problema 2

### Problema 4: "Error: domain not verified"

**Solución:**
- El dominio `cot.piwisuite.cl` no está verificado en Resend
- Opciones:
  1. Verifica el dominio en Resend (agrega registros DNS)
  2. O cambia temporalmente el `from` a `onboarding@resend.dev` en el script

### Problema 5: La función se ejecuta pero no hay errores

**Posibles causas:**
1. La función SQL no está siendo llamada (error en `invitations.ts`)
2. La función SQL falla silenciosamente (solo `RAISE NOTICE`, no `RAISE EXCEPTION`)
3. El email se envía pero va a spam

**Solución:**
1. Revisa la consola del navegador (F12) cuando creas la invitación
2. Busca errores en `supabase/invitations.ts`
3. Revisa la carpeta de spam
4. Verifica en Resend Dashboard si el email se envió

## 🔍 Verificar que la Función SQL se Llama

### Desde el Código TypeScript

Cuando creas una invitación, el código en `supabase/invitations.ts` debería:
1. Crear la invitación en la tabla `invitations`
2. Llamar a `sendInvitationEmail()` que llama a `supabaseClient.rpc('send_invitation_email', ...)`

**Verifica en la consola del navegador (F12):**
- Busca mensajes como `[sendInvitationEmail]`
- Busca errores de `rpc`

### Desde Supabase

Ejecuta esto para ver si la función se está llamando:
```sql
-- Ver invitaciones recientes
SELECT 
  id,
  email,
  tenant_id,
  role,
  status,
  created_at
FROM public.invitations
ORDER BY created_at DESC
LIMIT 5;
```

Si ves la invitación creada pero no recibes email, el problema está en el envío.

## 🧪 Prueba Manual Completa

### 1. Verificar API Key
```sql
SELECT value FROM public.app_config WHERE key = 'resend_api_key';
-- Debería mostrar: re_MrCk22RD_LuXWsiJ47Vp6c9tNx1pMzRmP
```

### 2. Verificar pg_net
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
-- Debería mostrar una fila
```

### 3. Probar función directamente
```sql
-- Ejecuta: supabase/probar-envio-email-directo.sql
-- (Cambia el email primero)
```

### 4. Verificar en Resend
- Ve a https://resend.com/emails
- Deberías ver el email en "Emails sent"

## 📝 Checklist de Verificación

Antes de reportar el problema, verifica:

- [ ] Ejecutado `supabase/configurar-resend-api-key.sql`
- [ ] Ejecutado `supabase/setup-email-functions-ACTIVO.sql`
- [ ] Extensión `pg_net` habilitada en Supabase
- [ ] API key verificada: `SELECT * FROM public.app_config WHERE key = 'resend_api_key';`
- [ ] Probado envío directo: `supabase/probar-envio-email-directo.sql`
- [ ] Revisado logs de Supabase (Postgres Logs)
- [ ] Revisado Resend Dashboard
- [ ] Revisado carpeta de spam
- [ ] Revisado consola del navegador (F12) al crear invitación

## 🆘 Si Nada Funciona

1. **Comparte los logs de Supabase:**
   - Ve a Supabase Dashboard → Logs → Postgres Logs
   - Filtra por "send_invitation_email" o "resend"
   - Copia los errores

2. **Comparte el resultado del script de diagnóstico:**
   ```sql
   -- Ejecuta: supabase/diagnosticar-envio-emails.sql
   ```

3. **Comparte el resultado del test directo:**
   ```sql
   -- Ejecuta: supabase/probar-envio-email-directo.sql
   ```

4. **Verifica en Resend Dashboard:**
   - ¿Aparece el email en "Emails sent"?
   - ¿Cuál es el estado? (Sent, Delivered, Failed, etc.)

## ✅ Solución Rápida (Si Todo Falló)

Si nada funciona, puedes temporalmente:

1. **Cambiar el `from` a `onboarding@resend.dev`:**
   - Edita `supabase/setup-email-functions-ACTIVO.sql`
   - Cambia `'from', 'Cotizador Pro <noreply@cot.piwisuite.cl>'` 
   - A `'from', 'onboarding@resend.dev'`
   - Ejecuta el script nuevamente

2. **Verificar que la API key sea correcta:**
   - Ve a https://resend.com/api-keys
   - Verifica que la key `re_MrCk22RD_LuXWsiJ47Vp6c9tNx1pMzRmP` esté activa

3. **Probar con un email diferente:**
   - A veces ciertos proveedores de email bloquean emails de prueba
   - Prueba con Gmail, Outlook, etc.

