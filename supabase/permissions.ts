import { api } from '@/lib/api-client';
import { isSuperAdmin } from './admin';
import { getTenantMembers } from './tenants';

export async function isTenantAdmin(userId: string, tenantId: string): Promise<boolean> {
  try {
    const members = await getTenantMembers(tenantId);
    const userMembership = members.find((m: any) => m.user_id === userId);
    return userMembership?.role === 'admin' || userMembership?.role === 'owner';
  } catch {
    return false;
  }
}

export async function isTenantOwner(userId: string, tenantId: string): Promise<boolean> {
  try {
    const members = await getTenantMembers(tenantId);
    const userMembership = members.find((m: any) => m.user_id === userId);
    return userMembership?.role === 'owner';
  } catch {
    return false;
  }
}

export async function hasTenantAccess(userId: string, tenantId: string): Promise<boolean> {
  try {
    const members = await getTenantMembers(tenantId);
    return members.some((m: any) => m.user_id === userId);
  } catch {
    return false;
  }
}

export async function canManageTenant(userId: string, tenantId: string): Promise<boolean> {
  try {
    const isSuper = await isSuperAdmin(userId);
    if (isSuper) return true;
    return await isTenantAdmin(userId, tenantId);
  } catch {
    return false;
  }
}

export async function canManageTenantUsers(userId: string, tenantId: string): Promise<boolean> {
  return canManageTenant(userId, tenantId);
}

export async function canViewTenantData(userId: string, tenantId: string): Promise<boolean> {
  try {
    const isSuper = await isSuperAdmin(userId);
    if (isSuper) return true;
    return await hasTenantAccess(userId, tenantId);
  } catch {
    return false;
  }
}