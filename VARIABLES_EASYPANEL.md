# Variables de Entorno para Easypanel

## 📋 Configuración Completa

Copia y pega estas variables en la sección **Environment Variables** de Easypanel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://rxfcdnuycrauvybjowik.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZmNkbnV5Y3JhdXZ5Ympvd2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mjg1OTIsImV4cCI6MjA4MTQwNDU5Mn0.uKp2wRv69-OAEVHxjZnYsx_L-PV5BYRt3Ru0Wz8PkOY
NODE_ENV=production
```

## ✅ Pasos para Configurar en Easypanel

1. **Ve a tu aplicación en Easypanel**
2. **Sección "Environment Variables" o "Env"**
3. **Agrega cada variable una por una:**
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://rxfcdnuycrauvybjowik.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZmNkbnV5Y3JhdXZ5Ympvd2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mjg1OTIsImV4cCI6MjA4MTQwNDU5Mn0.uKp2wRv69-OAEVHxjZnYsx_L-PV5BYRt3Ru0Wz8PkOY`
   - `NODE_ENV` = `production`

4. **Guarda los cambios**
5. **Haz redeploy** de la aplicación

## 📝 Información del Proyecto Supabase

- **Project URL**: `https://rxfcdnuycrauvybjowik.supabase.co`
- **Project ID**: `rxfcdnuycrauvybjowik`
- **Organización**: selffene-cyber's Organization-APPS
- **Proyecto**: CotizadorPiwiSuite

## ⚠️ Importante

- **NO incluyas espacios** alrededor del signo `=`
- **NO uses comillas** alrededor de los valores
- Estas son las **únicas 2 variables de Supabase** necesarias (vs 6 de Firebase)
- La variable `NODE_ENV=production` es opcional pero recomendada

## 🔧 Verificación

Después de configurar las variables:

1. Haz redeploy en Easypanel
2. Verifica los logs del deploy
3. Si hay errores, revisa que las variables estén correctamente configuradas
4. Prueba acceder a `https://cot.piwisuite.cl`

## 📚 Archivos Relacionados

- `env.example` - Template para desarrollo local
- `easypanel.env` - Variables para Easypanel
- `CONFIGURACION_SUPABASE.md` - Guía completa de configuración

