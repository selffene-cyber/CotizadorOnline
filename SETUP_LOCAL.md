# 🚀 Setup para Desarrollo Local

## 📋 Pasos para probar en local

### 1. Crear archivo `.env.local`

Crea un archivo `.env.local` en la raíz del proyecto con este contenido:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://rxfcdnuycrauvybjowik.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZmNkbnV5Y3JhdXZ5Ympvd2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mjg1OTIsImV4cCI6MjA4MTQwNDU5Mn0.uKp2wRv69-OAEVHxjZnYsx_L-PV5BYRt3Ru0Wz8PkOY

# Next.js Configuration
NODE_ENV=development
```

### 2. Instalar dependencias (si no lo has hecho)

```bash
npm install
```

### 3. Ejecutar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:3000`

### 4. Acceder al panel de administración

1. Inicia sesión con el usuario admin:
   - Email: `piwisuite@gmail.com`
   - Password: `Admin1994AS#`

2. Accede a: `http://localhost:3000/admin`

## ⚠️ Importante: Configurar Supabase

Antes de probar el panel de administración, necesitas:

### 1. Ejecutar el esquema multi-tenant en Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto: **CotizadorPiwiSuite**
3. Ve a **SQL Editor**
4. Abre el archivo `supabase/schema-multi-tenant.sql`
5. Copia y pega todo el contenido
6. Haz clic en **Run** o presiona `Ctrl+Enter`
7. Verifica que no haya errores

### 2. Crear el usuario administrador

1. Ve a **Authentication** → **Users**
2. Haz clic en **Add user** → **Create new user**
3. Ingresa:
   - Email: `piwisuite@gmail.com`
   - Password: `Admin1994AS#`
4. Haz clic en **Create user**

### 3. Asignar rol de admin

1. Ve a **SQL Editor**
2. Ejecuta el script `supabase/create-admin-user.sql`:

```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'piwisuite@gmail.com';
```

3. Verifica que se actualizó:

```sql
SELECT id, email, role, created_at
FROM public.users
WHERE email = 'piwisuite@gmail.com';
```

Deberías ver `role = 'admin'`.

## 🧪 Probar funcionalidades

### Panel de Administración

- **URL**: `http://localhost:3000/admin`
- **Funcionalidades**:
  - Ver solicitudes de acceso
  - Aprobar/rechazar solicitudes
  - Ver todos los usuarios
  - Cambiar roles de usuarios
  - Eliminar usuarios

### Aplicación Principal

- **URL**: `http://localhost:3000`
- **Login**: Usa cualquier usuario creado en Supabase Auth

## 🐛 Troubleshooting

### Error: "Supabase no está configurado"

- Verifica que el archivo `.env.local` existe y tiene las variables correctas
- Reinicia el servidor de desarrollo (`Ctrl+C` y luego `npm run dev`)

### Error: "useAuth must be used within an AuthProvider"

- Asegúrate de que el servidor esté corriendo
- Limpia la caché del navegador (`Ctrl+Shift+R`)

### No puedo acceder a /admin

- Verifica que el usuario tenga `role = 'admin'` en `public.users`
- Verifica que estés autenticado
- Revisa la consola del navegador para errores

### No aparecen usuarios en el panel

- Verifica que la tabla `users` tenga datos
- Verifica que las políticas RLS estén correctas
- Revisa los logs de Supabase

## 📝 Notas

- El archivo `.env.local` está en `.gitignore` y no se subirá a Git
- Los cambios en local no afectan la versión en producción
- Para hacer deploy, usa `npm run deploy:main` desde la rama `develop`

