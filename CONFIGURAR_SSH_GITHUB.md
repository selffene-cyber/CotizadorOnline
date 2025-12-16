# Configurar SSH para Repositorio Privado en GitHub

## 🔑 Tu Clave SSH Pública

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAII5ncQDjW4GgHIyEuomh0EW5R8KMi0vfXLyqxsvVBTqQ root@9814edea224d
```

## 📋 Pasos para Configurar

### Paso 1: Agregar la Clave SSH a GitHub

1. Inicia sesión en [GitHub](https://github.com)
2. Ve a tu perfil (esquina superior derecha) > **Settings**
3. En el menú lateral, ve a **SSH and GPG keys**
4. Haz clic en **"New SSH key"**
5. Completa el formulario:
   - **Title**: `Easypanel - Cotizador.PiwiSuite` (o el nombre que prefieras)
   - **Key type**: `Authentication Key`
   - **Key**: Pega tu clave SSH pública completa:
     ```
     ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAII5ncQDjW4GgHIyEuomh0EW5R8KMi0vfXLyqxsvVBTqQ root@9814edea224d
     ```
6. Haz clic en **"Add SSH key"**

### Paso 2: Hacer el Repositorio Privado (si aún no lo es)

1. Ve a tu repositorio: https://github.com/selffene-cyber/CotizadorOnline
2. Haz clic en **Settings** (arriba del repositorio)
3. Desplázate hasta la sección **Danger Zone**
4. Haz clic en **"Change visibility"**
5. Selecciona **"Make private"**
6. Confirma la acción

### Paso 3: Configurar Easypanel para Usar SSH

En Easypanel, cuando configures el repositorio:

1. **Repository URL**: Usa la URL SSH en lugar de HTTPS:
   ```
   git@github.com:selffene-cyber/CotizadorOnline.git
   ```
   
   **NO uses**: `https://github.com/selffene-cyber/CotizadorOnline.git`

2. **Branch**: `main`

3. **SSH Key**: Easypanel debería usar la clave SSH que agregaste a GitHub automáticamente

### Paso 4: Verificar la Conexión SSH

Puedes verificar que la clave SSH funciona:

```bash
ssh -T git@github.com
```

Deberías ver un mensaje como:
```
Hi selffene-cyber! You've successfully authenticated...
```

## ⚠️ Notas Importantes

1. **Si el repositorio es público**: No necesitas SSH, puedes usar HTTPS normalmente
2. **Si el repositorio es privado**: Necesitas SSH o un Personal Access Token
3. **Easypanel**: Algunos servicios pueden usar HTTPS con tokens, verifica la documentación de Easypanel

## 🔄 Alternativa: Personal Access Token (si Easypanel no soporta SSH)

Si Easypanel no soporta SSH directamente, puedes usar un Personal Access Token:

1. GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate new token (classic)
3. Selecciona scopes: `repo` (acceso completo a repositorios privados)
4. Genera el token
5. En Easypanel, usa la URL HTTPS con el token:
   ```
   https://TU_TOKEN@github.com/selffene-cyber/CotizadorOnline.git
   ```

## ✅ Checklist

- [ ] Clave SSH agregada a GitHub
- [ ] Repositorio configurado como privado (si es necesario)
- [ ] Easypanel configurado con URL SSH o HTTPS con token
- [ ] Conexión verificada




