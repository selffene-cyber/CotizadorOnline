# Migración de Firebase a Supabase

## ¿Por qué Supabase?

Supabase es una alternativa open-source a Firebase que es:
- ✅ **Más simple** de configurar
- ✅ **PostgreSQL real** (mejor que Firestore para queries complejas)
- ✅ **Gratis** hasta 500MB de base de datos
- ✅ **Misma API** que Firebase (fácil migración)
- ✅ **Mejor para desarrollo** (puedes correr localmente)

## Comparación: Firebase vs Supabase

| Característica | Firebase | Supabase |
|---------------|----------|----------|
| **Base de Datos** | Firestore (NoSQL) | PostgreSQL (SQL) |
| **Autenticación** | Firebase Auth | Supabase Auth |
| **Storage** | Firebase Storage | Supabase Storage |
| **Complejidad** | Media-Alta | Baja |
| **Costo** | Gratis hasta cierto límite | Gratis hasta 500MB |
| **Queries** | Limitadas | SQL completo |
| **Configuración** | Muchas variables | 2 variables |

## Plan de Migración

### Paso 1: Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea cuenta gratuita
3. Crea nuevo proyecto
4. Anota:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: `eyJhbGc...` (la encontrarás en Settings > API)

### Paso 2: Instalar Dependencias

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### Paso 3: Configurar Variables de Entorno

Solo necesitas **2 variables** en lugar de 6:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Paso 4: Migrar Código

La migración es muy similar porque Supabase tiene API compatible.

## Ventajas de Supabase

1. **Solo 2 variables de entorno** vs 6 de Firebase
2. **SQL real** - puedes hacer queries complejas fácilmente
3. **Dashboard más simple** - interfaz más clara
4. **Mejor para desarrollo** - puedes correr PostgreSQL localmente
5. **Open source** - no dependes de Google

## ¿Quieres que migre el código ahora?

Puedo:
1. ✅ Instalar Supabase
2. ✅ Crear configuración
3. ✅ Migrar autenticación
4. ✅ Migrar base de datos (Firestore → PostgreSQL)
5. ✅ Migrar storage
6. ✅ Actualizar todos los helpers

**Tiempo estimado**: 1-2 horas

¿Procedo con la migración?


