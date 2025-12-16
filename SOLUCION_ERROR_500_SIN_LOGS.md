# 🔧 Solución Error 500 - Sin Acceso a Logs del Servidor

## ✅ Enfoque Alternativo

Como no podemos ver los logs del servidor, vamos a diagnosticar el error 500 de otras maneras.

## 🔍 Paso 1: Verificar Errores en el Navegador

### Abrir la Consola del Navegador

1. Abre `https://cot.piwisuite.cl` en el navegador
2. Presiona **F12** para abrir las herramientas de desarrollador
3. Ve a la pestaña **"Console"**
4. **¿Qué errores ves?** (copia todos los errores en rojo)

### Verificar la Pestaña Network

1. En las herramientas de desarrollador, ve a la pestaña **"Network"**
2. Recarga la página (F5)
3. Busca la petición a `cot.piwisuite.cl` (debería estar en rojo si hay error)
4. Haz clic en ella
5. Ve a la pestaña **"Response"** o **"Preview"**
6. **¿Qué mensaje de error muestra?** (copia el contenido)

## 🔍 Paso 2: Verificar Variables de Entorno

### En Easypanel

1. Ve a tu servicio `piwisuite / cotizadorpiwisuite`
2. Ve a **"Entorno"** o **"Environment Variables"**
3. Verifica que estén estas 3 variables **exactamente así** (sin comentarios, sin espacios extra):

```
NEXT_PUBLIC_SUPABASE_URL=https://rxfcdnuycrauvybjowik.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZmNkbnV5Y3JhdXZ5Ympvd2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mjg1OTIsImV4cCI6MjA4MTQwNDU5Mn0.uKp2wRv69-OAEVHxjZnYsx_L-PV5BYRt3Ru0Wz8PkOY
NODE_ENV=production
```

**IMPORTANTE:**
- ✅ Sin comentarios (#)
- ✅ Sin espacios alrededor del signo =
- ✅ Sin comillas en los valores
- ✅ Cada variable en una línea separada

### Si las Variables Están Correctas

1. **Reinicia el servicio:**
   - En Easypanel, haz clic en **"Stop"**
   - Espera 10 segundos
   - Haz clic en **"Start"** o **"Deploy"**
   - Espera 1-2 minutos
   - Intenta acceder nuevamente

## 🔍 Paso 3: Verificar Configuración del Dominio

### En Easypanel

1. Ve a **"Dominios"**
2. Verifica que `cot.piwisuite.cl` esté configurado así:
   - **External URL**: `https://cot.piwisuite.cl/`
   - **Internal URL**: `http://app-prod:3000/` ✅ (no `app-prod-1`)

## 🔍 Paso 4: Soluciones Comunes (Sin Necesitar Logs)

### Solución 1: Variables de Entorno con Espacios

Si las variables tienen espacios alrededor del `=`, puede causar problemas:

**❌ Incorrecto:**
```
NEXT_PUBLIC_SUPABASE_URL = https://...
```

**✅ Correcto:**
```
NEXT_PUBLIC_SUPABASE_URL=https://...
```

### Solución 2: Variables de Entorno con Comillas

Si las variables tienen comillas, puede causar problemas:

**❌ Incorrecto:**
```
NEXT_PUBLIC_SUPABASE_URL="https://..."
```

**✅ Correcto:**
```
NEXT_PUBLIC_SUPABASE_URL=https://...
```

### Solución 3: Reiniciar el Servicio

Después de cambiar las variables de entorno:

1. **Reinicia el servicio** (Stop → Start)
2. Espera 1-2 minutos
3. Intenta acceder nuevamente

### Solución 4: Hacer un Nuevo Deploy

Si el problema persiste:

1. En Easypanel, haz clic en **"Deploy"** o **"Rebuild"**
2. Esto reconstruirá la imagen Docker desde cero
3. Espera 3-5 minutos
4. Intenta acceder nuevamente

## 🔍 Paso 5: Verificar Supabase

### Verificar que el Proyecto Esté Activo

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Verifica que el proyecto **CotizadorPiwiSuite** esté activo
3. Verifica que las credenciales sean correctas

### Verificar que las Tablas Estén Creadas

1. En Supabase, ve a **Table Editor**
2. Verifica que existan las tablas:
   - `users`
   - `clients`
   - `quotes`
   - `costings`
   - etc.

## 📋 Checklist de Verificación

- [ ] Revisé la consola del navegador (F12 → Console) y copié los errores
- [ ] Revisé la pestaña Network (F12 → Network → Response) y copié el error
- [ ] Verifiqué que las 3 variables de entorno estén configuradas correctamente en Easypanel
- [ ] Las variables NO tienen espacios alrededor del `=`
- [ ] Las variables NO tienen comillas
- [ ] Reinicié el servicio después de verificar las variables
- [ ] Verifiqué que el dominio esté configurado con `app-prod:3000`
- [ ] Verifiqué que el proyecto de Supabase esté activo

## 💡 Información Necesaria

Para diagnosticar mejor, necesito:

1. **Errores en la consola del navegador** (F12 → Console)
2. **La respuesta del servidor** (F12 → Network → Click en la petición → Response)
3. **Confirmación de que las variables de entorno están configuradas correctamente**

## 🚀 Próximos Pasos

1. **Revisa la consola del navegador** y comparte los errores
2. **Revisa la pestaña Network** y comparte la respuesta del servidor
3. **Verifica las variables de entorno** en Easypanel
4. **Reinicia el servicio** después de verificar

Con esa información podré identificar el error específico y darte la solución exacta.

