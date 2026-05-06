import { Costing } from '@/types';
import { api } from '@/lib/api-client';

function toCosting(row: any): Costing {
  return {
    id: row.id,
    costingNumber: row.costing_number,
    name: row.name,
    description: row.description,
    type: row.type,
    modality: row.modality,
    clientId: row.client_id,
    itemsMO: typeof row.items_mo === 'string' ? JSON.parse(row.items_mo) : (row.items_mo || []),
    itemsMaterials: typeof row.items_materials === 'string' ? JSON.parse(row.items_materials) : (row.items_materials || []),
    itemsEquipment: typeof row.items_equipment === 'string' ? JSON.parse(row.items_equipment) : (row.items_equipment || []),
    itemsLogistics: typeof row.items_logistics === 'string' ? JSON.parse(row.items_logistics) : (row.items_logistics || { mode: 'km', subtotal: 0 }),
    itemsIndirects: typeof row.items_indirects === 'string' ? JSON.parse(row.items_indirects) : (row.items_indirects || []),
    ggPercentage: row.gg_percentage ?? 12,
    contingencyItems: typeof row.contingency_items === 'string' ? JSON.parse(row.contingency_items) : (row.contingency_items || []),
    utilityPercentage: row.utility_percentage ?? 55,
    totals: typeof row.totals === 'string' ? JSON.parse(row.totals) : row.totals,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    createdBy: row.created_by,
  };
}

function toRow(costing: Partial<Costing>): any {
  const row: any = {};
  if (costing.costingNumber !== undefined) row.costing_number = costing.costingNumber;
  if (costing.name !== undefined) row.name = costing.name;
  if (costing.description !== undefined) row.description = costing.description;
  if (costing.type !== undefined) row.type = costing.type;
  if (costing.modality !== undefined) row.modality = costing.modality;
  if (costing.clientId !== undefined) row.client_id = costing.clientId;
  if (costing.itemsMO !== undefined) row.items_mo = costing.itemsMO;
  if (costing.itemsMaterials !== undefined) row.items_materials = costing.itemsMaterials;
  if (costing.itemsEquipment !== undefined) row.items_equipment = costing.itemsEquipment;
  if (costing.itemsLogistics !== undefined) row.items_logistics = costing.itemsLogistics;
  if (costing.itemsIndirects !== undefined) row.items_indirects = costing.itemsIndirects;
  if (costing.ggPercentage !== undefined) row.gg_percentage = costing.ggPercentage;
  if (costing.contingencyItems !== undefined) row.contingency_items = costing.contingencyItems;
  if (costing.utilityPercentage !== undefined) row.utility_percentage = costing.utilityPercentage;
  if (costing.totals !== undefined) row.totals = costing.totals;
  return row;
}

export async function createCosting(costingData: Omit<Costing, 'id'>, tenantId?: string): Promise<string> {
  const data = await api.costings.create(toRow(costingData), tenantId);
  return data.costing.id;
}

export async function getCostingById(costingId: string): Promise<Costing | null> {
  try {
    const data = await api.costings.getById(costingId);
    return data.costing ? toCosting(data.costing) : null;
  } catch {
    return null;
  }
}

export async function getAllCostings(tenantId?: string): Promise<Costing[]> {
  try {
    const data = await api.costings.getAll(tenantId);
    return (data.costings || []).map(toCosting);
  } catch {
    return [];
  }
}

export async function updateCosting(costingId: string, costingData: Partial<Costing>): Promise<void> {
  await api.costings.update(costingId, toRow(costingData));
}

export async function deleteCosting(costingId: string): Promise<void> {
  await api.costings.delete(costingId);
}