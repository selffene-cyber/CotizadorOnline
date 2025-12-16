# 🔍 Diagnóstico del Error - cot.piwisuite.cl

## Paso 1: Verificar el Error Actual

¿Qué error ves ahora cuando intentas acceder a `cot.piwisuite.cl`?

- [ ] Error 502 (Bad Gateway)
- [ ] Error 503 (Service Unavailable)
- [ ] Error 504 (Gateway Timeout)
- [ ] Error 1016 (Origin DNS Error) - aún persiste
- [ ] Página en blanco
- [ ] Otro error: _______________

## Paso 2: Verificar Estado del Servicio en Easypanel

1. En Easypanel, ve a tu servicio `piwisuite / cotizadorpiwisuite`
2. Verifica:
   - ¿El servicio está **corriendo**? (debe mostrar "Running" o estado verde)
   - ¿Hay algún botón de "Start" o "Deploy"? (si está detenido, inícialo)
   - Revisa los recursos: CPU, Memoria (debe mostrar uso, no 0%)

## Paso 3: Revisar Logs del Servicio

1. En Easypanel, ve a tu servicio
2. Busca la sección **"Logs"** o haz clic en el icono de terminal/consola
3. Revisa los últimos logs y busca:
   - Errores de inicio
   - Errores de conexión a Supabase
   - Errores de variables de entorno faltantes
   - Errores de puerto

**¿Qué ves en los logs?** (Copia los últimos mensajes de error si los hay)

## Paso 4: Verificar Variables de Entorno

1. En Easypanel, ve a tu servicio
2. Busca la sección **"Environment Variables"** o **"Variables"**
3. Verifica que estén configuradas estas variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://rxfcdnuycrauvybjowik.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZmNkbnV5Y3JhdXZ5Ympvd2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mjg1OTIsImV4cCI6MjA4MTQwNDU5Mn0.uKp2wRv69-OAEVHxjZnYsx_L-PV5BYRt3Ru0Wz8PkOY
NODE_ENV=production
```

**¿Están todas configuradas?** Sí / No

## Paso 5: Verificar Configuración del Dominio

1. En Easypanel, ve a tu servicio
2. Ve a la sección **"Dominios"**
3. Verifica que `cot.piwisuite.cl` esté configurado así:
   - **External URL**: `https://cot.piwisuite.cl/`
   - **Internal URL**: `http://piwisuite_cotizadorpiwisuite:3000/`

**¿Está correcto?** Sí / No

## Paso 6: Verificar DNS en Cloudflare

1. Ve a Cloudflare → DNS → Records
2. Verifica que `cot` esté configurado como:
   - **Type**: A
   - **Name**: cot
   - **Content**: 217.216.48.47
   - **Proxy**: Proxied (nube naranja)

**¿Está correcto?** Sí / No

## Paso 7: Probar Acceso Directo

Intenta acceder directamente a la IP del servidor (esto ayuda a diagnosticar si es problema de DNS o del servicio):

1. Abre una terminal o navegador
2. Intenta hacer un curl o acceder directamente:
   ```bash
   curl -I http://217.216.48.47
   ```
   O en el navegador, intenta: `http://217.216.48.47` (puede que no funcione sin el dominio, pero prueba)

## Paso 8: Verificar Certificado SSL

1. En Cloudflare, ve a **SSL/TLS**
2. Verifica que el modo esté en **"Full"** o **"Full (strict)"**
3. En Easypanel, verifica que el certificado SSL esté generado para `cot.piwisuite.cl`

## Soluciones Comunes

### Si el servicio está detenido:
1. En Easypanel, haz clic en **"Deploy"** o **"Start"**
2. Espera a que el servicio inicie
3. Verifica los logs para ver si hay errores

### Si faltan variables de entorno:
1. Agrega las variables faltantes en Easypanel
2. Reinicia el servicio (Stop → Start)

### Si hay errores en los logs:
- **Error de Supabase**: Verifica las credenciales
- **Error de puerto**: Verifica que el puerto sea 3000
- **Error de build**: Puede que necesites hacer un nuevo deploy

### Si el DNS aún no propaga:
- Espera hasta 15 minutos
- Verifica en Cloudflare que el registro esté "Active"
- Puedes usar `nslookup cot.piwisuite.cl` para verificar la resolución DNS

## Información Necesaria para Diagnosticar

Por favor, comparte:
1. ¿Qué error específico ves ahora?
2. ¿El servicio está corriendo en Easypanel?
3. ¿Qué muestran los logs del servicio?
4. ¿Las variables de entorno están configuradas?

