# ✅ Solución Final: Internal URL Automática en Easypanel

## 🔍 Problema

Easypanel está generando automáticamente la Internal URL como:
```
https://piwisuite_cotizadorpiwisuite_app-prod:3000/
```

Y no puedes editarla manualmente. Además, está usando `https://` cuando debería ser `http://`.

## ✅ Solución: Usar el Nombre que Easypanel Genera

Si Easypanel genera automáticamente la Internal URL, debemos usar el nombre que está generando, pero cambiando `https://` por `http://`.

### Opción 1: Eliminar y Recrear el Dominio con HTTP

1. En Easypanel, ve a **"Dominios"**
2. **Elimina** el dominio `cot.piwisuite.cl` (icono de basura)
3. Haz clic en **"Agregar dominio"** o **"Add Domain"**
4. Configura:
   - **External URL**: `https://cot.piwisuite.cl/`
   - **Internal URL**: `http://piwisuite_cotizadorpiwisuite_app-prod:3000/` ✅
     - Nota: Usa `http://` (no `https://`)
     - Nota: Usa el nombre completo que Easypanel genera
5. Guarda los cambios

### Opción 2: Si Easypanel No Permite Especificar la Internal URL

Si Easypanel no te permite especificar la Internal URL al crear el dominio:

1. **Déjalo que lo genere automáticamente**
2. Luego, si es posible, **edítalo** para cambiar `https://` por `http://`
3. O contacta al soporte de Easypanel para que te permitan editarlo

### Opción 3: Verificar si Easypanel Acepta HTTP Internamente

Puede que Easypanel esté usando `https://` pero internamente lo convierta a `http://`. En ese caso:

1. **Deja la Internal URL como está** (`https://piwisuite_cotizadorpiwisuite_app-prod:3000/`)
2. Verifica si funciona así
3. Si no funciona, entonces necesitas cambiarlo a `http://`

## 🔍 Verificar el Nombre Exacto

Para confirmar el nombre exacto que Easypanel está usando:

1. En Easypanel, ve a tu servicio
2. Ve a la pestaña **"Fuente"** o **"Source"**
3. Abre `docker-compose.yml`
4. El servicio se llama `app-prod`
5. Easypanel está agregando el prefijo `piwisuite_cotizadorpiwisuite_` automáticamente

## ✅ Prueba Esta Configuración

Intenta crear el dominio con esta Internal URL:

```
http://piwisuite_cotizadorpiwisuite_app-prod:3000/
```

**Importante:**
- ✅ Usa `http://` (no `https://`)
- ✅ Usa el nombre completo que Easypanel genera
- ✅ El puerto es `3000`

## 🚀 Después de Configurar

1. Guarda los cambios
2. Espera 30 segundos
3. Intenta acceder a `https://cot.piwisuite.cl`
4. Debería funcionar correctamente

## 💡 Si Aún No Funciona

Si después de intentar esto sigue sin funcionar:

1. **Verifica que el servicio esté corriendo** (debe mostrar "Running")
2. **Verifica las variables de entorno** (deben estar configuradas)
3. **Revisa los logs** para ver si hay errores de conexión
4. **Intenta acceder directamente** a la IP del servidor (si es posible) para verificar que el servicio responde

