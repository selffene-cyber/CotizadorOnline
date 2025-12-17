# Configuración de Emails para Invitaciones

## Estado Actual

He implementado la estructura para enviar emails cuando se crea una invitación. Por ahora, las funciones están preparadas pero **no envían emails reales** hasta que configures un servicio de email.

## Flujo de Invitación

1. **Admin crea invitación** desde `/admin` → pestaña "Empresas" → "Gestión de Miembros"
2. **Se crea la invitación** en la base de datos con un token único
3. **Se envía email automáticamente** (cuando esté configurado) con:
   - Nombre de la empresa
   - Rol asignado
   - Link para aceptar: `https://cot.piwisuite.cl/invite/{token}`
   - Información del invitador
4. **Usuario recibe email** y hace clic en el link
5. **Usuario es redirigido** a `/invite/{token}` donde puede:
   - Si no está logueado: se le pide iniciar sesión
   - Si está logueado: puede aceptar o rechazar la invitación
6. **Al aceptar**: se crea el membership y se redirige al dashboard

## Opciones para Enviar Emails

### Opción 1: Resend (Recomendado - Más Simple)

**Ventajas:**
- Muy fácil de configurar
- Gratis hasta 3,000 emails/mes
- API simple
- Buena deliverability
- Soporte para HTML templates

**Pasos:**

1. **Crear cuenta en Resend:**
   - Ve a [https://resend.com](https://resend.com)
   - Crea una cuenta gratuita

2. **Verificar dominio (opcional pero recomendado):**
   - Ve a Settings → Domains
   - Agrega tu dominio `cot.piwisuite.cl` o `piwisuite.cl`
   - Configura los registros DNS que te indique
   - O usa el dominio de prueba de Resend (menos profesional)

3. **Obtener API Key:**
   - Ve a Settings → API Keys
   - Crea una nueva API key
   - Cópiala (solo se muestra una vez)

4. **Configurar en Supabase:**
   - Ve a Supabase Dashboard → Project Settings → Edge Functions
   - O mejor: usa una variable de entorno en Easypanel
   - Agrega: `RESEND_API_KEY=tu_api_key_aqui`

5. **Habilitar extensión pg_net en Supabase:**
   - Ve a Database → Extensions
   - Busca `pg_net` y habilítala

6. **Descomentar código en SQL:**
   - Edita `supabase/setup-email-functions.sql`
   - Descomenta el código de `net.http_post` en la función `send_invitation_email`
   - Ejecuta el script actualizado en Supabase SQL Editor

### Opción 2: Supabase Edge Functions

**Ventajas:**
- Más flexible
- Puedes usar cualquier servicio de email
- Mejor para lógica compleja

**Pasos:**

1. Crea una Edge Function en Supabase
2. Integra Resend, SendGrid, o el servicio que prefieras
3. Las funciones en `supabase/email.ts` ya están preparadas para llamar Edge Functions

### Opción 3: SendGrid, Mailgun, etc.

Similar a Resend, pero con diferentes APIs.

## Implementación Actual

### Funciones Creadas

1. **`supabase/email.ts`**: 
   - `sendInvitationEmail()`: Función TypeScript que envía emails de invitación
   - Llama a función SQL o Edge Function

2. **`supabase/setup-email-functions.sql`**: 
   - `send_invitation_email()`: Función SQL con template HTML
   - Por ahora solo registra el intento (comentada para Resend)

3. **Integración en `supabase/invitations.ts`**: 
   - `createInvitation()` ahora llama automáticamente a `sendInvitationEmail()`
   - Obtiene información del tenant y del invitador
   - No bloquea si el email falla (la invitación se crea de todas formas)

### Contenido del Email

**Email de Invitación:**
- Asunto: "Invitación a {Nombre Empresa} - Cotizador Pro"
- Contenido HTML con:
  - Nombre de la empresa
  - Rol asignado (traducido a español)
  - Nombre del invitador
  - Botón grande "Aceptar Invitación"
  - Link alternativo (texto)
  - Nota sobre expiración (7 días)

## Pasos para Activar

### Paso 1: Ejecutar Script SQL

1. Ve a Supabase SQL Editor
2. Ejecuta `supabase/setup-email-functions.sql` (ya incluye la función de invitación)
3. Esto crea las funciones SQL (por ahora solo registran el intento)

### Paso 2: Configurar Servicio de Email (Opcional - Para enviar emails reales)

Si quieres enviar emails reales ahora:

1. **Con Resend (Recomendado):**
   - Crea cuenta en Resend
   - Obtén API key
   - Configúrala en Supabase/Easypanel como variable de entorno: `RESEND_API_KEY`
   - Habilita extensión `pg_net` en Supabase
   - Edita `supabase/setup-email-functions.sql`
   - Descomenta el código de `net.http_post` en `send_invitation_email`
   - Ejecuta el script actualizado

2. **O espera a configurarlo después:**
   - Por ahora, las funciones solo registran el intento
   - Puedes configurar el servicio de email cuando lo necesites
   - Los emails se enviarán automáticamente cuando esté configurado

## Estado Actual

✅ **Estructura implementada**: Las funciones están listas
✅ **Integración completa**: Se llaman automáticamente al crear invitación
✅ **Template HTML**: Email con diseño profesional
✅ **Link de aceptación**: Incluye el token en la URL
⚠️ **Emails reales**: No se envían hasta configurar un servicio (Resend, etc.)

## Próximos Pasos

1. Ejecuta `supabase/setup-email-functions.sql` en Supabase (si no lo has hecho)
2. Prueba crear una invitación (verás logs en Supabase)
3. Cuando quieras enviar emails reales, configura Resend siguiendo los pasos arriba

## Casilla de Correo Recomendada

**Para el remitente (`from`):**
- **Opción 1 (Recomendada)**: `noreply@cot.piwisuite.cl` o `noreply@piwisuite.cl`
  - Requiere verificar dominio en Resend
  - Más profesional
  - Mejor deliverability

- **Opción 2 (Temporal)**: Usar dominio de prueba de Resend
  - `onboarding@resend.dev` (solo para desarrollo)
  - No requiere configuración
  - Menos profesional

## Ejemplo de Email

El email que recibirá el usuario se verá así:

```
┌─────────────────────────────────────┐
│   Invitación a Cotizador Pro       │
├─────────────────────────────────────┤
│                                     │
│  Hola,                              │
│                                     │
│  Juan Pérez te ha invitado a        │
│  unirte a Empresa MIC en            │
│  Cotizador Pro con el rol de        │
│  Administrador.                     │
│                                     │
│  [Información de la empresa]        │
│                                     │
│  [Botón: Aceptar Invitación]        │
│                                     │
│  O copia este link:                 │
│  https://cot.piwisuite.cl/invite/...│
│                                     │
└─────────────────────────────────────┘
```

¿Quieres que configure Resend ahora o lo dejamos para después?

