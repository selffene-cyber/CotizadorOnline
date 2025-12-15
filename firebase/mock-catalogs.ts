// Mock de catalogs.ts para desarrollo local
import { MaterialCatalogItem, EquipmentCatalogItem, LaborCatalogItem, RiskCatalogItem, Settings } from '@/types';
import { mockCatalogs } from '@/lib/mock-storage';

export async function getMaterialsCatalog(): Promise<MaterialCatalogItem[]> {
  return mockCatalogs.getMaterials();
}

export async function saveMaterialsCatalog(items: MaterialCatalogItem[]): Promise<void> {
  mockCatalogs.saveMaterials(items);
}

export async function getEquipmentCatalog(): Promise<EquipmentCatalogItem[]> {
  return mockCatalogs.getEquipment();
}

export async function saveEquipmentCatalog(items: EquipmentCatalogItem[]): Promise<void> {
  mockCatalogs.saveEquipment(items);
}

export async function getLaborCatalog(): Promise<LaborCatalogItem[]> {
  return mockCatalogs.getLabor();
}

export async function saveLaborCatalog(items: LaborCatalogItem[]): Promise<void> {
  mockCatalogs.saveLabor(items);
}

export async function getRiskCatalog(): Promise<RiskCatalogItem[]> {
  return mockCatalogs.getRisks();
}

export async function saveRiskCatalog(items: RiskCatalogItem[]): Promise<void> {
  mockCatalogs.saveRisks(items);
}

export async function getSettings(): Promise<Settings> {
  return mockCatalogs.getSettings();
}

export async function saveSettings(settings: Settings): Promise<void> {
  mockCatalogs.saveSettings(settings);
}



