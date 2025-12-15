# Configuración DNS Final - cot.piwisuite.cl

## ✅ Configuración Correcta

### Información Importante

- **URL pública de Easypanel**: `tku18l.easypanel.host`
- **Dominio del panel de Easypanel**: `panel.piwisuite.cl` (este es para el panel, NO para tu app)
- **Dominio de tu aplicación**: `cot.piwisuite.cl` (este es el que vamos a configurar)

### ⚠️ NO CONFUNDIR

- `panel.piwisuite.cl` → Panel de administración de Easypanel
- `cot.piwisuite.cl` → Tu aplicación Next.js

Son dos cosas diferentes. Tu aplicación debe apuntar directamente a la URL pública de Easypanel.

## 🔧 Configuración en Cloudflare

### Paso 1: Editar el CNAME Existente

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Selecciona el dominio `piwisuite.cl`
3. Ve a **DNS** > **Records**
4. **Edita** el registro CNAME existente para `cot`
5. Cambia el **Content** a: `tku18l.easypanel.host`

### Configuración Final del CNAME

```
Type:     CNAME
Name:     cot
Content:  tku18l.easypanel.host  ← CAMBIAR ESTO
Proxy:    Proxied (nube naranja)  ← Dejar así
TTL:      Auto
```

**IMPORTANTE**: 
- ✅ El Content debe ser: `tku18l.easypanel.host`
- ❌ NO debe ser: `piwisuite.cl` (actual, incorrecto)
- ❌ NO debe ser: `panel.piwisuite.cl` (ese es para el panel, no tu app)

## 📋 Pasos Completos

### 1. En Cloudflare (CORREGIR)

1. Edita el CNAME existente
2. Cambia Content de `piwisuite.cl` a `tku18l.easypanel.host`
3. Guarda los cambios
4. Espera 5-15 minutos para propagación DNS

### 2. En Easypanel (VERIFICAR)

1. Ve a tu aplicación `cotizadorpiwisuite`
2. Sección "Domains" o "Custom Domain"
3. Verifica que `cot.piwisuite.cl` esté agregado
4. Debería mostrar estado "Active" o "DNS Verified"

Si no está agregado:
- Haz clic en "Add Domain"
- Ingresa: `cot.piwisuite.cl`
- Easypanel detectará el DNS automáticamente

### 3. En Firebase Auth (IMPORTANTE)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Proyecto: `cotizadorpiwisuite`
3. Authentication > Settings > Authorized domains
4. Agrega: `cot.piwisuite.cl`
5. Guarda

### 4. Verificar

Después de hacer los cambios:

1. **Espera 5-15 minutos** para propagación DNS
2. Verifica DNS:
   ```bash
   nslookup cot.piwisuite.cl
   ```
   Debería mostrar que apunta a `tku18l.easypanel.host`
3. Visita: https://cot.piwisuite.cl
4. Debería cargar tu aplicación

## 🎯 Resumen Visual

```
Flujo Correcto:
┌─────────────────────┐
│ cot.piwisuite.cl    │ (Cloudflare CNAME)
│     (CNAME)         │
└──────────┬──────────┘
           │ apunta a
           ▼
┌─────────────────────┐
│ tku18l.easypanel.host │ (URL pública de Easypanel)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Tu app Next.js      │ (En Easypanel)
│ cot.piwisuite.cl    │
└─────────────────────┘
```

## ❌ Lo que NO hacer

- ❌ NO poner `piwisuite.cl` como Content (crea loop)
- ❌ NO poner `panel.piwisuite.cl` como Content (ese es el panel, no tu app)
- ❌ NO usar IP directamente si tienes hostname

## ✅ Checklist Final

- [ ] CNAME en Cloudflare apunta a `tku18l.easypanel.host`
- [ ] Dominio `cot.piwisuite.cl` agregado en Easypanel
- [ ] Dominio `cot.piwisuite.cl` agregado en Firebase Auth
- [ ] Variables de entorno configuradas en Easypanel
- [ ] Puerto 3000 configurado en Easypanel
- [ ] Esperar propagación DNS (5-15 minutos)
- [ ] Verificar que https://cot.piwisuite.cl funciona

## 🚀 Después de Configurar

Una vez que el DNS esté correcto:

1. Haz commit y push de los cambios al código
2. Haz deploy en Easypanel
3. Verifica que todo funcione en `cot.piwisuite.cl`

