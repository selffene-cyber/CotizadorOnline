# 🔧 Solución: Internal URL Automática en Easypanel

## 🔍 Problema

Easypanel está generando automáticamente la Internal URL como:
```
https://piwisuite_cotizadorpiwisuite_app-prod:3000/
```

Y no puedes editarla manualmente.

## ✅ Solución: Cambiar el Nombre del Servicio en docker-compose.yml

Si Easypanel genera automáticamente la Internal URL basándose en el nombre del servicio, podemos cambiar el nombre del servicio para que coincida con lo que Easypanel espera.

### Opción 1: Usar el Nombre que Easypanel Genera

Easypanel parece estar usando: `piwisuite_cotizadorpiwisuite_app-prod`

Podemos cambiar el nombre del servicio en `docker-compose.yml` para que coincida:

```yaml
services:
  piwisuite_cotizadorpiwisuite_app-prod:  # ← Cambiar el nombre aquí
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
```

**PERO ESPERA**: Esto puede causar problemas. Mejor probemos la Opción 2.

### Opción 2: Verificar Cómo Easypanel Nombra los Servicios

Easypanel puede estar usando:
- `[proyecto]_[servicio]` → `piwisuite_cotizadorpiwisuite_app-prod`
- O `[servicio]` → `app-prod`

Necesitamos verificar qué nombre está usando realmente.

### Opción 3: Cambiar el Nombre del Proyecto o Servicio en Easypanel

1. En Easypanel, ve a la configuración del proyecto o servicio
2. Busca opciones para cambiar el nombre
3. Puede que al cambiar el nombre, Easypanel genere una Internal URL diferente

## 🔍 Verificar el Nombre Real del Servicio

### Paso 1: Verificar en los Logs

En los logs, el contenedor se llama `app-prod-1`, pero el servicio puede tener otro nombre.

### Paso 2: Verificar en docker-compose.yml

El servicio se llama `app-prod` en el archivo, pero Easypanel puede estar agregando un prefijo.

### Paso 3: Probar con el Nombre Completo

Si Easypanel está usando `piwisuite_cotizadorpiwisuite_app-prod`, podemos:

1. Cambiar el nombre del servicio en `docker-compose.yml` a ese nombre
2. Hacer un nuevo deploy
3. Ver si Easypanel ahora genera la Internal URL correctamente

## ✅ Solución Recomendada: Usar el Nombre que Easypanel Espera

Basándome en que Easypanel está generando `piwisuite_cotizadorpiwisuite_app-prod`, vamos a cambiar el nombre del servicio:

### Paso 1: Modificar docker-compose.yml

Cambia el nombre del servicio de `app-prod` a `piwisuite_cotizadorpiwisuite_app-prod`:

```yaml
services:
  piwisuite_cotizadorpiwisuite_app-prod:  # ← Cambiar aquí
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
```

### Paso 2: Hacer Commit y Push

```bash
git add docker-compose.yml
git commit -m "fix: cambiar nombre del servicio para que coincida con Easypanel"
git push origin main
```

### Paso 3: Hacer un Nuevo Deploy en Easypanel

1. En Easypanel, haz clic en **"Deploy"** o **"Rebuild"**
2. Espera a que complete
3. Verifica que la Internal URL ahora sea correcta

## 🔍 Alternativa: Verificar la Configuración de Easypanel

Puede que Easypanel tenga una opción para configurar el nombre del servicio o la Internal URL en otro lugar:

1. Ve a **"Settings"** o **"Config"** del servicio
2. Busca opciones de **"Networking"** o **"Service Name"**
3. Puede haber una forma de configurar el nombre del servicio allí

## 💡 Información Necesaria

Para ayudarte mejor, necesito saber:

1. **¿Puedes ver el archivo docker-compose.yml en Easypanel?** (pestaña "Fuente" o "Source")
2. **¿Qué nombre tiene el servicio allí?**
3. **¿Hay alguna opción en "Settings" o "Config" para cambiar el nombre del servicio?**

## 🚀 Próximos Pasos

1. **Verifica el nombre del servicio** en docker-compose.yml (tanto local como en Easypanel)
2. **Prueba cambiar el nombre del servicio** para que coincida con lo que Easypanel genera
3. **Haz un nuevo deploy** y verifica si funciona

