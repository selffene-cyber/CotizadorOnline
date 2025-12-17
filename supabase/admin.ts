// Funciones para el panel de administración
import { supabase, createSupabaseClient } from './config';
import type { User } from '@supabase/supabase-js';
import { sendApprovalEmail, sendRejectionEmail } from './email';

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

export interface UserWithRequest extends User {
  access_request?: AccessRequest;
  role?: string;
  display_name?: string;
}

/**
 * Verificar si el usuario actual es super admin
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    // Usar el cliente del navegador que tiene la sesión del usuario
    const supabaseClient = typeof window !== 'undefined' ? createSupabaseClient() : supabase;
    
    // Usar .maybeSingle() en lugar de .single() para evitar errores si hay múltiples filas
    const { data, error } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle(); // Cambiado de .single() a .maybeSingle() para evitar "Cannot coerce to single JSON object"

    if (error) {
      // Si la tabla no existe o hay un error de RLS, loguear pero no fallar
      console.warn('[isSuperAdmin] Error verificando rol:', error.message || error);
      // Si es un error de "no existe", retornar false pero no crashear
      if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.code === '42P01') {
        console.warn('[isSuperAdmin] Tabla users no existe o no tiene acceso. Verifica que el script SQL se haya ejecutado.');
        return false;
      }
      // Error 406 (Not Acceptable) generalmente significa problema con RLS o formato de respuesta
      if (error.code === 'PGRST301' || error.message?.includes('Not Acceptable')) {
        console.warn('[isSuperAdmin] Error de acceso (RLS o formato). Verifica las políticas RLS y que el usuario exista en public.users.');
        return false;
      }
      return false;
    }

    // Si no hay data, el usuario no existe en public.users
    if (!data) {
      console.warn('[isSuperAdmin] Usuario no encontrado en public.users. Ejecuta el script setup-admin-user.sql.');
      return false;
    }

    return data.role === 'admin';
  } catch (error: any) {
    console.error('[isSuperAdmin] Error inesperado:', error);
    return false;
  }
}

/**
 * Obtener todas las solicitudes de acceso (todas, no solo pendientes)
 */
export async function getAccessRequests(): Promise<AccessRequest[]> {
  try {
    const supabaseClient = typeof window !== 'undefined' ? createSupabaseClient() : supabase;
    
    // Verificar sesión antes de hacer la consulta
    if (typeof window !== 'undefined') {
      const { data: { session } } = await supabaseClient.auth.getSession();
      console.log('[getAccessRequests] Sesión activa:', !!session, 'User ID:', session?.user?.id);
    }
    
    const { data, error } = await supabaseClient
      .from('access_requests')
      .select('*')
      .order('requested_at', { ascending: false });

    if (error) {
      // Log detallado del error
      console.error('[getAccessRequests] Error detallado:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      
      // Si la tabla no existe o error de permisos, retornar array vacío
      if (error.code === 'PGRST116' || error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('[getAccessRequests] Tabla access_requests no existe. Ejecuta el script schema-multi-tenant.sql en Supabase.');
        return [];
      }
      
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.error('[getAccessRequests] Error de permisos RLS. Verifica que las políticas RLS permitan a super admins leer access_requests.');
        return [];
      }
      
      return [];
    }

    console.log('[getAccessRequests] Solicitudes encontradas:', data?.length || 0);
    return data || [];
  } catch (error: any) {
    console.error('[getAccessRequests] Error inesperado:', {
      message: error?.message || 'Error desconocido',
      code: error?.code,
      error: error,
    });
    return [];
  }
}

/**
 * Obtener todos los usuarios con sus solicitudes
 */
