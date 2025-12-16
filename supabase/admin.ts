// Funciones para el panel de administración
import { supabase } from './config';
import type { User } from '@supabase/supabase-js';

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
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      // Si la tabla no existe o hay un error de RLS, loguear pero no fallar
      console.warn('[isSuperAdmin] Error verificando rol:', error.message || error);
      // Si es un error de "no existe", retornar false pero no crashear
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        console.warn('[isSuperAdmin] Tabla users no existe o no tiene acceso. Verifica que el script SQL se haya ejecutado.');
        return false;
      }
      return false;
    }

    return data?.role === 'admin';
  } catch (error: any) {
    console.error('[isSuperAdmin] Error inesperado:', error);
    return false;
  }
}

/**
 * Obtener todas las solicitudes de acceso pendientes
 */
export async function getAccessRequests(): Promise<AccessRequest[]> {
  try {
    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .order('requested_at', { ascending: false });

    if (error) {
      // Si la tabla no existe, retornar array vacío
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        console.warn('[getAccessRequests] Tabla access_requests no existe. Ejecuta el script schema-multi-tenant.sql en Supabase.');
        return [];
      }
      console.error('[getAccessRequests] Error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getAccessRequests] Error:', error);
    return [];
  }
}

/**
 * Obtener todos los usuarios con sus solicitudes
 */
export async function getAllUsers(): Promise<UserWithRequest[]> {
  try {
    // Obtener usuarios de auth.users (necesita función en Supabase)
    // Por ahora, obtenemos de public.users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('[getAllUsers] Error:', usersError);
      throw usersError;
    }

    // Obtener solicitudes de acceso
    const { data: requests } = await supabase
      .from('access_requests')
      .select('*');

    // Combinar usuarios con sus solicitudes
    const usersWithRequests: UserWithRequest[] = (users || []).map((user: any) => {
      const request = requests?.find((r) => r.user_id === user.id);
      return {
        ...user,
        access_request: request,
      } as UserWithRequest;
    });

    return usersWithRequests;
  } catch (error) {
    console.error('[getAllUsers] Error:', error);
    return [];
  }
}

/**
 * Aprobar solicitud de acceso
 */
export async function approveAccessRequest(requestId: string, reviewerId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('access_requests')
      .update({
        status: 'approved',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) {
      console.error('[approveAccessRequest] Error:', error);
      throw error;
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
    const { error } = await supabase
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
    const { error } = await supabase
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
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    // Primero eliminar de public.users (esto debería cascadear)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('[deleteUser] Error:', error);
      throw error;
    }

    // Nota: Eliminar de auth.users requiere usar Admin API de Supabase
    // Por ahora, solo eliminamos de public.users
    // Para eliminar completamente, necesitarías una función en Supabase Edge Function
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
    const [usersCount, tenantsCount, requestsCount] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('tenants').select('*', { count: 'exact', head: true }).catch(() => ({ count: 0 })),
      supabase
        .from('access_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .catch(() => ({ count: 0 })),
    ]);

    return {
      totalUsers: usersCount.count || 0,
      totalTenants: (tenantsCount as any).count || 0,
      pendingRequests: (requestsCount as any).count || 0,
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
    const { error } = await supabase
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

