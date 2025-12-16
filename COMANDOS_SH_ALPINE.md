# 🔧 Comandos para Alpine Linux (sh, no bash)

## ⚠️ Importante

El contenedor usa **Alpine Linux** con `sh`, no `bash`. Los comandos deben ser compatibles con `sh`.

## ✅ Comandos Corregidos para sh

### Paso 1: Verificar que el Servidor Esté Corriendo

```sh
# Ver procesos de Node.js
ps aux | grep node

# Ver si el puerto 3000 está escuchando
netstat -tuln | grep 3000
```

### Paso 2: Probar el Servidor Localmente

```sh
# Probar que el servidor responda
curl http://localhost:3000

# Ver la respuesta completa
curl -v http://localhost:3000
```

### Paso 3: Crear Script de Prueba (Compatible con sh)

```sh
# Crear el script directamente (sin heredoc)
echo 'const fs = require("fs");
const path = require("path");

const envPath = path.join(process.cwd(), ".env");
console.log("Buscando .env en:", envPath);
if (fs.existsSync(envPath)) {
  console.log(".env encontrado!");
  const envContent = fs.readFileSync(envPath, "utf8");
  console.log("Contenido del .env:");
  console.log(envContent);
  
  envContent.split("\n").forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith("#")) {
      const [key, ...valueParts] = trimmedLine.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim();
        process.env[key.trim()] = value;
        console.log("Cargada:", key.trim());
      }
    }
  });
} else {
  console.log(".env NO encontrado");
}

console.log("\n--- Variables después de cargar .env ---");
console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "EXISTS" : "MISSING");
console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "EXISTS" : "MISSING");
console.log("NODE_ENV:", process.env.NODE_ENV);' > /tmp/test-vars.js

# Ejecutar el script
node /tmp/test-vars.js
```

### Paso 4: Verificar Archivos

```sh
# Ver si existe .env
ls -la .env

# Ver el contenido de .env
cat .env

# Ver si existe server.js
ls -la server.js

# Ver el directorio actual
pwd
```

## 🔍 Comandos Útiles Adicionales

```sh
# Ver procesos corriendo
ps aux

# Ver puertos en uso
netstat -tuln

# Ver variables de entorno del proceso actual
env

# Verificar versión de Node.js
node --version

# Verificar que curl esté disponible
which curl
```

## 💡 Nota sobre Alpine Linux

Alpine Linux es una distribución minimalista que usa `sh` en lugar de `bash`. Algunas características de bash no están disponibles:
- No hay `<< 'EOF'` (heredoc)
- Algunos comandos pueden tener sintaxis ligeramente diferente
- Usa `sh` como shell por defecto

