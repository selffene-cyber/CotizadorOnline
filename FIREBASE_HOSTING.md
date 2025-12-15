# Guía de Deployment en Firebase Hosting

Esta guía explica cómo desplegar **Cotizador.PiwiSuite** en Firebase Hosting.

## ⚠️ Importante: Limitaciones

Firebase Hosting está diseñado para sitios estáticos. Next.js con App Router tiene algunas limitaciones:

- ✅ **Funciona**: Sitios estáticos, componentes del cliente (`'use client'`)
- ❌ **No funciona**: Server-Side Rendering (SSR), API Routes, Server Components sin export estático

**Recomendación**: Para funcionalidad completa, usa **Easypanel** o **Cloud Run** (ver EASYPANEL.md)

## Prerrequisitos

1. Firebase CLI instalado
2. Proyecto Firebase configurado: `cotizadorpiwisuite`
3. Site ID: `cotizadorpiwisuite-10a5f`

## Paso 1: Instalar Firebase CLI

Si no lo tienes instalado:

```bash
npm install -g firebase-tools
```

## Paso 2: Iniciar Sesión en Firebase

```bash
firebase login
```

Esto abrirá tu navegador para autenticarte con tu cuenta de Google.

## Paso 3: Configuración del Proyecto

El proyecto ya está configurado con:

- `.firebaserc` - Proyecto: `cotizadorpiwisuite`
- `firebase.json` - Site: `cotizadorpiwisuite-10a5f`

## Paso 4: Configurar Next.js para Export Estático

Para usar Firebase Hosting, necesitas generar un export estático. Tienes dos opciones:

### Opción A: Export Estático (Limitado)

Si tu aplicación puede funcionar completamente en el cliente, puedes usar:

1. **Hacer backup del next.config.ts actual**:
```bash
cp next.config.ts next.config.standalone.ts
```

2. **Usar la configuración de export estático**:
```bash
cp next.config.export.ts next.config.ts
```

O edita manualmente `next.config.ts` y cambia:
```typescript
const nextConfig = {
  output: 'export', // Cambiar de 'standalone' a 'export'
  images: {
    unoptimized: true, // Necesario para export estático
  },
};
```

3. **Build y export**:
```bash
npm run build
```

Esto generará la carpeta `out/` con los archivos estáticos.

4. **Deploy a Firebase Hosting**:
```bash
firebase deploy --only hosting:cotizadorpiwisuite-10a5f
```

**Importante**: Después del deploy, si quieres volver a usar Docker/Easypanel:
```bash
cp next.config.standalone.ts next.config.ts
```

### Opción B: Usar Easypanel/Docker (Recomendado)

Para funcionalidad completa, usa la configuración de Docker y Easypanel como se describe en `EASYPANEL.md`.

## Paso 5: Variables de Entorno

Las variables de entorno de Firebase ya están configuradas en el código. Asegúrate de que estén disponibles en el momento del build:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDSOkK2VejNdwCb7CYTWqj0BZFeZriwbLc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cotizadorpiwisuite.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cotizadorpiwisuite
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cotizadorpiwisuite.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=415072535894
NEXT_PUBLIC_FIREBASE_APP_ID=1:415072535894:web:52b4f8b34502f3d08dc2f7
```

## Paso 6: Deploy

Una vez configurado:

```bash
# Build del proyecto
npm run build

# Deploy a Firebase Hosting
firebase deploy --only hosting:cotizadorpiwisuite-10a5f
```

## Paso 7: Verificar

Después del deploy, tu sitio estará disponible en:
- **URL**: https://cotizadorpiwisuite-10a5f.web.app
- **URL alternativa**: https://cotizadorpiwisuite-10a5f.firebaseapp.com

## Comandos Útiles

```bash
# Ver configuración actual
firebase projects:list

# Ver sitios de hosting
firebase hosting:sites:list

# Deploy solo hosting
firebase deploy --only hosting:cotizadorpiwisuite-10a5f

# Ver logs del deploy
firebase deploy --only hosting:cotizadorpiwisuite-10a5f --debug

# Abrir el sitio en el navegador
firebase open hosting:site
```

## Estructura de Archivos

```
firebase.json          # Configuración de Firebase Hosting
.firebaserc           # Configuración del proyecto Firebase
out/                  # Directorio de salida (generado por next export)
```

## Solución de Problemas

### Error: "Site not found"

Asegúrate de que el Site ID `cotizadorpiwisuite-10a5f` esté correcto en `firebase.json`.

### Error: "Build failed"

- Verifica que todas las variables de entorno estén configuradas
- Asegúrate de que no uses Server Components o API Routes
- Revisa los logs del build: `npm run build`

### La aplicación no carga correctamente

- Verifica que el export estático se haya generado en la carpeta `out/`
- Revisa la consola del navegador para errores de JavaScript
- Asegúrate de que las variables `NEXT_PUBLIC_*` estén incluidas en el build

## Alternativas Recomendadas

Para Next.js con funcionalidad completa:

1. **Easypanel + Docker** (Ver `EASYPANEL.md`)
   - ✅ SSR completo
   - ✅ API Routes
   - ✅ Server Components
   - ✅ Fácil de configurar

2. **Cloud Run + Firebase Hosting**
   - ✅ SSR completo
   - ✅ Más complejo de configurar
   - Requiere configuración adicional

## Recursos

- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