export async function getAllUsers(): Promise<UserWithRequest[]> {
  try {
    const supabaseClient = typeof window !== 'undefined' ? createSupabaseClient() : supabase;
    
    // Verificar sesión antes de hacer la consulta
    if (typeof window !== 'undefined') {
      const { data: { session } } = await supabaseClient.auth.getSession();
      console.log('[getAllUsers] Sesión activa:', !!session, 'User ID:', session?.user?.id);
    }
    
    // Obtener usuarios de auth.users (necesita función en Supabase)
    // Por ahora, obtenemos de public.users
    const { data: users, error: usersError } = await supabaseClient
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      // Log simple del error
      console.error('[getAllUsers] Error:', usersError.code || 'NO_CODE', usersError.message || 'NO_MESSAGE');
      
      // Si la tabla no existe o error de permisos, retornar array vacío
      if (!usersError.code || usersError.code === 'PGRST116' || usersError.code === '42P01' || usersError.code === '42501') {
        return [];
      }
      
      return [];
    }

    // Obtener solicitudes de acceso (sin lanzar error si falla)
    let requests: any[] = [];
    try {
      const { data: requestsData, error: requestsError } = await supabaseClient
        .from('access_requests')
        .select('*');
      
      if (!requestsError) {
        requests = requestsData || [];
      } else {
        console.warn('[getAllUsers] Error obteniendo access_requests (continuando sin ellos):', {
          code: requestsError.code,
          message: requestsError.message,
        });
      }
    } catch (requestsErr) {
      console.warn('[getAllUsers] Error inesperado obteniendo access_requests (continuando sin ellos):', requestsErr);
    }

    // Combinar usuarios con sus solicitudes
    const usersWithRequests: UserWithRequest[] = (users || []).map((user: any) => {
      const request = requests?.find((r) => r.user_id === user.id);
      return {
        ...user,
        access_request: request,
      } as UserWithRequest;
    });

    return usersWithRequests;
  } catch (error: any) {
    console.error('[getAllUsers] Error inesperado:', {
      message: error?.message || 'Error desconocido',
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      error: error,
    });
    return [];
  }
}

/**
 * Aprobar solicitud de acceso
 * Esto crea el usuario en public.users si no existe
 */
export async function approveAccessRequest(requestId: string, reviewerId: string): Promise<void> {
  try {
    const supabaseClient = typeof window !== 'undefined' ? createSupabaseClient() : supabase;
    
    // Primero obtener la solicitud para obtener el user_id y email
    const { data: request, error: requestError } = await supabaseClient
      .from('access_requests')
      .select('user_id, email')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      console.error('[approveAccessRequest] Error obteniendo solicitud:', requestError);
      throw new Error('No se pudo obtener la solicitud');
    }

    // Crear o actualizar el usuario en public.users
    const { error: userError } = await supabaseClient
      .from('users')
      .upsert({
        id: request.user_id,
        email: request.email,
        display_name: request.email, // Se puede actualizar después
        role: 'user', // Rol por defecto
      }, {
        onConflict: 'id',
      });

    if (userError) {
      console.error('[approveAccessRequest] Error creando usuario:', userError);
      // Continuar de todas formas, puede que ya exista
    }

    // Actualizar la solicitud como aprobada
    const { error: updateError } = await supabaseClient
      .from('access_requests')
      .update({
        status: 'approved',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('[approveAccessRequest] Error actualizando solicitud:', updateError);
      throw updateError;
    }

    // Enviar email de aprobación (no bloquea si falla)
    try {
      await sendApprovalEmail(request.email);
    } catch (emailError) {
      console.warn('[approveAccessRequest] Error enviando email (continuando):', emailError);
    }
  } catch (error) {
    console.error('[approveAccessRequest] Error:', error);
    throw error;
  }
}

/**
 * Rechazar solicitud de acceso
 */
export async function rejectAccessRequest(
  requestId: string,
  reviewerId: string,
  notes?: string
): Promise<void> {
  try {
    const supabaseClient = typeof window !== 'undefined' ? createSupabaseClient() : supabase;
    
    // Primero obtener la solicitud para obtener el email
    const { data: request, error: requestError } = await supabaseClient
      .from('access_requests')
      .select('email')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      console.error('[rejectAccessRequest] Error obteniendo solicitud:', requestError);
      throw new Error('No se pudo obtener la solicitud');
    }

    // Actualizar la solicitud como rechazada
    const { error } = await supabaseClient
      .from('access_requests')
      .update({
        status: 'rejected',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        notes: notes || null,
      })
      .eq('id', requestId);

    if (error) {
      console.error('[rejectAccessRequest] Error:', error);
      throw error;
    }

    // Enviar email de rechazo (no bloquea si falla)
    try {
      await sendRejectionEmail(request.email, undefined, notes);
    } catch (emailError) {
      console.warn('[rejectAccessRequest] Error enviando email (continuando):', emailError);
    }
  } catch (error) {
    console.error('[rejectAccessRequest] Error:', error);
    throw error;
  }
}

