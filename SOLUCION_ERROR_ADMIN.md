# Solución para Error de Acceso al Panel Admin

## Problema

Al intentar acceder a `/admin`, aparece el error:
- `[isSuperAdmin] Usuario no encontrado en public.users`
- `[getAllTenants] Tabla tenants no existe`

## Causa

El usuario existe en `auth.users` pero:
1. **No existe el registro en `public.users`** (o el trigger no funcionó)
2. **Falta la tabla `tenants`** (no se ejecutó `schema-multi-tenant.sql`)

## Solución Rápida

### Paso 1: Crear/Actualizar Usuario en public.users

Ejecuta este script en **Supabase SQL Editor**:

**Archivo: `supabase/fix-user-admin.sql`**

Este script:
- ✅ Busca el usuario en `auth.users`
- ✅ Crea/actualiza el registro en `public.users` con `role = 'admin'`
- ✅ Verifica que todo esté correcto

### Paso 2: Crear Tablas Multi-Tenant (si no existen)

Si el error persiste con `tenants`, ejecuta:

**Archivo: `supabase/schema-multi-tenant.sql`**

Este script crea:
- Tabla `tenants`
- Tabla `memberships`
- Tabla `invitations`
- Tabla `access_requests`
- Políticas RLS necesarias

## Verificación

Después de ejecutar los scripts, verifica con:

```sql
-- Verificar usuario
SELECT id, email, role 
FROM public.users 
WHERE email = 'jeans.selfene@outlook.com';
-- Deberías ver: role = 'admin'

-- Verificar tabla tenants
SELECT COUNT(*) FROM public.tenants;
-- Debería devolver 0 (tabla vacía pero existe)
```

## Solución Manual (Alternativa)

Si prefieres hacerlo manualmente:

```sql
-- 1. Obtener el ID del usuario
SELECT id, email FROM auth.users WHERE email = 'jeans.selfene@outlook.com';

-- 2. Crear/actualizar en public.users (reemplaza USER_ID con el ID de arriba)
INSERT INTO public.users (id, email, display_name, role)
VALUES (
  'USER_ID_AQUI',  -- Reemplaza con el ID real
  'jeans.selfene@outlook.com',
  'jeans.selfene@outlook.com',
  'admin'
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin', updated_at = NOW();
```

## Próximos Pasos

1. Ejecuta `supabase/fix-user-admin.sql`
2. Si falta la tabla `tenants`, ejecuta `supabase/schema-multi-tenant.sql`
3. Cierra sesión y vuelve a iniciar sesión
4. Intenta acceder a `/admin` nuevamente

## Nota sobre el Trigger

El trigger `handle_new_user` debería crear automáticamente el registro en `public.users` cuando se crea un usuario en `auth.users`. Si no funcionó, puede ser porque:
- El trigger no está activo
- El usuario se creó antes de que existiera el trigger
- Hubo un error al ejecutar el trigger

El script `fix-user-admin.sql` corrige esto creando/actualizando el registro manualmente.
