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
   - Copiar `.env.local.example` a `.env.local`
   - Completar con las credenciales de Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
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

## Notas Importantes

- Todas las cantidades se manejan en CLP (pesos chilenos)
- Los cálculos usan redondeos apropiados para CLP
- El sistema está diseñado para un administrador inicial, extensible a múltiples usuarios

## Licencia

Proyecto privado - Todos los derechos reservados
