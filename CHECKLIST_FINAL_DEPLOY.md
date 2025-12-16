# ✅ Checklist Final - Deploy en Easypanel

## ✅ Ya Completado

- [x] CNAME en Cloudflare corregido (apunta a `tku18l.easypanel.host`)
- [x] Código subido a GitHub
- [x] Dockerfile y docker-compose.yml configurados
- [x] Variables de entorno documentadas

## 📋 Antes de Hacer Deploy

### 1. Variables de Entorno en Easypanel

En la sección **"Environment Variables"** de Easypanel, asegúrate de tener:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDSOkK2VejNdwCb7CYTWqj0BZFeZriwbLc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cotizadorpiwisuite.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cotizadorpiwisuite
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cotizadorpiwisuite.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=415072535894
NEXT_PUBLIC_FIREBASE_APP_ID=1:415072535894:web:52b4f8b34502f3d08dc2f7
NODE_ENV=production
```

✅ **Puedes copiarlas directamente de `easypanel.env`**

### 2. Configuración del Repositorio en Easypanel

Verifica que esté configurado:
- **Repository URL**: `https://github.com/selffene-cyber/CotizadorOnline.git` (o SSH si es privado)
- **Branch**: `main`
- **App Type**: `Docker Compose`
- **Docker Compose File**: `docker-compose.yml`
- **Service**: `app-prod`

### 3. Puerto y Recursos

- **Port**: `3000`
- **CPU**: 1 core (recomendado)
- **Memory**: 1GB (recomendado)

### 4. Dominio en Easypanel

- Verifica que `cot.piwisuite.cl` esté agregado en la sección "Domains"
- Espera a que Easypanel verifique el DNS (puede tomar unos minutos)

### 5. Firebase Auth (Opcional pero Recomendado)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Proyecto: `cotizadorpiwisuite`
3. Authentication > Settings > Authorized domains
4. Agrega: `cot.piwisuite.cl`

## 🚀 Hacer Deploy

1. En Easypanel, ve a tu aplicación
2. Haz clic en **"Deploy"** o **"Save & Deploy"**
3. Espera a que termine el build (puede tomar varios minutos la primera vez)
4. Revisa los logs si hay algún error

## ✅ Después del Deploy

1. Espera 5-15 minutos para propagación DNS (si es la primera vez)
2. Verifica que `https://cot.piwisuite.cl` funcione
3. Verifica que el certificado SSL esté activo (candado verde)
4. Prueba la aplicación y verifica que Firebase Auth funcione

## 🆘 Si Hay Problemas

- **Build falla**: Revisa los logs en Easypanel
- **Dominio no carga**: Verifica el CNAME en Cloudflare
- **Error de Firebase**: Verifica que las variables de entorno estén correctas
- **SSL no funciona**: Espera unos minutos más, Easypanel genera el certificado automáticamente

## 📝 Notas

- El deploy puede tomar 5-15 minutos
- El DNS puede tardar en propagarse (5-60 minutos normalmente)
- El certificado SSL se genera automáticamente en Easypanel





