# 🔍 Cómo Obtener los Logs de Runtime (No de Build)

## ⚠️ Importante

Los logs que compartiste son del **build** (cuando se construye la imagen Docker). Necesitamos los logs del **runtime** (cuando el servicio está corriendo).

## ✅ Pasos para Obtener los Logs de Runtime

### Paso 1: Ir a los Logs del Servicio

1. En Easypanel, ve a tu servicio `piwisuite / cotizadorpiwisuite`
2. **NO vayas a la pestaña "Implementaciones"** (esos son logs de build)
3. Ve directamente a la pestaña **"Registros"** o **"Logs"** (debería estar en el menú lateral o en la parte superior)

### Paso 2: Filtrar los Logs

1. En la sección de logs, busca un filtro o selector
2. Selecciona **"app-prod"** o **"Todo"** (no "Build" o "Deploy")
3. Los logs de runtime deberían mostrar algo como:
   ```
   app-prod-1 | ▲ Next.js 16.0.10
   app-prod-1 | - Local: http://localhost:3000
   app-prod-1 | - Network: http://0.0.0.0:3000
   app-prod-1 | ✓ Ready in 182ms
   ```
   Y luego errores como:
   ```
   app-prod-1 | Error: ...
   app-prod-1 | TypeError: ...
   ```

### Paso 3: Buscar Errores

Una vez que veas los logs de runtime:

1. **Desplázate hacia abajo** para ver los logs más recientes
2. **Busca líneas que contengan:**
   - `Error:`
   - `TypeError:`
   - `ReferenceError:`
   - `Failed to`
   - `Cannot`
   - `ECONNREFUSED`
   - `supabaseUrl is required`

3. **Copia las últimas 50-100 líneas** que contengan errores

## 🔍 Qué Buscar en los Logs

### Errores Comunes:

#### 1. Error de Variables de Entorno
```
Error: supabaseUrl is required
```
**Solución**: Las variables no están disponibles en runtime

#### 2. Error de Conexión a Supabase
```
Error: connect ECONNREFUSED
Error: Failed to fetch
```
**Solución**: Problema de conexión a Supabase

#### 3. Error de Autenticación
```
Error: useAuth must be used within an AuthProvider
```
**Solución**: Problema con el contexto de autenticación

#### 4. Error de Módulo
```
Error: Cannot find module '@supabase/supabase-js'
```
**Solución**: Dependencias faltantes

## 📋 Alternativa: Ver Logs en Tiempo Real

Si Easypanel tiene la opción:

1. En los logs, busca un botón de **"Follow"** o **"Stream"** o **"Live"**
2. Esto mostrará los logs en tiempo real
3. Intenta acceder a `https://cot.piwisuite.cl` mientras ves los logs
4. Verás el error aparecer en tiempo real

## 💡 Si No Puedes Ver los Logs de Runtime

Si Easypanel no muestra logs de runtime separados:

1. **Reinicia el servicio:**
   - Haz clic en **"Stop"**
   - Espera 10 segundos
   - Haz clic en **"Start"** o **"Deploy"**
   - Inmediatamente ve a los logs
   - Deberías ver los logs de inicio del servicio

2. **Haz una petición mientras ves los logs:**
   - Abre `https://cot.piwisuite.cl` en otra pestaña
   - Mientras tanto, observa los logs en Easypanel
   - El error debería aparecer cuando haces la petición

## 🚀 Solución Temporal: Verificar Variables de Entorno

Mientras tanto, verifica que las variables estén correctamente configuradas:

1. En Easypanel, ve a **"Entorno"** o **"Environment Variables"**
2. Verifica que estén estas 3 variables (sin comentarios, sin espacios extra):
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://rxfcdnuycrauvybjowik.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZmNkbnV5Y3JhdXZ5Ympvd2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mjg1OTIsImV4cCI6MjA4MTQwNDU5Mn0.uKp2wRv69-OAEVHxjZnYsx_L-PV5BYRt3Ru0Wz8PkOY
   NODE_ENV = production
   ```
3. Si están configuradas, **reinicia el servicio** para que las variables se carguen

