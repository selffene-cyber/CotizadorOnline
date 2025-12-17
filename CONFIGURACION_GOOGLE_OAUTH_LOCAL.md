# Configuración de Google OAuth para Desarrollo Local

## Problema
Cuando estás en desarrollo local (`localhost:3000`), Google OAuth necesita un redirect URL diferente al de producción.

## Solución

### Paso 1: Agregar Redirect URL de Localhost en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Ve a **APIs & Services** > **Credentials**
3. Haz clic en tu **Client ID** (`30852874054-...`)
4. En la sección **Authorized redirect URIs**, agrega:
   ```
   http://localhost:3000/auth/callback
   ```
5. También agrega (por si acaso):
   ```
   http://127.0.0.1:3000/auth/callback
   ```
6. **Guarda los cambios**

### Paso 2: Verificar que Supabase esté configurado

En Supabase Dashboard > Authentication > Providers > Google:
- El **Callback URL** debe ser: `https://rxfcdnuycrauvybjowik.supabase.co/auth/v1/callback`
- Este es el callback de Supabase, no el de tu app local

### Paso 3: Cómo funciona el flujo

1. Usuario hace clic en "Continuar con Google" en `localhost:3000`
2. Se redirige a Google para autenticarse
3. Google redirige a Supabase: `https://rxfcdnuycrauvybjowik.supabase.co/auth/v1/callback`
4. Supabase procesa la autenticación
5. Supabase redirige a tu app: `http://localhost:3000/auth/callback`
6. Tu app procesa el callback y redirige al dashboard o página de aprobación

### Paso 4: Verificar en la consola

Después de hacer clic en "Continuar con Google", deberías ver en la consola del navegador:
- `[Auth Callback] Usuario: ... Nuevo: true/false`
- `[Auth Callback] Usuario tiene acceso, redirigiendo al dashboard` (si ya está aprobado)
- O `[Auth Callback] Usuario no encontrado en public.users, creando solicitud` (si es nuevo)

## Nota Importante

- **En producción**: El redirect URL será `https://cot.piwisuite.cl/auth/callback`
- **En local**: El redirect URL es `http://localhost:3000/auth/callback`
- Ambos deben estar configurados en Google Cloud Console

