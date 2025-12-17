# Configurar Dominio Personalizado en Resend

## Pasos para Verificar tu Dominio en Resend

### Paso 1: Crear Cuenta en Resend

1. Ve a [https://resend.com](https://resend.com)
2. Crea una cuenta gratuita (3,000 emails/mes gratis)
3. Verifica tu email

### Paso 2: Agregar y Verificar Dominio

1. **Ve a Domains:**
   - En el dashboard de Resend, ve a **Settings** → **Domains**
   - O directamente: [https://resend.com/domains](https://resend.com/domains)

2. **Agregar Dominio:**
   - Haz clic en **"Add Domain"** o **"Add New Domain"**
   - Ingresa tu dominio: `cot.piwisuite.cl` o `piwisuite.cl`
   - Haz clic en **"Add"**

3. **Obtener Registros DNS:**
   - Resend te mostrará los registros DNS que necesitas agregar
   - Normalmente incluyen:
     - **TXT record** para verificación de dominio
     - **DKIM records** (TXT) para autenticación
     - **SPF record** (TXT) para prevenir spam
     - **DMARC record** (TXT) opcional pero recomendado

### Paso 3: Configurar Registros DNS en Cloudflare

Como mencionaste que usas Cloudflare (`cot.piwisuite.cl`), sigue estos pasos:

1. **Ve a Cloudflare Dashboard:**
   - Inicia sesión en [https://dash.cloudflare.com](https://dash.cloudflare.com)
   - Selecciona el dominio `piwisuite.cl` o `cot.piwisuite.cl`

2. **Ve a DNS:**
   - En el menú lateral, haz clic en **DNS**
   - Haz clic en **"Add record"**

3. **Agregar Registros DNS de Resend:**
   
   Resend te dará algo como esto (ejemplo):
   ```
   Tipo: TXT
   Nombre: @ (o piwisuite.cl)
   Contenido: resend-domain-verification=abc123...
   TTL: Auto
   ```

   Y para DKIM:
   ```
   Tipo: TXT
   Nombre: resend._domainkey (o resend._domainkey.cot)
   Contenido: p=... (clave pública DKIM)
   TTL: Auto
   ```

   Y para SPF:
   ```
   Tipo: TXT
   Nombre: @ (o piwisuite.cl)
   Contenido: v=spf1 include:resend.net ~all
   TTL: Auto
   ```

4. **Agregar cada registro:**
   - Copia exactamente lo que Resend te indique
   - Agrega cada registro en Cloudflare
   - Asegúrate de que el **Proxy status** esté en **DNS only** (nube gris, no naranja) para los registros TXT

### Paso 4: Esperar Verificación

1. **Propagación DNS:**
   - Los cambios DNS pueden tardar desde minutos hasta 24 horas
   - Cloudflare generalmente propaga en 5-15 minutos

2. **Verificar en Resend:**
   - Vuelve a Resend → Domains
   - Haz clic en **"Verify"** o espera a que se verifique automáticamente
   - El estado cambiará de "Pending" a "Verified" cuando esté listo

### Paso 5: Usar el Dominio Verificado

Una vez verificado, puedes usar:
- `noreply@cot.piwisuite.cl` (si verificaste `cot.piwisuite.cl`)
- `noreply@piwisuite.cl` (si verificaste `piwisuite.cl`)
- O cualquier otro alias: `invitaciones@cot.piwisuite.cl`, `soporte@cot.piwisuite.cl`, etc.

## Registros DNS Típicos de Resend

Aquí tienes un ejemplo de los registros que Resend suele pedir:

### 1. Verificación de Dominio (TXT)
```
Nombre: @ (o piwisuite.cl)
Tipo: TXT
Contenido: resend-domain-verification=abc123def456...
```

### 2. DKIM (TXT)
```
Nombre: resend._domainkey (o resend._domainkey.cot)
Tipo: TXT
Contenido: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC... (clave pública)
```

### 3. SPF (TXT)
```
Nombre: @ (o piwisuite.cl)
Tipo: TXT
Contenido: v=spf1 include:resend.net ~all
```

### 4. DMARC (TXT) - Opcional pero Recomendado
```
Nombre: _dmarc (o _dmarc.cot)
Tipo: TXT
Contenido: v=DMARC1; p=none; rua=mailto:dmarc@cot.piwisuite.cl
```

## Notas Importantes

1. **Proxy Status en Cloudflare:**
   - Los registros TXT deben estar en **DNS only** (nube gris)
   - NO uses **Proxied** (nube naranja) para registros TXT

2. **Subdominio vs Dominio Principal:**
   - Si verificas `piwisuite.cl`, puedes usar cualquier subdominio: `noreply@cot.piwisuite.cl`
   - Si solo verificas `cot.piwisuite.cl`, solo puedes usar ese subdominio

3. **Tiempo de Verificación:**
   - Resend verifica automáticamente cada pocos minutos
   - Si después de 24 horas no se verifica, revisa que los registros DNS estén correctos

4. **Múltiples Dominios:**
   - Puedes verificar múltiples dominios en Resend
   - Cada uno requiere sus propios registros DNS

## Verificación Rápida

Para verificar que los registros DNS están configurados correctamente, puedes usar:

```bash
# Verificar registro de verificación
nslookup -type=TXT piwisuite.cl

# Verificar DKIM
nslookup -type=TXT resend._domainkey.piwisuite.cl

# Verificar SPF
nslookup -type=TXT piwisuite.cl
```

O usa herramientas online:
- [MXToolbox](https://mxtoolbox.com/TXTLookup.aspx)
- [DNS Checker](https://dnschecker.org/)

## Después de Verificar

Una vez que el dominio esté verificado en Resend:

1. **Actualiza el script SQL** (si es necesario):
   - El script ya usa `noreply@cot.piwisuite.cl`
   - Si verificaste otro dominio, cambia el `from` en las funciones

2. **Prueba el envío:**
   - Crea una invitación desde `/admin`
   - Verifica que el email llegue correctamente
   - Revisa la bandeja de spam si no aparece en principal

3. **Monitorea en Resend:**
   - Ve a **Emails** en Resend para ver el estado de los envíos
   - Revisa si hay bounces o errores

## Solución de Problemas

### El dominio no se verifica:
- Verifica que los registros DNS estén correctos
- Asegúrate de que el Proxy en Cloudflare esté desactivado para TXT
- Espera más tiempo (hasta 24 horas)
- Contacta a Resend si persiste el problema

### Los emails van a spam:
- Verifica que DKIM y SPF estén configurados correctamente
- Configura DMARC
- Evita palabras spam en el contenido
- Usa un dominio verificado (no el de prueba)

### Error al enviar:
- Verifica que la API key esté correcta
- Verifica que el dominio esté verificado en Resend
- Revisa los logs de Supabase para ver errores específicos

