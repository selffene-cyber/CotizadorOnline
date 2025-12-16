# 🔧 Solución Error 1016 - Origin DNS Error

## Problema
Cloudflare no puede resolver el dominio de origen porque el CNAME está apuntando a un dominio incorrecto o inexistente.

## Solución: Obtener la URL Pública de Easypanel

### Paso 1: Obtener la URL Pública en Easypanel

Tienes dos opciones para encontrar la URL pública:

#### Opción A: Desde la sección "Panel" o "Overview"

1. En Easypanel, ve a la sección **"Panel"** (icono de casa)
2. Busca tu servicio `piwisuite_cotizadorpiwisuite` o `CotizadorPiwiSuite`
3. Haz clic en el servicio para ver sus detalles
4. Busca una sección que muestre:
   - **"Public URL"** o **"Access URL"**
   - **"External Access"**
   - **"Ingress"** o **"Network"**
   - Debería ser algo como: `tu-servicio-xxxxx.easypanel.host` o una IP pública

#### Opción B: Desde la sección "Dominios"

1. En Easypanel, ve a **"Dominios"**
2. Haz clic en el dominio `cot.piwisuite.cl`
3. En la configuración del dominio, busca:
   - **"Origin"** o **"Target"**
   - **"Backend URL"** o **"Upstream"**
   - Puede mostrar la URL pública que Easypanel usa internamente

#### Opción C: Verificar el servicio directamente

1. En Easypanel, ve a **"Panel"**
2. Busca tu servicio y haz clic en él
3. Ve a la pestaña **"Settings"** o **"Config"**
4. Busca la sección de **"Networking"** o **"Network"**
5. Debería mostrar la URL pública o el hostname

### Paso 2: Configurar el CNAME en Cloudflare

Una vez que tengas la URL pública de Easypanel (ejemplo: `tku18l.easypanel.host` o similar):

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Selecciona el dominio `piwisuite.cl`
3. Ve a **DNS** > **Records**
4. **Edita** el registro CNAME existente para `cot`
5. Configura así:

```
Type:     CNAME
Name:     cot
Content:  [URL PÚBLICA DE EASYPANEL]  ← Aquí va la URL que encontraste
Proxy:    Proxied (nube naranja)  ← Debe estar activado
TTL:      Auto
```

**Ejemplos de Content válidos:**
- `tku18l.easypanel.host` (si es el hostname de Easypanel)
- `lb.easypanel.host` (si Easypanel usa un load balancer)
- Cualquier hostname que Easypanel te proporcione

**❌ NO uses:**
- `piwisuite.cl` (crea un loop)
- `panel.piwisuite.cl` (ese es para el panel, no tu app)
- `cot.piwisuite.cl` (ese es tu dominio, no el origen)

### Paso 3: Verificar la configuración en Easypanel

1. En Easypanel, ve a **"Dominios"**
2. Verifica que `cot.piwisuite.cl` esté configurado así:
   - **External URL**: `https://cot.piwisuite.cl/`
   - **Internal URL**: `http://piwisuite_cotizadorpiwisuite:3000/` ✅

### Paso 4: Esperar propagación DNS

Después de cambiar el CNAME en Cloudflare:
- Espera **5-15 minutos** para la propagación DNS
- Puedes verificar el estado en Cloudflare (debería mostrar "Active")

## 🔍 Si no encuentras la URL pública

Si no encuentras la URL pública en Easypanel, puedes:

1. **Contactar a Easypanel**: Revisa su documentación o soporte
2. **Verificar logs**: En Easypanel, revisa los logs del servicio para ver qué URL está usando
3. **Usar una IP pública**: Si Easypanel te proporciona una IP pública, usa un registro **A** en lugar de CNAME:
   ```
   Type:     A
   Name:     cot
   Content:  [IP PÚBLICA]
   Proxy:    Proxied
   TTL:      Auto
   ```

## ✅ Verificación Final

Después de configurar el CNAME correctamente:

1. Espera 5-15 minutos
2. Intenta acceder a `https://cot.piwisuite.cl`
3. Si aún hay error, verifica:
   - Que el servicio esté corriendo en Easypanel
   - Que el puerto sea 3000 (no 80)
   - Que las variables de entorno estén configuradas
   - Los logs del servicio en Easypanel

## 📝 Notas Importantes

- El **Proxy** en Cloudflare debe estar **activado** (nube naranja) para SSL/TLS
- El **Content** del CNAME debe ser el hostname de Easypanel, NO tu dominio personalizado
- `panel.piwisuite.cl` es solo para el panel de administración, no para tu aplicación

