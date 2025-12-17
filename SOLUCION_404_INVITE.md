# 🔧 Solución: Error 404 al Aceptar Invitación

## 🔍 Problema

Al hacer clic en el link de invitación del email, aparece un error 404: "This page could not be found."

## ✅ Soluciones

### Solución 1: Rebuild de la Aplicación (Más Probable)

**Si estás en producción (Easypanel):**

1. Ve a **Easypanel** → Tu aplicación
2. Haz clic en **"Redeploy"** o **"Rebuild"**
3. Espera a que termine el deploy
4. Prueba nuevamente el link de invitación

**Si estás en desarrollo local:**

1. Detén el servidor (`Ctrl+C`)
2. Ejecuta: `npm run dev`
3. Prueba nuevamente el link

### Solución 2: Verificar que la Ruta Esté Correcta

El link en el email debería ser:
```
https://cot.piwisuite.cl/invite/[token]
```

**Verifica:**
1. Abre el email de invitación
2. Revisa el link del botón "Aceptar Invitación"
3. Debería ser: `https://cot.piwisuite.cl/invite/[token]`
4. NO debería ser: `https://cot.piwisuite.cl/invite/invite/[token]` (duplicado)

### Solución 3: Verificar el Archivo Existe

El archivo debería estar en:
```
app/invite/[token]/page.tsx
```

**Verifica:**
1. Asegúrate de que el archivo existe
2. Si no existe, créalo (ya está creado en el proyecto)
3. Haz commit y push si es necesario

### Solución 4: Limpiar Caché y Rebuild

**En desarrollo local:**
```bash
# Limpiar caché de Next.js
rm -rf .next

# Rebuild
npm run build

# Iniciar servidor
npm run dev
```

**En producción (Easypanel):**
1. Ve a Easypanel → Tu aplicación
2. Haz clic en **"Redeploy"** o **"Rebuild"**
3. Esto limpiará el caché y reconstruirá la aplicación

### Solución 5: Verificar Middleware

El middleware debería permitir la ruta `/invite`. Verifica que `middleware.ts` tenga:

```typescript
const nonTenantRoutes = ['login', 'admin', 'dashboard', 'invite', 'api', '_next', 'favicon.ico', 'auth', 'onboarding'];
```

Si `'invite'` no está en la lista, agrégalo.

## 🧪 Probar la Ruta Directamente

1. **Obtén el token de la invitación:**
   - Ve a `/admin` → Empresas → Ver Miembros
   - Busca la invitación en la lista
   - Copia el token

2. **Prueba la URL directamente:**
   ```
   https://cot.piwisuite.cl/invite/[token]
   ```

3. **Si funciona:**
   - El problema era el link en el email
   - Verifica cómo se construye la URL en `supabase/email.ts`

4. **Si no funciona:**
   - El problema es el routing
   - Necesitas hacer rebuild

## 📝 Verificar URL en el Email

La URL se construye en `supabase/email.ts` línea 100-102:

```typescript
const invitationUrl = typeof window !== 'undefined' 
  ? `${window.location.origin}/invite/${invitationToken}`
  : `https://cot.piwisuite.cl/invite/${invitationToken}`;
```

**Verifica que:**
- La URL sea correcta (sin duplicados)
- El dominio sea `cot.piwisuite.cl`
- El path sea `/invite/[token]` (no `/invite/invite/[token]`)

## ✅ Checklist

- [ ] Archivo `app/invite/[token]/page.tsx` existe
- [ ] `'invite'` está en `nonTenantRoutes` del middleware
- [ ] URL en el email es correcta: `https://cot.piwisuite.cl/invite/[token]`
- [ ] Aplicación rebuilded (Redeploy en Easypanel o `npm run dev` local)
- [ ] Probado la URL directamente en el navegador

## 🚀 Solución Rápida

**Si estás en producción:**
1. Ve a **Easypanel**
2. Haz clic en **"Redeploy"**
3. Espera 2-3 minutos
4. Prueba nuevamente el link

**Si estás en desarrollo:**
1. Detén el servidor
2. Ejecuta: `npm run dev`
3. Prueba nuevamente

¡Esto debería resolver el 404! 🎉

