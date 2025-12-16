# Guía para Crear Usuario Administrador

## Problema Actual

El panel de administración requiere que el usuario tenga `role = 'admin'` en la tabla `public.users`. Los errores que estás viendo indican que:

1. La tabla `users` no existe o no tiene acceso (ejecuta los scripts SQL)
2. El usuario no tiene un registro en `public.users` con `role = 'admin'`

## Solución Paso a Paso

### Paso 1: Ejecutar Scripts SQL Base (si no lo has hecho)

1. Ve a **Supabase Dashboard** > **SQL Editor**
2. Ejecuta en orden:
   - `supabase/schema.sql` (crea tablas base)
   - `supabase/schema-multi-tenant.sql` (agrega multi-tenancy)

### Paso 2: Crear Usuario en Supabase Auth

Tienes dos opciones:

#### Opción A: Desde el Dashboard de Supabase (Recomendado)

1. Ve a **Supabase Dashboard** > **Authentication** > **Users**
2. Click en **"Add User"** > **"Create new user"**
3. Completa:
   - **Email**: `jeans.selfene@outlook.com`
   - **Password**: `selfene1994AS#`
   - **Auto Confirm User**: ✅ (activado)
4. Click en **"Create user"**

#### Opción B: Desde la Aplicación

1. Ve a `http://localhost:3000/login`
2. Click en **"Registrarse"** o **"Sign Up"**
3. Ingresa:
   - Email: `jeans.selfene@outlook.com`
   - Password: `selfene1994AS#`
4. Completa el registro

### Paso 3: Crear Registro en public.users con Rol Admin

1. Ve a **Supabase Dashboard** > **SQL Editor**
2. Copia y pega el contenido de `supabase/setup-admin-user.sql`
3. Click en **"Run"** o presiona `Ctrl+Enter`

El script:
- Verifica que las tablas existan
- Busca el usuario en `auth.users`
- Crea/actualiza el registro en `public.users` con `role = 'admin'`
- Muestra una confirmación

### Paso 4: Verificar

1. Ve a **Supabase Dashboard** > **Table Editor** > **users**
2. Busca el usuario `jeans.selfene@outlook.com`
3. Verifica que la columna `role` sea `admin`

### Paso 5: Probar en la Aplicación

1. Cierra sesión si estás logueado
2. Inicia sesión con:
   - Email: `jeans.selfene@outlook.com`
   - Password: `selfene1994AS#`
3. Ve a `http://localhost:3000/admin`
4. Deberías poder acceder al panel de administración

## Solución Rápida (Script SQL Directo)

Si ya creaste el usuario en Auth, ejecuta esto en el SQL Editor:

```sql
-- Crear/actualizar usuario admin
INSERT INTO public.users (id, email, display_name, role)
SELECT 
  id,
  email,
  email,
  'admin'
FROM auth.users
WHERE email = 'jeans.selfene@outlook.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin', updated_at = NOW();

-- Verificar
SELECT id, email, role FROM public.users WHERE email = 'jeans.selfene@outlook.com';
```

## Verificación Completa

Para verificar que todo está configurado correctamente, ejecuta:

**`supabase/verificar-setup.sql`**

Este script verifica:
- ✅ Que las tablas existan
- ✅ Que el usuario exista en `auth.users`
- ✅ Que el usuario exista en `public.users` con `role = 'admin'`
- ✅ Que las políticas RLS estén configuradas

## Troubleshooting

### Error: "Usuario no encontrado en auth.users"

- Asegúrate de haber creado el usuario en **Authentication > Users**
- Verifica que el email sea exactamente `jeans.selfene@outlook.com` (sin espacios)

### Error: "La tabla public.users no existe"

- Ejecuta primero `supabase/schema.sql` en el SQL Editor

### Error: "La tabla public.tenants no existe"

- Ejecuta primero `supabase/schema-multi-tenant.sql` en el SQL Editor

### Error 406 o 500 al acceder a /admin

- Verifica que el usuario tenga `role = 'admin'` en `public.users`
- Verifica que las políticas RLS estén activas (deberían estar en los scripts SQL)

## Notas

- El rol `admin` en `public.users` es diferente del rol en `memberships` (que es por tenant)
- Un usuario con `role = 'admin'` en `public.users` es un **super administrador** que puede acceder a `/admin`
- Los usuarios normales tienen `role = 'user'` en `public.users` y roles específicos por tenant en `memberships`

