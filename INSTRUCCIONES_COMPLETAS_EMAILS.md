# 📧 Instrucciones Completas para Configurar Emails

## ⚠️ IMPORTANTE: Orden de Ejecución

**Ejecuta los scripts en este orden exacto:**

1. **PRIMERO:** `supabase/habilitar-pg-net.sql` - Habilita la extensión necesaria
2. **SEGUNDO:** `supabase/configurar-resend-api-key.sql` - Configura tu API key
3. **TERCERO:** `supabase/setup-email-functions-ACTIVO.sql` - Crea las funciones de email

## 📋 Paso a Paso

### Paso 1: Habilitar pg_net (OBLIGATORIO)

**Ejecuta en Supabase SQL Editor:**
```sql
-- Ejecuta: supabase/habilitar-pg-net.sql
```

**Verifica que funcionó:**
```sql
-- Ejecuta: supabase/verificar-pg-net-disponible.sql
```

**Si no funciona:**
1. Ve a **Supabase Dashboard** → **Database** → **Extensions**
2. Busca `pg_net`
3. Habilítala manualmente desde la interfaz
4. Asegúrate de que esté en el schema `net` o `public`

### Paso 2: Configurar API Key

**Ejecuta en Supabase SQL Editor:**
```sql
-- Ejecuta: supabase/configurar-resend-api-key.sql
```

**Verifica que funcionó:**
```sql
SELECT * FROM public.app_config WHERE key = 'resend_api_key';
-- Debería mostrar tu API key
```

### Paso 3: Crear Funciones de Email

**Ejecuta en Supabase SQL Editor:**
```sql
-- Ejecuta: supabase/setup-email-functions-ACTIVO.sql
```

**Verifica que funcionó:**
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('send_approval_email', 'send_rejection_email', 'send_invitation_email');
-- Debería mostrar las 3 funciones
```

### Paso 4: Probar Envío

**Ejecuta en Supabase SQL Editor:**
```sql
-- Ejecuta: supabase/probar-envio-email-directo.sql
-- IMPORTANTE: Cambia 'TU-EMAIL@ejemplo.com' a tu email real (línea 5)
```

**Si funciona:**
- ✅ Verás: "Email enviado exitosamente!"
- ✅ Revisa tu bandeja de entrada
- ✅ Revisa [Resend Dashboard](https://resend.com/emails)

**Si falla:**
- Revisa el error específico
- Consulta `SOLUCION_EMAIL_NO_ENVIADO.md`

## 🐛 Solución de Problemas

### Error: "function net.http_post does not exist"

**Causa:** La extensión `pg_net` no está habilitada.

**Solución:**
1. Ejecuta `supabase/habilitar-pg-net.sql`
2. O habilítala manualmente en Supabase Dashboard → Extensions
3. Verifica con `supabase/verificar-pg-net-disponible.sql`

### Error: "RESEND_API_KEY no configurada"

**Causa:** La API key no está en la tabla `app_config`.

**Solución:**
1. Ejecuta `supabase/configurar-resend-api-key.sql`
2. Verifica con: `SELECT * FROM public.app_config WHERE key = 'resend_api_key';`

### Error: "domain not verified"

**Causa:** El dominio `cot.piwisuite.cl` no está verificado en Resend.

**Solución:**
1. Verifica el dominio en [Resend Dashboard](https://resend.com/domains)
2. O cambia temporalmente el `from` a `onboarding@resend.dev` en el script

### La función se ejecuta pero no llega el email

**Posibles causas:**
1. El email va a spam
2. El dominio no está verificado
3. La API key es incorrecta

**Solución:**
1. Revisa la carpeta de spam
2. Revisa [Resend Dashboard](https://resend.com/emails) para ver el estado
3. Verifica que la API key sea correcta

## ✅ Checklist Final

Antes de probar crear una invitación, verifica:

- [ ] Ejecutado `supabase/habilitar-pg-net.sql` ✓
- [ ] Verificado que `pg_net` está habilitado ✓
- [ ] Ejecutado `supabase/configurar-resend-api-key.sql` ✓
- [ ] Verificado que la API key está configurada ✓
- [ ] Ejecutado `supabase/setup-email-functions-ACTIVO.sql` ✓
- [ ] Verificado que las funciones existen ✓
- [ ] Probado envío directo con `supabase/probar-envio-email-directo.sql` ✓

## 📝 Notas Importantes

1. **Orden es crítico:** No puedes crear las funciones de email sin `pg_net` habilitado primero.

2. **pg_net es obligatorio:** Sin esta extensión, no puedes hacer requests HTTP desde PostgreSQL.

3. **API key en app_config:** Las funciones leen la API key desde `public.app_config`, no desde variables de entorno.

4. **Dominio verificado:** Para usar `noreply@cot.piwisuite.cl`, debes verificar el dominio en Resend primero.

5. **Prueba primero:** Siempre prueba con `probar-envio-email-directo.sql` antes de crear invitaciones reales.

## 🚀 Una Vez Configurado

Una vez que todo esté configurado:

1. Las invitaciones se enviarán automáticamente cuando las crees desde `/admin`
2. Los emails de aprobación se enviarán cuando apruebes solicitudes
3. Los emails de rechazo se enviarán cuando rechaces solicitudes

¡Todo funcionará automáticamente! 🎉

