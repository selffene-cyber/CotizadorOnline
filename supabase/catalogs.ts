import { MaterialCatalogItem, EquipmentCatalogItem, LaborCatalogItem, RiskCatalogItem, Settings } from '@/types';
import { api } from '@/lib/api-client';

export async function getMaterialsCatalog(tenantId?: string): Promise<MaterialCatalogItem[]> {
  try {
    const data = await api.catalogs.getMaterials(tenantId);
    return (data.materials || []).map((row: any) => ({
      id: row.id,
      number: row.code ? parseInt(row.code.split('-')[1] || row.code) || undefined : undefined,
      name: row.name,
      unidad: row.unit,
      defaultCost: row.default_cost !== null && row.default_cost !== undefined ? parseFloat(row.default_cost) : 0,
      defaultMermaPct: row.default_merma || 0,
      category: row.category,
    }));
  } catch {
    return [];
  }
}

export async function saveMaterialsCatalog(items: MaterialCatalogItem[], tenantId?: string): Promise<void> {
  const rows = items.map(item => ({
    code: item.number ? `${tenantId}-${item.number}` : `${tenantId}-temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: item.name,
    unidad: item.unidad,
    defaultCost: item.defaultCost ?? 0,
    default_merma: item.defaultMermaPct ?? 0,
    default_cost: item.defaultCost ?? 0,
    category: item.category,
    number: item.number,
  }));
  await api.catalogs.saveMaterials(rows, tenantId);
}

export async function getEquipmentCatalog(tenantId?: string): Promise<EquipmentCatalogItem[]> {
  try {
    const data = await api.catalogs.getEquipment(tenantId);
    return (data.equipment || []).map((row: any) => ({
      id: row.id,
      number: row.code ? parseInt(row.code) || undefined : undefined,
      name: row.name,
      unit: row.unit as 'día' | 'hora',
      defaultRate: row.default_rate,
      category: row.category,
    }));
  } catch {
    return [];
  }
}

export async function saveEquipmentCatalog(items: EquipmentCatalogItem[], tenantId?: string): Promise<void> {
  const rows = items.map(item => ({
    name: item.name,
    unit: item.unit,
    defaultRate: item.defaultRate || 0,
    default_rate: item.defaultRate || 0,
    category: item.category,
    number: item.number,
    code: item.number?.toString(),
  }));
  await api.catalogs.saveEquipment(rows, tenantId);
}

export async function getLaborCatalog(): Promise<LaborCatalogItem[]> {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('labor-catalog');
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export async function saveLaborCatalog(items: LaborCatalogItem[]): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('labor-catalog', JSON.stringify(items));
  } catch (error) {
    console.error('Error guardando catálogo de labor:', error);
    throw error;
  }
}

export async function getRiskCatalog(): Promise<RiskCatalogItem[]> {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('risk-catalog');
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export async function saveRiskCatalog(items: RiskCatalogItem[]): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('risk-catalog', JSON.stringify(items));
  } catch (error) {
    console.error('Error guardando catálogo de riesgos:', error);
    throw error;
  }
}

export async function getSettings(): Promise<Settings> {
  if (typeof window === 'undefined') {
    return { ggDefault: 12, utilityDefault: 55, utilityMin: 45, ratePerKm: 0, hoursPerDay: 9, efficiency: 0.85, equipmentPercentageMO: 4 };
  }
  try {
    const stored = localStorage.getItem('settings');
    if (stored) return JSON.parse(stored);
  } catch {}
  return { ggDefault: 12, utilityDefault: 55, utilityMin: 45, ratePerKm: 0, hoursPerDay: 9, efficiency: 0.85, equipmentPercentageMO: 4 };
}

export async function saveSettings(settings: Settings): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error guardando configuración:', error);
    throw error;
  }
}