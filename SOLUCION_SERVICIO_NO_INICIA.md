# 🔧 Solución: Deploy Exitoso pero Servicio No Inicia

## Problema Identificado

El deploy se completó exitosamente (build verde), pero el servicio muestra "Service is not started" y error 503. Esto significa que:

✅ **El build funcionó** (imagen Docker creada correctamente)
❌ **El servicio no está corriendo** (el contenedor se inició pero crasheó o no está respondiendo)

## 🔍 Diagnóstico: Revisar Logs de Runtime (No de Build)

Los logs que compartiste son del **build**, pero necesitamos ver los logs del **servicio corriendo**.

### Paso 1: Ver Logs del Servicio en Ejecución

1. En Easypanel, ve a tu servicio `piwisuite / cotizadorpiwisuite`
2. Haz clic en **"Logs"** o el icono de terminal/consola
3. **NO mires los logs de build**, busca los logs del servicio corriendo
4. Los logs de runtime deberían mostrar algo como:
   ```
   > next start
   - ready started server on 0.0.0.0:3000
   ```
   O errores como:
   ```
   Error: supabaseUrl is required
   Error: Cannot find module
   Error: listen EADDRINUSE
   ```

### Paso 2: Verificar Estado del Contenedor

1. En Easypanel, ve a tu servicio
2. Verifica el estado:
   - ¿Muestra **"Running"**? → El contenedor está corriendo pero puede tener errores
   - ¿Muestra **"Stopped"**? → El contenedor crasheó
   - ¿Muestra **"Restarting"**? → El contenedor está en loop de reinicios

### Paso 3: Verificar Variables de Entorno en Runtime

El build puede funcionar sin variables de entorno, pero el servicio necesita las variables para correr.

1. En Easypanel, ve a tu servicio
2. Ve a **"Environment Variables"** o **"Variables"**
3. Verifica que estén configuradas estas 3 variables:

```
NEXT_PUBLIC_SUPABASE_URL = https://rxfcdnuycrauvybjowik.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZmNkbnV5Y3JhdXZ5Ympvd2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mjg1OTIsImV4cCI6MjA4MTQwNDU5Mn0.uKp2wRv69-OAEVHxjZnYsx_L-PV5BYRt3Ru0Wz8PkOY
NODE_ENV = production
```

**IMPORTANTE**: Estas variables deben estar configuradas **en el servicio**, no solo en el archivo `easypanel.env`.

### Paso 4: Verificar Configuración del Servicio

1. En Easypanel, ve a tu servicio
2. Ve a **"Settings"** o **"Config"**
3. Verifica:
   - **Puerto**: Debe ser 3000
   - **Command**: Debe ser `node server.js` o similar
   - **Working Directory**: Debe ser `/app` o similar

## 🚀 Soluciones Comunes

### Solución 1: Reiniciar el Servicio

1. En Easypanel, ve a tu servicio
2. Haz clic en **"Stop"**
3. Espera 10 segundos
4. Haz clic en **"Start"** o **"Deploy"**
5. Espera 1-2 minutos
6. Revisa los logs de runtime (no de build)

### Solución 2: Verificar que las Variables Estén Configuradas

Si las variables no están configuradas en Easypanel:

1. Ve a **"Environment Variables"** del servicio
2. Agrega las 3 variables (una por una, sin comentarios)
3. Reinicia el servicio

### Solución 3: Verificar el Comando de Inicio

El Dockerfile usa `CMD ["node", "server.js"]`, pero verifica que Easypanel no esté sobrescribiendo esto.

1. En Easypanel, ve a **"Settings"** del servicio
2. Verifica el **"Command"** o **"Entrypoint"**
3. Debe ser `node server.js` o dejar vacío para usar el CMD del Dockerfile

### Solución 4: Verificar Health Check

Si Easypanel tiene un health check configurado:

1. Verifica que el health check esté apuntando al puerto 3000
2. Verifica que la ruta del health check sea correcta (ej: `/` o `/api/health`)

## 📋 Checklist de Verificación

- [ ] Los logs de **runtime** (no de build) no muestran errores
- [ ] El servicio muestra estado **"Running"** (no "Stopped" o "Restarting")
- [ ] Las 3 variables de entorno están configuradas en Easypanel
- [ ] El puerto está configurado como 3000
- [ ] El servicio tiene uso de recursos (CPU/Memoria > 0)
- [ ] Se reinició el servicio después de configurar las variables

## 🔍 Información Necesaria

Para diagnosticar mejor, necesito:

1. **Logs de runtime** (no de build):
   - Los últimos 50-100 líneas después de que el contenedor se inició
   - Busca mensajes como "ready started server" o errores

2. **Estado actual del servicio**:
   - ¿Running, Stopped, o Restarting?

3. **Uso de recursos**:
   - CPU, Memoria, Red (¿están en 0 o hay uso?)

4. **Variables de entorno**:
   - ¿Están configuradas en Easypanel? (no solo en el archivo)

## 💡 Nota Importante

El mensaje "Service is not started" que ves en el navegador es una página de error de Easypanel/Traefik, no de tu aplicación. Esto significa que el proxy no puede alcanzar tu servicio, probablemente porque:

1. El servicio no está corriendo
2. El servicio está crasheando al iniciar
3. El servicio no está escuchando en el puerto correcto
4. Hay un problema de configuración del dominio/proxy

