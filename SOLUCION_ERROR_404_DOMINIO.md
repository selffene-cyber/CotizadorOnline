# 🔧 Solución: Error 404 Not Found

## ✅ Estado Actual

- ❌ Error 404 al acceder a `cot.piwisuite.cl`
- ❌ HTTPS desactivado en Easypanel
- ❌ Proxy de Cloudflare desactivado

## 🔍 Problema Identificado

El error 404 significa que:
- El dominio está apuntando al servidor ✅
- Pero Easypanel no está enrutando correctamente las peticiones ❌

## ✅ Solución: Configurar Correctamente el Dominio

### Paso 1: Verificar la Configuración del Dominio en Easypanel

1. En Easypanel, ve a **"Dominios"** o **"Domains"**
2. Busca `cot.piwisuite.cl` y haz clic en **"Editar"** (icono de lápiz)
3. Verifica la configuración en el modal:

#### Configuración Correcta:

**Sección "HTTPS":**
- **HTTPS**: Activado ✅ (debe estar ON)
- **Host**: `cot.piwisuite.cl`
- **Ruta**: `/`

**Sección "Destino":**
- **Protocolo**: `HTTP` (no HTTPS)
- **Puerto**: `3000`
- **Ruta**: `/`
- **Compose Service**: `piwisuite_cotizadorpiwisuite_app-prod` (nombre completo)

### Paso 2: Reactivar el Proxy de Cloudflare

El proxy de Cloudflare es necesario para:
- ✅ HTTPS automático
- ✅ Protección DDoS
- ✅ Mejor rendimiento

1. En Cloudflare, ve a **DNS**
2. Busca el registro para `cot.piwisuite.cl`
3. Haz clic en el icono de nube (proxy) para activarlo
4. Debería estar **naranja** (proxied) no **gris** (DNS only)

### Paso 3: Verificar el DNS en Cloudflare

El registro DNS debe ser:

**Tipo**: `A` o `CNAME`
**Nombre**: `cot`
**Contenido**: La IP del servidor de Easypanel (o el dominio de Easypanel)
**Proxy**: Activado (naranja) ✅

### Paso 4: Verificar que el Servicio Esté Corriendo

1. En Easypanel, ve a tu servicio `piwisuite / cotizadorpiwisuite`
2. Verifica que el estado sea **"Running"** (verde)
3. Si no está corriendo, haz clic en **"Start"** o **"Reiniciar"**

## 🔍 Verificación Adicional

### Verificar el Internal URL

En el modal de edición del dominio, el **Internal URL** debe ser exactamente:

```
http://piwisuite_cotizadorpiwisuite_app-prod:3000/
```

**NO debe ser:**
- ❌ `http://app-prod:3000/` (nombre corto)
- ❌ `http://localhost:3000/` (localhost no funciona)
- ❌ `https://piwisuite_cotizadorpiwisuite_app-prod:3000/` (HTTPS interno)

### Verificar el Nombre del Servicio

Para verificar el nombre exacto del servicio:

1. En Easypanel, ve a tu servicio
2. Busca el nombre en la parte superior o en la configuración
3. O revisa los logs - el nombre del contenedor aparece como `app-prod-1`

## 📋 Checklist de Verificación

Antes de probar nuevamente:

- [ ] HTTPS está activado en Easypanel (para el External URL)
- [ ] El Internal URL es `http://piwisuite_cotizadorpiwisuite_app-prod:3000/`
- [ ] El protocolo interno es HTTP (no HTTPS)
- [ ] El puerto es 3000
- [ ] La ruta es `/` (sin espacios)
- [ ] El Compose Service es el nombre completo del servicio
- [ ] El proxy de Cloudflare está activado (naranja)
- [ ] El servicio está en estado "Running"
- [ ] El DNS en Cloudflare está configurado correctamente

## 💡 Nota Importante

**NO desactives el proxy de Cloudflare** - es necesario para:
- HTTPS automático
- Protección
- Mejor rendimiento

El proxy de Cloudflare debe estar **activado** (naranja) para que funcione correctamente.

## 🚀 Próximos Pasos

1. **Reactiva HTTPS en Easypanel** (para el External URL)
2. **Reactiva el proxy de Cloudflare** (naranja)
3. **Verifica que el Internal URL sea correcto** (`http://piwisuite_cotizadorpiwisuite_app-prod:3000/`)
4. **Guarda los cambios** en Easypanel
5. **Espera 1-2 minutos** para que los cambios se propaguen
6. **Prueba nuevamente** `https://cot.piwisuite.cl`

