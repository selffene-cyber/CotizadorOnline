# Plan de Acción - Deployment y Sistema de Usuarios

## 📋 ÍNDICE
1. [Hosting y Dominio](#1-hosting-y-dominio)
2. [GitHub y Deployment](#2-github-y-deployment)
3. [Autenticación con Gmail](#3-autenticación-con-gmail)
4. [Sistema de Aprobación de Usuarios](#4-sistema-de-aprobación-de-usuarios)
5. [Vista de Administrador](#5-vista-de-administrador)
6. [Checklist de Implementación](#6-checklist-de-implementación)

---

## 1. HOSTING Y DOMINIO

### Opción Recomendada: **Vercel + Firebase**

#### ¿Por qué Vercel?
- ✅ **Gratis** para proyectos personales
- ✅ **Optimizado para Next.js** (creado por el mismo equipo)
- ✅ **Deployment automático** desde GitHub
- ✅ **SSL gratuito** (HTTPS automático)
- ✅ **CDN global** (rápido en todo el mundo)
- ✅ **Variables de entorno** fáciles de configurar

#### ¿Necesitas comprar dominio?
**NO es obligatorio**, pero es recomendable:

**Sin dominio (Gratis):**
- URL: `tu-app.vercel.app` o `tu-app.web.app` (Firebase Hosting)
- ✅ Funciona perfectamente
- ✅ SSL incluido
- ❌ URL menos profesional

**Con dominio (Opcional, ~$10-15/año):**
- Comprar en: Namecheap, Google Domains, GoDaddy
- Conectar a Vercel (gratis, toma 5 minutos)
- URL: `cotizador.tudominio.cl`
- ✅ Más profesional
- ✅ Mejor para clientes

**Recomendación:** Empieza sin dominio, luego compra uno si lo necesitas.

---

## 2. GITHUB Y DEPLOYMENT

### Paso a Paso:

#### 2.1 Crear Repositorio en GitHub
```bash
# 1. Crear cuenta en GitHub (si no tienes)
# 2. Crear nuevo repositorio PRIVADO
# 3. En tu proyecto local:
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/tu-usuario/cotizador-mic.git
git push -u origin main
```

#### 2.2 Conectar Vercel con GitHub
1. Ir a [vercel.com](https://vercel.com)
2. Registrarse con GitHub
3. "New Project" → Seleccionar tu repositorio
4. Vercel detecta Next.js automáticamente
5. Agregar variables de entorno:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - etc.
6. Click "Deploy"

**¡Listo!** Cada vez que hagas `git push`, se despliega automáticamente.

---

## 3. AUTENTICACIÓN CON GMAIL

### 3.1 Configurar Firebase Authentication

#### En Firebase Console:
1. Ir a **Authentication** → **Sign-in method**
2. Habilitar **Google**
3. Agregar email de soporte (tu email)
4. Guardar

#### En tu código:
Necesitas migrar de `mock-auth` a Firebase Auth real.

**Archivos a crear/modificar:**
- `lib/firebase-auth-context.tsx` (nuevo)
- `app/login/page.tsx` (actualizar)
- `firebase/auth.ts` (nuevo helper)

---

## 4. SISTEMA DE APROBACIÓN DE USUARIOS

### 4.1 Estructura de Datos

#### Colección `users` en Firestore:
```typescript
interface User {
  id: string; // UID de Firebase Auth
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'user' | 'pending'; // Nuevo campo
  approved: boolean; // Nuevo campo
  approvedBy?: string; // ID del admin que aprobó
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.2 Flujo de Registro

1. Usuario se registra con Google → Se crea en Firebase Auth
2. Se crea documento en `users` con `role: 'pending'` y `approved: false`
3. Usuario ve pantalla: "Tu cuenta está pendiente de aprobación"
4. Admin recibe notificación (o revisa panel)
5. Admin aprueba → `approved: true`, `role: 'user'`
6. Usuario puede acceder a la app

---

## 5. VISTA DE ADMINISTRADOR

### 5.1 Rutas Protegidas

- `/admin` - Panel principal de administración
- `/admin/users` - Gestión de usuarios (aprobar/rechazar)
- `/admin/settings` - Configuración del sistema

### 5.2 Funcionalidades del Admin

1. **Panel de Usuarios Pendientes**
   - Lista de usuarios con `approved: false`
   - Botones: Aprobar / Rechazar
   - Ver información del usuario (email, nombre, fecha registro)

2. **Gestión de Usuarios**
   - Lista todos los usuarios
   - Cambiar roles (user ↔ admin)
   - Desactivar usuarios
   - Ver actividad

3. **Configuración del Sistema**
   - Ajustes generales
   - Configuración de empresa (ya existe, pero solo admin puede editar)

---

## 6. CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Preparación (1-2 días)
- [ ] Crear cuenta en GitHub
- [ ] Crear repositorio privado
- [ ] Subir código a GitHub
- [ ] Crear cuenta en Vercel
- [ ] Conectar Vercel con GitHub
- [ ] Configurar variables de entorno en Vercel
- [ ] Primer deployment de prueba

### Fase 2: Autenticación Real (2-3 días)
- [ ] Habilitar Google Sign-In en Firebase Console
- [ ] Crear `lib/firebase-auth-context.tsx`
- [ ] Crear `firebase/auth.ts` (helpers)
- [ ] Actualizar `app/login/page.tsx` para usar Google Auth
- [ ] Migrar de `mock-auth` a Firebase Auth
- [ ] Probar login con Google

### Fase 3: Sistema de Usuarios (3-4 días)
- [ ] Crear colección `users` en Firestore
- [ ] Crear función `onUserCreate` (Cloud Function o código cliente)
- [ ] Actualizar tipos TypeScript (`types/index.ts`)
- [ ] Crear middleware para verificar `approved`
- [ ] Crear pantalla "Pendiente de Aprobación"
- [ ] Probar flujo completo de registro

### Fase 4: Panel de Administrador (3-4 días)
- [ ] Crear ruta `/admin` protegida
- [ ] Crear componente `AdminUsersPanel`
- [ ] Implementar función `approveUser`
- [ ] Implementar función `rejectUser`
- [ ] Crear vista de lista de usuarios
- [ ] Agregar filtros (pendientes, aprobados, etc.)
- [ ] Probar flujo de aprobación

### Fase 5: Deployment Final (1 día)
- [ ] Configurar dominio (opcional)
- [ ] Verificar variables de entorno en producción
- [ ] Probar autenticación en producción
- [ ] Configurar reglas de seguridad Firestore
- [ ] Documentar proceso de deployment

---

## 📝 ARCHIVOS A CREAR/MODIFICAR

### Nuevos Archivos:
```
lib/
  firebase-auth-context.tsx    # Contexto de autenticación real
firebase/
  auth.ts                      # Helpers de autenticación
  users.ts                     # CRUD de usuarios
app/
  admin/
    page.tsx                   # Panel principal admin
    users/
      page.tsx                 # Gestión de usuarios
  pending-approval/
    page.tsx                   # Pantalla de espera
components/
  admin/
    UsersPanel.tsx            # Componente de gestión de usuarios
    UserApprovalCard.tsx      # Card de usuario pendiente
```

### Archivos a Modificar:
```
app/login/page.tsx            # Cambiar a Google Auth
lib/mock-auth-context.tsx     # Deprecar o mantener para dev
middleware.ts                  # Agregar verificación de approved
types/index.ts                 # Agregar interface User
```

---

## 🔒 SEGURIDAD

### Reglas de Firestore:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios: solo pueden leer su propio documento o si son admin
    match /users/{userId} {
      allow read: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Cotizaciones: usuarios aprobados pueden leer/escribir
    match /quotes/{quoteId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.approved == true;
    }
    
    // Similar para clients, costings, etc.
  }
}
```

---

## 💰 COSTOS ESTIMADOS

### Gratis (Plan inicial):
- ✅ Vercel: Gratis (hasta 100GB bandwidth/mes)
- ✅ Firebase Hosting: Gratis (10GB storage)
- ✅ Firebase Auth: Gratis (ilimitado)
- ✅ Firestore: Gratis (1GB storage, 50K reads/día)
- ✅ GitHub: Gratis (repositorios privados ilimitados)

### Si creces (pago):
- Dominio: ~$10-15/año
- Vercel Pro: $20/mes (si necesitas más recursos)
- Firebase: Pay as you go (muy económico al inicio)

**Total estimado año 1:** $10-15 (solo dominio, todo lo demás gratis)

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

1. **Hoy:** Crear repositorio en GitHub y subir código
2. **Mañana:** Configurar Vercel y hacer primer deployment
3. **Esta semana:** Implementar autenticación con Google
4. **Próxima semana:** Sistema de aprobación y panel admin

---

## 📞 SOPORTE

Si necesitas ayuda en algún paso, puedo:
- Generar el código de autenticación
- Crear los componentes del panel admin
- Configurar las reglas de seguridad
- Ayudar con el deployment

¿Quieres que empiece implementando alguna parte específica?

