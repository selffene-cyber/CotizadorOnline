// Tipos principales para Cotizador Pro

export interface Client {
  id?: string;
  name: string; // Razón Social
  rut: string;
  contact: string; // Nombre de Contacto
  email: string;
  phone: string;
  region: string; // Región
  city: string; // Ciudad
  address: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type QuoteStatus = 'Borrador' | 'Enviada' | 'Aprobada' | 'Perdida';
export type ProjectType = 'Fabricación' | 'Montaje' | 'Obras Civiles' | 'Reparación' | 'Eventos';
export type Modality = 'Cerrado' | 'HH+Mat' | 'Mixto';

// ===== COSTEO =====
// Costeo es una entidad independiente que representa el cálculo de costos de un proyecto/servicio
export interface Costing {
  id?: string;
  costingNumber?: number; // Número correlativo del costeo
  name: string; // Nombre del proyecto/servicio costeado
  description?: string;
  type: ProjectType;
  modality: Modality;
  clientId?: string; // Cliente asociado al costeo cuando se creó
  
  // Items de costeo
  itemsMO: QuoteItemMO[];
  itemsMaterials: QuoteItemMaterial[];
  itemsEquipment: QuoteItemEquipment[];
  itemsLogistics: QuoteItemLogistics;
  itemsIndirects: QuoteItemIndirect[];
  
  // Configuración de costeo
  ggPercentage: number; // Gastos Generales %
  contingencyItems: ContingencyItem[];
  utilityPercentage: number;
  
  // Totales calculados del costeo
  totals?: QuoteTotals;
  
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}

// ===== COTIZACIÓN =====
// Cotización es una propuesta comercial que puede incluir uno o más costeos + items manuales
export interface Quote {
  id?: string;
  clientId: string;
  client?: Client;
  status: QuoteStatus;
  version: number;
  parentQuoteId?: string; // Para versionado
  quoteNumber?: number; // Número correlativo de la cotización
  
  // Datos del proyecto/cliente
  projectName: string;
  location?: string; // Deprecated, usar region y city
  region?: string;
  city?: string;
  type?: ProjectType; // Tipo de proyecto (Fabricación, Montaje, etc.)
  modality?: Modality; // Modalidad (Cerrado, HH+Mat, Mixto)
  scope: string;
  exclusions: string;
  assumptions: string;
  executionDeadline: number; // días
  validity: number; // días
  paymentTerms: string;
  warranties: string;
  
  // Items de cotización (líneas de productos/servicios para mostrar al cliente)
  // Estos pueden venir de costeos o ser agregados manualmente
  quoteItems: QuoteLineItem[];
  
  // Referencias a costeos usados (opcional, para trazabilidad)
  costingReferences?: string[]; // IDs de costeos usados
  
  // Utilidad porcentual (copiada del costeo asociado)
  utilityPercentage?: number;
  
