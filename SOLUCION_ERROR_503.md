# 🔧 Solución Error 503 - Service Unavailable

## Problema
Error 503 significa que el servicio no está disponible o no está respondiendo. Esto es diferente del 502:
- **502**: El proxy no puede comunicarse con el servicio (servicio corriendo pero no responde)
- **503**: El servicio no está disponible (servicio no está corriendo o está crasheando)

## 🔍 Causas Comunes del Error 503

1. **El servicio no está corriendo** en Easypanel
2. **El servicio está crasheando** al iniciar
3. **El servicio no está escuchando** en el puerto correcto
4. **Problemas de configuración** (variables de entorno, build, etc.)

## ✅ Solución Paso a Paso

### Paso 1: Verificar Estado del Servicio en Easypanel

1. En Easypanel, ve a tu servicio `piwisuite / cotizadorpiwisuite`
2. **Verifica el estado:**
   - ¿Muestra **"Running"** o estado verde? ✅
   - ¿Muestra **"Stopped"** o estado rojo? ❌
   - ¿Muestra **"Restarting"** o estado amarillo? ⚠️

**Si está detenido:**
- Haz clic en **"Deploy"** o **"Start"**
- Espera 1-2 minutos a que inicie
- Verifica que cambie a estado "Running"

**Si está reiniciando constantemente:**
- El servicio está crasheando al iniciar
- Ve al Paso 2 para revisar los logs

### Paso 2: Revisar los Logs del Servicio

1. En Easypanel, ve a tu servicio
2. Haz clic en **"Logs"** o el icono de terminal/consola
3. **Revisa los últimos mensajes** (últimas 50-100 líneas)

**Busca estos errores comunes:**

#### Error: "supabaseUrl is required" o "Missing Supabase URL"
```
Error: supabaseUrl is required
```
**Solución**: Verifica que la variable `NEXT_PUBLIC_SUPABASE_URL` esté configurada correctamente

#### Error: "Cannot find module" o errores de importación
```
Error: Cannot find module '...'
```
**Solución**: Problema de build, necesitas hacer un nuevo deploy

#### Error: "Port 3000 is already in use"
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solución**: Conflicto de puertos, verifica la configuración

#### Error: "ECONNREFUSED" o errores de conexión a Supabase
```
Error: connect ECONNREFUSED
```
**Solución**: Problema de conexión a Supabase, verifica las credenciales

#### Error: "Failed to start server"
```
Error: Failed to start server
```
**Solución**: Revisa todos los errores anteriores en los logs

### Paso 3: Verificar Variables de Entorno

1. En Easypanel, ve a tu servicio
2. Ve a **"Environment Variables"** o **"Variables"**
3. **Verifica que estén configuradas estas 3 variables** (sin comentarios):

```
NEXT_PUBLIC_SUPABASE_URL = https://rxfcdnuycrauvybjowik.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZmNkbnV5Y3JhdXZ5Ympvd2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mjg1OTIsImV4cCI6MjA4MTQwNDU5Mn0.uKp2wRv69-OAEVHxjZnYsx_L-PV5BYRt3Ru0Wz8PkOY
NODE_ENV = production
```

**IMPORTANTE:**
- ✅ Sin comentarios (#)
- ✅ Sin espacios alrededor del signo = (o con espacios, según la interfaz)
- ✅ Sin comillas en los valores
- ✅ Cada variable en una línea separada

### Paso 4: Verificar Configuración del Dominio

1. En Easypanel, ve a tu servicio
2. Ve a la sección **"Dominios"**
3. Verifica que `cot.piwisuite.cl` esté configurado así:
   - **External URL**: `https://cot.piwisuite.cl/`
   - **Internal URL**: `http://piwisuite_cotizadorpiwisuite:3000/` ✅

### Paso 5: Reiniciar el Servicio

Después de verificar/corregir las variables:

1. En Easypanel, ve a tu servicio
2. Haz clic en **"Stop"** (si está corriendo)
3. Espera 10 segundos
4. Haz clic en **"Deploy"** o **"Start"**
5. Espera 1-2 minutos a que inicie
6. **Revisa los logs** para verificar que no hay errores
7. Verifica que el estado cambie a **"Running"**

### Paso 6: Hacer un Nuevo Deploy Completo

Si el servicio sigue crasheando o no inicia:

1. En Easypanel, ve a tu servicio
2. Haz clic en **"Deploy"** o **"Rebuild"**
3. Esto reconstruirá la imagen Docker desde cero
4. Espera 3-5 minutos a que complete el build y deploy
5. Revisa los logs durante el proceso

## 🔍 Diagnóstico Avanzado

### Verificar Recursos del Servicio

1. En Easypanel, ve a tu servicio
2. Revisa la sección de **recursos**:
   - **CPU**: ¿Está en 0% o hay uso?
   - **Memoria**: ¿Está en 0 MB o hay uso?
   - **Red**: ¿Hay tráfico?

**Si todo está en 0:**
- El servicio no está corriendo realmente
- Necesitas iniciarlo o hacer un deploy

### Verificar Configuración del Servicio

1. En Easypanel, ve a tu servicio
2. Ve a **"Settings"** o **"Config"**
3. Verifica:
   - **Puerto**: Debe ser 3000
   - **Health check**: Si está configurado, verifica que esté funcionando
   - **Restart policy**: Debe ser "unless-stopped" o similar

## 📋 Checklist de Verificación

- [ ] El servicio muestra estado "Running" en Easypanel
- [ ] Los logs no muestran errores de inicio
- [ ] Las 3 variables de entorno están configuradas correctamente
- [ ] El dominio está configurado con puerto 3000
- [ ] El servicio tiene uso de recursos (CPU/Memoria > 0)
- [ ] Se hizo un reinicio después de cambiar las variables

## 🚀 Si Aún No Funciona

1. **Comparte los logs completos:**
   - Copia las últimas 100-200 líneas de los logs
   - Incluye cualquier mensaje de error

2. **Verifica la configuración del servicio:**
   - ¿Qué tipo de servicio es? (Docker Compose, Dockerfile, etc.)
   - ¿Hay alguna configuración especial?

3. **Intenta acceder directamente:**
   - En Easypanel, busca un botón de "Open App" o similar
   - Esto te dará la URL directa del servicio (sin Cloudflare)
   - Si funciona directamente pero no con el dominio, el problema es de DNS/proxy

## 💡 Información Necesaria

Para diagnosticar mejor, necesito:
1. **Estado del servicio** en Easypanel (Running/Stopped/Restarting)
2. **Últimos 50-100 líneas de los logs** (especialmente errores)
3. **Uso de recursos** (CPU, Memoria, Red)
4. **Configuración del servicio** (puerto, health checks, etc.)

