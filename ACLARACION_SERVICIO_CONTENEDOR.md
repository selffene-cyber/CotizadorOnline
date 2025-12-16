# 🔍 Aclaración: Servicio vs Contenedor

## ⚠️ Confusión Común

Hay una diferencia importante entre:
- **Nombre del servicio** (en docker-compose.yml): `app-prod`
- **Nombre del contenedor** (en Docker): `app-prod-1`

## ✅ Explicación

### Nombre del Servicio (`app-prod`)
- Este es el nombre que defines en `docker-compose.yml`
- Este es el nombre que usas en la **Internal URL** de Easypanel
- Docker Compose crea una red interna donde los servicios se comunican por este nombre

### Nombre del Contenedor (`app-prod-1`)
- Este es el nombre del contenedor Docker real
- Docker agrega el `-1` automáticamente (puede ser `-2`, `-3`, etc. si hay múltiples instancias)
- Este NO es el nombre que debes usar en la Internal URL

## ✅ Configuración Correcta

### En docker-compose.yml:
```yaml
services:
  app-prod:  # ← Este es el nombre del servicio
    build:
      context: .
      dockerfile: Dockerfile
```

### En Easypanel - Internal URL:
```
http://app-prod:3000/  # ← Usa el nombre del SERVICIO, no del contenedor
```

**NO uses:**
```
http://app-prod-1:3000/  # ❌ Esto es el nombre del contenedor, no funciona
```

## 🔍 Por Qué `app-prod-1` Da Error 502

Cuando usas `app-prod-1` en la Internal URL:
- Easypanel/Traefik intenta encontrar un servicio llamado `app-prod-1`
- Pero ese servicio no existe (solo existe `app-prod`)
- Por eso da error 502 (Bad Gateway) - no puede encontrar el servicio

## ✅ Solución

### Paso 1: Cambiar la Internal URL de Vuelta

1. En Easypanel, ve a **"Dominios"**
2. Edita el dominio `cot.piwisuite.cl`
3. Cambia la Internal URL a:
   ```
   http://app-prod:3000/
   ```
4. Guarda los cambios

### Paso 2: Verificar

Después de cambiar:
- El error 502 debería desaparecer
- Si vuelve el error 500, entonces el problema es otro (no el nombre del servicio)

## 🔍 Sobre el Error 500 Original

Si después de cambiar a `app-prod` vuelve el error 500, entonces el problema NO es el nombre del servicio, sino:

1. **Error en el código de la aplicación**
2. **Variables de entorno no disponibles en runtime**
3. **Error de conexión a Supabase**
4. **Error en el middleware o routing**

## 📋 Resumen

- ✅ **Usa**: `http://app-prod:3000/` (nombre del servicio)
- ❌ **NO uses**: `http://app-prod-1:3000/` (nombre del contenedor)
- 🔍 **El error 500** es un problema diferente, no relacionado con el nombre del servicio

