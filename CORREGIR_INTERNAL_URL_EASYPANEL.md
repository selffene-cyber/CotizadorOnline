# 🔧 Corregir Internal URL en Easypanel

## ❌ Problema Actual

La Internal URL está configurada como:
```
https://piwisuite_cotizadorpiwisuite_app-prod:3000/
```

## ✅ Configuración Correcta

Debe ser:
```
http://app-prod:3000/
```

**Diferencias:**
- ❌ `https://` → ✅ `http://` (dentro de la red interna de Docker se usa HTTP)
- ❌ `piwisuite_cotizadorpiwisuite_app-prod` → ✅ `app-prod` (solo el nombre del servicio)

## 🔍 Cómo Editar el Dominio en Easypanel

### Opción 1: Desde la Pestaña "Dominios"

1. En Easypanel, ve a tu servicio `piwisuite / cotizadorpiwisuite`
2. Ve a la pestaña **"Dominios"** (en el menú lateral)
3. Deberías ver el dominio `cot.piwisuite.cl` listado
4. **Haz clic en el icono de lápiz (editar)** que está a la derecha del dominio
5. Se abrirá un formulario o modal para editar
6. Cambia la **Internal URL** a: `http://app-prod:3000/`
7. Guarda los cambios

### Opción 2: Si No Aparece el Icono de Editar

1. En la pestaña "Dominios", busca el dominio `cot.piwisuite.cl`
2. Puede haber un botón **"Edit"** o **"Editar"** en algún lugar
3. O puede que necesites hacer clic directamente en el dominio para editarlo

### Opción 3: Eliminar y Recrear el Dominio

Si no puedes editar el dominio:

1. En la pestaña "Dominios", haz clic en el **icono de basura (eliminar)** del dominio `cot.piwisuite.cl`
2. Confirma la eliminación
3. Haz clic en **"Agregar dominio"** o **"Add Domain"**
4. Configura:
   - **External URL**: `https://cot.piwisuite.cl/`
   - **Internal URL**: `http://app-prod:3000/`
5. Guarda los cambios

### Opción 4: Verificar la Configuración del Servicio

Si no encuentras la opción de editar dominios:

1. En Easypanel, ve a tu servicio
2. Ve a la pestaña **"Settings"** o **"Config"** o **"Ajustes"**
3. Busca una sección de **"Networking"** o **"Domains"**
4. Puede estar ahí la configuración del dominio

## 🔍 Verificar el Nombre Correcto del Servicio

Para confirmar el nombre correcto del servicio:

1. En Easypanel, ve a tu servicio
2. Ve a la pestaña **"Fuente"** o **"Source"**
3. Abre el archivo `docker-compose.yml`
4. Busca la línea `services:` y luego el nombre del servicio
5. Debería ser `app-prod:`

## 📋 Configuración Final Esperada

Después de corregir, el dominio debería estar configurado así:

```
External URL: https://cot.piwisuite.cl/
Internal URL: http://app-prod:3000/
```

**NOTA IMPORTANTE:**
- ✅ Usa `http://` (no `https://`) para la Internal URL
- ✅ Usa solo `app-prod` (no el nombre completo del contenedor)
- ✅ El puerto debe ser `3000`

## 🚀 Después de Corregir

1. Guarda los cambios
2. Espera 30 segundos
3. Intenta acceder a `https://cot.piwisuite.cl`
4. Debería funcionar correctamente

## 💡 Si Aún No Puedes Editar

Si después de intentar todas las opciones no puedes editar el dominio:

1. **Toma una captura de pantalla** de la sección "Dominios" en Easypanel
2. **Comparte la captura** para que pueda ver exactamente qué opciones tienes disponibles
3. Puede que haya una forma diferente de editar en tu versión de Easypanel

