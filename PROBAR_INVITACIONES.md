# 🧪 Guía para Probar el Sistema de Invitaciones

## ✅ Verificación Previa (Opcional pero Recomendado)

Antes de crear una invitación, verifica que todo esté configurado:

1. **Ejecuta en Supabase SQL Editor:**
   ```sql
   -- Ejecuta: supabase/verificar-configuracion-emails.sql
   ```
   
   Deberías ver:
   - ✓ Tabla app_config existe
   - ✓ API Key de Resend configurada
   - ✓ Funciones de email creadas
   - ✓ Extensión pg_net habilitada
   - ✅ TODO LISTO

## 🚀 Probar Crear una Invitación

### Paso 1: Acceder al Panel de Administración

1. Inicia sesión como super admin (`jeans.selfene@outlook.com`)
2. Ve a `/admin`
3. Haz clic en la pestaña **"Empresas"**

### Paso 2: Seleccionar una Empresa

1. En la lista de empresas, haz clic en **"Ver Miembros"** o **"Gestión de Miembros"** de cualquier empresa
2. Se abrirá un modal con la lista de miembros

### Paso 3: Enviar Invitación

1. Haz clic en el botón **"Enviar Invitación"** o **"Invitar Usuario"**
2. Completa el formulario:
   - **Email:** Ingresa un email válido (puede ser el tuyo para probar)
   - **Rol:** Selecciona `owner`, `admin` o `user`
3. Haz clic en **"Enviar Invitación"**

### Paso 4: Verificar el Envío

#### ✅ Si todo funciona correctamente:

1. **En la aplicación:**
   - Deberías ver un mensaje de éxito: "Invitación enviada correctamente"
   - La invitación aparecerá en la lista de invitaciones pendientes

2. **En Supabase (logs):**
   - Ve a Supabase Dashboard → Logs → Postgres Logs
   - Busca mensajes como: `Email de invitación enviado a: [email]`
   - Si ves errores, revisa los detalles

3. **En Resend:**
   - Ve a [Resend Dashboard](https://resend.com/emails)
   - Deberías ver el email en la lista de "Emails sent"
   - El estado debería ser "Delivered" o "Sent"

4. **En el buzón de correo:**
   - Revisa la bandeja de entrada del email que ingresaste
   - Deberías recibir un email con:
     - Asunto: "Invitación a [Nombre de Empresa] - Cotizador Pro"
     - Botón "Aceptar Invitación"
     - Link para aceptar la invitación

#### ⚠️ Si hay problemas:

1. **No se envía el email:**
   - Verifica que `pg_net` esté habilitado
   - Verifica que la API key esté en `app_config`
   - Revisa los logs de Supabase para ver errores

2. **Error "RESEND_API_KEY no configurada":**
   - Ejecuta `supabase/configurar-resend-api-key.sql` nuevamente
   - Verifica con: `SELECT * FROM public.app_config WHERE key = 'resend_api_key';`

3. **Error de dominio no verificado:**
   - Si usas `noreply@cot.piwisuite.cl`, verifica el dominio en Resend
   - O cambia temporalmente a `onboarding@resend.dev` en el script

4. **Email no llega:**
   - Revisa la carpeta de spam
   - Verifica en Resend Dashboard que el email se envió
   - Verifica que el email esté correcto

## 📧 Qué Esperar en el Email

El email de invitación incluye:

- **Asunto:** "Invitación a [Nombre de Empresa] - Cotizador Pro"
- **Contenido:**
  - Saludo personalizado
  - Nombre de la empresa
  - Rol asignado (Propietario/Administrador/Usuario)
  - Nombre del invitador
  - Botón "Aceptar Invitación"
  - Link directo para aceptar
  - Nota sobre expiración (7 días)

## 🔗 Probar Aceptar la Invitación

1. **Haz clic en el botón o link del email**
2. **Si no estás logueado:**
   - Serás redirigido a `/login`
   - Inicia sesión (o regístrate si es nuevo usuario)
   - Después del login, serás redirigido a `/invite/[token]`

3. **Si ya estás logueado:**
   - Serás redirigido directamente a `/invite/[token]`
   - Verás una página de confirmación
   - Haz clic en "Aceptar Invitación"

4. **Después de aceptar:**
   - Serás agregado como miembro de la empresa
   - Serás redirigido al dashboard
   - Podrás ver la empresa en tu lista de empresas

## 🐛 Solución de Problemas Comunes

### Error: "Invitación no encontrada o expirada"
- Verifica que el token sea correcto
- Verifica que la invitación no haya expirado (7 días)
- Verifica que la invitación no haya sido aceptada/rechazada antes

### Error: "El email del usuario no coincide con la invitación"
- El email del usuario logueado debe coincidir con el email de la invitación
- Si usaste Google OAuth, verifica que el email sea el mismo

### Error: "No se pudo crear la membresía"
- Verifica que el tenant exista
- Verifica que el usuario exista en `public.users`
- Revisa los logs de Supabase para más detalles

## ✅ Checklist Final

Antes de probar, asegúrate de tener:

- [ ] Ejecutado `supabase/configurar-resend-api-key.sql`
- [ ] Ejecutado `supabase/setup-email-functions-ACTIVO.sql`
- [ ] Habilitada extensión `pg_net` en Supabase
- [ ] Verificado que la API key está configurada
- [ ] (Opcional) Verificado dominio en Resend para usar `noreply@cot.piwisuite.cl`
- [ ] Tener acceso al panel de administración (`/admin`)
- [ ] Tener al menos una empresa creada

## 🎉 ¡Listo para Probar!

Una vez que hayas verificado todo, puedes crear una invitación desde `/admin` → Empresas → Ver Miembros → Enviar Invitación.

**Nota:** Si estás probando localmente, el email se enviará igual porque las funciones SQL están en Supabase (no dependen de tu entorno local).

