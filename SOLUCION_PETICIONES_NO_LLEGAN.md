# 🔧 Solución: Las Peticiones No Llegan al Servidor

## ✅ Problema Identificado

- ✅ El servidor está corriendo (`✓ Ready in 164ms`)
- ✅ El servidor está escuchando en el puerto 3000
- ❌ **Las peticiones NO están llegando al servidor** (no aparecen logs)
- ❌ El problema está en la configuración del proxy/dominio de Easypanel

## 🔍 Diagnóstico: Verificar Configuración de Easypanel

### Paso 1: Verificar el Estado del Servicio

1. En Easypanel, ve a tu servicio `piwisuite / cotizadorpiwisuite`
2. Verifica que el estado sea **"Running"** (verde)
3. Si está en otro estado, haz clic en **"Reiniciar"** o **"Start"**

### Paso 2: Verificar la Configuración del Dominio

1. En Easypanel, ve a la sección **"Dominios"** o **"Domains"**
2. Busca el dominio `cot.piwisuite.cl`
3. Haz clic en **"Editar"** o el icono de lápiz
4. Verifica la configuración:

#### ✅ Configuración Correcta:

**Sección "Destino" (Internal URL):**
- **Protocolo**: `HTTP` (no HTTPS)
- **Puerto**: `3000`
- **Ruta**: `/` (una sola barra, sin espacios)
- **Compose Service**: `app-prod` (exactamente así, sin prefijos)

**Sección "HTTPS" (External URL):**
- **HTTPS**: Activado ✅
- **Host**: `cot.piwisuite.cl`
- **Ruta**: `/` (una sola barra, sin espacios)

### Paso 3: Verificar el Nombre del Servicio

1. En Easypanel, ve a tu servicio
2. Busca el nombre del servicio en la parte superior
3. Debería ser algo como: `app-prod` o `cotizadorpiwisuite`
4. **El nombre en "Compose Service" debe coincidir exactamente**

### Paso 4: Verificar el Puerto

1. En Easypanel, ve a la configuración del servicio
2. Busca la sección **"Puertos"** o **"Ports"**
3. Verifica que el puerto **3000** esté expuesto
4. Si no está, agrega el puerto 3000

## 🔧 Soluciones

### Solución 1: Verificar Internal URL

El Internal URL debe ser exactamente:
```
http://app-prod:3000/
```

**NO debe ser:**
- ❌ `https://app-prod:3000/` (HTTPS interno)
- ❌ `http://piwisuite_cotizadorpiwisuite_app-prod:3000/` (nombre largo)
- ❌ `http://localhost:3000/` (localhost no funciona entre contenedores)
- ❌ `http://app-prod:3000` (sin la barra final)

### Solución 2: Verificar el Nombre del Servicio

1. En Easypanel, ve a tu servicio
2. Busca el nombre real del servicio (puede estar en la URL o en la parte superior)
3. Si el nombre es diferente a `app-prod`, actualiza el Internal URL para usar el nombre correcto

### Solución 3: Probar con el Nombre Completo del Servicio

Si Easypanel está generando un nombre largo para el servicio, prueba con:
```
http://piwisuite_cotizadorpiwisuite_app-prod:3000/
```

O el nombre que Easypanel muestre en la configuración del servicio.

### Solución 4: Verificar la Red de Docker

1. En Easypanel, verifica que el servicio esté en la misma red que el proxy
2. Easypanel debería manejar esto automáticamente, pero verifica que no haya configuraciones de red personalizadas

## 🧪 Prueba de Diagnóstico

### Prueba 1: Verificar que el Servidor Está Escuchando

En la consola de Easypanel (SSH), ejecuta:
```sh
# Verificar que el puerto 3000 está escuchando
netstat -tuln | grep 3000

# Debería mostrar algo como:
# tcp        0      0 0.0.0.0:3000            0.0.0.0:*               LISTEN
```

### Prueba 2: Probar desde Dentro del Contenedor

En la consola de Easypanel (SSH), ejecuta:
```sh
# Probar que el servidor responde localmente
wget -O- http://localhost:3000/api/test

# O si wget no está disponible:
echo -e "GET /api/test HTTP/1.1\r\nHost: localhost\r\n\r\n" | nc localhost 3000
```

Si esto funciona, el servidor está bien y el problema es el proxy.

## 📋 Checklist de Verificación

Antes de probar nuevamente, verifica:

- [ ] El servicio está en estado "Running"
- [ ] El Internal URL es `http://app-prod:3000/` (o el nombre correcto del servicio)
- [ ] El protocolo es HTTP (no HTTPS) para el Internal URL
- [ ] El puerto es 3000
- [ ] La ruta es `/` (sin espacios)
- [ ] El nombre del servicio en "Compose Service" coincide con el nombre real
- [ ] El puerto 3000 está expuesto en la configuración del servicio

## 💡 Si Nada Funciona

Si después de verificar todo lo anterior las peticiones siguen sin llegar:

1. **Reinicia el servicio** en Easypanel
2. **Elimina y vuelve a crear el dominio** en Easypanel
3. **Verifica los logs del proxy de Easypanel** (si están disponibles)
4. **Contacta al soporte de Easypanel** con los detalles del problema

## 🔍 Información para Compartir

Si necesitas ayuda adicional, comparte:

1. **Screenshot de la configuración del dominio** en Easypanel
2. **Screenshot de la configuración del servicio** (puertos, nombre, etc.)
3. **El resultado de `netstat -tuln | grep 3000`** en la consola SSH
4. **El resultado de probar `wget http://localhost:3000/api/test`** en la consola SSH

