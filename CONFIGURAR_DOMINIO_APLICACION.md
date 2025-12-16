# Configurar Dominio de la Aplicación en Easypanel

## ⚠️ IMPORTANTE: Dos Dominios Diferentes

- **`panel.piwisuite.cl`** → Panel de administración de Easypanel (ya configurado)
- **`cot.piwisuite.cl`** → Tu aplicación Cotizador (necesitas configurarlo)

## 📋 Pasos para Configurar `cot.piwisuite.cl`

### Paso 1: En Easypanel - Agregar Dominio a la Aplicación

1. **Ve a tu aplicación** `cotizadorpiwisuite` en Easypanel
   - NO vayas a la configuración del panel
   - Ve específicamente a la aplicación

2. **Busca la sección "Domains" o "Custom Domain"**
   - Debería estar en la página de configuración de la aplicación
   - Puede estar en "Settings", "Networking", o "Domains"

3. **Haz clic en "Add Domain" o "Add Custom Domain"**

4. **Ingresa el dominio**: `cot.piwisuite.cl`

5. **Easypanel verificará el DNS automáticamente**
   - Debería mostrar: "DNS Verified" o "Active"
   - Si muestra error, verifica el CNAME en Cloudflare

### Paso 2: En Cloudflare - Configurar CNAME

1. **Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/)**

2. **Selecciona el dominio** `piwisuite.cl`

3. **Ve a DNS > Records**

4. **Busca o crea el registro CNAME para `cot`**

5. **Configura así:**
   ```
   Type:     CNAME
   Name:     cot
   Content:  tku18l.easypanel.host
   Proxy:    Proxied (nube naranja) ✅
   TTL:      Auto
   ```

6. **Guarda los cambios**

### Paso 3: Verificar en Easypanel

Después de configurar el CNAME en Cloudflare:

1. **Vuelve a Easypanel** → Tu aplicación → Domains
2. **Easypanel debería detectar** que el DNS está configurado
3. **Espera 5-15 minutos** para que Easypanel genere el certificado SSL
4. **El estado debería cambiar a "Active"**

## 🔍 Cómo Encontrar la Sección de Dominios en Easypanel

### Opción A: En la Página de la Aplicación

1. Ve a tu proyecto en Easypanel
2. Haz clic en la aplicación `cotizadorpiwisuite`
3. Busca en el menú lateral o en la parte superior:
   - "Domains"
   - "Custom Domain"
   - "Networking"
   - "Settings" → "Domains"

### Opción B: En la Configuración

1. En la página de la aplicación
2. Busca un botón o pestaña "Settings" o "Configure"
3. Dentro, busca "Domains" o "Custom Domain"

## ✅ Checklist

- [ ] CNAME en Cloudflare: `cot` → `tku18l.easypanel.host`
- [ ] Dominio `cot.piwisuite.cl` agregado en Easypanel (en la aplicación, NO en el panel)
- [ ] Estado en Easypanel: "DNS Verified" o "Active"
- [ ] Variables de entorno configuradas en Easypanel
- [ ] Esperar 5-15 minutos para propagación DNS y SSL

## 🐛 Si No Encuentras la Sección de Dominios

Si no encuentras dónde agregar el dominio en Easypanel:

1. **Verifica que la aplicación esté desplegada**
2. **Busca en la documentación de Easypanel** sobre dominios personalizados
3. **Puede que necesites** una versión específica de Easypanel o un plan que lo permita
4. **Alternativa**: Contacta el soporte de Easypanel

## 📞 Información que Necesito

Si sigues teniendo problemas, comparte:

1. **¿Ves la sección "Domains" en tu aplicación en Easypanel?**
2. **¿Qué opciones ves en la configuración de la aplicación?**
3. **¿El CNAME en Cloudflare está configurado correctamente?**
4. **¿Qué error específico ves cuando accedes a `cot.piwisuite.cl`?**

