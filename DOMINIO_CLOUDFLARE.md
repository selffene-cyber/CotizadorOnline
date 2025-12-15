# Guía: Configurar Dominio Personalizado con Cloudflare y Easypanel

Esta guía te ayudará a configurar tu dominio `cot.piwisuite.cl` para que apunte a tu aplicación en Easypanel.

## Resumen del Flujo

```
cot.piwisuite.cl (CNAME en Cloudflare) → Easypanel → Tu aplicación Next.js
```

## Paso 1: Desplegar en Easypanel Primero

Antes de configurar el dominio, necesitas tener la aplicación desplegada en Easypanel:

1. Despliega tu aplicación siguiendo los pasos en `EASYPANEL.md`
2. Anota la URL que Easypanel te proporciona (ej: `tu-app-123.easypanel.host` o una IP)

**Importante**: Necesitas esta URL para el siguiente paso.

## Paso 2: Configurar CNAME en Cloudflare

### 2.1 Acceder a Cloudflare

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Inicia sesión con tu cuenta
3. Selecciona el dominio `piwisuite.cl`

### 2.2 Crear el Registro CNAME

1. En el menú lateral, ve a **DNS** > **Records**
2. Haz clic en **"Add record"**
3. Configura el registro de la siguiente manera:

```
Type:     CNAME
Name:     cot
Content:  [La URL que Easypanel te dio - ej: tu-app.easypanel.host]
Proxy:    [Puedes usar Proxied o DNS only]
TTL:      Auto
```

4. Haz clic en **"Save"**

**Ejemplo visual**:
```
┌─────────────────────────────────────────┐
│ Type:    CNAME                          │
│ Name:    cot                            │
│ Content: tu-app-123.easypanel.host     │
│ Proxy:   Proxied ⚠️ (o DNS only)       │
│ TTL:     Auto                           │
└─────────────────────────────────────────┘
```

Esto creará el subdominio: `cot.piwisuite.cl`

### 2.3 Si Easypanel Proporciona una IP

Si Easypanel te da una IP en lugar de un hostname, usa un registro **A** en lugar de **CNAME**:

```
Type:     A
Name:     cot
Content:  [La IP que Easypanel te dio - ej: 192.0.2.1]
Proxy:    [Proxied o DNS only]
TTL:      Auto
```

## Paso 3: Configurar el Dominio en Easypanel

1. En tu aplicación en Easypanel, busca la sección **"Domains"** o **"Custom Domain"**
2. Haz clic en **"Add Domain"** o **"Add Custom Domain"**
3. Ingresa: `cot.piwisuite.cl`
4. Easypanel detectará automáticamente que el registro DNS está configurado
5. Easypanel generará automáticamente un certificado SSL (puede tomar 5-15 minutos)

### Verificación en Easypanel

Easypanel debería mostrar un estado como:
- ✅ **DNS Verified** - El registro DNS está correcto
- ⏳ **SSL Pending** - El certificado SSL se está generando
- ✅ **SSL Active** - Todo listo

## Paso 4: Configurar el Dominio en Firebase Auth

Para que Firebase Authentication funcione con tu dominio personalizado:

### 4.1 Agregar Dominio Autorizado

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el proyecto: **cotizadorpiwisuite**
3. Ve a **Authentication** > **Settings** (Configuración)
4. En la sección **"Authorized domains"** (Dominios autorizados)
5. Haz clic en **"Add domain"**
6. Ingresa: `cot.piwisuite.cl`
7. Haz clic en **"Add"**

### 4.2 Dominios que Deberías Tener

Tu lista de dominios autorizados debería incluir:
- `localhost` (ya debería estar para desarrollo)
- `cotizadorpiwisuite.firebaseapp.com` (automático)
- `cot.piwisuite.cl` (tu dominio personalizado) ✨

## Paso 5: Verificar la Configuración

### 5.1 Verificar DNS

Puedes verificar que el DNS esté propagado usando:

