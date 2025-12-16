# 🛡️ Panel de Administración - Setup

## 📋 Resumen

Se ha creado un panel de administración en `/admin` para gestionar usuarios, aprobar/rechazar solicitudes de acceso, y administrar permisos.

## 🔐 Usuario Administrador

- **Email**: `piwisuite@gmail.com`
- **Password**: `Admin1994AS#`
- **Ruta**: `https://cot.piwisuite.cl/admin`

## 📝 Pasos de Configuración

### 1. Crear el Usuario Administrador en Supabase Auth

1. Ve a Supabase Dashboard → Authentication → Users
2. Haz clic en "Add user" → "Create new user"
3. Ingresa:
   - Email: `piwisuite@gmail.com`
   - Password: `Admin1994AS#`
   - Confirma la contraseña
4. Haz clic en "Create user"

### 2. Ejecutar Scripts SQL en Supabase

#### Paso 1: Ejecutar el esquema multi-tenant

1. Ve a Supabase Dashboard → SQL Editor
2. Abre el archivo `supabase/schema-multi-tenant.sql`
3. Copia y pega todo el contenido en el SQL Editor
4. Haz clic en "Run" o presiona `Ctrl+Enter`
5. Verifica que no haya errores

#### Paso 2: Asignar rol de admin al usuario

1. En el SQL Editor, abre el archivo `supabase/create-admin-user.sql`
2. Copia y pega el contenido
3. Haz clic en "Run"
4. Verifica que el usuario tenga `role = 'admin'`:

```sql
SELECT id, email, role, created_at
FROM public.users
WHERE email = 'piwisuite@gmail.com';
```

Deberías ver `role = 'admin'`.

## 🎯 Funcionalidades del Panel

### Gestión de Solicitudes de Acceso

- Ver todas las solicitudes de acceso pendientes
- Aprobar solicitudes
- Rechazar solicitudes
- Ver historial de solicitudes aprobadas/rechazadas

### Gestión de Usuarios

- Ver todos los usuarios del sistema
- Cambiar roles (Usuario ↔ Administrador)
- Eliminar usuarios
- Ver información de cada usuario

## 🔒 Seguridad

- Solo usuarios con `role = 'admin'` en `public.users` pueden acceder a `/admin`
- Si un usuario no admin intenta acceder, será redirigido a `/dashboard`
- Si un usuario no autenticado intenta acceder, será redirigido a `/login`

## 📊 Modelo de Datos

### Tablas Nuevas

- `tenants`: Empresas/organizaciones
- `memberships`: Relación usuarios-empresas con roles
- `invitations`: Invitaciones a empresas
- `access_requests`: Solicitudes de acceso al sistema

### Tablas Actualizadas

Todas las tablas existentes ahora tienen `tenant_id`:
- `clients`
- `quotes`
- `costings`
- `material_catalog`
- `equipment_catalog`
- `company_settings`

## 🚀 Próximos Pasos

1. ✅ Panel de administración creado
2. ⏳ Implementar sistema de invitaciones
3. ⏳ Implementar onboarding automático
4. ⏳ Migrar datos existentes a tenant por defecto
5. ⏳ Implementar detección de tenant por ruta

## 🐛 Troubleshooting

### No puedo acceder a /admin

1. Verifica que el usuario tenga `role = 'admin'` en `public.users`
2. Verifica que estés autenticado
3. Revisa la consola del navegador para errores

### No aparecen usuarios en el panel

1. Verifica que la tabla `users` tenga datos
2. Verifica que las políticas RLS estén correctas
3. Revisa los logs de Supabase

### Error al aprobar/rechazar solicitudes

1. Verifica que la tabla `access_requests` exista
2. Verifica que tengas permisos de escritura
3. Revisa los logs de Supabase

