# 🔍 Probar el Servidor en el Contenedor de Easypanel

## ⚠️ Importante

No pruebes en tu máquina local. Necesitas probar **dentro del contenedor de Easypanel** usando la consola que te mostraste.

## ✅ Comandos para Ejecutar en la Consola de Easypanel

### Paso 1: Verificar que el Servidor Esté Corriendo

```bash
# Ver procesos de Node.js
ps aux | grep node

# Ver si el puerto 3000 está escuchando
netstat -tuln | grep 3000
# O
ss -tuln | grep 3000
```

### Paso 2: Probar el Servidor Localmente en el Contenedor

```bash
# Probar que el servidor responda dentro del contenedor
curl http://localhost:3000

# Ver la respuesta completa
curl -v http://localhost:3000

# Ver si hay errores
curl http://localhost:3000 2>&1
```

### Paso 3: Crear Script de Prueba para Verificar Variables

```bash
# Crear un script que cargue el .env y muestre las variables
cat > /tmp/test-vars.js << 'EOF'
const fs = require('fs');
const path = require('path');

// Cargar .env si existe
const envPath = path.join(process.cwd(), '.env');
console.log('Buscando .env en:', envPath);
if (fs.existsSync(envPath)) {
  console.log('.env encontrado!');
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('Contenido del .env:');
  console.log(envContent);
  
  envContent.split('\n').forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
        console.log(`Cargada: ${key.trim()}`);
      }
    }
  });
} else {
  console.log('.env NO encontrado');
}

console.log('\n--- Variables después de cargar .env ---');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'EXISTS: ' + process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : 'MISSING');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'EXISTS' : 'MISSING');
console.log('NODE_ENV:', process.env.NODE_ENV);
EOF

# Ejecutar el script
node /tmp/test-vars.js
```

### Paso 4: Verificar si el Servidor Está Cargando las Variables

```bash
# Ver el proceso de Node.js
ps aux | grep "server.js"

# Ver los logs del servidor (si están disponibles)
# Los logs deberían estar en Easypanel, no en la consola
```

## 🔍 Si el Servidor No Responde en el Contenedor

Si `curl http://localhost:3000` dentro del contenedor no responde:

1. **El servidor no está corriendo** - Verifica en Easypanel que el servicio esté en estado "Running"
2. **El servidor está crasheando** - Revisa los logs en Easypanel
3. **El servidor está escuchando en otro puerto** - Verifica con `netstat -tuln`

## 💡 Información Necesaria

Por favor, ejecuta estos comandos **en la consola de Easypanel** (no en tu máquina local) y comparte los resultados:

1. `ps aux | grep node` - Para ver si el servidor está corriendo
2. `netstat -tuln | grep 3000` - Para ver si el puerto está escuchando
3. `curl http://localhost:3000` - Para probar el servidor
4. `node /tmp/test-vars.js` - Para verificar que las variables se carguen

Con esa información podré identificar si el problema es:
- El servidor no está corriendo
- El servidor no está escuchando en el puerto correcto
- Las variables no se están cargando correctamente
- Hay un error en el código que impide que el servidor inicie

