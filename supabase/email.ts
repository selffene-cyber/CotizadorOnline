// Funciones para enviar emails usando Supabase Edge Functions o servicio externo
import { createSupabaseClient, supabase } from './config';

/**
 * Enviar email de aprobación de solicitud
 * Usa Supabase Edge Function o función SQL
 */
export async function sendApprovalEmail(email: string, userName?: string): Promise<void> {
  try {
    const supabaseClient = typeof window !== 'undefined' ? createSupabaseClient() : supabase;
    
    // Intentar llamar a función SQL (si existe)
    const { error: rpcError } = await supabaseClient.rpc('send_approval_email', {
      user_email: email,
      user_name: userName || email,
    });

    if (rpcError) {
      // Si la función SQL no existe o falla, intentar con Edge Function
      console.log('[sendApprovalEmail] Función SQL no disponible, intentando Edge Function...');
      
      // Llamar a Edge Function (si está configurada)
      const { error: edgeError } = await supabaseClient.functions.invoke('send-email', {
        body: {
          to: email,
          subject: '¡Tu solicitud de acceso ha sido aprobada!',
          template: 'approval',
          data: {
            userName: userName || email,
            loginUrl: typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://cot.piwisuite.cl/login',
          },
        },
      });

      if (edgeError) {
        console.warn('[sendApprovalEmail] No se pudo enviar email (funciones no configuradas):', edgeError);
        // No lanzar error, solo loguear (el email no es crítico)
      }
    }
  } catch (error) {
    console.warn('[sendApprovalEmail] Error enviando email (continuando):', error);
    // No lanzar error, solo loguear
  }
}

/**
 * Enviar email de rechazo de solicitud
 */
export async function sendRejectionEmail(email: string, userName?: string, notes?: string): Promise<void> {
  try {
    const supabaseClient = typeof window !== 'undefined' ? createSupabaseClient() : supabase;
    
    // Intentar llamar a función SQL (si existe)
    const { error: rpcError } = await supabaseClient.rpc('send_rejection_email', {
      user_email: email,
      user_name: userName || email,
      rejection_notes: notes || null,
    });

    if (rpcError) {
      // Si la función SQL no existe o falla, intentar con Edge Function
      console.log('[sendRejectionEmail] Función SQL no disponible, intentando Edge Function...');
      
      const { error: edgeError } = await supabaseClient.functions.invoke('send-email', {
        body: {
          to: email,
          subject: 'Solicitud de acceso rechazada',
          template: 'rejection',
          data: {
            userName: userName || email,
            notes: notes || null,
          },
        },
      });

      if (edgeError) {
        console.warn('[sendRejectionEmail] No se pudo enviar email (funciones no configuradas):', edgeError);
      }
    }
  } catch (error) {
    console.warn('[sendRejectionEmail] Error enviando email (continuando):', error);
    // No lanzar error, solo loguear
  }
}

/**
 * Enviar email de invitación
 */
export async function sendInvitationEmail(
  email: string,
  invitationToken: string,
  tenantName: string,
  role: 'owner' | 'admin' | 'user',
  inviterName?: string
): Promise<void> {
  try {
    const supabaseClient = typeof window !== 'undefined' ? createSupabaseClient() : supabase;
    
    // Construir URL de invitación
    const invitationUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/invite/${invitationToken}`
      : `https://cot.piwisuite.cl/invite/${invitationToken}`;
    
    // Intentar llamar a función SQL (si existe)
    const { error: rpcError } = await supabaseClient.rpc('send_invitation_email', {
      user_email: email,
      invitation_token: invitationToken,
      tenant_name: tenantName,
      invitation_role: role,
      invitation_url: invitationUrl,
      inviter_name: inviterName || null,
    });

    if (rpcError) {
      // Si la función SQL no existe o falla, intentar con Edge Function
      console.log('[sendInvitationEmail] Función SQL no disponible, intentando Edge Function...');
      
      const { error: edgeError } = await supabaseClient.functions.invoke('send-email', {
        body: {
          to: email,
          subject: `Invitación a ${tenantName} - Cotizador Pro`,
          template: 'invitation',
          data: {
            tenantName,
            role,
            invitationUrl,
            inviterName: inviterName || null,
          },
        },
      });

      if (edgeError) {
        console.warn('[sendInvitationEmail] No se pudo enviar email (funciones no configuradas):', edgeError);
      }
    }
  } catch (error) {
    console.warn('[sendInvitationEmail] Error enviando email (continuando):', error);
    // No lanzar error, solo loguear
  }
}

