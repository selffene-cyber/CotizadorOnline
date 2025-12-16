# 🔧 Comandos Útiles en la Consola de Easypanel

## 📋 Comandos Básicos de Diagnóstico

### Ver Variables de Entorno

```bash
# Ver todas las variables de entorno
env

# Ver una variable específica
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
echo $NODE_ENV

# Verificar que las variables estén configuradas
env | grep NEXT_PUBLIC
env | grep NODE_ENV
```

### Ver Procesos Corriendo

```bash
# Ver todos los procesos
ps aux

# Ver procesos de Node.js
ps aux | grep node

# Ver el proceso principal
ps aux | grep "server.js"
```

### Ver Archivos y Estructura

```bash
# Ver el directorio actual
pwd

# Listar archivos en el directorio actual
ls -la

# Ver la estructura de directorios
ls -la /app

# Ver si existe el archivo server.js
ls -la server.js

# Ver el contenido del directorio .next
ls -la .next/
```

### Verificar que el Servidor Esté Escuchando

```bash
# Ver qué puertos están en uso
netstat -tuln

# O con ss (más moderno)
ss -tuln

# Verificar que el puerto 3000 esté escuchando
netstat -tuln | grep 3000
# O
ss -tuln | grep 3000
```

### Probar Conexiones

```bash
# Probar conexión a Supabase
curl -I https://rxfcdnuycrauvybjowik.supabase.co

# Probar que el servidor local responda
curl http://localhost:3000

# Ver la respuesta completa
curl -v http://localhost:3000
```

### Ver Logs del Proceso

```bash
# Si el proceso está corriendo, los logs deberían estar en stdout/stderr
# Pero puedes verificar el proceso
ps aux | grep node

# Ver si hay archivos de log
find /app -name "*.log" 2>/dev/null

# Ver los últimos archivos modificados
ls -lt /app | head -10
```

### Verificar Configuración de Next.js

```bash
# Ver si existe next.config.js o next.config.ts
ls -la next.config.*

# Ver el contenido (si es texto)
cat next.config.js 2>/dev/null || cat next.config.ts 2>/dev/null
```

### Verificar Dependencias

```bash
# Ver si node_modules existe
ls -la node_modules/

# Verificar versión de Node.js
node --version

# Verificar versión de npm
npm --version
```

### Verificar Archivos de Build

```bash
# Ver si existe .next/standalone
ls -la .next/standalone/

# Ver si existe server.js
ls -la server.js

# Ver el contenido del directorio .next
ls -la .next/
```

## 🔍 Comandos para Diagnosticar el Error 500/404

### Verificar Variables de Entorno Específicas

```bash
# Verificar que las variables de Supabase estén configuradas
echo "SUPABASE_URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "SUPABASE_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:20}..." # Solo primeros 20 caracteres
echo "NODE_ENV: $NODE_ENV"
```

### Probar el Servidor Localmente

```bash
# Probar que el servidor responda en localhost
curl http://localhost:3000

# Ver headers completos
curl -v http://localhost:3000

# Probar una ruta específica
curl http://localhost:3000/login
```

### Verificar Archivos de la Aplicación

```bash
# Ver estructura de app/
ls -la app/

# Ver si existe app/page.tsx
ls -la app/page.tsx

# Ver si existe app/layout.tsx
ls -la app/layout.tsx
```

### Verificar Middleware

```bash
# Ver si existe middleware.ts
ls -la middleware.ts

# Ver el contenido
cat middleware.ts
```

## 🚀 Comandos Útiles Adicionales

### Ver Uso de Recursos

```bash
# Ver uso de memoria
free -h

# Ver uso de disco
df -h

# Ver uso de CPU (si está disponible)
top -n 1
```

### Ver Información del Sistema

```bash
# Ver información del sistema
uname -a

# Ver versión del sistema operativo
cat /etc/os-release
```

### Buscar Errores en Archivos

```bash
# Buscar archivos que contengan "error" (case insensitive)
grep -r -i "error" /app --include="*.js" --include="*.ts" 2>/dev/null | head -20

# Buscar archivos que contengan "supabase"
grep -r -i "supabase" /app --include="*.js" --include="*.ts" 2>/dev/null | head -20
```

## 📋 Checklist de Diagnóstico Rápido

Ejecuta estos comandos en orden para diagnosticar:

```bash
# 1. Verificar variables de entorno
env | grep NEXT_PUBLIC

# 2. Verificar que el servidor esté corriendo
ps aux | grep node

# 3. Verificar que el puerto 3000 esté escuchando
netstat -tuln | grep 3000

# 4. Probar que el servidor responda localmente
curl http://localhost:3000

# 5. Verificar estructura de archivos
ls -la /app
ls -la server.js
```

## 💡 Comandos Específicos para Tu Problema

Para diagnosticar el error 500/404, ejecuta estos comandos:

```bash
# 1. Verificar variables de entorno
echo "NEXT_PUBLIC_SUPABASE_URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "NODE_ENV: $NODE_ENV"

# 2. Verificar que el servidor esté corriendo
ps aux | grep "server.js"

# 3. Probar el servidor localmente
curl -v http://localhost:3000

# 4. Verificar archivos de build
ls -la .next/standalone/
ls -la server.js

# 5. Verificar configuración
cat next.config.ts 2>/dev/null || cat next.config.js 2>/dev/null
```

