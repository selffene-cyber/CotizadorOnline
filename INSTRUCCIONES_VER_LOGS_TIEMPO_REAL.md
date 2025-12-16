# 📋 Instrucciones: Ver Logs en Tiempo Real

## ⚠️ Problema Actual

Los logs solo muestran el inicio del servidor, pero no aparecen errores cuando haces una petición. Esto significa que necesitamos ver los logs **en tiempo real** mientras haces la petición.

## ✅ Pasos para Ver los Logs Correctamente

### Paso 1: Abrir los Logs en Easypanel

1. Ve a Easypanel
2. Entra a tu servicio `piwisuite / cotizadorpiwisuite`
3. Haz clic en la pestaña **"Logs"** o el icono de terminal
4. **Deja esta pestaña abierta** y visible

### Paso 2: Hacer una Petición

1. En **otra pestaña del navegador**, intenta acceder a `https://cot.piwisuite.cl`
2. **Inmediatamente** (sin esperar), vuelve a la pestaña de Easypanel con los logs
3. **Observa** si aparecen nuevos mensajes en los logs

### Paso 3: Qué Buscar en los Logs

Busca mensajes que aparezcan cuando haces la petición:

#### ✅ Mensajes que DEBERÍAS ver (si todo está bien):
```
[RootLayout] Renderizando layout en servidor
[RootLayout] Variables de entorno: { hasUrl: true, hasKey: true }
[Supabase Config] Variables cargadas: { hasUrl: true, hasKey: true, ... }
```

#### ❌ Mensajes de ERROR que podrías ver:
```
Error: ...
TypeError: ...
ReferenceError: ...
Cannot find module: ...
supabaseUrl is required: ...
```

### Paso 4: Si NO Aparecen Logs

Si haces la petición pero **no aparecen nuevos logs**, puede significar:

1. **El error ocurre antes de que se ejecute el código** (muy temprano)
2. **El error ocurre en el cliente** (navegador), no en el servidor
3. **Los logs no se están mostrando en tiempo real**

### Paso 5: Alternativa - Ver Error en el Navegador

Si los logs no muestran nada:

1. Abre las **herramientas de desarrollador** (F12)
2. Ve a la pestaña **"Console"**
3. Intenta acceder a `https://cot.piwisuite.cl`
4. **¿Qué errores aparecen en la consola?** (copia todos los errores)

### Paso 6: Ver el Response del Error

1. En las herramientas de desarrollador (F12)
2. Ve a la pestaña **"Network"**
3. Recarga la página (F5)
4. Haz clic en la petición a `cot.piwisuite.cl` (la que muestra 500)
5. Ve a la pestaña **"Response"** o **"Preview"**
6. **¿Qué mensaje de error muestra?** (copia el contenido completo)

## 🔍 Información Necesaria

Para diagnosticar el problema, necesito:

1. **Logs de Easypanel** cuando haces la petición (si aparecen)
2. **Errores en la consola del navegador** (F12 → Console)
3. **Response body** del error 500 (F12 → Network → Response)

Con esa información podré identificar el problema específico y solucionarlo.

## 💡 Nota Importante

Si los logs no muestran nada cuando haces la petición, el problema puede ser:
- Un error muy temprano en el proceso de renderizado
- Un error en el middleware
- Un error en la configuración de Next.js

En ese caso, los errores deberían aparecer en la consola del navegador o en el Response body.

