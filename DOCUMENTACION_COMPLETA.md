# Documentación Completa - Cotizador.PiwiSuite

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Tecnologías y Stack](#tecnologías-y-stack)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Base de Datos](#base-de-datos)
5. [Autenticación y Seguridad](#autenticación-y-seguridad)
6. [Configuración y Variables de Entorno](#configuración-y-variables-de-entorno)
7. [Funcionalidades Principales](#funcionalidades-principales)
8. [Generación de PDF](#generación-de-pdf)
9. [Estructura del Proyecto](#estructura-del-proyecto)
10. [Deployment](#deployment)
11. [Mantenimiento y Desarrollo](#mantenimiento-y-desarrollo)

---

## 📖 Descripción General

**Cotizador.PiwiSuite** es un sistema web completo para la gestión de cotizaciones profesionales dirigido a empresas de:
- Fabricación estructural
- Metalmecánica
- Montaje industrial
- Obras civiles

El sistema permite crear, gestionar y exportar cotizaciones con cálculos detallados de costos, incluyendo mano de obra, materiales, equipos, logística e indirectos.

---

## 🛠️ Tecnologías y Stack

### Frontend

- **Next.js 16.0.10** (App Router)
  - Framework React con renderizado del lado del servidor (SSR)
  - Routing basado en archivos
  - Server Components y Client Components
  - TypeScript para tipado estático

- **React 19.2.1**
  - Biblioteca UI
  - Hooks personalizados
  - Context API para estado global

- **Tailwind CSS 4**
  - Framework CSS utility-first
  - Estilos responsive
  - Diseño moderno y profesional

### Backend (Next.js Server)

- **Next.js API Routes**
  - Endpoints REST cuando se necesitan
  - Server Actions (experimental)
  - Middleware para autenticación y rutas protegidas

### Base de Datos

- **Supabase (PostgreSQL)**
  - Base de datos relacional PostgreSQL
  - Row Level Security (RLS) para seguridad a nivel de fila
  - Autenticación integrada
  - API REST automática
  - Real-time subscriptions (disponible pero no usado actualmente)

### Bibliotecas Especializadas

- **@react-pdf/renderer 4.3.1**
  - Generación de PDFs del lado del cliente
  - Componentes React para estructurar documentos PDF

- **docx 9.5.1**
  - Generación de documentos Word (.docx)

- **xlsx 0.18.5**
  - Generación de archivos Excel (.xlsx)

- **rut.js 2.1.0**
  - Validación y formateo de RUT chileno

- **yup 1.7.1**
  - Validación de esquemas y formularios

- **@supabase/supabase-js 2.87.3**
  - Cliente oficial de Supabase para JavaScript/TypeScript

- **@supabase/ssr 0.8.0**
  - Integración de Supabase con Next.js SSR

### Herramientas de Desarrollo

- **TypeScript 5**
  - Tipado estático
  - Mejor experiencia de desarrollo

- **ESLint**
  - Linting de código

- **Docker & Docker Compose**
  - Contenedorización para desarrollo y producción

---

## 🏗️ Arquitectura del Sistema

### Arquitectura Full-Stack con Next.js

```
┌─────────────────────────────────────────────────────────┐
│                    Navegador (Cliente)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Client Components (React)                       │  │
│  │  - Interfaz de usuario                          │  │
│  │  - Interacciones                                │  │
│  │  - Generación de PDFs (react-pdf)               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTP/HTTPS
┌─────────────────────────────────────────────────────────┐
│              Next.js Server (Node.js)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Server Components                               │  │
│  │  - Renderizado en servidor                       │  │
│  │  - Acceso a base de datos                        │  │
│  │  - Lógica de negocio                             │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  API Routes (opcional)                           │  │
│  │  - Endpoints REST                                │  │
│  │  - Server Actions                                │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Middleware                                      │  │
│  │  - Autenticación                                 │  │
│  │  - Redirecciones                                 │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTPS
┌─────────────────────────────────────────────────────────┐
│                  Supabase (PostgreSQL)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │  - Base de datos PostgreSQL                     │  │
│  │  - Row Level Security (RLS)                     │  │
│  │  - Autenticación                                │  │
│  │  - Storage (no usado actualmente)               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Flujo de Datos

1. **Usuario accede a la aplicación** → Middleware verifica autenticación
2. **Server Component renderiza** → Obtiene datos de Supabase
3. **Cliente recibe HTML** → Hydratación de Client Components
4. **Interacciones del usuario** → Llamadas a Server Actions o API Routes
5. **Actualización de datos** → Supabase → Re-renderizado

---

## 💾 Base de Datos

### Supabase (PostgreSQL)

**Proyecto:** CotizadorPiwiSuite  
**Organización:** selffene-cyber's Organization-APPS  
**URL:** `https://rxfcdnuycrauvybjowik.supabase.co`

### Tablas Principales

#### 1. `users`
- Usuarios del sistema (extiende auth.users de Supabase)
- Campos: id, email, name, role, tenant_id, etc.

#### 2. `tenants`
- Organizaciones/empresas (multi-tenancy)
- Campos: id, name, created_at, etc.

#### 3. `memberships`
- Relación usuarios-tenant con roles
- Campos: user_id, tenant_id, role, etc.

#### 4. `clients`
- Clientes de la empresa
- Campos: id, name, rut, contact, email, phone, region, city, address

#### 5. `quotes`
- Cotizaciones
- **Nota importante:** Los items de cotización se almacenan como JSONB en la columna `quote_items`, no hay una tabla separada `quote_items`

#### 6. `costings`
- Costeos (cálculos detallados de costos)
- Campos: id, costing_number, name, type, modality, client_id, items_mo, items_materials, items_equipment, totals, etc.

#### 7. `material_catalog`
- Catálogo de materiales
- Campos: id, number, name, unidad, default_cost, default_merma_pct, category

#### 8. `equipment_catalog`
- Catálogo de equipos
- Campos: id, number, name, unit, default_rate, category

#### 9. `labor_catalog`
- Catálogo de mano de obra
- Campos: id, number, cargo, default_cost_hh, category

#### 10. `risk_catalog`
- Catálogo de riesgos/contingencias
- Campos: id, name, percentage, description

#### 11. `company_settings`
- Configuración de la empresa
- Campos: tenant_id, company_name, company_rut, logo, quoter_name, bank_account, etc.

#### 12. `invitations`
- Invitaciones de usuarios
- Campos: id, tenant_id, email, role, token, status, expires_at

#### 13. `access_requests`
- Solicitudes de acceso
- Campos: id, tenant_id, email, status, message

### DDL Completo de Tablas Principales

#### Tabla `quotes` - DDL Completo

```sql
CREATE TABLE IF NOT EXISTS public.quotes (
  -- Identificación
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  
  -- Estado y versionado
  status TEXT NOT NULL DEFAULT 'Borrador' 
    CHECK (status IN ('Borrador', 'Enviada', 'Aprobada', 'Perdida')),
  version INTEGER DEFAULT 1,
  parent_quote_id UUID REFERENCES public.quotes(id),
  quote_number INTEGER,
  
  -- Datos del proyecto/cliente
  project_name TEXT NOT NULL,
  location TEXT,  -- Deprecated, usar region y city
  region TEXT,
  city TEXT,
  type TEXT CHECK (type IN ('Fabricación', 'Montaje', 'Obras Civiles', 'Reparación', 'Eventos')),
  modality TEXT CHECK (modality IN ('Cerrado', 'HH+Mat', 'Mixto')),
  
  -- Descripción del proyecto
  scope TEXT DEFAULT '',
  exclusions TEXT DEFAULT '',
  assumptions TEXT DEFAULT '',
  
  -- Plazos y condiciones
  execution_deadline INTEGER DEFAULT 30,  -- días
  validity INTEGER DEFAULT 30,            -- días
  payment_terms TEXT DEFAULT '',
  warranties TEXT DEFAULT '',
  
  -- Items de cotización (JSONB array de QuoteLineItem)
  quote_items JSONB DEFAULT '[]'::jsonb,
  
  -- Referencias y configuración
  costing_references JSONB DEFAULT '[]'::jsonb,  -- IDs de costeos usados
  utility_percentage NUMERIC,
  
  -- Totales calculados (JSONB object)
  totals JSONB,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON public.quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes(created_at DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_quotes_updated_at 
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

#### Estructura del Campo `quote_items` (JSONB)

El campo `quote_items` es de tipo **JSONB** y contiene un **array de objetos** con la siguiente estructura TypeScript:

```typescript
interface QuoteLineItem {
  id?: string;                    // UUID opcional (generado en frontend)
  itemNumber?: number;            // Número correlativo (1, 2, 3, ...)
  codigoInterno?: string;         // Código interno del item (creado manualmente)
  description: string;            // Descripción del producto/servicio (REQUERIDO)
  quantity: number;               // Cantidad (REQUERIDO)
  unit: string;                   // Unidad de medida: 'pz', 'm2', 'm', 'kg', etc. (REQUERIDO)
  cost?: number;                  // Costo unitario (para items nuevos manuales)
  margin?: number;                // Margen en $ (para items nuevos manuales)
  marginPct?: number;             // Margen en % (para items nuevos manuales)
  unitPrice: number;              // Precio unitario (costo + margen) o precio desde costeo (REQUERIDO)
  subtotal: number;               // quantity * unitPrice (REQUERIDO)
  costingId?: string;             // ID del costeo del cual proviene este item (opcional)
}
```

**Ejemplo de valor JSONB:**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "itemNumber": 1,
    "codigoInterno": "FAB-001",
    "description": "Fabricación de estructura metálica tipo A",
    "quantity": 10,
    "unit": "pz",
    "cost": 50000,
    "margin": 25000,
    "marginPct": 50,
    "unitPrice": 75000,
    "subtotal": 750000
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "itemNumber": 2,
    "codigoInterno": "MON-002",
    "description": "Montaje en sitio",
    "quantity": 1,
    "unit": "servicio",
    "unitPrice": 150000,
    "subtotal": 150000,
    "costingId": "costing-uuid-here"
  }
]
```

#### Estructura del Campo `totals` (JSONB)

El campo `totals` es de tipo **JSONB** y contiene un **objeto** con los totales calculados:

```typescript
interface QuoteTotals {
  subtotal: number;      // Suma de todos los quoteItems (suma de subtotales)
  iva: number;          // 19% del subtotal
  totalConIva: number;  // subtotal + iva
}
```

**Ejemplo de valor JSONB:**

```json
{
  "subtotal": 900000,
  "iva": 171000,
  "totalConIva": 1071000
}
```

#### Constraints y Validaciones

1. **Primary Key:** `id` (UUID, auto-generado)
2. **Foreign Keys:**
   - `client_id` → `public.clients(id)`
   - `parent_quote_id` → `public.quotes(id)` (auto-referencia para versionado)
   - `created_by` → `auth.users(id)`

3. **Check Constraints:**
   - `status` debe ser uno de: 'Borrador', 'Enviada', 'Aprobada', 'Perdida'
   - `type` debe ser uno de: 'Fabricación', 'Montaje', 'Obras Civiles', 'Reparación', 'Eventos'
   - `modality` debe ser uno de: 'Cerrado', 'HH+Mat', 'Mixto'

4. **Not Null:**
   - `id` (generado automáticamente)
   - `client_id` (requerido)
   - `status` (default: 'Borrador')
   - `project_name` (requerido)
   - `created_at` (default: NOW())
   - `updated_at` (default: NOW())

5. **Defaults:**
   - `status`: 'Borrador'
   - `version`: 1
   - `scope`, `exclusions`, `assumptions`: '' (string vacío)
   - `execution_deadline`, `validity`: 30 (días)
   - `payment_terms`, `warranties`: '' (string vacío)
   - `quote_items`: '[]' (array JSONB vacío)
   - `costing_references`: '[]' (array JSONB vacío)
   - `created_at`, `updated_at`: NOW()

#### Row Level Security (RLS)

```sql
-- Habilitar RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can read all quotes" ON public.quotes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert quotes" ON public.quotes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update quotes" ON public.quotes
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete quotes" ON public.quotes
  FOR DELETE USING (auth.role() = 'authenticated');
```

### Row Level Security (RLS)

Todas las tablas tienen políticas RLS configuradas:

- **Usuarios autenticados** pueden leer/escribir sus propios datos
- **Administradores** pueden leer/escribir todos los datos de su tenant
- **Políticas específicas** por tabla según necesidades de negocio

### Funciones y Triggers

- **Funciones de email** para envío de invitaciones (usando Resend API)
- **Triggers** para crear registros de usuario automáticamente
- **Funciones helper** para validaciones y cálculos

---

## 🔐 Autenticación y Seguridad

### Autenticación con Supabase Auth

El sistema usa **Supabase Authentication** que proporciona:

- Autenticación por email/contraseña
- OAuth con GitHub (opcional)
- Gestión de sesiones
- Tokens JWT

### Flujo de Autenticación

1. Usuario ingresa email/contraseña
2. Supabase valida credenciales
3. Retorna token JWT
4. Token se almacena en cookies (manejado por @supabase/ssr)
5. Middleware verifica token en cada request
6. Si no hay token válido → redirige a `/login`

### Seguridad de Datos

- **Row Level Security (RLS)**: Cada usuario solo ve sus datos o los de su tenant
- **Variables de entorno**: Credenciales sensibles no en código
- **HTTPS obligatorio**: Todas las comunicaciones encriptadas
- **Validación de inputs**: Validación en cliente y servidor
- **Sanitización**: Prevención de SQL injection (manejado por Supabase)

---

## ⚙️ Configuración y Variables de Entorno

### Variables de Entorno Requeridas

#### Supabase (Obligatorias)

```env
# URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://rxfcdnuycrauvybjowik.supabase.co

# Clave pública anónima (anon key)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Importante:** 
- Las variables que empiezan con `NEXT_PUBLIC_` son **públicas** y estarán disponibles en el código del cliente
- La anon key es segura para exponer en el cliente (tiene restricciones vía RLS)

### Ubicación de Variables

#### Desarrollo Local
- Archivo: `.env.local`
- Copiar desde `env.example`

#### Producción (Easypanel)
- Configurar en: **Environment Variables** del servicio
- No usar archivos `.env` en producción (usar panel de Easypanel)

### Obtener Credenciales de Supabase

1. Acceder a [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleccionar proyecto: **CotizadorPiwiSuite**
3. Ir a **Settings** > **API**
4. Copiar:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🎯 Funcionalidades Principales

### 1. Dashboard

- Vista general de cotizaciones
- Estadísticas: Total de cotizaciones, Valor total, Cotizaciones pendientes
- Lista de cotizaciones recientes
- Filtros por estado

### 2. Gestión de Clientes

- Búsqueda por RUT
- Crear nuevos clientes
- Lista de todos los clientes
- Validación de RUT chileno
- Datos: Razón social, RUT, contacto, email, teléfono, región, ciudad, dirección

### 3. Cotizaciones

#### Crear Cotización (Wizard)
1. **Paso 1: Cliente**
   - Buscar cliente existente por RUT
   - Crear nuevo cliente
   - Seleccionar cliente

2. **Paso 2: Proyecto**
   - Nombre del proyecto
   - Ubicación (región/ciudad)
   - Tipo de proyecto (Fabricación, Montaje, Obras Civiles, etc.)
   - Modalidad (Cerrado, HH+Mat, Mixto)
   - Alcance, exclusiones, supuestos
   - Plazos y condiciones

3. **Paso 3: Items**
   - Agregar items manualmente
   - Importar desde costeo
   - Editar items
   - Cálculo automático de totales

#### Gestionar Cotizaciones
- Editar cotizaciones existentes
- Cambiar estado (Borrador, Enviada, Aprobada, Perdida)
- Versionado (crear nuevas versiones)
- Exportar a PDF, Word, Excel

### 4. Costeos

#### Crear Costeo
- Definir nombre y tipo de proyecto
- **Mano de Obra (MO)**:
  - Cargo, días, horas/día, eficiencia
  - Horas hombre (HH) calculadas
  - Costo HH, recargo %
  
- **Materiales**:
  - Item, unidad, cantidad
  - Costo unitario, merma %

- **Equipos**:
  - Equipo, unidad (día/hora), cantidad
  - Tarifa

- **Logística**:
  - Modo: km o viático
  - Distancia, peajes, horas conductor
  - O días, viático, alojamiento

- **Indirectos**:
  - Tipo: HH o fijo
  - Horas y tarifa, o monto fijo

- **Configuración**:
  - Gastos Generales (%)
  - Contingencias (múltiples %)
  - Utilidad (%)

#### Cálculos Automáticos
- Costo Directo (MO + Materiales + Equipos + Logística)
- Indirectos de Obra
- Subtotal Costo
- Gastos Generales
- Base
- Contingencia
- Costo Total
- Precio Venta (con utilidad %)
- Precio Neto, IVA (19%), Total con IVA
- Margen Bruto y Margen %

#### Exportar Costeo
- PDF con detalle completo
- Excel con todas las tablas

### 5. Catálogos

#### Catálogo de Materiales
- Crear, editar, eliminar materiales
- Número correlativo automático
- Categorías
- Costos y merma por defecto

#### Catálogo de Equipos
- Crear, editar, eliminar equipos
- Número correlativo automático
- Categorías
- Tarifa por defecto

#### Catálogo de Mano de Obra
- Crear, editar, eliminar cargos
- Número correlativo automático
- Categorías
- Costo HH por defecto

#### Catálogo de Riesgos
- Crear, editar riesgos/contingencias
- Porcentaje de contingencia

### 6. Configuración

#### Configuración de Empresa
- Datos de la empresa (nombre, RUT, giro, dirección)
- Logo de la empresa
- Datos del cotizador (nombre, cargo, email, teléfono)
- Datos bancarios (cuenta, banco, tipo)
- Redes sociales

#### Configuración del Sistema
- Gastos Generales por defecto
- Utilidad por defecto y mínimo
- Tarifa por km
- Horas por día
- Eficiencia
- Porcentaje de equipos sobre MO

### 7. Usuarios y Permisos

- Sistema multi-tenant
- Roles: Admin, Usuario
- Invitaciones por email
- Gestión de usuarios
- Panel de administración

---

## 📄 Generación de PDF

### ¿Dónde se genera el PDF?

**Del lado del CLIENTE (navegador)** usando `@react-pdf/renderer`.

### Tecnología

- **Biblioteca:** `@react-pdf/renderer` v4.3.1
- **Método:** Renderizado de componentes React a PDF
- **Ejecución:** Navegador del usuario (no servidor)

### Flujo de Generación

```
1. Usuario hace clic en "Exportar PDF"
   ↓
2. Se muestra modal con opciones (qué incluir)
   ↓
3. Usuario selecciona opciones y confirma
   ↓
4. Se renderiza componente <PDFDocument> con datos
   ↓
5. @react-pdf/renderer convierte React a PDF
   ↓
6. Se genera Blob del PDF
   ↓
7. Se crea URL temporal del blob
   ↓
8. Se crea elemento <a> y se descarga automáticamente
   ↓
9. Se limpia URL temporal
```

### Código Clave

**Componente PDF:**
```typescript
// utils/exporters/pdf.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const PDFDocument = ({ quote, client, options }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Contenido del PDF */}
    </Page>
  </Document>
);
```

**Generación y Descarga:**
```typescript
// components/quote/ExportButtons.tsx
import { pdf } from '@react-pdf/renderer';

const handleDownloadPDF = async () => {
  const blob = await pdf(
    <PDFDocument 
      quote={quote} 
      client={client} 
      options={exportOptions} 
    />
  ).toBlob();
  
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'COT-001-Cliente-18122025.pdf';
  a.click();
  window.URL.revokeObjectURL(url);
};
```

### Ventajas de Generar en el Cliente

✅ **No carga el servidor**: El procesamiento ocurre en el navegador  
✅ **Escalable**: Cada usuario genera su propio PDF  
✅ **Rápido**: No hay latencia de red  
✅ **Preview antes de descargar**: Se puede mostrar preview con `<PDFViewer>`

### Opciones de Exportación

El PDF puede incluir/excluir:

- ✅ Alcance del proyecto
- ✅ Exclusiones
- ✅ Supuestos
- ❌ Detalles de Mano de Obra (costos internos)
- ❌ Detalles de Materiales (costos internos)
- ❌ Márgenes y costos
- ❌ Resumen de costeo completo

Por defecto, solo se muestra lo que el cliente debe ver (sin costos internos).

---

## 📁 Estructura del Proyecto

```
CotizadorMIC/
│
├── app/                          # Next.js App Router
│   ├── admin/                    # Panel de administración
│   ├── api/                      # API Routes (opcionales)
│   ├── auth/                     # Autenticación (callback, etc.)
│   ├── clients/                  # Gestión de clientes
│   ├── costings/                 # Gestión de costeos
│   │   ├── [id]/                 # Vista/edición de costeo
│   │   ├── catalog/              # Catálogos
│   │   └── new/                  # Nuevo costeo
│   ├── dashboard/                # Dashboard principal
│   ├── invite/                   # Invitaciones de usuarios
│   ├── login/                    # Página de login
│   ├── onboarding/               # Onboarding inicial
│   ├── quotes/                   # Gestión de cotizaciones
│   │   ├── [id]/                 # Vista/edición de cotización
│   │   ├── [id]/costeo/          # Asociar costeo
│   │   ├── [id]/items/           # Gestión de items
│   │   └── new/                  # Nueva cotización (wizard)
│   ├── settings/                 # Configuración
│   ├── layout.tsx                # Layout principal
│   ├── page.tsx                  # Página de inicio
│   └── globals.css               # Estilos globales
│
├── components/                   # Componentes React
│   ├── dashboard/                # Componentes del dashboard
│   ├── layouts/                  # Layouts reutilizables
│   ├── quote/                    # Componentes de cotización
│   │   ├── ExportButtons.tsx     # Botones de exportación
│   │   ├── ExportPDFModal.tsx    # Modal de opciones PDF
│   │   ├── WizardStep1Client.tsx # Paso 1 del wizard
│   │   ├── WizardStep2Project.tsx# Paso 2 del wizard
│   │   └── WizardStep3Items.tsx  # Paso 3 del wizard
│   └── ui/                       # Componentes UI reutilizables
│       ├── Button.tsx
│       ├── Input.tsx
│       └── ...
│
├── contexts/                     # React Contexts
│   └── SidebarContext.tsx        # Estado del sidebar
│
├── hooks/                        # Custom Hooks
│   └── useQuote.ts               # Hook para cotizaciones
│
├── lib/                          # Utilidades generales
│   ├── supabase.ts               # Cliente Supabase
│   └── ...
│
├── supabase/                     # Código relacionado con Supabase
│   ├── clients.ts                # Funciones de clientes
│   ├── quotes.ts                 # Funciones de cotizaciones
│   ├── costings.ts               # Funciones de costeos
│   ├── catalogs.ts               # Funciones de catálogos
│   ├── settings.ts               # Funciones de configuración
│   ├── admin.ts                  # Funciones de administración
│   ├── invitations.ts            # Funciones de invitaciones
│   ├── email.ts                  # Funciones de email
│   ├── schema.sql                # Schema de la base de datos
│   └── *.sql                     # Scripts SQL varios
│
├── types/                        # TypeScript Types
│   └── index.ts                  # Tipos principales
│
├── utils/                        # Utilidades
│   ├── calculations/             # Lógica de cálculos
│   ├── validations/              # Validaciones (RUT, etc.)
│   ├── exporters/                # Exportadores
│   │   ├── pdf.tsx               # Exportador PDF de cotizaciones
│   │   ├── costing-pdf.tsx       # Exportador PDF de costeos
│   │   ├── word.ts               # Exportador Word
│   │   └── excel.ts              # Exportador Excel
│   └── chile-regions.ts          # Datos de regiones/ciudades
│
├── firebase/                     # Código legacy de Firebase (no usado)
│
├── public/                       # Archivos estáticos
│   └── *.svg                     # Iconos, logos
│
├── .env.local                    # Variables de entorno (local)
├── env.example                   # Ejemplo de variables de entorno
├── easypanel.env                 # Variables para Easypanel
├── package.json                  # Dependencias y scripts
├── tsconfig.json                 # Configuración TypeScript
├── next.config.ts                # Configuración Next.js
├── tailwind.config.js            # Configuración Tailwind
├── Dockerfile                    # Docker para producción
├── Dockerfile.dev                # Docker para desarrollo
├── docker-compose.yml            # Docker Compose producción
└── docker-compose.dev.yml        # Docker Compose desarrollo
```

---

## 🚀 Deployment

### Easypanel (Producción Actual)

**Dominio:** `cot.piwisuite.cl`

#### Configuración

1. **Servicio en Easypanel:**
   - Tipo: App
   - Repositorio: GitHub `selffene-cyber/CotizadorOnline`
   - Rama: `main`
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm start`
   - Puerto: `3000`

2. **Variables de Entorno:**
   - Configurar en panel de Easypanel (Environment Variables)
   - Ver `easypanel.env` para referencia
   - **Obligatorias:**
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Dominio:**
   - Configurar CNAME en Cloudflare: `cot.piwisuite.cl` → IP del servidor Easypanel
   - SSL/TLS automático vía Cloudflare

4. **Deploy Automático:**
   - Cada push a `main` dispara rebuild automático
   - Easypanel reconstruye la imagen Docker
   - El servicio se reinicia con la nueva versión

#### Docker

- **Imagen base:** `node:20-alpine`
- **Multi-stage build:**
  1. Stage `deps`: Instala dependencias
  2. Stage `builder`: Copia código y ejecuta build
  3. Stage final: Solo archivos necesarios para producción

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Crear .env.local con variables de Supabase
cp env.example .env.local
# Editar .env.local con credenciales reales

# Ejecutar en desarrollo
npm run dev

# Abrir http://localhost:3000
```

### Docker Compose (Desarrollo)

```bash
# Ejecutar en modo desarrollo
docker-compose -f docker-compose.dev.yml up

# O construir y ejecutar
docker-compose -f docker-compose.dev.yml up --build
```

### Docker Compose (Producción Local)

```bash
# Build
docker-compose build

# Ejecutar
docker-compose up

# O en background
docker-compose up -d
```

---

## 🔧 Mantenimiento y Desarrollo

### Scripts Disponibles

```bash
npm run dev          # Desarrollo local (puerto 3000)
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Ejecutar ESLint
```

### Comandos Git

```bash
# Trabajar en develop
git checkout develop

# Crear nueva rama
git checkout -b feature/nueva-funcionalidad

# Commit y push
git add .
git commit -m "feat: Nueva funcionalidad"
git push origin feature/nueva-funcionalidad

# Merge a main (después de revisión)
git checkout main
git merge develop
git push origin main
```

### Base de Datos

#### Acceder a Supabase Dashboard

1. Ir a [supabase.com/dashboard](https://supabase.com/dashboard)
2. Iniciar sesión
3. Seleccionar proyecto: **CotizadorPiwiSuite**
4. Organización: **selffene-cyber's Organization-APPS**

#### Ejecutar Migraciones

1. Ir a **SQL Editor** en Supabase
2. Copiar contenido de archivo `.sql` en `supabase/`
3. Ejecutar script
4. Verificar cambios

#### Backup

- Supabase hace backups automáticos
- Backup manual: Exportar desde dashboard o usar `pg_dump`

### Debugging

#### Logs en Desarrollo

```bash
# Ver logs de Next.js
npm run dev

# Logs aparecen en consola
```

#### Logs en Producción (Easypanel)

1. Ir a Easypanel
2. Seleccionar servicio
3. Pestaña **Logs**
4. Ver logs en tiempo real

#### Debugging en el Navegador

- Abrir DevTools (F12)
- Console: Errores y logs
- Network: Ver requests a Supabase
- Application: Ver cookies/tokens

### Actualizar Dependencias

```bash
# Ver dependencias desactualizadas
npm outdated

# Actualizar todas (cuidado con breaking changes)
npm update

# Actualizar una específica
npm install package@latest
```

### Agregar Nueva Funcionalidad

1. Crear rama: `git checkout -b feature/nombre`
2. Implementar cambios
3. Probar localmente: `npm run dev`
4. Hacer commit: `git commit -m "feat: Descripción"`
5. Push: `git push origin feature/nombre`
6. Merge a develop después de revisión
7. Merge a main cuando esté listo para producción

---

## 📊 Datos y Cálculos

### Moneda

- Todas las cantidades en **CLP (Pesos Chilenos)**
- Sin decimales (redondeo a enteros)
- Formato: `$ 1.234.567`

### IVA

- **19%** de IVA en Chile
- Se calcula sobre subtotal
- Total = Subtotal + IVA

### Cálculos de Costeo

1. **Costo Directo** = MO + Materiales + Equipos + Logística
2. **Subtotal Costo** = Costo Directo + Indirectos
3. **Gastos Generales** = Subtotal Costo × (GG % / 100)
4. **Base** = Subtotal Costo + Gastos Generales
5. **Contingencia** = Base × (Σ Contingencias % / 100)
6. **Costo Total** = Base + Contingencia
7. **Precio Venta** = Costo Total × (1 + Utilidad % / 100)
8. **IVA** = Precio Venta × 0.19
9. **Total con IVA** = Precio Venta + IVA
10. **Margen Bruto** = Precio Venta - Costo Total
11. **Margen %** = (Margen Bruto / Precio Venta) × 100

---

## 🔑 Keys y Credenciales

### Supabase

- **Project URL:** `https://rxfcdnuycrauvybjowik.supabase.co`
- **Anon Key:** Ver `env.example` o Supabase Dashboard > Settings > API
- **Service Role Key:** NO se usa en el cliente (solo servidor si se necesita)

### Resend (Emails)

- API Key para envío de emails (invitaciones)
- Configurada en Supabase como variable de entorno
- Ver: Supabase Dashboard > Settings > Edge Functions > Secrets

### Cloudflare

- DNS configurado para `cot.piwisuite.cl`
- SSL/TLS automático
- Proxy habilitado

---

## 📝 Notas Importantes

### Seguridad

- ✅ **Nunca** commitear `.env.local` o credenciales
- ✅ Usar variables de entorno siempre
- ✅ La anon key es segura en el cliente (RLS la protege)
- ✅ Service role key solo en servidor (si se necesita)

### Performance

- ✅ Next.js hace caching automático
- ✅ Supabase tiene límites de rate limiting
- ✅ PDFs se generan en cliente (no carga servidor)

### Limitaciones Actuales

- ⚠️ Firebase Hosting no soporta SSR completo (por eso se usa Easypanel)
- ⚠️ Algunas funciones legacy de Firebase aún en código (no usadas)
- ⚠️ Storage de Supabase no configurado aún (para logos futuros)

---

## 📚 Recursos Adicionales

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React PDF Renderer](https://react-pdf.org/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 🆘 Soporte y Contacto

Para problemas o preguntas:
- Revisar logs en Easypanel
- Verificar variables de entorno
- Consultar documentación de Supabase
- Revisar código fuente en GitHub

---

**Última actualización:** Diciembre 2025  
**Versión:** 0.1.0  
**Autor:** PiwiSuite Team

