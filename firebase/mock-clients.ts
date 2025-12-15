// Mock de clients.ts para desarrollo local
import { Client } from '@/types';
import { mockClients } from '@/lib/mock-storage';

export async function createClient(clientData: Omit<Client, 'id'>): Promise<string> {
  return mockClients.create(clientData);
}

export async function getClientById(clientId: string): Promise<Client | null> {
  return mockClients.getById(clientId);
}

export async function getAllClients(): Promise<Client[]> {
  return mockClients.getAll();
}

export async function getClientByRUT(rut: string): Promise<Client | null> {
  return mockClients.getByRUT(rut.replace(/[.\-]/g, ''));
}

export async function updateClient(clientId: string, clientData: Partial<Client>): Promise<void> {
  mockClients.update(clientId, clientData);
}

export async function deleteClient(clientId: string): Promise<void> {
  mockClients.delete(clientId);
}



