import { api } from '@/lib/api-client';

export interface AccessRequest {
  id: string;
  user_id: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  notes?: string;
}

export interface UserWithRequest {
  id: string;
  email: string;
  display_name?: string;
  photo_url?: string;
  role: string;
  created_at?: string;
  updated_at?: string;
  access_request?: AccessRequest | null;
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    const data = await api.auth.me();
    return data.user?.role === 'admin';
  } catch {
    return false;
  }
}

export async function getAccessRequests(): Promise<AccessRequest[]> {
  try {
    const data = await api.admin.getAccessRequests();
    return data.requests || [];
  } catch {
    return [];
  }
}

export async function getAllUsers(): Promise<any[]> {
  try {
    const data = await api.admin.getUsers();
    return data.users || [];
  } catch {
    return [];
  }
}

export async function approveAccessRequest(requestId: string, reviewerId: string): Promise<void> {
  await api.admin.approveRequest(requestId);
}

export async function rejectAccessRequest(requestId: string, reviewerId: string, notes?: string): Promise<void> {
  await api.admin.rejectRequest(requestId, notes);
}

export async function updateUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
  await api.admin.updateUserRole(userId, role);
}

export async function deleteUser(userId: string): Promise<void> {
  await api.admin.deleteUser(userId);
}

export async function getSystemStats() {
  try {
    return await api.admin.getStats();
  } catch {
    return { totalUsers: 0, totalTenants: 0, pendingRequests: 0 };
  }
}

export async function createAccessRequest(email: string, userId: string): Promise<void> {
  throw new Error('Access requests are created automatically during registration via the API');
}