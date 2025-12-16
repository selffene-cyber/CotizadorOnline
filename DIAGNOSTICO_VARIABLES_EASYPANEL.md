# 🔍 Diagnóstico: Variables No Se Inyectan en Easypanel

## ❌ Problema

Las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` no aparecen ni como variables de entorno ni en el archivo `.env`, incluso después de deploy y reinicio.

## ✅ Diagnóstico Paso a Paso

### Paso 1: Verificar si Existe el Archivo .env

Con el toggle "Crear archivo .env" **activado**, ejecuta en la consola:

```bash
# Verificar si existe .env
ls -la .env

# Si existe, ver el contenido
cat .env

# Ver todas las líneas (incluso si hay muchas)
cat .env | head -20
```

### Paso 2: Verificar Todas las Variables de Entorno

Ejecuta en la consola para ver TODAS las variables:

```bash
# Ver todas las variables
env

# O buscar cualquier mención de SUPABASE
env | grep -i supabase

# O buscar cualquier mención de NEXT
env | grep -i next
```

### Paso 3: Verificar el Formato en Easypanel

En Easypanel, en la sección "Variables de entorno", verifica:

1. **¿Cómo están escritas exactamente las variables?**
   - ¿Tienen espacios alrededor del `=`?
   - ¿Tienen comillas?
   - ¿Hay comentarios (#) antes de ellas?

2. **Toma una captura de pantalla** de cómo están configuradas las variables en Easypanel

### Paso 4: Probar con Variables de Prueba

Para verificar si Easypanel está inyectando variables en general:

1. En Easypanel, agrega una variable de prueba:
   ```
   TEST_VAR=test_value
   ```
2. Guarda los cambios
3. Haz un deploy completo
4. En la consola, ejecuta:
   ```bash
   env | grep TEST
   ```
5. Si `TEST_VAR` aparece, entonces Easypanel SÍ inyecta variables, pero hay un problema específico con `NEXT_PUBLIC_*`

### Paso 5: Verificar si el Problema es con NEXT_PUBLIC_

Algunos sistemas tienen problemas con variables que empiezan con `NEXT_PUBLIC_`. Prueba:

1. En Easypanel, agrega una variable sin el prefijo:
   ```
   SUPABASE_URL=https://rxfcdnuycrauvybjowik.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
2. Guarda y haz deploy
3. Verifica en la consola:
   ```bash
   env | grep SUPABASE
   ```

## 🔍 Posibles Causas

### Causa 1: Formato Incorrecto en Easypanel

Las variables pueden estar mal formateadas. Verifica que sean:
- Sin espacios: `NEXT_PUBLIC_SUPABASE_URL=https://...` ✅
- No: `NEXT_PUBLIC_SUPABASE_URL = https://...` ❌

### Causa 2: Easypanel No Inyecta Variables con NEXT_PUBLIC_

Algunos sistemas filtran variables que empiezan con ciertos prefijos. Prueba con variables sin el prefijo.

### Causa 3: Problema con Docker Compose

Easypanel puede no estar inyectando las variables correctamente en Docker Compose. Verifica el archivo `docker-compose.yml` en Easypanel.

### Causa 4: Variables en Formato Incorrecto

Si el toggle "Crear archivo .env" está activado, las variables deben estar en formato de archivo .env. Si está desactivado, deben estar como variables de entorno.

## 🚀 Solución Alternativa: Usar Variables Sin NEXT_PUBLIC_

Si Easypanel no inyecta variables con `NEXT_PUBLIC_`, podemos modificar el código para usar variables sin el prefijo:

1. En Easypanel, configura:
   ```
   SUPABASE_URL=https://rxfcdnuycrauvybjowik.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NODE_ENV=production
   ```

2. Modificar `supabase/config.ts` para usar estas variables

## 💡 Información Necesaria

Para diagnosticar mejor, necesito:

1. **¿Existe el archivo `.env` cuando el toggle está activado?**
   - Ejecuta: `ls -la .env` y `cat .env`

2. **¿Aparece alguna variable cuando ejecutas `env`?**
   - Ejecuta: `env | grep -i supabase` o `env | grep -i next`

3. **¿Cómo están escritas exactamente las variables en Easypanel?**
   - Toma una captura de pantalla o copia exactamente cómo están

4. **¿Funciona la variable de prueba `TEST_VAR`?**
   - Prueba agregar una variable simple y ver si aparece

