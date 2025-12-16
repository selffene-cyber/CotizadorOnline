# 🔧 Corregir Variables de Entorno en Easypanel

## ❌ Problema

Las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` **NO se están inyectando** en el contenedor, aunque están configuradas en Easypanel.

## ✅ Solución Paso a Paso

### Paso 1: Verificar el Toggle "Crear archivo .env"

En la sección "Variables de entorno" de Easypanel:

1. **¿Está activado el toggle "Crear archivo .env"?**
   - Si está **activado** (azul): Las variables se guardan en un archivo `.env` dentro del contenedor
   - Si está **desactivado** (gris): Las variables se inyectan directamente como variables de entorno

### Paso 2: Si el Toggle Está Activado

Si "Crear archivo .env" está activado:

1. **Desactiva el toggle** (cámbialo a gris)
2. **Guarda los cambios**
3. **Reinicia el servicio** (Stop → Start)
4. **Verifica en la consola**: `env | grep NEXT_PUBLIC`

**O alternativamente:**

Si prefieres usar el archivo .env:

1. **Mantén el toggle activado**
2. **Verifica en la consola** que el archivo .env exista:
   ```bash
   ls -la .env
   cat .env
   ```
3. Si el archivo existe, las variables deberían estar ahí

### Paso 3: Verificar el Formato de las Variables

En Easypanel, las variables deben estar **exactamente así** (sin espacios, sin comillas):

```
NEXT_PUBLIC_SUPABASE_URL=https://rxfcdnuycrauvybjowik.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZmNkbnV5Y3JhdXZ5Ympvd2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mjg1OTIsImV4cCI6MjA4MTQwNDU5Mn0.uKp2wRv69-OAEVHxjZnYsx_L-PV5BYRt3Ru0Wz8PkOY
NODE_ENV=production
```

**❌ INCORRECTO:**
```
NEXT_PUBLIC_SUPABASE_URL = https://...  (con espacios)
NEXT_PUBLIC_SUPABASE_URL="https://..."  (con comillas)
# NEXT_PUBLIC_SUPABASE_URL=...  (con comentario)
```

**✅ CORRECTO:**
```
NEXT_PUBLIC_SUPABASE_URL=https://rxfcdnuycrauvybjowik.supabase.co
```

### Paso 4: Eliminar y Recrear las Variables

Si las variables están mal formateadas:

1. **Elimina TODAS las variables** de la sección "Variables de entorno"
2. **Agrega las 3 variables UNA POR UNA**:
   - Primera: `NEXT_PUBLIC_SUPABASE_URL` = `https://rxfcdnuycrauvybjowik.supabase.co`
   - Segunda: `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Tercera: `NODE_ENV` = `production`
3. **Desactiva el toggle "Crear archivo .env"** (si está activado)
4. **Guarda los cambios**
5. **Haz un DEPLOY COMPLETO** (no solo restart):
   - Haz clic en **"Deploy"** o **"Rebuild"**
   - Esto reconstruirá el contenedor con las variables correctas

### Paso 5: Verificar en la Consola

Después del deploy, ejecuta en la consola:

```bash
# Verificar variables de entorno
env | grep NEXT_PUBLIC

# Deberías ver:
# NEXT_PUBLIC_SUPABASE_URL=https://rxfcdnuycrauvybjowik.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

Si el toggle "Crear archivo .env" está activado, verifica el archivo:

```bash
# Verificar si existe .env
ls -la .env

# Ver el contenido
cat .env
```

## 🔍 Verificar en Easypanel

Antes de hacer el deploy, verifica en Easypanel que:

1. **Las 3 variables estén listadas** en "Variables de entorno"
2. **No tengan espacios** alrededor del `=`
3. **No tengan comillas** en los valores
4. **El toggle "Crear archivo .env"** esté **desactivado** (recomendado)

## 🚀 Solución Rápida

1. **Ve a "Entorno" en Easypanel**
2. **Desactiva el toggle "Crear archivo .env"** (si está activado)
3. **Elimina todas las variables**
4. **Agrega estas 3 variables UNA POR UNA** (sin espacios, sin comillas):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://rxfcdnuycrauvybjowik.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZmNkbnV5Y3JhdXZ5Ympvd2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mjg1OTIsImV4cCI6MjA4MTQwNDU5Mn0.uKp2wRv69-OAEVHxjZnYsx_L-PV5BYRt3Ru0Wz8PkOY
   NODE_ENV=production
   ```
5. **Guarda los cambios**
6. **Haz un DEPLOY COMPLETO** (Deploy/Rebuild, no solo restart)
7. **Espera 3-5 minutos** a que complete
8. **Verifica en la consola**: `env | grep NEXT_PUBLIC`

## 💡 Importante

- **NO uses solo "Restart"** - necesitas hacer un **Deploy completo** para que las variables se inyecten
- **Desactiva "Crear archivo .env"** - es más confiable usar variables de entorno directas
- **Verifica el formato** - sin espacios, sin comillas, sin comentarios

