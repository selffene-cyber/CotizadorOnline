# 🔍 Probar el Servidor sin curl (Alpine Linux)

## ⚠️ Problema

- El puerto 3000 está escuchando ✅
- Pero no hay proceso de Node.js visible
- `curl` no está instalado en Alpine

## ✅ Soluciones Alternativas

### Opción 1: Usar wget (si está disponible)

```sh
# Probar con wget
wget -O- http://localhost:3000

# O con wget mostrando headers
wget --spider --server-response http://localhost:3000 2>&1
```

### Opción 2: Usar nc (netcat)

```sh
# Probar con netcat
echo -e "GET / HTTP/1.1\r\nHost: localhost\r\n\r\n" | nc localhost 3000
```

### Opción 3: Instalar curl

```sh
# Instalar curl en Alpine
apk add curl

# Luego probar
curl http://localhost:3000
```

### Opción 4: Verificar qué Proceso Está Escuchando en el Puerto 3000

```sh
# Ver qué proceso está usando el puerto 3000
netstat -tulnp | grep 3000

# O con lsof (si está disponible)
lsof -i :3000
```

### Opción 5: Verificar Todos los Procesos

```sh
# Ver todos los procesos
ps aux

# Buscar procesos relacionados con el servidor
ps aux | grep -E "node|server|next"
```

## 🔍 Verificar si el Servidor Está Funcionando

El puerto está escuchando, pero necesitamos verificar:
1. ¿Qué proceso está escuchando en el puerto 3000?
2. ¿El servidor responde a peticiones HTTP?
3. ¿Hay errores en los logs de Easypanel?

## 💡 Información Necesaria

Por favor, ejecuta estos comandos y comparte los resultados:

1. `netstat -tulnp | grep 3000` - Para ver qué proceso está usando el puerto
2. `ps aux` - Para ver todos los procesos
3. `wget -O- http://localhost:3000` - Para probar el servidor (si wget está disponible)
4. O instala curl: `apk add curl` y luego `curl http://localhost:3000`

