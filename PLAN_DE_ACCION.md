# Plan de Acción - Cotizador Pro MVP

## Estado General del Proyecto

### ✅ Completado
- ✅ Configuración inicial del proyecto Next.js con TypeScript
- ✅ Instalación de dependencias (Firebase, react-pdf, docx, xlsx, Tailwind)
- ✅ Estructura de carpetas completa
- ✅ Configuración base de Firebase (Auth, Firestore, Storage)
- ✅ Sistema de autenticación completo
- ✅ Dashboard con lista de cotizaciones y métricas
- ✅ Modelos de datos TypeScript completos
- ✅ Wizard de nueva cotización (3 pasos: Cliente, Proyecto, Detalles)
- ✅ Módulo de Costeo (parcial):
  - ✅ Sección Mano de Obra (MO)
  - ✅ Sección Materiales
  - ✅ Sección Gastos Generales y Utilidad
  - ✅ Sección Contingencias/Riesgos
  - ✅ Resumen Ejecutivo con cálculos automáticos
- ✅ Helpers de Firebase (Clients, Quotes, Catalogs)
- ✅ Validación de RUT chileno
- ✅ Cálculos de totales de cotización
- ✅ Layout y navegación principal

### 🚧 En Progreso
- Módulo de Costeo (completar secciones faltantes):
  - ⏳ Sección Equipos/Herramientas
  - ⏳ Sección Logística/Traslados
  - ⏳ Sección Indirectos de Obra

### 📋 Pendiente

#### Funcionalidades Core
- [ ] Completar secciones faltantes del módulo de costeo
- [ ] Vista de detalle de cotización
- [ ] Edición de cotizaciones existentes
- [ ] Duplicar/Versionar cotizaciones
- [ ] Comparación de versiones

#### Exportación
- [ ] Exportación a PDF profesional (react-pdf)
- [ ] Exportación a Word (DOCX)
- [ ] Exportación a Excel con múltiples hojas

#### Funcionalidades Adicionales
- [ ] Simulador de sensibilidades
- [ ] Gestión de clientes (CRUD completo)
- [ ] Filtros avanzados en dashboard
- [ ] Búsqueda de cotizaciones

#### Catálogos y Configuración
- [ ] Interfaz de administración de catálogos
- [ ] Configuración de settings (GG, utilidad, etc.)
- [ ] Gestión de catálogo de materiales
- [ ] Gestión de catálogo de equipos
- [ ] Gestión de catálogo de mano de obra
- [ ] Gestión de catálogo de riesgos

#### Validaciones y UX
- [ ] Validaciones completas en formularios
- [ ] Mensajes de error amigables
- [ ] Confirmaciones de acciones críticas
- [ ] UI responsiva (tablas desktop, tarjetas móvil)
- [ ] Loading states mejorados
- [ ] Manejo de errores global

#### Testing y Deployment
- [ ] Pruebas de funcionalidades críticas
- [ ] Configuración de variables de entorno
- [ ] Documentación de deployment
- [ ] Configuración de reglas de seguridad Firestore

## Arquitectura Implementada

### Stack Tecnológico
- **Next.js 16** (App Router con TypeScript)
- **Firebase** (Authentication, Firestore, Storage)
- **Tailwind CSS** (Estilos)
- **react-pdf** (Generación de PDF) - Instalado, pendiente implementar
- **docx** (Generación de Word) - Instalado, pendiente implementar
- **xlsx** (Generación de Excel) - Instalado, pendiente implementar
- **rut.js** (Validación de RUT chileno) - Implementado

### Estructura de Carpetas
```
/app
  /dashboard          ✅ Dashboard principal
  /login              ✅ Login
  /quotes
    /new              ✅ Wizard nueva cotización
    /[id]/costeo      ✅ Módulo de costeo
/components
  /ui                 ✅ Componentes reutilizables (Button, Input)
  /quote              ✅ Componentes de cotización
    /costeo           ✅ Secciones de costeo (parcial)
  /dashboard          ✅ Sidebar, layout
/firebase             ✅ Config y helpers (clients, quotes, catalogs)
/hooks                ✅ useQuote hook
/utils
  /calculations       ✅ Cálculos de totales
  /validations        ✅ Validación RUT
  /exporters          ⏳ Pendiente
/types                ✅ Tipos TypeScript completos
/lib                  ✅ Auth context
```

## Próximos Pasos Prioritarios

1. **Completar Módulo de Costeo** (Alta prioridad)
   - Implementar sección de Equipos
   - Implementar sección de Logística (dos modos)
   - Implementar sección de Indirectos

2. **Exportación a PDF** (Alta prioridad)
   - Template profesional
   - Incluir todos los datos de la cotización
   - Formato adecuado para impresión

3. **Vista de Detalle de Cotización** (Media prioridad)
   - Mostrar toda la información
   - Opciones de edición
   - Botones de exportación

4. **Gestión de Catálogos** (Media prioridad)
   - Interfaz para administrar materiales
   - Interfaz para administrar equipos
   - Interfaz para administrar mano de obra

5. **Versionado** (Baja prioridad)
   - Duplicar cotizaciones
   - Comparación lado a lado

## Notas Técnicas

- Todos los cálculos se realizan en CLP con redondeos apropiados
- Los totales se recalculan automáticamente cuando cambian los items
- El sistema está preparado para extensión a múltiples usuarios
- Firebase Auth protege todas las rutas del dashboard
- Los catálogos tienen valores por defecto si no existen en Firestore
