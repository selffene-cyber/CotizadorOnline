import { api } from '@/lib/api-client';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TenantWithMembers extends Tenant {
  member_count?: number;
  owner?: {
    id: string;
    email: string;
    display_name?: string;
  };
}

export async function getAllTenants(): Promise<TenantWithMembers[]> {
  try {
    const data = await api.admin.getTenants();
    return data.tenants || [];
  } catch {
    return [];
  }
}

export async function getTenantById(tenantId: string): Promise<Tenant | null> {
  try {
    const data = await api.tenants.getById(tenantId);
    return data.tenant || null;
  } catch {
    return null;
  }
}

export async function createTenant(name: string, slug: string, createdBy: string): Promise<Tenant> {
  const data = await api.tenants.create(name, slug);
  return data.tenant;
}

export async function updateTenant(tenantId: string, updates: { name?: string; slug?: string }): Promise<void> {
  await api.tenants.update(tenantId, updates);
}

export async function deleteTenant(tenantId: string): Promise<void> {
  await api.admin.deleteTenant(tenantId);
}

export async function getTenantMembers(tenantId: string) {
  try {
    const data = await api.tenants.getMembers(tenantId);
    return data.members || [];
  } catch {
    return [];
  }
}

export async function addUserToTenant(
  tenantId: string,
  userId: string,
  role: 'owner' | 'admin' | 'user'
): Promise<void> {
  await api.tenants.addMember(tenantId, userId, role);
}

export async function updateUserRoleInTenant(
  tenantId: string,
  userId: string,
  newRole: 'owner' | 'admin' | 'user'
): Promise<void> {
  await api.tenants.updateMemberRole(tenantId, userId, newRole);
}

export async function removeUserFromTenant(
  tenantId: string,
  userId: string
): Promise<void> {
  await api.tenants.removeMember(tenantId, userId);
}