# Configuración de Supabase - CotizadorPiwiSuite

## 📋 Pasos para Configurar Supabase

### 1. Acceder a Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión con tu cuenta de GitHub
3. Organización: **selffene-cyber's Organization-APPS**
4. Proyecto: **CotizadorPiwiSuite**
5. Contraseña del proyecto: `selfene1994AS`

### 2. Obtener Credenciales

1. En el dashboard de Supabase, ve a **Settings** > **API**
2. Copia:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (la clave larga)

### 3. Crear la Base de Datos

1. En Supabase, ve a **SQL Editor**
2. Abre el archivo `supabase/schema.sql` de este proyecto
3. Copia todo el contenido del archivo
4. Pégalo en el SQL Editor de Supabase
5. Haz clic en **Run** para ejecutar el script
6. Esto creará todas las tablas necesarias

### 4. Configurar Variables de Entorno

#### Para Desarrollo Local:

1. Copia `env.example` a `.env.local`
2. Agrega las credenciales:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

#### Para Easypanel:

1. Ve a tu aplicación en Easypanel
2. Sección **Environment Variables**
3. Agrega:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://xxxxx.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGc...`

### 5. Configurar Autenticación con GitHub (Opcional)

1. En Supabase, ve a **Authentication** > **Providers**
2. Habilita **GitHub**
3. Configura:
   - **Client ID**: (obtener de GitHub OAuth App)
   - **Client Secret**: (obtener de GitHub OAuth App)
4. **Redirect URL**: `https://cot.piwisuite.cl/auth/callback`

### 6. Crear Primer Usuario

Puedes crear usuarios de dos formas:

#### Opción A: Desde Supabase Dashboard
1. Ve a **Authentication** > **Users**
2. Haz clic en **Add user**
3. Ingresa email y contraseña
4. El usuario se creará automáticamente

#### Opción B: Desde la Aplicación
1. Ejecuta la aplicación
2. Ve a `/login`
3. Usa el botón "Registrarse" (si está implementado)
4. O crea el usuario desde el código

### 7. Verificar que Funciona

1. Ejecuta `npm run dev`
2. Ve a `http://localhost:3000/login`
3. Inicia sesión con un usuario creado
4. Deberías poder acceder al dashboard

## ✅ Checklist de Configuración

- [ ] Proyecto Supabase creado
- [ ] Credenciales obtenidas (URL y Anon Key)
- [ ] Script SQL ejecutado (tablas creadas)
- [ ] Variables de entorno configuradas (local y Easypanel)
- [ ] Primer usuario creado
- [ ] Autenticación probada
- [ ] Aplicación funcionando

## 🔧 Solución de Problemas

### Error: "Supabase no está configurado"
- Verifica que las variables de entorno estén configuradas
- Asegúrate de que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` tengan valores

### Error: "relation does not exist"
- Ejecuta el script SQL en Supabase
- Verifica que todas las tablas se crearon correctamente

### Error de autenticación
- Verifica que el usuario existe en Supabase
- Revisa las políticas RLS (Row Level Security) en Supabase

## 📚 Recursos

- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de Autenticación](https://supabase.com/docs/guides/auth)
- [Guía de Base de Datos](https://supabase.com/docs/guides/database)

