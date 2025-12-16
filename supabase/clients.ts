// Helpers para manejo de Clientes con Supabase
import { Client } from '@/types';
import { supabase, hasValidSupabaseConfig, createSupabaseClient } from './config';

// Helper para obtener el cliente correcto
function getSupabaseClient() {
  return typeof window !== 'undefined' ? createSupabaseClient() : supabase;
}

// Función auxiliar para convertir de snake_case a camelCase
function toClient(row: any): Client {
  return {
    id: row.id,
    name: row.name,
    rut: row.rut,
    contact: row.contact,
    email: row.email,
    phone: row.phone,
    region: row.region,
    city: row.city,
    address: row.address,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  };
}

// Función auxiliar para convertir de camelCase a snake_case
function toRow(client: Partial<Client>): any {
  const row: any = {};
  if (client.name !== undefined) row.name = client.name;
  if (client.rut !== undefined) row.rut = client.rut;
  if (client.contact !== undefined) row.contact = client.contact;
  if (client.email !== undefined) row.email = client.email;
  if (client.phone !== undefined) row.phone = client.phone;
  if (client.region !== undefined) row.region = client.region;
  if (client.city !== undefined) row.city = client.city;
  if (client.address !== undefined) row.address = client.address;
  return row;
}

export async function createClient(
  clientData: Omit<Client, 'id'>,
  tenantId?: string
): Promise<string> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase no está configurado');
  }

  const supabaseClient = getSupabaseClient();
  const rowData = toRow(clientData);
  
  // Agregar tenant_id si se proporciona
  if (tenantId) {
    rowData.tenant_id = tenantId;
  }

  const { data, error } = await supabaseClient
    .from('clients')
    .insert(rowData)
    .select('id')
    .single();

  if (error) {
    throw new Error(`Error al crear cliente: ${error.message}`);
  }

  return data.id;
}

export async function getClientById(clientId: string): Promise<Client | null> {
  if (!hasValidSupabaseConfig()) {
    return null;
  }

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error || !data) {
    return null;
  }

  return toClient(data);
}

export async function getAllClients(tenantId?: string): Promise<Client[]> {
  if (!hasValidSupabaseConfig()) {
    return [];
  }

  const supabaseClient = getSupabaseClient();
  let query = supabaseClient
    .from('clients')
    .select('*');

  // Filtrar por tenant_id si se proporciona
  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(toClient);
}

export async function getClientByRUT(rut: string): Promise<Client | null> {
  if (!hasValidSupabaseConfig()) {
    return null;
  }

  // Normalizar RUT (remover puntos y guiones)
  const normalizedRut = rut.replace(/[.\-]/g, '');

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('rut', normalizedRut)
    .single();

  if (error || !data) {
    return null;
  }

  return toClient(data);
}

export async function updateClient(clientId: string, clientData: Partial<Client>): Promise<void> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase no está configurado');
  }

  const { error } = await supabase
    .from('clients')
    .update(toRow(clientData))
    .eq('id', clientId);

  if (error) {
    throw new Error(`Error al actualizar cliente: ${error.message}`);
  }
}

export async function deleteClient(clientId: string): Promise<void> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase no está configurado');
  }

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId);

  if (error) {
    throw new Error(`Error al eliminar cliente: ${error.message}`);
  }
}

