# 🔍 Verificar si el Servidor Está Cargando las Variables

## ⚠️ Importante

El comando `export` en el Dockerfile carga las variables **solo para el proceso de Node.js**, no para el shell interactivo. Por eso `env` no las muestra, pero el servidor SÍ debería tenerlas.

## ✅ Verificar si el Servidor Está Usando las Variables

### Paso 1: Probar el Servidor Localmente

Ejecuta en la consola:

```bash
# Probar que el servidor responda
curl http://localhost:3000

# Ver la respuesta completa
curl -v http://localhost:3000

# Ver si hay errores relacionados con Supabase
curl http://localhost:3000 2>&1 | grep -i supabase
```

### Paso 2: Verificar el Proceso de Node.js

```bash
# Ver el proceso de Node.js
ps aux | grep node

# Ver las variables del proceso (si es posible)
cat /proc/$(pgrep -f "server.js")/environ 2>/dev/null | tr '\0' '\n' | grep NEXT_PUBLIC
```

### Paso 3: Crear un Script de Prueba

Crea un archivo temporal para verificar:

```bash
# Crear un script de prueba
cat > /tmp/test-env.js << 'EOF'
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'EXISTS' : 'MISSING');
console.log('NODE_ENV:', process.env.NODE_ENV);
EOF

# Ejecutar el script cargando el .env
if [ -f .env ]; then
  export $(cat .env | grep -v "^#" | xargs)
  node /tmp/test-env.js
else
  echo ".env file not found"
fi
```

## 🔍 Alternativa: Usar dotenv en el Código

Si el comando del Dockerfile no funciona, podemos usar `dotenv` para cargar el archivo .env directamente en el código.

