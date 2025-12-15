# Solución: Configuración DNS para cot.piwisuite.cl

## ✅ SOLUCIÓN CORRECTA

**URL pública de Easypanel**: `tku18l.easypanel.host`

**En Cloudflare, configura el CNAME así:**

```
Type: CNAME
Name: cot
Content: tku18l.easypanel.host
Proxy: Proxied (nube naranja)
TTL: Auto
```

## 🔴 Problema Actual

1. **En Cloudflare**: CNAME apunta a `piwisuite.cl` (INCORRECTO - crea un loop)
2. **Necesitas cambiar**: El Content del CNAME a `tku18l.easypanel.host`

## ✅ Solución: Configuración Correcta

### Opción 1: Usar el Dominio de Easypanel Directamente (Recomendado)

Si Easypanel ya tiene configurado `cot.piwisuite.cl` y te muestra esa URL, entonces:

**En Cloudflare, configura así:**

```
Type: CNAME
Name: cot
Content: [DEJAR VACÍO O USAR EL HOSTNAME DE EASYPANEL]
Proxy: Proxied (nube naranja)
TTL: Auto
```

**PERO ESPERA**: Si Easypanel ya maneja el dominio `cot.piwisuite.cl`, puede que necesites:

### Opción 2: Easypanel con Reverse Proxy

Si Easypanel está usando un reverse proxy o load balancer, necesitas encontrar la IP o hostname real.

**Pasos:**

1. **En Easypanel**, busca:
   - Sección "Networking" o "Network"
   - Sección "Ingress" o "Load Balancer"
   - Sección "Services" > busca el servicio y mira su configuración de red
   - Puede haber una IP pública o un hostname tipo `lb.easypanel.host` o similar

2. **Si encuentras una IP pública**, usa un registro **A**:
   ```
   Type: A
   Name: cot
   Content: [IP PÚBLICA]
   Proxy: Proxied
   TTL: Auto
   ```

3. **Si encuentras un hostname**, usa un registro **CNAME**:
   ```
   Type: CNAME
   Name: cot
   Content: [HOSTNAME DE EASYPANEL - ej: lb.easypanel.host]
   Proxy: Proxied
   TTL: Auto
   ```

### Opción 3: Easypanel con Dominio Personalizado (Ya Configurado)

Si Easypanel ya tiene `cot.piwisuite.cl` configurado y funcionando, entonces:

**En Cloudflare, puedes:**

1. **Opción A**: Dejar el CNAME apuntando al hostname de Easypanel (si lo proporciona)
2. **Opción B**: Usar un registro A con la IP del servidor de Easypanel
3. **Opción C**: Si Easypanel maneja todo, puede que solo necesites verificar el DNS

## 🔍 Cómo Encontrar la Información en Easypanel

### Busca en Easypanel:

1. **Panel Principal de la Aplicación**:
   - Ve a tu aplicación `cotizadorpiwisuite`
   - Busca sección "Network", "Networking", "Ingress", o "Load Balancer"
   - Busca "External IP" o "Public IP"
   - Busca "Hostname" o "Public Hostname"

2. **Sección "Domains"**:
   - Ve a "Domains" o "Custom Domains"
   - Puede mostrar instrucciones de DNS
   - Puede mostrar el hostname o IP a la que debe apuntar

3. **Sección "Settings" o "Configuration"**:
   - Busca configuración de red
   - Busca información de ingress o reverse proxy

4. **Logs o Info**:
   - Revisa los logs de la aplicación
   - Puede mostrar la IP o hostname real

## 🛠️ Solución Temporal: Probar con IP Pública

Si no encuentras la información, puedes:

1. **Obtener la IP del servidor de Easypanel**:
   ```bash
   # Desde terminal, prueba:
   nslookup cot.piwisuite.cl
   # O
   dig cot.piwisuite.cl
   ```

2. **O contactar a Easypanel**:
   - Revisa la documentación de Easypanel sobre dominios personalizados
   - Puede haber una sección específica sobre DNS

## ⚠️ IMPORTANTE: No uses piwisuite.cl en el CNAME

**NUNCA** pongas `piwisuite.cl` como Content en un CNAME para `cot.piwisuite.cl` porque:
- Crea un loop DNS
- No resuelve correctamente
- Puede causar problemas de rendimiento

## 📋 Checklist de Verificación

- [ ] Encontrar IP pública o hostname de Easypanel
- [ ] Configurar registro A o CNAME correcto en Cloudflare
- [ ] Verificar que el Proxy esté en "Proxied" (nube naranja)
- [ ] Esperar propagación DNS (5-60 minutos)
- [ ] Verificar que `cot.piwisuite.cl` funcione
- [ ] Verificar certificado SSL (debe ser automático con Cloudflare)

## 🆘 Si Nada Funciona

1. **Contacta soporte de Easypanel**: Pueden darte la IP o hostname exacto
2. **Revisa documentación**: Busca "custom domain" o "DNS configuration" en docs de Easypanel
3. **Prueba sin Proxy**: Temporalmente, cambia a "DNS only" (gris) en Cloudflare para ver si es problema del proxy

