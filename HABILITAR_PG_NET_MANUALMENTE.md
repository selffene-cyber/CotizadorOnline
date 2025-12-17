# 🔧 Cómo Habilitar pg_net Manualmente en Supabase

## ⚠️ Problema

El error `function net.http_post does not exist` significa que la extensión `pg_net` no está habilitada en tu base de datos de Supabase.

## ✅ Solución: Habilitar Manualmente

### Paso 1: Ir al Dashboard de Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto: **CotizadorPiwiSuite**

### Paso 2: Ir a Extensions

1. En el menú lateral izquierdo, haz clic en **"Database"**
2. Haz clic en **"Extensions"** (o "Extensiones")

### Paso 3: Buscar y Habilitar pg_net

1. En la barra de búsqueda, escribe: `pg_net`
2. Deberías ver la extensión `pg_net` en la lista
3. Haz clic en el botón **"Enable"** o **"Habilitar"** (puede estar en un menú de 3 puntos)
4. Si te pide un schema, selecciona: **`net`** (o `public` si `net` no está disponible)

### Paso 4: Verificar que Funcionó

Ejecuta en Supabase SQL Editor:
```sql
-- Ejecuta: supabase/verificar-y-habilitar-pg-net.sql
```

Deberías ver:
- ✓ Extensión pg_net creada exitosamente
- ✓ pg_net está habilitada - Puedes usar net.http_post
- ✓ Esquema net existe
- ✓ Función net.http_post existe - Lista para usar

### Paso 5: Probar Nuevamente

Una vez habilitado, ejecuta:
```sql
-- Ejecuta: supabase/probar-envio-email-directo.sql
-- (Cambia el email a selffene@gmail.com)
```

## 🐛 Si No Aparece pg_net en Extensions

### Opción 1: Verificar Plan de Supabase

Algunos planes de Supabase pueden no incluir `pg_net`. Verifica:
1. Ve a **Settings** → **Billing**
2. Revisa qué plan tienes
3. Si estás en plan gratuito, `pg_net` debería estar disponible

### Opción 2: Usar Alternativa (Edge Functions)

Si `pg_net` no está disponible, puedes usar **Supabase Edge Functions** en su lugar:

1. Crea una Edge Function que envíe emails usando Resend
2. Llama a la Edge Function desde tu código TypeScript
3. Esto requiere más configuración pero es más flexible

### Opción 3: Contactar Soporte

Si `pg_net` no aparece en Extensions y estás en un plan que debería incluirlo:
1. Contacta al soporte de Supabase
2. Pregunta por qué `pg_net` no está disponible
3. Pueden habilitarlo manualmente

## 📝 Verificación Rápida

Ejecuta esto para ver el estado actual:

```sql
-- Ver extensiones instaladas
SELECT extname, extversion, n.nspname as schema_name
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname = 'pg_net';

-- Si no hay resultados, pg_net no está habilitado
```

## ✅ Checklist

- [ ] Fui a Supabase Dashboard → Database → Extensions
- [ ] Busqué "pg_net" en la lista
- [ ] Hice clic en "Enable" o "Habilitar"
- [ ] Seleccioné schema "net" (o "public")
- [ ] Ejecuté `supabase/verificar-y-habilitar-pg-net.sql` para verificar
- [ ] Vi "✓ pg_net está habilitada"
- [ ] Probé nuevamente `supabase/probar-envio-email-directo.sql`

## 🚀 Una Vez Habilitado

Una vez que `pg_net` esté habilitado:

1. ✅ Las funciones de email funcionarán correctamente
2. ✅ Podrás enviar invitaciones desde `/admin`
3. ✅ Los emails se enviarán automáticamente

¡No necesitas hacer nada más! 🎉