```bash
# En terminal o cmd
nslookup cot.piwisuite.cl

# O usando dig (Linux/Mac)
dig cot.piwisuite.cl CNAME
```

Deberías ver que `cot.piwisuite.cl` apunta a la URL de Easypanel.

### 5.2 Verificar el Sitio

1. Espera 5-15 minutos después de configurar todo
2. Abre tu navegador y ve a: https://cot.piwisuite.cl
3. Deberías ver tu aplicación funcionando
4. Verifica que el certificado SSL esté activo (candado verde en el navegador)

### 5.3 Verificar Firebase Auth

1. Intenta iniciar sesión en tu aplicación en `cot.piwisuite.cl`
2. Si Firebase Auth funciona correctamente, significa que el dominio está bien configurado

## Solución de Problemas

### El dominio no carga / Error 404

1. **Verifica el CNAME en Cloudflare**:
   - Asegúrate de que el registro CNAME esté correcto
   - Verifica que el "Content" apunte a la URL correcta de Easypanel

2. **Verifica en Easypanel**:
   - Asegúrate de que el dominio esté agregado en Easypanel
   - Verifica que el estado sea "Active" o "DNS Verified"

3. **Espera la propagación DNS**:
   - DNS puede tardar hasta 24 horas (normalmente 5-60 minutos)
   - Usa `nslookup` para verificar si el DNS ya se propagó

### Error de Certificado SSL

1. **Espera más tiempo**: Los certificados SSL pueden tardar 5-15 minutos en generarse
2. **Verifica en Easypanel**: Revisa el estado del dominio en Easypanel
3. **Revisa los logs**: En Easypanel, revisa los logs de la aplicación

### Firebase Auth no funciona con el dominio personalizado

1. **Verifica en Firebase Console**: Asegúrate de que `cot.piwisuite.cl` esté en la lista de dominios autorizados
2. **Limpia la caché**: Limpia la caché del navegador o prueba en modo incógnito
3. **Revisa las variables de entorno**: Asegúrate de que las variables de Firebase estén configuradas correctamente

### El dominio carga pero muestra "Invalid Host Header"

Esto puede pasar si usas Cloudflare Proxy. Soluciones:

1. **Opción 1**: Cambia el registro a **DNS only** (gris) en Cloudflare en lugar de **Proxied** (naranja)
2. **Opción 2**: Configura en Easypanel para aceptar el dominio (si tiene esa opción)

## Configuración Recomendada de Cloudflare

### Para Mejor Rendimiento

1. **Proxy Status**: Puedes usar **Proxied** (nube naranja) para:
   - ✅ Protección DDoS automática
   - ✅ CDN global de Cloudflare
   - ✅ Mejor rendimiento

2. **SSL/TLS Mode**: En Cloudflare, configura:
   - **SSL/TLS** > **Overview** > **Encryption mode**: `Full` o `Full (strict)`

3. **Cache**: Puedes configurar reglas de caché si lo necesitas

## Resumen de URLs

Después de configurar todo, tendrás:

- **Dominio personalizado**: https://cot.piwisuite.cl ✅
- **URL de Easypanel**: [La URL que Easypanel te proporcionó] (aún funcional)
- **Firebase Auth**: Funcionará con ambos dominios

## ¿Te Equivocaste?

**¡NO!** Usar Easypanel + Cloudflare es una excelente opción:

✅ **Ventajas**:
- Control total sobre el dominio
- Certificado SSL automático
- CDN de Cloudflare (si usas Proxied)
- Fácil de configurar
- Perfecto para Next.js con SSR

✅ **Funciona perfectamente** con tu stack:
- Next.js ✅
- Firebase ✅
- Docker ✅
- Dominio personalizado ✅

## Recursos Adicionales

- [Documentación de Cloudflare DNS](https://developers.cloudflare.com/dns/)
- [Documentación de Easypanel Domains](https://easypanel.io/docs)
- [Firebase Authorized Domains](https://firebase.google.com/docs/auth/web/domain-name-verification)

