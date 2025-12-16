# 🔍 Probar el Servidor Directamente

## ⚠️ Importante

Las variables no aparecen en `env` porque se cargan solo en el proceso de Node.js, no en el shell. Pero el servidor SÍ debería tenerlas.

## ✅ Verificar si el Servidor Está Funcionando

Ejecuta estos comandos en la consola:

### Paso 1: Probar el Servidor Localmente

```bash
# Probar que el servidor responda
curl http://localhost:3000

# Ver la respuesta completa con headers
curl -v http://localhost:3000

# Ver si hay errores
curl http://localhost:3000 2>&1
```

### Paso 2: Verificar el Proceso de Node.js

```bash
# Ver el proceso de Node.js
ps aux | grep node

# Ver si el servidor está escuchando
netstat -tuln | grep 3000
```

### Paso 3: Crear un Script de Prueba para Verificar Variables

```bash
# Crear un script que cargue el .env y muestre las variables
cat > /tmp/test-vars.js << 'EOF'
const fs = require('fs');
const path = require('path');

// Cargar .env si existe
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    }
  });
}

console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'EXISTS' : 'MISSING');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'EXISTS' : 'MISSING');
console.log('NODE_ENV:', process.env.NODE_ENV);
EOF

# Ejecutar el script
node /tmp/test-vars.js
```

## 🔍 Si el Servidor No Responde

Si `curl http://localhost:3000` no responde o da error:

1. **Verifica que el servidor esté corriendo:**
   ```bash
   ps aux | grep "server.js"
   ```

2. **Verifica los logs del servidor** en Easypanel para ver si hay errores

3. **Reinicia el servicio** en Easypanel

## 💡 Solución Alternativa: Desactivar "Crear archivo .env"

Si el servidor sigue sin funcionar, prueba:

1. **Desactiva el toggle "Crear archivo .env"** en Easypanel
2. **Elimina todas las variables**
3. **Agrega las variables UNA POR UNA** (sin el toggle activado)
4. **Guarda y haz un deploy completo**
5. **Verifica**: `env | grep NEXT_PUBLIC`

Esto hará que Easypanel inyecte las variables directamente como variables de entorno del sistema, en lugar de crear un archivo `.env`.

