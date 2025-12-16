# ✅ Corregir Dominio en el Modal de Easypanel

## 🔍 Problema Identificado

En el modal "Actualizar dominio", veo que:
- **Protocolo**: Está en **HTTPS** ❌ (debe ser HTTP)
- **Puerto**: 3000 ✅ (correcto)
- **Compose Service**: app-prod ✅ (correcto)

## ✅ Solución: Cambiar el Protocolo en el Modal

### Paso 1: Abrir el Modal de Edición

1. En Easypanel, ve a tu servicio `piwisuite / cotizadorpiwisuite`
2. Ve a la pestaña **"Dominios"**
3. Haz clic en el **icono de lápiz (editar)** del dominio `cot.piwisuite.cl`
4. Se abrirá el modal "Actualizar dominio"

### Paso 2: Cambiar el Protocolo

En el modal, en la sección **"Destino"**:

1. **Protocolo**: Cambia de **HTTPS** a **HTTP** ✅
   - Haz clic en el dropdown "Protocolo"
   - Selecciona **HTTP** (no HTTPS)

2. **Puerto**: Debe estar en **3000** ✅ (ya está correcto)

3. **Compose Service**: Debe estar en **app-prod** ✅ (ya está correcto)

### Paso 3: Guardar

1. Haz clic en el botón verde **"Guardar"** en la parte inferior del modal
2. Espera 30 segundos
3. Intenta acceder a `https://cot.piwisuite.cl`

## 📋 Configuración Correcta en el Modal

Después de corregir, el modal debería mostrar:

**Sección "Destino":**
- **Protocolo**: HTTP ✅ (no HTTPS)
- **Puerto**: 3000 ✅
- **Ruta**: / ✅
- **Compose Service**: app-prod ✅

**Sección "HTTPS":**
- **HTTPS**: Activado ✅ (esto es para el External URL, está bien)

## 🔍 Explicación

- **HTTPS en "HTTPS"**: Está bien, es para el External URL (`https://cot.piwisuite.cl`)
- **HTTP en "Protocolo"**: Es para la comunicación interna entre servicios Docker (Internal URL)
- **Compose Service**: `app-prod` es el nombre correcto del servicio en docker-compose.yml

## 🚀 Después de Corregir

1. El dominio debería funcionar correctamente
2. El error 500 debería desaparecer (si era causado por el protocolo incorrecto)
3. Si aún hay error 500, entonces el problema es otro (variables de entorno, etc.)

## 💡 Nota Importante

**NO edites el docker-compose.yml directamente en Easypanel** si quieres mantener la conexión con Git. El docker-compose.yml está bien como está. El problema es solo la configuración del dominio.

