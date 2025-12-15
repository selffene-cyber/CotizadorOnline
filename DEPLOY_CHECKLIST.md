# Checklist Pre-Deploy - Cotizador.PiwiSuite

## ⚠️ IMPORTANTE: Antes de hacer Deploy

### 1. ✅ Corrección del CNAME en Cloudflare

**PROBLEMA ACTUAL**: El CNAME está apuntando a `piwisuite.cl` (INCORRECTO)

**SOLUCIÓN**: Necesitas encontrar la **URL pública de Easypanel** y actualizar el CNAME.

#### Pasos:

1. **En Easypanel**, busca en tu aplicación:
   - Sección "Overview" o "Details"
   - Busca la URL pública (debería ser algo como: `tu-app.easypanel.host` o una IP pública)
   - **NO uses** la URL interna `piwisuite_cotizadorpiwisuite:80`

2. **En Cloudflare**, corrige el CNAME:
   - Type: `CNAME`
   - Name: `cot`
   - Content: `[URL PÚBLICA DE EASYPANEL]` ← **Aquí va la URL pública, NO piwisuite.cl**
   - Proxy status: `Proxied` (está bien)
   - TTL: `Auto`

3. **Alternativa**: Si Easypanel te da una IP pública, usa un registro **A**:
   - Type: `A`
   - Name: `cot`
   - Content: `[IP PÚBLICA]`
   - Proxy status: `Proxied`
   - TTL: `Auto`

### 2. ✅ Variables de Entorno en Easypanel

Asegúrate de que todas estas variables estén configuradas en Easypanel:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDSOkK2VejNdwCb7CYTWqj0BZFeZriwbLc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cotizadorpiwisuite.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cotizadorpiwisuite
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cotizadorpiwisuite.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=415072535894
NEXT_PUBLIC_FIREBASE_APP_ID=1:415072535894:web:52b4f8b34502f3d08dc2f7
NODE_ENV=production
```

### 3. ✅ Configuración del Dominio en Easypanel

Después de corregir el CNAME en Cloudflare:

1. En Easypanel, ve a tu aplicación
2. Sección "Domains" o "Custom Domain"
3. Agrega: `cot.piwisuite.cl`
4. Espera a que Easypanel verifique el DNS (puede tomar unos minutos)

### 4. ✅ Configuración en Firebase Auth

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Proyecto: `cotizadorpiwisuite`
3. Authentication > Settings > Authorized domains
4. Agrega: `cot.piwisuite.cl`

### 5. ✅ Puerto y Recursos en Easypanel

- Port: `3000`
- CPU: Mínimo 0.5 cores (recomendado 1 core)
- Memory: Mínimo 512MB (recomendado 1GB)

## ✅ Todo está listo en el código

- ✅ Dockerfile configurado
- ✅ docker-compose.yml listo
- ✅ next.config.ts con output: 'standalone'
- ✅ Variables de entorno documentadas
- ✅ Firebase configurado
- ✅ Git listo para commit y push

## 🚀 Orden de Acción

1. **Primero**: Encuentra la URL pública de Easypanel
2. **Segundo**: Corrige el CNAME en Cloudflare
3. **Tercero**: Configura el dominio en Easypanel
4. **Cuarto**: Hacemos commit y push a GitHub
5. **Quinto**: Deploy en Easypanel

## ❓ ¿Dónde encontrar la URL pública de Easypanel?

La URL pública de Easypanel normalmente está en:
- Panel principal de la aplicación
- Sección "Overview" o "Info"
- Puede ser algo como: `app-123.easypanel.host` o una IP pública
- También puede aparecer en la sección "Domains" antes de agregar un dominio personalizado

