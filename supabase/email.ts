import { api } from '@/lib/api-client';

export async function sendApprovalEmail(email: string, userName?: string): Promise<void> {
  try {
    console.log('[sendApprovalEmail] Email functionality will be handled via API/Resend');
  } catch (error) {
    console.warn('[sendApprovalEmail] Error:', error);
  }
}

export async function sendRejectionEmail(email: string, userName?: string, notes?: string): Promise<void> {
  try {
    console.log('[sendRejectionEmail] Email functionality will be handled via API/Resend');
  } catch (error) {
    console.warn('[sendRejectionEmail] Error:', error);
  }
}

export async function sendInvitationEmail(email: string, token: string, tenantName: string, role: string, inviterName: string): Promise<void> {
  try {
    console.log('[sendInvitationEmail] Email functionality will be handled via API/Resend');
  } catch (error) {
    console.warn('[sendInvitationEmail] Error:', error);
  }
}