# 🔧 Corrección del Error 502 - Configuración de Dominio

## Problema
El dominio `cot.piwisuite.cl` está configurado para apuntar al puerto **80**, pero la aplicación Next.js corre en el puerto **3000**.

## Solución

### Paso 1: Editar el dominio en Easypanel

1. En Easypanel, ve a la sección **"Dominios"** (donde está la lista que muestras)
2. Haz clic en el **icono de lápiz (editar)** del dominio `cot.piwisuite.cl`
3. Cambia la **Internal URL** de:
   ```
   http://piwisuite_cotizadorpiwisuite:80/
   ```
   a:
   ```
   http://piwisuite_cotizadorpiwisuite:3000/
   ```
4. Guarda los cambios

### Paso 2: Verificar que el servicio esté corriendo

1. En Easypanel, ve a la sección **"Panel"** o **"Monitor"**
2. Verifica que el servicio `piwisuite_cotizadorpiwisuite` esté **activo** y **corriendo**
3. Si está detenido, inícialo

### Paso 3: Verificar logs

Si después de cambiar el puerto sigue el error 502:

1. En Easypanel, ve a **"Monitor"** o busca la sección de **Logs**
2. Revisa los logs del servicio `piwisuite_cotizadorpiwisuite`
3. Busca errores relacionados con:
   - Variables de entorno faltantes
   - Errores de conexión a Supabase
   - Errores de inicio de la aplicación

### Paso 4: Verificar variables de entorno

Asegúrate de que en Easypanel estén configuradas estas variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://rxfcdnuycrauvybjowik.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZmNkbnV5Y3JhdXZ5Ympvd2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mjg1OTIsImV4cCI6MjA4MTQwNDU5Mn0.uKp2wRv69-OAEVHxjZnYsx_L-PV5BYRt3Ru0Wz8PkOY
NODE_ENV=production
```

## Resumen de la configuración correcta

**Dominio en Easypanel:**
- **External URL**: `https://cot.piwisuite.cl/`
- **Internal URL**: `http://piwisuite_cotizadorpiwisuite:3000/` ✅ (puerto 3000, no 80)

**Cloudflare:**
- **Tipo**: CNAME
- **Nombre**: `cot`
- **Destino**: El dominio público que Easypanel te proporciona para este servicio (no `panel.piwisuite.cl`)

## Nota importante

- `panel.piwisuite.cl` es el panel de administración de Easypanel (no tu aplicación)
- `cot.piwisuite.cl` es tu aplicación Cotizador
- El dominio en Cloudflare debe apuntar al dominio público de Easypanel para el servicio, no al panel

