// Helpers para catálogos con Supabase
import { MaterialCatalogItem, EquipmentCatalogItem, LaborCatalogItem, RiskCatalogItem, Settings } from '@/types';
import { supabase, hasValidSupabaseConfig } from './config';

// Materiales
export async function getMaterialsCatalog(): Promise<MaterialCatalogItem[]> {
  if (!hasValidSupabaseConfig()) {
    return [];
  }

  const { data, error } = await supabase
    .from('material_catalog')
    .select('*')
    .order('name');

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    number: row.code ? parseInt(row.code) || undefined : undefined,
    name: row.name,
    unidad: row.unit,
    defaultMermaPct: row.default_merma || 0,
    category: row.category,
  }));
}

export async function saveMaterialsCatalog(items: MaterialCatalogItem[]): Promise<void> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase no está configurado');
  }

  // Eliminar todos los existentes
  await supabase.from('material_catalog').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Insertar nuevos
  if (items.length > 0) {
    const rows = items.map(item => ({
      code: item.number?.toString() || undefined,
      name: item.name,
      unit: item.unidad,
      default_cost: 0, // No hay defaultCost en el tipo
      default_merma: item.defaultMermaPct,
      category: item.category,
    }));

    const { error } = await supabase.from('material_catalog').insert(rows);
    if (error) {
      throw new Error(`Error al guardar catálogo de materiales: ${error.message}`);
    }
  }
}

// Equipos
export async function getEquipmentCatalog(): Promise<EquipmentCatalogItem[]> {
  if (!hasValidSupabaseConfig()) {
    return [];
  }

  const { data, error } = await supabase
    .from('equipment_catalog')
    .select('*')
    .order('name');

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    number: row.code ? parseInt(row.code) || undefined : undefined,
    name: row.name,
    unit: row.unit as 'día' | 'hora',
    defaultRate: row.default_rate,
    category: row.category,
  }));
}

export async function saveEquipmentCatalog(items: EquipmentCatalogItem[]): Promise<void> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase no está configurado');
  }

  // Eliminar todos los existentes
  await supabase.from('equipment_catalog').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Insertar nuevos
  if (items.length > 0) {
    const rows = items.map(item => ({
      code: item.number?.toString() || undefined,
      name: item.name,
      unit: item.unit,
      default_rate: item.defaultRate || 0,
      category: item.category,
    }));

    const { error } = await supabase.from('equipment_catalog').insert(rows);
    if (error) {
      throw new Error(`Error al guardar catálogo de equipos: ${error.message}`);
    }
  }
}

// Labor, Risk y Settings - Por ahora usar localStorage como fallback
// TODO: Crear tablas en Supabase si es necesario
export async function getLaborCatalog(): Promise<LaborCatalogItem[]> {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem('labor-catalog');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error cargando catálogo de labor:', error);
  }

  return [];
}

export async function saveLaborCatalog(items: LaborCatalogItem[]): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem('labor-catalog', JSON.stringify(items));
  } catch (error) {
    console.error('Error guardando catálogo de labor:', error);
    throw error;
  }
}

export async function getRiskCatalog(): Promise<RiskCatalogItem[]> {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem('risk-catalog');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error cargando catálogo de riesgos:', error);
  }

  return [];
}

export async function saveRiskCatalog(items: RiskCatalogItem[]): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem('risk-catalog', JSON.stringify(items));
  } catch (error) {
    console.error('Error guardando catálogo de riesgos:', error);
    throw error;
  }
}

export async function getSettings(): Promise<Settings> {
  if (typeof window === 'undefined') {
    return {
      ggDefault: 12,
      utilityDefault: 55,
      utilityMin: 45,
      ratePerKm: 0,
      hoursPerDay: 9,
      efficiency: 0.85,
      equipmentPercentageMO: 4,
    };
  }

  try {
    const stored = localStorage.getItem('settings');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error cargando configuración:', error);
  }

  return {
    ggDefault: 12,
    utilityDefault: 55,
    utilityMin: 45,
    ratePerKm: 0,
    hoursPerDay: 9,
    efficiency: 0.85,
    equipmentPercentageMO: 4,
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem('settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error guardando configuración:', error);
    throw error;
  }
}

