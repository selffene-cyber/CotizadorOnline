// Helpers para manejo de Costeos con Supabase
import { Costing } from '@/types';
import { supabase, hasValidSupabaseConfig, createSupabaseClient } from './config';

// Helper para obtener el cliente correcto
function getSupabaseClient() {
  return typeof window !== 'undefined' ? createSupabaseClient() : supabase;
}

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

export async function createCosting(costingData: Omit<Costing, 'id'>, tenantId?: string): Promise<string> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase no está configurado');
  }

  const supabaseClient = getSupabaseClient();
  const rowData = toRow(costingData);
  
  // Obtener el usuario actual
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Usuario no autenticado. Debes iniciar sesión para crear costeos.');
  }

  // Agregar created_by
  rowData.created_by = user.id;

  // Obtener tenant_id si no se proporciona
  let finalTenantId = tenantId;
  
  if (!finalTenantId) {
    // Buscar el tenant_id del usuario desde memberships
    const { data: memberships, error: membershipError } = await supabaseClient
      .from('memberships')
      .select('tenant_id')
      .eq('user_id', user.id)
      .limit(1);

    if (membershipError || !memberships || memberships.length === 0) {
      throw new Error('No se encontró un tenant asociado. Asegúrate de estar asociado a una empresa.');
    }

    finalTenantId = memberships[0].tenant_id;
  }

  if (!finalTenantId) {
    throw new Error('No se pudo determinar el tenant_id. Proporciona un tenant_id o asegúrate de estar asociado a una empresa.');
  }

  // Agregar tenant_id
  rowData.tenant_id = finalTenantId;

  const { data, error } = await supabaseClient
    .from('costings')
    .insert(rowData)
    .select('id')
    .single();

  if (error) {
    console.error('[createCosting] Error completo:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(`Error al crear costeo: ${error.message || 'Error desconocido'}`);
  }

  if (!data) {
    throw new Error('No se pudo crear el costeo. No se recibió confirmación del servidor.');
  }

  return data.id;
}

export async function getCostingById(costingId: string): Promise<Costing | null> {
  if (!hasValidSupabaseConfig()) {
    return null;
  }

  const supabaseClient = getSupabaseClient();
  const { data, error } = await supabaseClient
    .from('costings')
    .select('*')
    .eq('id', costingId)
    .single();

  if (error || !data) {
    return null;
  }

  return toCosting(data);
}

export async function getAllCostings(tenantId?: string): Promise<Costing[]> {
  if (!hasValidSupabaseConfig()) {
    return [];
  }

  const supabaseClient = getSupabaseClient();
  let query = supabaseClient
    .from('costings')
    .select('*');

  // Filtrar por tenant_id si se proporciona
  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(toCosting);
}

export async function updateCosting(costingId: string, costingData: Partial<Costing>): Promise<void> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase no está configurado');
  }

  const supabaseClient = getSupabaseClient();
  const { error } = await supabaseClient
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

  const supabaseClient = getSupabaseClient();
  const { error } = await supabaseClient
    .from('costings')
    .delete()
    .eq('id', costingId);

  if (error) {
    throw new Error(`Error al eliminar costeo: ${error.message}`);
  }
}

