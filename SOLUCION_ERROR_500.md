# 🔧 Solución Error 500 - Internal Server Error

## ✅ Progreso

El cambio de **503** a **500** es una buena señal:
- ✅ El proxy ahora puede alcanzar el servicio
- ✅ La configuración del dominio está correcta
- ❌ Pero hay un error interno en la aplicación

## 🔍 Causas Comunes del Error 500

1. **Error en el código de la aplicación** (runtime error)
2. **Problemas con variables de entorno** (no disponibles en runtime)
3. **Errores de conexión a Supabase**
4. **Problemas con el middleware** o alguna ruta
5. **Errores de autenticación** o configuración

## ✅ Solución: Revisar los Logs del Servicio

### Paso 1: Ver Logs Detallados

1. En Easypanel, ve a tu servicio `piwisuite / cotizadorpiwisuite`
2. Haz clic en **"Logs"** o el icono de terminal
3. **Busca los últimos errores** (últimas 50-100 líneas)
4. Busca mensajes que contengan:
   - `Error:`
   - `TypeError:`
   - `ReferenceError:`
   - `Failed to`
   - `Cannot`

### Paso 2: Errores Comunes y Soluciones

#### Error: "supabaseUrl is required" o "Missing Supabase URL"
```
Error: supabaseUrl is required
```
**Causa**: Las variables de entorno no están disponibles en runtime
**Solución**: 
- Verifica que las variables estén configuradas en Easypanel (no solo en el archivo)
- Reinicia el servicio después de agregar las variables

#### Error: "Cannot find module" o errores de importación
```
Error: Cannot find module '@supabase/supabase-js'
```
**Causa**: Dependencias faltantes en el build
**Solución**: Haz un nuevo deploy completo

#### Error: "ECONNREFUSED" o errores de conexión a Supabase
```
Error: connect ECONNREFUSED
```
**Causa**: Problema de conexión a Supabase
**Solución**: 
- Verifica que las credenciales de Supabase sean correctas
- Verifica que el proyecto de Supabase esté activo

#### Error: "useAuth must be used within an AuthProvider"
```
Error: useAuth must be used within an AuthProvider
```
**Causa**: Problema con el contexto de autenticación
**Solución**: Verifica que el `AuthProvider` esté configurado correctamente en `app/layout.tsx`

#### Error: "Failed to fetch" o errores de red
```
Error: Failed to fetch
```
**Causa**: Problema de red o CORS
**Solución**: Verifica la configuración de Supabase y CORS

### Paso 3: Verificar Variables de Entorno en Runtime

Aunque las variables estén configuradas, verifica que estén disponibles en runtime:

1. En Easypanel, ve a **"Environment Variables"**
2. Verifica que estén estas 3 variables (sin comentarios):
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://rxfcdnuycrauvybjowik.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZmNkbnV5Y3JhdXZ5Ympvd2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mjg1OTIsImV4cCI6MjA4MTQwNDU5Mn0.uKp2wRv69-OAEVHxjZnYsx_L-PV5BYRt3Ru0Wz8PkOY
   NODE_ENV = production
   ```
3. Si están configuradas, reinicia el servicio:
   - Haz clic en **"Stop"**
   - Espera 10 segundos
   - Haz clic en **"Start"** o **"Deploy"**

### Paso 4: Verificar Configuración de Supabase

1. Verifica que el proyecto de Supabase esté activo
2. Verifica que las credenciales sean correctas
3. Verifica que las tablas estén creadas (ejecutaste el script SQL)

## 🔍 Diagnóstico Avanzado

### Verificar Errores en el Navegador

1. Abre `https://cot.piwisuite.cl` en el navegador
2. Abre la **Consola de Desarrollador** (F12)
3. Ve a la pestaña **"Console"** y **"Network"**
4. Busca errores en la consola o peticiones fallidas

### Verificar Errores en los Logs de Easypanel

Los logs deberían mostrar el error específico. Busca:
- Stack traces completos
- Mensajes de error detallados
- Errores relacionados con Supabase
- Errores relacionados con el middleware

## 📋 Checklist de Verificación

- [ ] Revisé los logs del servicio y encontré el error específico
- [ ] Las 3 variables de entorno están configuradas en Easypanel
- [ ] Reinicié el servicio después de configurar las variables
- [ ] El proyecto de Supabase está activo
- [ ] Las tablas de Supabase están creadas (script SQL ejecutado)
- [ ] No hay errores en la consola del navegador

## 💡 Información Necesaria

Para diagnosticar mejor, necesito:

1. **Los últimos 50-100 líneas de los logs del servicio** (especialmente errores)
2. **Errores en la consola del navegador** (si los hay)
3. **El error específico** que aparece en los logs

## 🚀 Soluciones Rápidas

### Solución 1: Reiniciar el Servicio

1. En Easypanel, haz clic en **"Stop"**
2. Espera 10 segundos
3. Haz clic en **"Start"** o **"Deploy"**
4. Revisa los logs para ver si el error persiste

### Solución 2: Verificar Variables de Entorno

1. Verifica que las variables estén configuradas correctamente
2. Asegúrate de que no haya espacios extra o caracteres especiales
3. Reinicia el servicio

### Solución 3: Hacer un Nuevo Deploy

Si el error persiste:

1. En Easypanel, haz clic en **"Deploy"** o **"Rebuild"**
2. Esto reconstruirá la imagen Docker desde cero
3. Espera 3-5 minutos a que complete
4. Revisa los logs durante el proceso

