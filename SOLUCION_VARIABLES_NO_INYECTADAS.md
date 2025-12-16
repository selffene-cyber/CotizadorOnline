# 🔧 Solución: Variables de Entorno No Se Están Inyectando

## ❌ Problema Identificado

Las variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` **NO están en el contenedor**, aunque están configuradas en Easypanel.

## ✅ Solución: Verificar y Corregir en Easypanel

### Paso 1: Verificar Variables en Easypanel

1. En Easypanel, ve a tu servicio `piwisuite / cotizadorpiwisuite`
2. Ve a la pestaña **"Entorno"** o **"Environment Variables"**
3. Verifica que estén estas 3 variables **exactamente así** (sin espacios alrededor del `=`):

```
NEXT_PUBLIC_SUPABASE_URL=https://rxfcdnuycrauvybjowik.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZmNkbnV5Y3JhdXZ5Ympvd2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mjg1OTIsImV4cCI6MjA4MTQwNDU5Mn0.uKp2wRv69-OAEVHxjZnYsx_L-PV5BYRt3Ru0Wz8PkOY
NODE_ENV=production
```

**IMPORTANTE:**
- ✅ Sin espacios alrededor del `=`
- ✅ Sin comillas en los valores
- ✅ Cada variable en una línea separada
- ✅ Sin comentarios (#)

### Paso 2: Verificar el Formato

En Easypanel, las variables pueden estar en dos formatos:

**Formato 1: Lista de variables (recomendado)**
```
NEXT_PUBLIC_SUPABASE_URL=https://rxfcdnuycrauvybjowik.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NODE_ENV=production
```

**Formato 2: Archivo .env (si está activado "Crear archivo .env")**
Si el toggle "Crear archivo .env" está activado, las variables deberían estar en formato de archivo .env.

### Paso 3: Eliminar y Recrear las Variables

Si las variables están mal formateadas:

1. **Elimina todas las variables existentes**
2. **Agrega las 3 variables UNA POR UNA** (no todas juntas):
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://rxfcdnuycrauvybjowik.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - `NODE_ENV` = `production`

### Paso 4: Reiniciar el Servicio

Después de corregir las variables:

1. En Easypanel, haz clic en **"Stop"**
2. Espera 10 segundos
3. Haz clic en **"Start"** o **"Deploy"**
4. Espera 1-2 minutos
5. **Verifica en la consola** que las variables estén presentes:
   ```bash
   env | grep NEXT_PUBLIC
   ```

## 🔍 Verificar en la Consola

Después de reiniciar, ejecuta en la consola:

```bash
# Verificar que las variables estén presentes
env | grep NEXT_PUBLIC

# Deberías ver:
# NEXT_PUBLIC_SUPABASE_URL=https://rxfcdnuycrauvybjowik.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

## 💡 Posibles Causas

1. **Variables con espacios alrededor del `=`**: `NEXT_PUBLIC_SUPABASE_URL = https://...` (incorrecto)
2. **Variables con comillas**: `NEXT_PUBLIC_SUPABASE_URL="https://..."` (incorrecto)
3. **Variables con comentarios**: `# NEXT_PUBLIC_SUPABASE_URL=...` (incorrecto)
4. **Formato incorrecto en Easypanel**: Puede que Easypanel no esté interpretando correctamente el formato

## 🚀 Solución Rápida

1. **Ve a "Entorno" en Easypanel**
2. **Elimina todas las variables**
3. **Agrega estas 3 variables UNA POR UNA** (sin espacios, sin comillas):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://rxfcdnuycrauvybjowik.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZmNkbnV5Y3JhdXZ5Ympvd2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mjg1OTIsImV4cCI6MjA4MTQwNDU5Mn0.uKp2wRv69-OAEVHxjZnYsx_L-PV5BYRt3Ru0Wz8PkOY
   NODE_ENV=production
   ```
4. **Guarda los cambios**
5. **Reinicia el servicio** (Stop → Start)
6. **Verifica en la consola**: `env | grep NEXT_PUBLIC`

