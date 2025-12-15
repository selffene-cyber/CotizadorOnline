# Guía de Deployment en Easypanel

Esta guía explica cómo desplegar **Cotizador.PiwiSuite** en Easypanel.

## Prerrequisitos

1. Cuenta en Easypanel
2. Proyecto Firebase configurado con las credenciales necesarias
3. Repositorio GitHub configurado (https://github.com/selffene-cyber/CotizadorOnline.git)

## Paso 1: Configurar Firebase

Antes de desplegar, asegúrate de tener un proyecto Firebase configurado:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **Project Settings** > **General** > **Your apps**
4. Si no tienes una app web, haz clic en el ícono de Web (`</>`)
5. Copia las credenciales de configuración

Necesitarás estas credenciales:
- API Key
- Auth Domain
- Project ID
- Storage Bucket
- Messaging Sender ID
- App ID

### Configurar Firebase Services

#### Authentication
1. Ve a **Authentication** > **Sign-in method**
2. Habilita **Email/Password**
3. (Opcional) Habilita **Google** para autenticación con Gmail

#### Firestore Database
1. Ve a **Firestore Database**
2. Crea la base de datos en modo producción
3. Configura las reglas de seguridad (ver README.md)

#### Storage
1. Ve a **Storage**
2. Habilita Storage
3. Configura las reglas de seguridad

## Paso 2: Crear Aplicación en Easypanel

1. Inicia sesión en tu panel de Easypanel
2. Crea un nuevo proyecto o selecciona uno existente
3. Haz clic en **"Add App"** o **"New App"**
4. Selecciona **"GitHub"** como fuente

## Paso 3: Configurar el Repositorio

1. **Repository URL**: `https://github.com/selffene-cyber/CotizadorOnline.git`
2. **Branch**: `main` (o la rama que desees usar)
3. **Root Directory**: `/` (dejar vacío si está en la raíz)

## Paso 4: Configurar el Tipo de Aplicación

- **App Type**: `Dockerfile` o `Docker Compose`
- **Dockerfile Path**: `Dockerfile` (si usas Dockerfile directamente)

O si prefieres usar Docker Compose:

- **App Type**: `Docker Compose`
- **Docker Compose File**: `docker-compose.yml`
- **Service**: `app-prod`

## Paso 5: Configurar Variables de Entorno

En la sección **"Environment Variables"** o **"Env"** de Easypanel, agrega las siguientes variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDSOkK2VejNdwCb7CYTWqj0BZFeZriwbLc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cotizadorpiwisuite.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cotizadorpiwisuite
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cotizadorpiwisuite.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=415072535894
NEXT_PUBLIC_FIREBASE_APP_ID=1:415072535894:web:52b4f8b34502f3d08dc2f7
NODE_ENV=production
```

**Importante**: 
- Las credenciales del proyecto `cotizadorpiwisuite` ya están configuradas arriba
- Puedes copiar directamente desde el archivo `easypanel.env`
- No incluyas espacios alrededor del signo `=`
- No uses comillas alrededor de los valores

## Paso 6: Configurar Puerto y Recursos

- **Port**: `3000` (Next.js usa el puerto 3000 por defecto)
- **Resources**: 
  - CPU: Mínimo 0.5 cores (recomendado 1 core)
  - Memory: Mínimo 512MB (recomendado 1GB)
  - Storage: 1GB mínimo

## Paso 7: Configurar Dominio Personalizado `cot.piwisuite.cl`

Para usar tu dominio personalizado `cot.piwisuite.cl` con Easypanel y Cloudflare:

### Paso 7.1: Obtener la URL de Easypanel

1. Primero, despliega la aplicación en Easypanel (puedes usar la URL temporal)
2. Una vez desplegada, Easypanel te dará una URL (ej: `tu-app.easypanel.host` o similar)
3. **Necesitarás esta URL para configurar el CNAME en Cloudflare**

### Paso 7.2: Configurar CNAME en Cloudflare

1. Inicia sesión en tu cuenta de [Cloudflare](https://dash.cloudflare.com/)
2. Selecciona el dominio `piwisuite.cl`
3. Ve a **DNS** > **Records**
4. Haz clic en **"Add record"**
5. Configura el registro:
   - **Type**: `CNAME`
   - **Name**: `cot` (esto creará `cot.piwisuite.cl`)
   - **Target**: [La URL que Easypanel te proporcionó - ej: `tu-app.easypanel.host`]
   - **Proxy status**: Puedes usar **Proxied** (nube naranja) o **DNS only** (gris)
   - **TTL**: Auto (o el que prefieras)
6. Haz clic en **"Save"**

**Importante**: 
- Si Easypanel te da una IP en lugar de un hostname, usa un registro **A** en lugar de **CNAME**
- La propagación DNS puede tomar entre 5 minutos y 24 horas (normalmente menos de 1 hora)

### Paso 7.3: Configurar el Dominio en Easypanel

1. En tu aplicación en Easypanel, ve a la sección **"Domains"** o **"Custom Domain"**
2. Agrega el dominio: `cot.piwisuite.cl`
3. Easypanel detectará automáticamente el registro DNS
4. Espera a que Easypanel configure el certificado SSL (puede tomar unos minutos)

### Paso 7.4: Verificar la Configuración

1. Espera unos minutos para que el DNS se propague
2. Verifica que el dominio funcione: https://cot.piwisuite.cl
3. El certificado SSL debería configurarse automáticamente

### Paso 7.5: Configurar el Dominio en Firebase (Opcional pero Recomendado)

Para que Firebase Auth funcione correctamente con tu dominio personalizado:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto `cotizadorpiwisuite`
3. Ve a **Authentication** > **Settings** > **Authorized domains**
4. Haz clic en **"Add domain"**
5. Agrega: `cot.piwisuite.cl`
6. Guarda los cambios

Esto permitirá que Firebase Auth funcione con tu dominio personalizado.

### Notas Importantes

- **No te equivoaste**: Usar Easypanel + Cloudflare es una excelente opción para Next.js
- El CNAME `cot.piwisuite.cl` apuntará a tu aplicación en Easypanel
- Easypanel manejará automáticamente el certificado SSL (Let's Encrypt)
- Si tienes problemas, verifica que el CNAME esté correcto en Cloudflare DNS

## Paso 8: Configurar Health Check (Opcional)

- **Health Check Path**: `/`
- **Health Check Port**: `3000`

## Paso 9: Desplegar

1. Revisa todas las configuraciones
2. Haz clic en **"Deploy"** o **"Save & Deploy"**
3. Easypanel construirá la imagen Docker y desplegará la aplicación
4. Espera a que el deployment termine (puede tomar varios minutos la primera vez)

## Paso 10: Verificar el Deployment

1. Una vez completado el deployment, visita la URL proporcionada
2. Deberías ver la aplicación funcionando
3. Si hay errores, revisa los logs en Easypanel

## Solución de Problemas

### La aplicación no inicia

1. Revisa los logs en Easypanel: **Logs** > **Container Logs**
2. Verifica que todas las variables de entorno estén configuradas correctamente
3. Asegúrate de que las credenciales de Firebase sean válidas

### Error de conexión con Firebase

1. Verifica que todas las variables `NEXT_PUBLIC_FIREBASE_*` estén configuradas
2. Asegúrate de que no haya espacios extra en los valores
3. Verifica en Firebase Console que el proyecto esté activo

### Build falla

1. Revisa los logs de build en Easypanel
2. Verifica que el Dockerfile esté presente en el repositorio
3. Asegúrate de que `next.config.ts` tenga `output: 'standalone'` configurado

### Variables de entorno no se aplican

1. En Easypanel, asegúrate de que las variables estén en la sección correcta
2. Algunos cambios requieren un redeploy
3. Verifica que no uses `.env.local` (Easypanel usa las variables configuradas en su panel)

## Actualizaciones Futuras

Cada vez que hagas push a la rama `main` en GitHub:

1. Easypanel puede configurarse para auto-deploy (si está habilitado)
2. O puedes hacer deploy manual desde el panel
3. Las variables de entorno se mantienen entre deployments

## Estructura del Proyecto en Easypanel

```
Repository: https://github.com/selffene-cyber/CotizadorOnline.git
Branch: main
Dockerfile: Dockerfile (producción)
Docker Compose: docker-compose.yml (opcional)
Port: 3000
```

## Recursos Adicionales

- [Documentación de Easypanel](https://easypanel.io/docs)
- [Documentación de Next.js Docker](https://nextjs.org/docs/deployment#docker-image)
- [Firebase Console](https://console.firebase.google.com/)

## Soporte

Si tienes problemas con el deployment:
1. Revisa los logs en Easypanel
2. Verifica la configuración de Firebase
3. Asegúrate de que todas las variables de entorno estén correctas

