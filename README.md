# Cotizador.PiwiSuite

Sistema de cotizaciones profesionales para empresas de fabricación estructural, metalmecánica, montaje industrial y obras civiles.

## Stack Tecnológico

- **Next.js 16** (App Router con TypeScript)
- **Firebase** (Authentication, Firestore, Storage)
- **Tailwind CSS** (Estilos)
- **react-pdf** (Generación de PDF)
- **docx** (Generación de Word)
- **xlsx** (Generación de Excel)
- **rut.js** (Validación de RUT chileno)

## Instalación

1. **Clonar el repositorio** (o usar el proyecto actual)

2. **Instalar dependencias**:
```bash
npm install
```

3. **Configurar Firebase**:
   - Crear un proyecto en [Firebase Console](https://console.firebase.google.com/)
   - Habilitar Authentication (Email/Password)
   - Crear una base de datos Firestore
   - Habilitar Storage
   - Copiar las credenciales de configuración

4. **Configurar variables de entorno**:
   - Copiar `env.example` a `.env.local`
   - O usar directamente las credenciales del proyecto `cotizadorpiwisuite`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDSOkK2VejNdwCb7CYTWqj0BZFeZriwbLc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cotizadorpiwisuite.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cotizadorpiwisuite
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cotizadorpiwisuite.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=415072535894
NEXT_PUBLIC_FIREBASE_APP_ID=1:415072535894:web:52b4f8b34502f3d08dc2f7
```

5. **Ejecutar el proyecto en desarrollo**:
```bash
npm run dev
```

6. **Abrir en el navegador**: http://localhost:3000

## Configuración Inicial de Firebase

### Authentication
1. Ir a Firebase Console > Authentication > Sign-in method
2. Habilitar "Email/Password"
3. Crear el primer usuario administrador desde la consola o desde la app

### Firestore Database
1. Ir a Firebase Console > Firestore Database
2. Crear base de datos en modo producción (o testing para desarrollo)
3. Establecer reglas de seguridad:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo usuarios autenticados pueden leer/escribir
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Storage
1. Ir a Firebase Console > Storage
2. Habilitar Storage
3. Establecer reglas similares a Firestore

## Estructura del Proyecto

```
/app                    # Next.js App Router
  /dashboard           # Dashboard principal
  /login               # Página de login
  /quotes              # Gestión de cotizaciones
  /clients             # Gestión de clientes
/components
  /ui                  # Componentes reutilizables
  /quote               # Componentes de cotización
  /dashboard           # Componentes del dashboard
/firebase              # Configuración y helpers de Firebase
/hooks                 # Custom hooks
/utils
  /calculations        # Lógica de cálculos
  /validations         # Validaciones
  /exporters           # Exportadores (PDF, Word, Excel)
/types                 # TypeScript types
/lib                   # Utilidades generales
```

## Funcionalidades Principales

### ✅ Implementado
- Sistema de autenticación con Firebase
- Dashboard con lista de cotizaciones
- Estructura base de tipos y modelos
- Helpers de Firebase (Clients, Quotes)
- Validación de RUT chileno
- Cálculos de totales de cotización

### 🚧 En Desarrollo
- Wizard de nueva cotización
- Módulo de costeo completo
- Exportación a PDF, Word, Excel
- Catálogos y configuración

## Uso

### Primer Login
1. Ejecutar la aplicación
2. Crear el primer usuario desde Firebase Console o mediante código
3. Iniciar sesión con email y contraseña

### Crear una Cotización
1. Ir a "Nueva Cotización"
2. Seguir el wizard de 3 pasos
3. Completar el módulo de costeo
4. Revisar resumen ejecutivo
5. Guardar y exportar

## Desarrollo

### Scripts disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run start` - Servidor de producción
- `npm run lint` - Ejecutar linter

## Docker

El proyecto está configurado para ejecutarse con Docker y Docker Compose.

### Prerrequisitos

- Docker instalado
- Docker Compose instalado

### Desarrollo con Docker

1. **Crear archivo `.env.local`** con las variables de entorno de Firebase (ver sección de configuración arriba)

2. **Ejecutar en modo desarrollo**:
```bash
docker-compose up app-dev
```

Esto iniciará la aplicación en modo desarrollo en http://localhost:3000 con hot-reload habilitado.

### Producción con Docker

1. **Ejecutar en modo producción**:
```bash
docker-compose up app-prod
```

2. **O construir y ejecutar manualmente**:
```bash
docker-compose build app-prod
docker-compose up app-prod
```

### Comandos útiles de Docker

- `docker-compose up -d` - Ejecutar en segundo plano
- `docker-compose down` - Detener y eliminar contenedores
- `docker-compose logs -f` - Ver logs en tiempo real
- `docker-compose ps` - Ver contenedores en ejecución

## Deployment

### Easypanel (Recomendado)

Para desplegar en Easypanel, consulta la guía completa en [EASYPANEL.md](./EASYPANEL.md).

**Configurar dominio personalizado**: Si quieres usar tu dominio `cot.piwisuite.cl` con Cloudflare, consulta [DOMINIO_CLOUDFLARE.md](./DOMINIO_CLOUDFLARE.md).

### Firebase Hosting

Para desplegar en Firebase Hosting, consulta [FIREBASE_HOSTING.md](./FIREBASE_HOSTING.md).

**⚠️ Nota**: Firebase Hosting tiene limitaciones con Next.js App Router (no SSR, no API Routes). Para funcionalidad completa, se recomienda usar Easypanel o Cloud Run.

### Variables de Entorno Requeridas para Easypanel

Copia estas variables en la sección de Environment Variables de Easypanel:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDSOkK2VejNdwCb7CYTWqj0BZFeZriwbLc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cotizadorpiwisuite.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cotizadorpiwisuite
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cotizadorpiwisuite.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=415072535894
NEXT_PUBLIC_FIREBASE_APP_ID=1:415072535894:web:52b4f8b34502f3d08dc2f7
NODE_ENV=production
```

Las credenciales ya están configuradas. Puedes usar el archivo `easypanel.env` como referencia para copiar y pegar directamente en Easypanel.

## Notas Importantes

- Todas las cantidades se manejan en CLP (pesos chilenos)
- Los cálculos usan redondeos apropiados para CLP
- El sistema está diseñado para un administrador inicial, extensible a múltiples usuarios

## Licencia

Proyecto privado - Todos los derechos reservados
