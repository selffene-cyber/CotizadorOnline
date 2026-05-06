import { api } from '@/lib/api-client';

export interface Invitation {
  id: string;
  tenant_id: string;
  email: string;
  role: 'owner' | 'admin' | 'user';
  token: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  invited_by?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export async function createInvitation(
  tenantId: string,
  email: string,
  role: 'owner' | 'admin' | 'user',
  invitedBy: string,
  expiresInDays: number = 7
): Promise<Invitation> {
  const data = await api.invitations.create(tenantId, email, role, expiresInDays);
  return data.invitation;
}

export async function getTenantInvitations(tenantId: string): Promise<Invitation[]> {
  try {
    const data = await api.invitations.getByTenant(tenantId);
    return data.invitations || [];
  } catch {
    return [];
  }
}

export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  try {
    const data = await api.invitations.getByToken(token);
    return data.invitation || null;
  } catch {
    return null;
  }
}

export async function acceptInvitation(token: string, userId: string): Promise<void> {
  const data = await api.invitations.getByToken(token);
  if (!data.invitation) throw new Error('Invitación no encontrada o expirada');
  await api.invitations.accept(data.invitation.id);
}

export async function rejectInvitation(token: string): Promise<void> {
  const data = await api.invitations.getByToken(token);
  if (data.invitation) {
    await api.invitations.reject(data.invitation.id);
  }
}

export async function cancelInvitation(invitationId: string): Promise<void> {
  await api.invitations.cancel(invitationId);
}