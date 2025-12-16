# 🔧 Solución: Servicio Corriendo pero Error 503

## ✅ Estado Actual

- ✅ El servicio está corriendo correctamente (`✓ Ready in 182ms`)
- ✅ El servidor está escuchando en el puerto 3000 (`http://0.0.0.0:3000`)
- ✅ Las variables de entorno están configuradas correctamente
- ❌ Pero sigue dando error 503

## 🔍 Problema Identificado

El servicio está corriendo, pero el proxy (Easypanel/Traefik) no puede alcanzarlo. Esto generalmente se debe a:

1. **Nombre del servicio incorrecto** en la configuración del dominio
2. **Puerto incorrecto** en la configuración del dominio
3. **El dominio no está correctamente vinculado** al servicio

## ✅ Solución: Verificar y Corregir Configuración del Dominio

### Paso 1: Verificar el Nombre Correcto del Servicio

En los logs, el contenedor se llama: `app-prod-1`

Pero el nombre del servicio en Easypanel puede ser diferente. Necesitas verificar el nombre exacto.

**Opciones del nombre del servicio:**
- `piwisuite_cotizadorpiwisuite-app-prod`
- `piwisuite_cotizadorpiwisuite_app-prod`
- `app-prod`
- `cotizadorpiwisuite-app-prod`

### Paso 2: Verificar Configuración del Dominio en Easypanel

1. En Easypanel, ve a tu servicio `piwisuite / cotizadorpiwisuite`
2. Ve a la pestaña **"Dominios"** (en el menú lateral)
3. Verifica la configuración de `cot.piwisuite.cl`:

**Configuración CORRECTA debería ser:**

```
External URL: https://cot.piwisuite.cl/
Internal URL: http://piwisuite_cotizadorpiwisuite-app-prod:3000/
```

O si el nombre del servicio es diferente:

```
External URL: https://cot.piwisuite.cl/
Internal URL: http://app-prod:3000/
```

**⚠️ IMPORTANTE:**
- El nombre del servicio en "Internal URL" debe coincidir EXACTAMENTE con el nombre del servicio en docker-compose.yml
- El puerto debe ser **3000** (no 80)
- No debe haber espacios ni caracteres especiales

### Paso 3: Obtener el Nombre Exacto del Servicio

Para encontrar el nombre exacto del servicio:

1. En Easypanel, ve a tu servicio
2. Ve a la pestaña **"Fuente"** (Source) o **"Config"**
3. Busca el archivo `docker-compose.yml`
4. El nombre del servicio está en la línea `services:` → `app-prod:`
5. Easypanel puede agregar un prefijo como `piwisuite_cotizadorpiwisuite-` o `piwisuite_cotizadorpiwisuite_`

**O también puedes:**
1. En los logs, el contenedor se llama `app-prod-1`
2. El nombre del servicio (sin el `-1`) debería ser el que uses en la Internal URL

### Paso 4: Editar el Dominio

1. En Easypanel, ve a **"Dominios"**
2. Haz clic en el **icono de lápiz (editar)** del dominio `cot.piwisuite.cl`
3. Verifica/Corrige la **Internal URL**:

**Si el nombre del servicio es `app-prod`:**
```
http://app-prod:3000/
```

**Si el nombre del servicio es `piwisuite_cotizadorpiwisuite-app-prod`:**
```
http://piwisuite_cotizadorpiwisuite-app-prod:3000/
```

**Si el nombre del servicio usa guiones bajos:**
```
http://piwisuite_cotizadorpiwisuite_app-prod:3000/
```

4. Guarda los cambios

### Paso 5: Verificar que el Dominio Esté Activo

Después de corregir la Internal URL:

1. El dominio debería mostrar estado **"Active"** o **"Verified"**
2. Si muestra error, verifica:
   - Que el nombre del servicio sea correcto
   - Que el puerto sea 3000
   - Que no haya espacios o caracteres especiales

### Paso 6: Reiniciar el Servicio (Opcional)

Si después de corregir el dominio sigue el error:

1. En Easypanel, ve a tu servicio
2. Haz clic en **"Stop"**
3. Espera 10 segundos
4. Haz clic en **"Start"** o **"Deploy"**
5. Espera 1-2 minutos
6. Intenta acceder a `https://cot.piwisuite.cl`

## 🔍 Cómo Encontrar el Nombre Exacto del Servicio

### Opción 1: Desde los Logs

En los logs, el contenedor se llama `app-prod-1`. El nombre del servicio (sin el `-1`) es lo que necesitas.

### Opción 2: Desde docker-compose.yml

1. En Easypanel, ve a **"Fuente"** (Source)
2. Abre `docker-compose.yml`
3. Busca la línea `services:` y luego el nombre del servicio (ej: `app-prod:`)
4. Easypanel puede agregar un prefijo basado en el nombre del proyecto

### Opción 3: Desde la Configuración del Servicio

1. En Easypanel, ve a tu servicio
2. Ve a **"Settings"** o **"Config"**
3. Busca información sobre el nombre del servicio o contenedor

## 📋 Checklist de Verificación

- [ ] El servicio está corriendo (logs muestran "Ready")
- [ ] El dominio está configurado en Easypanel
- [ ] La Internal URL usa el nombre correcto del servicio
- [ ] La Internal URL usa el puerto 3000
- [ ] El dominio muestra estado "Active" o "Verified"
- [ ] Se reinició el servicio después de corregir el dominio

## 💡 Información Necesaria

Para ayudarte mejor, necesito saber:

1. **¿Qué muestra la sección "Dominios" en Easypanel?**
   - ¿Cuál es la Internal URL actual?
   - ¿Qué estado muestra el dominio? (Active/Error/Pending)

2. **¿Puedes ver el archivo docker-compose.yml en Easypanel?**
   - ¿Cuál es el nombre exacto del servicio?

3. **¿Hay algún error en la sección "Dominios"?**
   - ¿Muestra algún mensaje de error específico?

