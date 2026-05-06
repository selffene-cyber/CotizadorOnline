import { Client } from '@/types';
import { api } from '@/lib/api-client';

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

export async function createClient(clientData: Omit<Client, 'id'>, tenantId?: string): Promise<string> {
  const data = await api.clients.create(clientData, tenantId);
  return data.client.id;
}

export async function getClientById(clientId: string, tenantId?: string): Promise<Client | null> {
  try {
    const data = await api.clients.getById(clientId, tenantId);
    return data.client ? toClient(data.client) : null;
  } catch {
    return null;
  }
}

export async function getAllClients(tenantId?: string): Promise<Client[]> {
  try {
    const data = await api.clients.getAll(tenantId);
    return (data.clients || []).map(toClient);
  } catch {
    return [];
  }
}

export async function getClientByRUT(rut: string, tenantId?: string): Promise<Client | null> {
  try {
    const normalizedRut = rut.replace(/[.\-]/g, '');
    const data = await api.clients.getByRUT(normalizedRut, tenantId);
    return data.client ? toClient(data.client) : null;
  } catch {
    return null;
  }
}

export async function updateClient(clientId: string, clientData: Partial<Client>): Promise<void> {
  const row: any = {};
  if (clientData.name !== undefined) row.name = clientData.name;
  if (clientData.rut !== undefined) row.rut = clientData.rut;
  if (clientData.contact !== undefined) row.contact = clientData.contact;
  if (clientData.email !== undefined) row.email = clientData.email;
  if (clientData.phone !== undefined) row.phone = clientData.phone;
  if (clientData.region !== undefined) row.region = clientData.region;
  if (clientData.city !== undefined) row.city = clientData.city;
  if (clientData.address !== undefined) row.address = clientData.address;
  await api.clients.update(clientId, row);
}

export async function deleteClient(clientId: string): Promise<void> {
  await api.clients.delete(clientId);
}