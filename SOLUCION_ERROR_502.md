# 🔧 Solución Error 502 - Bad Gateway

## Problema
Error 502 significa que el proxy (Cloudflare/Easypanel) no puede comunicarse con el servicio. Esto generalmente ocurre cuando:
1. El servicio no está corriendo
2. El servicio está crasheando al iniciar
3. Las variables de entorno están mal configuradas
4. El servicio no está escuchando en el puerto correcto

## ⚠️ Problema Identificado: Variables de Entorno con Comentarios

Si copiaste el contenido completo del archivo `easypanel.env` (incluyendo comentarios) en Easypanel, eso puede causar problemas.

**En Easypanel, las variables de entorno deben configurarse SIN comentarios, una por una.**

## ✅ Solución Paso a Paso

### Paso 1: Verificar y Corregir Variables de Entorno en Easypanel

1. En Easypanel, ve a tu servicio `piwisuite / cotizadorpiwisuite`
2. Ve a la sección **"Environment Variables"** o **"Variables"**
3. **ELIMINA todas las variables existentes** (especialmente si tienen comentarios o están mal formateadas)
4. **Agrega estas 3 variables UNA POR UNA** (sin comentarios, sin espacios extra):

```
NEXT_PUBLIC_SUPABASE_URL
https://rxfcdnuycrauvybjowik.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZmNkbnV5Y3JhdXZ5Ympvd2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mjg1OTIsImV4cCI6MjA4MTQwNDU5Mn0.uKp2wRv69-OAEVHxjZnYsx_L-PV5BYRt3Ru0Wz8PkOY
```

```
NODE_ENV
production
```

**IMPORTANTE:**
- ✅ Cada variable en una línea separada
- ✅ Sin comentarios (#)
- ✅ Sin espacios alrededor del signo =
- ✅ Sin comillas en los valores

### Paso 2: Verificar que el Servicio Esté Corriendo

1. En Easypanel, ve a tu servicio
2. Verifica que muestre **"Running"** o estado verde
3. Si está detenido, haz clic en **"Deploy"** o **"Start"**

### Paso 3: Revisar los Logs del Servicio

1. En Easypanel, ve a tu servicio
2. Haz clic en **"Logs"** o el icono de terminal/consola
3. Revisa los últimos mensajes

**Busca estos errores comunes:**

#### Error: "supabaseUrl is required"
- **Causa**: La variable `NEXT_PUBLIC_SUPABASE_URL` no está configurada correctamente
- **Solución**: Verifica que esté escrita exactamente así (sin espacios, sin comillas)

#### Error: "Cannot find module" o errores de importación
- **Causa**: El build puede estar corrupto o faltan dependencias
- **Solución**: Haz un nuevo deploy

#### Error: "Port 3000 is already in use"
- **Causa**: Conflicto de puertos
- **Solución**: Verifica que el puerto en Easypanel sea 3000

#### Error: "ECONNREFUSED" o errores de conexión
- **Causa**: El servicio no está escuchando en el puerto correcto
- **Solución**: Verifica la configuración del dominio (puerto 3000)

### Paso 4: Reiniciar el Servicio

Después de corregir las variables de entorno:

1. En Easypanel, ve a tu servicio
2. Haz clic en **"Stop"** (si está corriendo)
3. Espera 10 segundos
4. Haz clic en **"Deploy"** o **"Start"**
5. Espera a que el servicio inicie (puede tomar 1-2 minutos)
6. Revisa los logs para verificar que no hay errores

### Paso 5: Verificar la Configuración del Dominio

1. En Easypanel, ve a tu servicio
2. Ve a la sección **"Dominios"**
3. Verifica que `cot.piwisuite.cl` esté configurado así:
   - **External URL**: `https://cot.piwisuite.cl/`
   - **Internal URL**: `http://piwisuite_cotizadorpiwisuite:3000/` ✅

## 🔍 Verificación de Variables de Entorno Correctas

Las variables deben verse así en Easypanel (sin comentarios):

```
NEXT_PUBLIC_SUPABASE_URL = https://rxfcdnuycrauvybjowik.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZmNkbnV5Y3JhdXZ5Ympvd2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mjg1OTIsImV4cCI6MjA4MTQwNDU5Mn0.uKp2wRv69-OAEVHxjZnYsx_L-PV5BYRt3Ru0Wz8PkOY
NODE_ENV = production
```

**O en formato de lista (dependiendo de la interfaz de Easypanel):**

- `NEXT_PUBLIC_SUPABASE_URL` → `https://rxfcdnuycrauvybjowik.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZmNkbnV5Y3JhdXZ5Ympvd2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mjg1OTIsImV4cCI6MjA4MTQwNDU5Mn0.uKp2wRv69-OAEVHxjZnYsx_L-PV5BYRt3Ru0Wz8PkOY`
- `NODE_ENV` → `production`

## 📋 Checklist Final

- [ ] Variables de entorno configuradas SIN comentarios
- [ ] Las 3 variables están presentes: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NODE_ENV`
- [ ] El servicio está corriendo (estado "Running")
- [ ] Los logs no muestran errores
- [ ] El dominio está configurado con puerto 3000
- [ ] El servicio se reinició después de cambiar las variables

## 🚀 Si Aún No Funciona

Si después de seguir estos pasos sigue el error 502:

1. **Haz un nuevo deploy completo:**
   - En Easypanel, ve a tu servicio
   - Haz clic en **"Deploy"** o **"Rebuild"**
   - Esto reconstruirá la imagen Docker con las variables correctas

2. **Verifica los logs detallados:**
   - Copia los últimos 50-100 líneas de los logs
   - Busca cualquier mensaje de error

3. **Verifica la conexión a Supabase:**
   - Asegúrate de que las credenciales de Supabase sean correctas
   - Verifica que el proyecto de Supabase esté activo

