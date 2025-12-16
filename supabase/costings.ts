// Helpers para manejo de Costeos con Supabase
import { Costing } from '@/types';
import { supabase, hasValidSupabaseConfig } from './config';

// Función auxiliar para convertir de snake_case a camelCase
function toCosting(row: any): Costing {
  return {
    id: row.id,
    costingNumber: row.costing_number,
    name: row.name,
    description: row.description,
    type: row.type,
    modality: row.modality,
    clientId: row.client_id,
    itemsMO: row.items_mo || [],
    itemsMaterials: row.items_materials || [],
    itemsEquipment: row.items_equipment || [],
    itemsLogistics: row.items_logistics || { mode: 'km', subtotal: 0 },
    itemsIndirects: row.items_indirects || [],
    ggPercentage: row.gg_percentage || 12,
    contingencyItems: row.contingency_items || [],
    utilityPercentage: row.utility_percentage || 55,
    totals: row.totals,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    createdBy: row.created_by,
  };
}

// Función auxiliar para convertir de camelCase a snake_case
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

export async function createCosting(costingData: Omit<Costing, 'id'>): Promise<string> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase
    .from('costings')
    .insert(toRow(costingData))
    .select('id')
    .single();

  if (error) {
    throw new Error(`Error al crear costeo: ${error.message}`);
  }

  return data.id;
}

export async function getCostingById(costingId: string): Promise<Costing | null> {
  if (!hasValidSupabaseConfig()) {
    return null;
  }

  const { data, error } = await supabase
    .from('costings')
    .select('*')
    .eq('id', costingId)
    .single();

  if (error || !data) {
    return null;
  }

  return toCosting(data);
}

export async function getAllCostings(): Promise<Costing[]> {
  if (!hasValidSupabaseConfig()) {
    return [];
  }

  const { data, error } = await supabase
    .from('costings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(toCosting);
}

export async function updateCosting(costingId: string, costingData: Partial<Costing>): Promise<void> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase no está configurado');
  }

  const { error } = await supabase
    .from('costings')
    .update(toRow(costingData))
    .eq('id', costingId);

  if (error) {
    throw new Error(`Error al actualizar costeo: ${error.message}`);
  }
}

export async function deleteCosting(costingId: string): Promise<void> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase no está configurado');
  }

  const { error } = await supabase
    .from('costings')
    .delete()
    .eq('id', costingId);

  if (error) {
    throw new Error(`Error al eliminar costeo: ${error.message}`);
  }
}

