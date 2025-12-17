# Configuración de Envío de Emails

## Estado Actual

He implementado la estructura para enviar emails cuando se aprueba o rechaza una solicitud de acceso. Por ahora, las funciones están preparadas pero **no envían emails reales** hasta que configures un servicio de email.

## Opciones para Enviar Emails

### Opción 1: Resend (Recomendado - Más Simple)

**Ventajas:**
- Muy fácil de configurar
- Gratis hasta 3,000 emails/mes
- API simple
- Buena deliverability

**Pasos:**
1. Crea una cuenta en [Resend](https://resend.com)
2. Verifica tu dominio o usa el dominio de prueba
3. Obtén tu API key
4. Configúrala en Supabase:
   - Ve a Supabase Dashboard > Project Settings > Edge Functions
   - O usa una variable de entorno: `RESEND_API_KEY`
5. Habilita la extensión `pg_net` en Supabase (si quieres usar funciones SQL)
6. Descomenta el código en `supabase/setup-email-functions.sql`

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

1. **`supabase/email.ts`**: Funciones TypeScript que llaman a las funciones SQL o Edge Functions
2. **`supabase/setup-email-functions.sql`**: Funciones SQL que pueden enviar emails (comentadas por ahora)
3. **Integración en `supabase/admin.ts`**: 
   - `approveAccessRequest()` envía email de aprobación
   - `rejectAccessRequest()` envía email de rechazo

### Contenido de los Emails

**Email de Aprobación:**
- Asunto: "¡Tu solicitud de acceso ha sido aprobada! - Cotizador Pro"
- Contenido: Mensaje de bienvenida con botón para iniciar sesión
- Incluye el nombre del usuario

**Email de Rechazo:**
- Asunto: "Solicitud de acceso rechazada - Cotizador Pro"
- Contenido: Mensaje informando el rechazo
- Incluye notas del administrador (si las hay)

## Pasos para Activar

### Paso 1: Ejecutar Script SQL

1. Ve a Supabase SQL Editor
2. Ejecuta `supabase/setup-email-functions.sql`
3. Esto crea las funciones SQL (por ahora solo registran el intento)

### Paso 2: Configurar Servicio de Email (Opcional - Para enviar emails reales)

Si quieres enviar emails reales ahora:

1. **Con Resend:**
   - Crea cuenta en Resend
   - Obtén API key
   - Edita `supabase/setup-email-functions.sql`
   - Descomenta el código de `net.http_post`
   - Configura la API key en Supabase

2. **O espera a configurarlo después:**
   - Por ahora, las funciones solo registran el intento
   - Puedes configurar el servicio de email cuando lo necesites
   - Los emails se enviarán automáticamente cuando esté configurado

## Estado Actual

✅ **Estructura implementada**: Las funciones están listas
✅ **Integración completa**: Se llaman automáticamente al aprobar/rechazar
⚠️ **Emails reales**: No se envían hasta configurar un servicio (Resend, etc.)

## Próximos Pasos

1. Ejecuta `supabase/setup-email-functions.sql` en Supabase
2. Prueba aprobar/rechazar una solicitud (verás logs en Supabase)
3. Cuando quieras enviar emails reales, configura Resend o el servicio que prefieras

¿Quieres que configure Resend ahora o lo dejamos para después?