/**
 * Actualizar rol de usuario
 */
export async function updateUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
  try {
    const supabaseClient = typeof window !== 'undefined' ? createSupabaseClient() : supabase;
    const { error } = await supabaseClient
      .from('users')
      .update({ role })
      .eq('id', userId);

    if (error) {
      console.error('[updateUserRole] Error:', error);
      throw error;
    }
  } catch (error) {
    console.error('[updateUserRole] Error:', error);
    throw error;
  }
}

/**
 * Eliminar usuario (elimina de auth.users y public.users)
 * Primero elimina memberships, luego access_requests, luego users
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    const supabaseClient = typeof window !== 'undefined' ? createSupabaseClient() : supabase;
    
    // 1. Eliminar memberships del usuario (si existen)
    try {
      const { error: membershipsError } = await supabaseClient
        .from('memberships')
        .delete()
        .eq('user_id', userId);

      if (membershipsError) {
        console.warn('[deleteUser] Error eliminando memberships (continuando):', membershipsError);
        // Continuar de todas formas, puede que no tenga memberships
      }
    } catch (err) {
      console.warn('[deleteUser] Error inesperado eliminando memberships (continuando):', err);
    }

    // 2. Eliminar access_requests del usuario (si existen)
    try {
      const { error: requestsError } = await supabaseClient
        .from('access_requests')
        .delete()
        .eq('user_id', userId);

      if (requestsError) {
        console.warn('[deleteUser] Error eliminando access_requests (continuando):', requestsError);
      }
    } catch (err) {
      console.warn('[deleteUser] Error inesperado eliminando access_requests (continuando):', err);
    }

    // 3. Eliminar de public.users (esto debería cascadear a otras tablas relacionadas)
    const { error } = await supabaseClient
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('[deleteUser] Error eliminando usuario:', error);
      throw error;
    }

    // Nota: Eliminar de auth.users requiere usar Admin API de Supabase
    // Por ahora, solo eliminamos de public.users
    // Para eliminar completamente de auth.users, necesitarías una función en Supabase Edge Function
    // o usar el Admin API directamente desde el servidor
  } catch (error) {
    console.error('[deleteUser] Error:', error);
    throw error;
  }
}

/**
 * Obtener estadísticas del sistema (solo super admin)
 */
export async function getSystemStats() {
  try {
    const supabaseClient = typeof window !== 'undefined' ? createSupabaseClient() : supabase;
    // Obtener conteo de usuarios
    const { count: usersCount } = await supabaseClient
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Obtener conteo de tenants (puede fallar si la tabla no existe)
    let tenantsCount = 0;
    try {
      const { count } = await supabaseClient
        .from('tenants')
        .select('*', { count: 'exact', head: true });
      tenantsCount = count || 0;
    } catch (error) {
      console.warn('[getSystemStats] Error obteniendo tenants:', error);
      tenantsCount = 0;
    }

    // Obtener conteo de solicitudes pendientes (puede fallar si la tabla no existe)
    let pendingRequests = 0;
    try {
      const { count } = await supabaseClient
        .from('access_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      pendingRequests = count || 0;
    } catch (error) {
      console.warn('[getSystemStats] Error obteniendo solicitudes:', error);
      pendingRequests = 0;
    }

    return {
      totalUsers: usersCount || 0,
      totalTenants: tenantsCount,
      pendingRequests: pendingRequests,
    };
  } catch (error) {
    console.error('[getSystemStats] Error:', error);
    return {
      totalUsers: 0,
      totalTenants: 0,
      pendingRequests: 0,
    };
  }
}

/**
 * Crear solicitud de acceso
 */
export async function createAccessRequest(email: string, userId: string): Promise<void> {
  try {
    const supabaseClient = typeof window !== 'undefined' ? createSupabaseClient() : supabase;
    const { error } = await supabaseClient
      .from('access_requests')
      .insert({
        user_id: userId,
        email,
        status: 'pending',
      });

    if (error) {
      console.error('[createAccessRequest] Error:', error);
      throw error;
    }
  } catch (error) {
    console.error('[createAccessRequest] Error:', error);
    throw error;
  }
}

