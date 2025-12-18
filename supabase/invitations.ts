// Funciones para gestión de invitaciones
import { supabase, createSupabaseClient } from './config';
import { sendInvitationEmail } from './email';

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
    
    // Generar token único seguro (sin caracteres especiales que puedan causar problemas en URLs)
    // Usar formato UUID simple o token alfanumérico largo
    let token: string;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      token = crypto.randomUUID();
    } else {
      // Fallback: generar token alfanumérico seguro (sin caracteres especiales)
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      token = result;
    }
    
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

    // Obtener información del tenant y del invitador para el email
    try {
      // Obtener nombre del tenant
      const { data: tenantData } = await supabaseClient
        .from('tenants')
        .select('name')
        .eq('id', tenantId)
        .single();

      // Obtener nombre del invitador
      const { data: inviterData } = await supabaseClient
        .from('users')
        .select('display_name, email')
        .eq('id', invitedBy)
        .maybeSingle();

      const tenantName = tenantData?.name || 'la empresa';
      const inviterName = inviterData?.display_name || inviterData?.email || 'un administrador';

      // Enviar email de invitación (no bloquea si falla)
      await sendInvitationEmail(email, token, tenantName, role, inviterName);
    } catch (emailError) {
      console.warn('[createInvitation] Error enviando email (continuando):', emailError);
      // No lanzar error, la invitación ya se creó
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
    // Primero intentar obtener el email del usuario autenticado de Supabase Auth
    let userEmail: string | null = null;
    
    try {
      const { data: { user: authUser } } = await supabaseClient.auth.getUser();
      if (authUser && authUser.email) {
        userEmail = authUser.email.toLowerCase().trim();
      }
    } catch (authError) {
      console.warn('[acceptInvitation] No se pudo obtener usuario de auth, intentando desde tabla users');
    }
    
    // Si no se pudo obtener de auth, intentar desde la tabla users
    if (!userEmail) {
      const { data: user } = await supabaseClient
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();
      
      if (user && user.email) {
        userEmail = user.email.toLowerCase().trim();
      }
    }
    
    // Comparar emails (case-insensitive y sin espacios)
    const invitationEmail = invitation.email.toLowerCase().trim();
    
    if (!userEmail || userEmail !== invitationEmail) {
      throw new Error(`El email del usuario (${userEmail || 'no encontrado'}) no coincide con la invitación (${invitationEmail})`);
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

