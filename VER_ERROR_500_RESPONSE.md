# 🔍 Ver el Error 500 Específico

## ✅ Estado Actual

- ✅ El servidor está corriendo
- ✅ El servidor responde (no es 502/503)
- ❌ Pero responde con error 500
- Content-Length: 21 (mensaje de error pequeño)

## 🔍 Ver el Mensaje de Error Específico

### Paso 1: Ver el Response Body

En las herramientas de desarrollador del navegador:

1. Ve a la pestaña **"Network"**
2. Haz clic en la petición a `cot.piwisuite.cl` (la que muestra 500)
3. Ve a la pestaña **"Response"** o **"Preview"**
4. **¿Qué mensaje de error muestra?** (copia el contenido completo)

### Paso 2: Ver Logs en Tiempo Real

1. En Easypanel, deja los logs abiertos
2. Intenta acceder a `https://cot.piwisuite.cl` en otra pestaña
3. **Inmediatamente vuelve a los logs** en Easypanel
4. Busca nuevos mensajes de error que aparezcan cuando haces la petición
5. Copia los últimos 50-100 líneas que muestren errores

## 🔍 Errores Comunes que Causan 500

### Error: "supabaseUrl is required"
- **Causa**: Las variables no están disponibles cuando se procesa la petición
- **Solución**: Asegurar que las variables se carguen antes de que Next.js las necesite

### Error: "Cannot read property of undefined"
- **Causa**: Algún componente está intentando acceder a una propiedad que no existe
- **Solución**: Verificar el código del componente que causa el error

### Error: "Failed to fetch" o errores de conexión
- **Causa**: Problema de conexión a Supabase
- **Solución**: Verificar las credenciales de Supabase

## 💡 Solución Rápida: Desactivar "Crear archivo .env"

Si el problema persiste, prueba:

1. **Desactiva el toggle "Crear archivo .env"** en Easypanel
2. **Elimina todas las variables**
3. **Agrega las variables UNA POR UNA** (sin el toggle activado):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://rxfcdnuycrauvybjowik.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NODE_ENV=production
   ```
4. **Guarda los cambios**
5. **Haz un deploy completo**
6. **Verifica**: `env | grep NEXT_PUBLIC` (ahora deberían aparecer)

Esto hará que Easypanel inyecte las variables directamente como variables de entorno del sistema, en lugar de crear un archivo `.env`.

## 📋 Información Necesaria

Para diagnosticar mejor, necesito:

1. **El contenido del Response** (F12 → Network → Click en la petición → Response)
2. **Los logs de Easypanel** cuando haces la petición (deberían mostrar nuevos errores)
3. **Errores en la consola del navegador** (F12 → Console)

Con esa información podré identificar el error específico y solucionarlo.

