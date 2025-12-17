# Instrucciones Completas para Configurar Emails

## ✅ Respuesta Rápida

**NO necesitas crear la casilla de correo.** Resend maneja todo automáticamente. Solo necesitas:
1. Verificar el dominio en Resend (agregar registros DNS)
2. Configurar la API key
3. Ejecutar los scripts SQL

## 📋 Pasos Completos

### Paso 1: Verificar Dominio en Resend (Opcional pero Recomendado)

**Si quieres usar `noreply@cot.piwisuite.cl`:**

1. Ve a [Resend Dashboard](https://resend.com/domains)
2. Agrega dominio: `cot.piwisuite.cl` o `piwisuite.cl`
3. Resend te dará registros DNS a agregar
4. Agrega esos registros en Cloudflare (DNS only, no proxy)
5. Espera verificación (5-15 minutos)

**Si no verificas dominio:**
- Puedes usar `onboarding@resend.dev` temporalmente
- Cambia el `from` en el script SQL

### Paso 2: Configurar API Key en Supabase

**Tu API Key:** `re_MrCk22RD_LuXWsiJ47Vp6c9tNx1pMzRmP`

Tienes dos opciones:

#### Opción A: Configurar en Supabase (Recomendado para Producción)

1. Ve a Supabase SQL Editor
2. Ejecuta `supabase/configurar-resend-api-key.sql`
3. Esto configura la API key en la base de datos

#### Opción B: Usar Variables de Easypanel

Las variables de Easypanel (`RESEND_API_KEY`) no están disponibles directamente en funciones SQL de Supabase. Para usarlas necesitarías:
- Edge Functions de Supabase (más complejo)
- O configurar la variable en Supabase directamente (Opción A)

**Recomendación:** Usa la Opción A para que funcione tanto en desarrollo como en producción.

### Paso 3: Ejecutar Script de Funciones de Email

1. Ve a Supabase SQL Editor
2. Ejecuta `supabase/setup-email-functions-ACTIVO.sql`
3. Esto crea las funciones que envían emails

### Paso 4: Habilitar Extensión pg_net

1. Ve a Supabase Dashboard → Database → Extensions
2. Busca `pg_net`
3. Habilítala en schema: **public**

## 🔧 Configuración para Desarrollo Local

**Para que funcione localmente:**

1. Crea/edita `.env.local`:
```env
RESEND_API_KEY=re_MrCk22RD_LuXWsiJ47Vp6c9tNx1pMzRmP
```

2. **PERO:** Las funciones SQL de Supabase no leen `.env.local` directamente
3. **Solución:** Configura la API key en Supabase (Paso 2, Opción A) para que funcione en ambos entornos

## 📝 Orden de Ejecución

1. ✅ Verificar dominio en Resend (opcional)
2. ✅ Ejecutar `supabase/configurar-resend-api-key.sql` (configura API key)
3. ✅ Habilitar extensión `pg_net` en Supabase
4. ✅ Ejecutar `supabase/setup-email-functions-ACTIVO.sql` (crea funciones)
5. ✅ Probar creando una invitación

## 🧪 Probar

1. Ve a `/admin` → pestaña "Empresas"
2. Selecciona una empresa → "Gestión de Miembros"
3. Haz clic en "Enviar Invitación"
4. Ingresa un email
5. El email debería enviarse automáticamente

## ⚠️ Notas Importantes

1. **Rama develop vs main:**
   - Las funciones SQL están en la base de datos de Supabase
   - No dependen de la rama de Git
   - Funcionarán igual en develop y main

2. **Variables de Easypanel:**
   - `RESEND_API_KEY` en Easypanel no está disponible directamente en funciones SQL
   - Necesitas configurarla en Supabase (Paso 2, Opción A)
   - O usar Edge Functions (más complejo)

3. **Dominio:**
   - Si no verificas dominio, cambia `noreply@cot.piwisuite.cl` a `onboarding@resend.dev` en el script
   - O verifica el dominio primero

## 🐛 Solución de Problemas

### Los emails no se envían:
1. Verifica que `pg_net` esté habilitado
2. Verifica que la API key esté configurada: `SELECT current_setting('app.resend_api_key', true);`
3. Revisa los logs de Supabase para ver errores

### Error "RESEND_API_KEY no configurada":
- Ejecuta `supabase/configurar-resend-api-key.sql`
- Verifica con: `SELECT current_setting('app.resend_api_key', true);`

### Error de dominio no verificado:
- Verifica el dominio en Resend
- O cambia `from` a `onboarding@resend.dev` en el script

## 📄 Archivos Necesarios

1. `supabase/configurar-resend-api-key.sql` - Configura la API key
2. `supabase/setup-email-functions-ACTIVO.sql` - Crea las funciones de email
3. `CONFIGURAR_DOMINIO_RESEND.md` - Guía para verificar dominio

## ✅ Checklist Final

- [ ] Cuenta creada en Resend
- [ ] API key obtenida: `re_MrCk22RD_LuXWsiJ47Vp6c9tNx1pMzRmP`
- [ ] Dominio verificado en Resend (opcional)
- [ ] Extensión `pg_net` habilitada en Supabase
- [ ] API key configurada en Supabase (ejecutar `configurar-resend-api-key.sql`)
- [ ] Funciones de email creadas (ejecutar `setup-email-functions-ACTIVO.sql`)
- [ ] Probado creando una invitación

¡Listo! Los emails se enviarán automáticamente. 🎉

