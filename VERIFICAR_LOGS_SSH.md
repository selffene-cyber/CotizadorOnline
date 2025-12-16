# 🔍 Verificar Logs del Contenedor vía SSH

## Opción 1: Conectarse por SSH y Ver Logs del Contenedor

Si tienes acceso SSH al servidor de Easypanel:

### Paso 1: Conectarse al Servidor

```bash
ssh root@[IP_DEL_SERVIDOR]
```

O si Easypanel te da un hostname:
```bash
ssh root@[HOSTNAME]
```

### Paso 2: Ver los Logs del Contenedor

Una vez conectado, ejecuta estos comandos:

```bash
# Ver todos los contenedores corriendo
docker ps

# Buscar el contenedor de tu aplicación (debería llamarse algo como piwisuite_cotizadorpiwisuite-app-prod-1)
docker ps | grep cotizador

# Ver los logs del contenedor (reemplaza CONTAINER_NAME con el nombre real)
docker logs CONTAINER_NAME --tail 100

# O ver los logs en tiempo real
docker logs CONTAINER_NAME -f
```

### Paso 3: Buscar Errores Específicos

```bash
# Ver logs y filtrar por errores
docker logs CONTAINER_NAME --tail 200 | grep -i error

# Ver logs y filtrar por "supabase"
docker logs CONTAINER_NAME --tail 200 | grep -i supabase

# Ver logs y filtrar por "failed"
docker logs CONTAINER_NAME --tail 200 | grep -i failed
```

## Opción 2: Ver Logs desde Easypanel (Más Fácil)

Es más fácil ver los logs directamente desde Easypanel:

1. En Easypanel, ve a tu servicio `piwisuite / cotizadorpiwisuite`
2. Ve a la pestaña **"Registros"** o **"Logs"**
3. Asegúrate de que el filtro esté en **"app-prod"** o **"Todo"** (no "Build")
4. Desplázate hacia abajo para ver los logs más recientes
5. Busca líneas que contengan errores

## Opción 3: Verificar Variables de Entorno en el Contenedor

Si quieres verificar que las variables de entorno estén disponibles en el contenedor:

```bash
# Conectarse al contenedor
docker exec -it CONTAINER_NAME sh

# Dentro del contenedor, verificar variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
echo $NODE_ENV

# Salir del contenedor
exit
```

## 🔍 Qué Buscar en los Logs

### Errores Comunes:

1. **Error de Variables de Entorno:**
   ```
   Error: supabaseUrl is required
   ```
   → Las variables no están disponibles en runtime

2. **Error de Conexión a Supabase:**
   ```
   Error: connect ECONNREFUSED
   Error: Failed to fetch
   ```
   → Problema de conexión a Supabase

3. **Error de Autenticación:**
   ```
   Error: useAuth must be used within an AuthProvider
   ```
   → Problema con el contexto de autenticación

4. **Error de Módulo:**
   ```
   Error: Cannot find module '@supabase/supabase-js'
   ```
   → Dependencias faltantes

## 📋 Comandos Útiles

```bash
# Ver estado del contenedor
docker ps -a | grep cotizador

# Ver logs de las últimas 100 líneas
docker logs --tail 100 CONTAINER_NAME

# Ver logs en tiempo real
docker logs -f CONTAINER_NAME

# Reiniciar el contenedor
docker restart CONTAINER_NAME

# Ver variables de entorno del contenedor
docker inspect CONTAINER_NAME | grep -A 20 Env
```

## 💡 Nota Importante

Si no puedes conectarte por SSH o prefieres usar Easypanel:
- Es más fácil ver los logs directamente desde la interfaz de Easypanel
- Los logs deberían mostrar el mismo error que verías por SSH

