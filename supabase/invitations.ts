// Funciones para gestión de invitaciones
import { supabase, createSupabaseClient } from './config';

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

// Helper para obtener el cliente correcto
function getSupabaseClient() {
  return typeof window !== 'undefined' ? createSupabaseClient() : supabase;
}

/**
 * Crear una invitación
 */
export async function createInvitation(
  tenantId: string,
  email: string,
  role: 'owner' | 'admin' | 'user',
  invitedBy: string,
  expiresInDays: number = 7
): Promise<Invitation> {
  try {
    const supabaseClient = getSupabaseClient();
    
    // Generar token único
    const token = `${tenantId}-${email}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const { data, error } = await supabaseClient
      .from('invitations')
      .insert({
        tenant_id: tenantId,
        email,
        role,
        token,
        status: 'pending',
        invited_by: invitedBy,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[createInvitation] Error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('[createInvitation] Error:', error);
    throw error;
  }
}

/**
 * Obtener invitaciones de un tenant
 */
export async function getTenantInvitations(tenantId: string): Promise<Invitation[]> {
  try {
    const supabaseClient = getSupabaseClient();
    const { data, error } = await supabaseClient
      .from('invitations')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getTenantInvitations] Error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getTenantInvitations] Error:', error);
    return [];
  }
}

/**
 * Obtener invitación por token
 */
export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  try {
    const supabaseClient = getSupabaseClient();
    const { data, error } = await supabaseClient
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (error) {
      console.error('[getInvitationByToken] Error:', error);
      return null;
    }

    // Verificar si está expirada
    if (new Date(data.expires_at) < new Date()) {
      // Actualizar estado a expirada
      await supabaseClient
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', data.id);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[getInvitationByToken] Error:', error);
    return null;
  }
}

/**
 * Aceptar una invitación
 */
export async function acceptInvitation(
  token: string,
  userId: string
): Promise<void> {
  try {
    const supabaseClient = getSupabaseClient();
    
    // Obtener la invitación
    const invitation = await getInvitationByToken(token);
    if (!invitation) {
      throw new Error('Invitación no encontrada o expirada');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Esta invitación ya fue procesada');
    }

    // Verificar que el email del usuario coincida
    const { data: user } = await supabaseClient
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (!user || user.email !== invitation.email) {
      throw new Error('El email del usuario no coincide con la invitación');
    }

    // Agregar usuario al tenant
    const { error: membershipError } = await supabaseClient
      .from('memberships')
      .insert({
        tenant_id: invitation.tenant_id,
        user_id: userId,
        role: invitation.role,
      });

    if (membershipError) {
      console.error('[acceptInvitation] Error creando membership:', membershipError);
      throw membershipError;
    }

    // Actualizar estado de la invitación
    const { error: updateError } = await supabaseClient
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('[acceptInvitation] Error actualizando invitación:', updateError);
      // No lanzar error, la membership ya se creó
    }
  } catch (error) {
    console.error('[acceptInvitation] Error:', error);
    throw error;
  }
}

/**
 * Rechazar una invitación
 */
export async function rejectInvitation(token: string): Promise<void> {
  try {
    const supabaseClient = getSupabaseClient();
    const { error } = await supabaseClient
      .from('invitations')
      .update({ status: 'rejected' })
      .eq('token', token);

    if (error) {
      console.error('[rejectInvitation] Error:', error);
      throw error;
    }
  } catch (error) {
    console.error('[rejectInvitation] Error:', error);
    throw error;
  }
}

/**
 * Cancelar una invitación (solo para admins)
 */
export async function cancelInvitation(invitationId: string): Promise<void> {
  try {
    const supabaseClient = getSupabaseClient();
    const { error } = await supabaseClient
      .from('invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      console.error('[cancelInvitation] Error:', error);
      throw error;
    }
  } catch (error) {
    console.error('[cancelInvitation] Error:', error);
    throw error;
  }
}

