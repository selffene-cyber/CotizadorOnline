# Diagnóstico de Error 502

## 🔍 ¿Qué es un Error 502?

Un error **502 Bad Gateway** significa que el servidor (Easypanel) no puede comunicarse con tu aplicación. Esto generalmente indica que:

1. **La aplicación crasheó al iniciar**
2. **Las variables de entorno no están configuradas**
3. **Hay un error en el código que impide que la app arranque**
4. **Supabase no está configurado correctamente**

## 📋 Checklist de Diagnóstico

### 1. ✅ Verificar Logs en Easypanel

**Pasos:**
1. Ve a tu aplicación en Easypanel
2. Sección **"Logs"** o **"Container Logs"**
3. Busca errores en rojo
4. Copia los últimos errores

**Qué buscar:**
- Errores de conexión a Supabase
- Errores de variables de entorno faltantes
- Errores de sintaxis
- Errores de importación

### 2. ✅ Verificar Variables de Entorno

**En Easypanel:**
1. Ve a **Environment Variables**
2. Verifica que estas variables existan:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NODE_ENV` (opcional)

**Valores esperados:**
```
NEXT_PUBLIC_SUPABASE_URL=https://rxfcdnuycrauvybjowik.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production
```

### 3. ✅ Verificar que Supabase esté Configurado

**En Supabase Dashboard:**
1. Verifica que el proyecto esté activo
2. Verifica que las tablas estén creadas (ejecutar `supabase/schema.sql`)
3. Verifica que Authentication esté habilitado

### 4. ✅ Verificar Build

**En Easypanel:**
1. Ve a la sección **"Build Logs"** o **"Deploy Logs"**
2. Verifica que el build haya sido exitoso
3. Busca errores de TypeScript o compilación

### 5. ✅ Verificar Puerto

**En Easypanel:**
1. Verifica que el puerto esté configurado como **3000**
2. Verifica que no haya conflictos de puerto

## 🐛 Errores Comunes y Soluciones

### Error: "Supabase no está configurado"
**Causa:** Variables de entorno faltantes
**Solución:** Agregar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Easypanel

### Error: "relation does not exist"
**Causa:** Tablas no creadas en Supabase
**Solución:** Ejecutar `supabase/schema.sql` en Supabase SQL Editor

### Error: "Failed to connect to Supabase"
**Causa:** URL o Key incorrectos
**Solución:** Verificar que las credenciales sean correctas

### Error: "Cannot read property of undefined"
**Causa:** Código intentando acceder a Supabase antes de inicializar
**Solución:** Verificar que `hasValidSupabaseConfig` esté funcionando

## 🔧 Pasos de Solución Rápida

### Paso 1: Revisar Logs
```bash
# En Easypanel, ve a Logs y copia los errores
```

### Paso 2: Verificar Variables
```bash
# Asegúrate de que estas variables estén en Easypanel:
NEXT_PUBLIC_SUPABASE_URL=https://rxfcdnuycrauvybjowik.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Paso 3: Redeploy
```bash
# En Easypanel, haz clic en "Redeploy" o "Restart"
```

### Paso 4: Verificar Supabase
```bash
# En Supabase Dashboard:
# 1. Verifica que el proyecto esté activo
# 2. Ejecuta el script SQL si no lo has hecho
# 3. Verifica que Authentication esté habilitado
```

## 📞 Información para Debugging

**Comparte conmigo:**
1. **Logs de Easypanel** (últimos 50-100 líneas)
2. **Variables de entorno configuradas** (sin mostrar valores sensibles completos)
3. **Estado del build** (¿fue exitoso?)
4. **Mensaje de error específico** (si hay alguno)

## 🚀 Próximos Pasos

1. **Revisa los logs en Easypanel** y compártelos
2. **Verifica las variables de entorno**
3. **Verifica que Supabase esté configurado**
4. **Intenta hacer redeploy**

Si después de estos pasos sigue fallando, comparte los logs y te ayudo a identificar el problema específico.

