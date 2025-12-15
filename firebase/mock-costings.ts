// Mock de costings.ts para desarrollo local
import { Costing } from '@/types';
import { mockCostings } from '@/lib/mock-storage';

function convertDates(costing: any): Costing {
  return {
    ...costing,
    createdAt: costing.createdAt ? new Date(costing.createdAt) : undefined,
    updatedAt: costing.updatedAt ? new Date(costing.updatedAt) : undefined,
  } as Costing;
}

export async function createCosting(costingData: Omit<Costing, 'id'>): Promise<string> {
  return mockCostings.create(costingData);
}

export async function getCostingById(costingId: string): Promise<Costing | null> {
  const costing = mockCostings.getById(costingId);
  return costing ? convertDates(costing) : null;
}

export async function getAllCostings(): Promise<Costing[]> {
  const costings = mockCostings.getAll();
  if (!costings || !Array.isArray(costings)) {
    return [];
  }
  return costings.map(convertDates);
}

export async function updateCosting(costingId: string, costingData: Partial<Costing>): Promise<void> {
  mockCostings.update(costingId, costingData);
}

export async function deleteCosting(costingId: string): Promise<void> {
  mockCostings.delete(costingId);
}

