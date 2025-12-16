# 🔍 Diagnosticar Error 500 - El Servicio Inicia Correctamente

## ✅ Estado Actual

Los logs muestran que el servicio inicia correctamente:
- ✅ Next.js está corriendo
- ✅ Escuchando en puerto 3000
- ✅ Ready en 176ms
- ❌ Pero hay error 500 al acceder

## 🔍 El Error 500 Solo Aparece en Peticiones HTTP

El error 500 probablemente ocurre cuando alguien intenta acceder a la aplicación, no durante el inicio. Necesitamos ver los logs **mientras se hace una petición**.

## ✅ Solución: Ver Logs en Tiempo Real

### Paso 1: Abrir los Logs en Easypanel

1. En Easypanel, ve a tu servicio
2. Ve a la pestaña **"Registros"** o **"Logs"**
3. Asegúrate de que el filtro esté en **"app-prod"** o **"Todo"**

### Paso 2: Hacer una Petición Mientras Observas los Logs

1. **Deja los logs abiertos** en Easypanel
2. En **otra pestaña del navegador**, intenta acceder a:
   - `https://cot.piwisuite.cl`
   - O `https://cot.piwisuite.cl/favicon.ico`
3. **Inmediatamente vuelve a los logs** en Easypanel
4. Deberías ver nuevos mensajes aparecer con el error

### Paso 3: Buscar el Error en los Logs

Después de hacer la petición, busca en los logs:

- Líneas nuevas que aparezcan después de "Ready"
- Mensajes que contengan:
  - `Error:`
  - `TypeError:`
  - `ReferenceError:`
  - `Failed to`
  - `Cannot`
  - `500`
  - `Internal Server Error`

## 🔍 Alternativa: Verificar Errores en el Navegador

Si no aparecen errores en los logs del servidor, el error podría estar en el cliente:

### Paso 1: Abrir la Consola del Navegador

1. Abre `https://cot.piwisuite.cl` en el navegador
2. Presiona **F12** para abrir las herramientas de desarrollador
3. Ve a la pestaña **"Console"**
4. Busca errores en rojo

### Paso 2: Verificar la Pestaña Network

1. En las herramientas de desarrollador, ve a la pestaña **"Network"**
2. Recarga la página (F5)
3. Busca la petición a `cot.piwisuite.cl`
4. Haz clic en ella para ver los detalles
5. Ve a la pestaña **"Response"** o **"Preview"**
6. Deberías ver el error específico

## 🔍 Posibles Causas del Error 500

### 1. Error en el Código de la Aplicación

Si el error aparece en los logs del servidor:
- Busca el stack trace completo
- Identifica qué archivo y línea está causando el error
- Comparte el error completo

### 2. Error de Variables de Entorno

Si las variables no están disponibles en runtime:
```
Error: supabaseUrl is required
```
**Solución**: Verifica que las variables estén configuradas en Easypanel

### 3. Error de Conexión a Supabase

Si hay problemas de conexión:
```
Error: connect ECONNREFUSED
Error: Failed to fetch
```
**Solución**: Verifica las credenciales de Supabase

### 4. Error en el Middleware o Routing

Si hay problemas con el routing:
- Verifica que el middleware esté configurado correctamente
- Verifica que las rutas existan

## 📋 Checklist de Verificación

- [ ] Intenté acceder a `https://cot.piwisuite.cl` mientras observaba los logs
- [ ] Vi nuevos mensajes de error aparecer en los logs
- [ ] Revisé la consola del navegador (F12) para errores
- [ ] Revisé la pestaña Network para ver la respuesta del servidor
- [ ] Las variables de entorno están configuradas en Easypanel

## 💡 Información Necesaria

Para diagnosticar mejor, necesito:

1. **Los logs que aparecen DESPUÉS de hacer una petición** (no solo los de inicio)
2. **Errores en la consola del navegador** (F12 → Console)
3. **La respuesta del servidor** (F12 → Network → Click en la petición → Response)

## 🚀 Solución Rápida: Verificar Variables de Entorno

Mientras tanto, verifica que las variables estén correctamente configuradas:

1. En Easypanel, ve a **"Entorno"** o **"Environment Variables"**
2. Verifica que estén estas 3 variables (sin comentarios):
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://rxfcdnuycrauvybjowik.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NODE_ENV = production
   ```
3. Si están configuradas, **reinicia el servicio** y luego intenta acceder nuevamente