  // Totales calculados basados en quoteItems
  totals?: {
    subtotal: number; // Suma de todos los quoteItems
    iva: number; // 19% del subtotal
    totalConIva: number; // subtotal + iva
  };
  
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}

// Item de línea de cotización (lo que se muestra al cliente)
export interface QuoteLineItem {
  id?: string;
  itemNumber?: number; // Número correlativo del item (1, 2, 3, ...)
  codigoInterno?: string; // Código interno del item (creado manualmente)
  description: string; // Descripción del producto/servicio
  quantity: number; // Cantidad
  unit: string; // Unidad (pz, m2, m, etc.)
  cost: number; // Costo unitario (para items nuevos manuales)
  margin?: number; // Margen en $ (para items nuevos manuales)
  marginPct?: number; // Margen en % (para items nuevos manuales)
  unitPrice: number; // Precio unitario (costo + margen) o precio desde costeo
  subtotal: number; // quantity * unitPrice
  // Opcional: referencia al costeo si viene de ahí
  costingId?: string; // ID del costeo del cual proviene este item
}

export interface QuoteItemMO {
  cargo: string;
  days?: number;
  hoursPerDay?: number;
  efficiency?: number;
  hh: number; // Horas hombre calculadas o directas
  costHH: number;
  recargoPct: number;
  subtotal: number;
}

export interface QuoteItemMaterial {
  item: string;
  unidad: string;
  quantity: number;
  unitCost: number;
  mermaPct: number;
  subtotal: number;
}

export interface QuoteItemEquipment {
  equipment: string;
  unit: 'día' | 'hora';
  quantity: number;
  rate: number;
  subtotal: number;
}

export interface QuoteItemLogistics {
  mode: 'km' | 'viatico';
  // Modo km
  km?: number;
  ratePerKm?: number;
  tolls?: number;
  driverHours?: number;
  driverRate?: number;
  // Modo viático
  viaticoPerDay?: number;
  days?: number;
  accommodation?: number;
  fixedMobilization?: number;
  subtotal: number;
}

export interface QuoteItemIndirect {
  description: string;
  type: 'hh' | 'fixed';
  hours?: number;
  rate?: number;
  amount?: number;
  subtotal: number;
}

export interface ContingencyItem {
  name: string;
  percentage: number;
  custom?: boolean;
}

export interface QuoteTotals {
  costoDirecto: number; // MO + Materiales + Equipos + Logística
  indirectosObra: number;
  subtotalCosto: number; // Directo + Indirectos
  gastosGenerales: number; // GG % * Subtotal
  base: number; // Subtotal + GG
  contingencia: number; // % * Base
  costoTotal: number; // Base + Contingencia
  precioVenta: number; // Costo Total * (1 + Utilidad%) - Precio Neto
  precioNeto: number; // Precio Venta (sin IVA)
  iva: number; // 19% del Precio Neto
  totalConIva: number; // Precio Neto + IVA
  margenBruto: number; // Precio Neto - Costo Total
  margenPct: number; // (Margen Bruto / Precio Neto) * 100
  markup: number; // (Precio Neto / Costo Total) - 1
}

// Catálogos
export interface MaterialCatalogItem {
  id?: string;
  number?: number; // Número correlativo
  name: string;
  unidad: string;
  defaultMermaPct: number;
  category?: string;
}

export interface EquipmentCatalogItem {
  id?: string;
  number?: number; // Número correlativo
  name: string;
  unit: 'día' | 'hora';
  defaultRate?: number;
  category?: string;
}

export interface LaborCatalogItem {
  id?: string;
  number?: number; // Número correlativo
  cargo: string;
  defaultCostHH: number;
  category?: string;
}

export interface RiskCatalogItem {
  id?: string;
  name: string;
  percentage: number;
  description?: string;
}

export interface Settings {
  ggDefault: number; // 10, 12, 15
  utilityDefault: number; // 45-65
  utilityMin: number; // mínimo bloqueable
  ratePerKm: number;
  hoursPerDay: number; // default 9
  efficiency: number; // default 0.85
  equipmentPercentageMO: number; // default 4%
}

export interface CompanySettings {
  // Datos de la empresa
  companyName: string;
  companyRUT: string;
  companyGiro: string;
  companyAddress: string;
  companyCity: string;
  companyRegion: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  companySocialMedia: string; // Redes sociales (Facebook, Instagram, LinkedIn, etc.)
  
  // Datos del cotizador
  quoterName: string;
  quoterPosition: string; // Cargo
  quoterEmail: string;
  quoterPhone: string;
  
  // Datos de cuenta bancaria para pagos
  bankAccountName?: string; // Nombre del titular de la cuenta
  bankAccountRUT?: string; // RUT del titular
  bankName?: string; // Nombre del banco
  bankAccountType?: string; // Tipo de cuenta (Corriente, Ahorro, Vista, etc.)
  bankAccountNumber?: string; // Número de cuenta
  bankEmail?: string; // Email para transferencias (opcional)
  
  // Logo
  companyLogo: string; // Base64 o URL del logo
}

