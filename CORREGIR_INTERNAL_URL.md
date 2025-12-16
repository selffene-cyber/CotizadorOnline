# ✅ Corrección de Internal URL

## Problema Identificado

La Internal URL actual es:
```
http://piwisuite_cotizadorpiwisuite:3000/
```

Pero el servicio en `docker-compose.yml` se llama `app-prod`, por lo que la Internal URL debería ser:
```
http://app-prod:3000/
```

O si Easypanel agrega un prefijo basado en el nombre del proyecto:
```
http://piwisuite_cotizadorpiwisuite-app-prod:3000/
```

## ✅ Solución: Cambiar la Internal URL

### Paso 1: Editar el Dominio

1. En Easypanel, ve a tu servicio `piwisuite / cotizadorpiwisuite`
2. Ve a la pestaña **"Dominios"**
3. Haz clic en el **icono de lápiz (editar)** del dominio `cot.piwisuite.cl`
4. Cambia la **Internal URL** de:
   ```
   http://piwisuite_cotizadorpiwisuite:3000/
   ```
   a:
   ```
   http://app-prod:3000/
   ```
5. Guarda los cambios

### Paso 2: Si `app-prod` No Funciona

Si después de cambiar a `app-prod` sigue el error, prueba con el nombre completo:

1. Edita el dominio nuevamente
2. Cambia la Internal URL a:
   ```
   http://piwisuite_cotizadorpiwisuite-app-prod:3000/
   ```
3. Guarda los cambios

### Paso 3: Verificar

Después de cambiar la Internal URL:

1. El dominio debería mostrar estado **"Active"** o **"Verified"**
2. Espera 30 segundos
3. Intenta acceder a `https://cot.piwisuite.cl`
4. Debería funcionar correctamente

## 🔍 Cómo Verificar el Nombre Correcto

Si ninguna de las opciones funciona, puedes verificar el nombre exacto del servicio:

1. En Easypanel, ve a tu servicio
2. Ve a la pestaña **"Fuente"** (Source)
3. Abre `docker-compose.yml`
4. El nombre del servicio está en la línea `services:` → `app-prod:`
5. Easypanel puede agregar un prefijo como `piwisuite_cotizadorpiwisuite-` o `piwisuite_cotizadorpiwisuite_`

O también puedes:

1. En los logs, el contenedor se llama `app-prod-1`
2. El nombre del servicio (sin el `-1`) es `app-prod`
3. Pero en la red interna de Docker, Easypanel puede agregar un prefijo

## 📋 Resumen

**Cambia la Internal URL de:**
```
http://piwisuite_cotizadorpiwisuite:3000/
```

**A (prueba primero):**
```
http://app-prod:3000/
```

**O si no funciona:**
```
http://piwisuite_cotizadorpiwisuite-app-prod:3000/
```

