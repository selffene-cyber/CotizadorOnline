// Funciones para gestión de tenants (empresas)
import { supabase, createSupabaseClient } from './config';

// Helper para obtener el cliente correcto (navegador o servidor)
function getSupabaseClient() {
  return typeof window !== 'undefined' ? createSupabaseClient() : supabase;
}

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

/**
 * Obtener todos los tenants (solo super admin)
 */
export async function getAllTenants(): Promise<TenantWithMembers[]> {
  try {
    const supabaseClient = getSupabaseClient();
    const { data: tenants, error } = await supabaseClient
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Si la tabla no existe, retornar array vacío en lugar de lanzar error
      if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('relation') || error.code === '42P01') {
        console.warn('[getAllTenants] Tabla tenants no existe. Ejecuta el script schema-multi-tenant.sql en Supabase.');
        return [];
      }
      // Si es un error de permisos RLS, también retornar array vacío
      if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
        console.warn('[getAllTenants] Error de permisos. Verifica las políticas RLS en Supabase.');
        return [];
      }
      // Log del error de forma más segura
      const errorMessage = error?.message || error?.code || JSON.stringify(error) || 'Error desconocido';
      console.error('[getAllTenants] Error:', errorMessage);
      return [];
    }

    // Si no hay tenants, retornar array vacío
    if (!tenants || tenants.length === 0) {
      return [];
    }

    // Obtener información de miembros para cada tenant
    const tenantsWithMembers = await Promise.all(
      (tenants || []).map(async (tenant) => {
        let memberCount = 0;
        let owner = null;

        try {
          const supabaseClient = getSupabaseClient();
          // Contar miembros
          const { count, error: countError } = await supabaseClient
            .from('memberships')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id);

          if (!countError) {
            memberCount = count || 0;
          }

          // Obtener owner
          const { data: ownerMembership, error: ownerError } = await supabaseClient
            .from('memberships')
            .select('user_id')
            .eq('tenant_id', tenant.id)
            .eq('role', 'owner')
            .limit(1)
            .single();

          if (!ownerError && ownerMembership) {
            const { data: ownerUser } = await supabaseClient
              .from('users')
              .select('id, email, display_name')
              .eq('id', ownerMembership.user_id)
              .single();

            owner = ownerUser || null;
          }
        } catch (error) {
          // Si hay error obteniendo miembros, continuar sin esa información
          console.warn(`[getAllTenants] Error obteniendo miembros para tenant ${tenant.id}:`, error);
        }

        return {
          ...tenant,
          member_count: memberCount,
          owner: owner || undefined,
        } as TenantWithMembers;
      })
    );

    return tenantsWithMembers;
  } catch (error) {
    console.error('[getAllTenants] Error:', error);
    return [];
  }
}

/**
 * Obtener un tenant por ID
 */
export async function getTenantById(tenantId: string): Promise<Tenant | null> {
  try {
    const supabaseClient = getSupabaseClient();
    const { data, error } = await supabaseClient
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error) {
      console.error('[getTenantById] Error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[getTenantById] Error:', error);
    return null;
  }
}

/**
 * Crear un nuevo tenant
 */
export async function createTenant(
  name: string,
  slug: string,
  createdBy: string
): Promise<Tenant> {
  try {
    const supabaseClient = getSupabaseClient();
    // Verificar que el slug no exista
    const { data: existing } = await supabaseClient
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      throw new Error('El slug ya existe. Elige otro.');
    }

    // Crear el tenant
    const { data: tenant, error: tenantError } = await supabaseClient
      .from('tenants')
      .insert({
        name,
        slug,
        created_by: createdBy,
      })
      .select()
      .single();

    if (tenantError) {
      console.error('[createTenant] Error creando tenant:', tenantError);
      throw tenantError;
    }

    // Crear automáticamente el membership del creador como 'owner'
    const { error: membershipError } = await supabaseClient
      .from('memberships')
      .insert({
        tenant_id: tenant.id,
        user_id: createdBy,
        role: 'owner',
      });

    if (membershipError) {
      console.error('[createTenant] Error creando membership:', membershipError);
      // No lanzar error aquí, solo loguear, porque el tenant ya se creó
      // El usuario puede agregar el membership manualmente después
      console.warn('[createTenant] El tenant se creó pero no se pudo crear el membership automáticamente');
    }

    return tenant;
  } catch (error) {
    console.error('[createTenant] Error:', error);
    throw error;
  }
}

/**
 * Actualizar un tenant
 */
export async function updateTenant(
  tenantId: string,
  updates: { name?: string; slug?: string }
): Promise<void> {
  try {
    const supabaseClient = getSupabaseClient();
    // Si se actualiza el slug, verificar que no exista
    if (updates.slug) {
      const { data: existing } = await supabaseClient
        .from('tenants')
        .select('id')
        .eq('slug', updates.slug)
        .neq('id', tenantId)
        .single();

      if (existing) {
        throw new Error('El slug ya existe. Elige otro.');
      }
    }

    const { error } = await supabaseClient
      .from('tenants')
      .update(updates)
      .eq('id', tenantId);

    if (error) {
      console.error('[updateTenant] Error:', error);
      throw error;
    }
  } catch (error) {
    console.error('[updateTenant] Error:', error);
    throw error;
  }
}

/**
 * Eliminar un tenant (y todos sus datos relacionados)
 */
export async function deleteTenant(tenantId: string): Promise<void> {
  try {
    const supabaseClient = getSupabaseClient();
    // Eliminar tenant (esto debería cascadear a memberships, clients, quotes, etc.)
    const { error } = await supabaseClient
      .from('tenants')
      .delete()
      .eq('id', tenantId);

    if (error) {
      console.error('[deleteTenant] Error:', error);
      throw error;
    }
  } catch (error) {
    console.error('[deleteTenant] Error:', error);
    throw error;
  }
}

/**
 * Obtener miembros de un tenant
 */
export async function getTenantMembers(tenantId: string) {
  try {
    const supabaseClient = getSupabaseClient();
    
    // Primero obtener los memberships
    const { data: memberships, error: membershipsError } = await supabaseClient
      .from('memberships')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (membershipsError) {
      console.error('[getTenantMembers] Error obteniendo memberships:', {
        code: membershipsError.code,
        message: membershipsError.message,
        details: membershipsError.details,
        hint: membershipsError.hint,
      });
      // Si es un error de permisos o tabla no encontrada, retornar array vacío
      if (membershipsError.code === 'PGRST116' || membershipsError.code === '42P01' || membershipsError.code === '42501') {
        console.warn('[getTenantMembers] Error de permisos o tabla no encontrada, retornando array vacío');
        return [];
      }
      throw membershipsError;
    }

    if (!memberships || memberships.length === 0) {
      return [];
    }

    // Obtener los IDs de usuarios únicos
    const userIds = [...new Set(memberships.map(m => m.user_id))];

    // Obtener información de usuarios
    const { data: users, error: usersError } = await supabaseClient
      .from('users')
      .select('id, email, display_name, role')
      .in('id', userIds);

    if (usersError) {
      console.error('[getTenantMembers] Error obteniendo usuarios:', {
        code: usersError.code,
        message: usersError.message,
        details: usersError.details,
        hint: usersError.hint,
      });
      // Si hay error obteniendo usuarios, retornar memberships sin info de usuario
      return memberships.map(m => ({
        ...m,
        user: null,
      }));
    }

    // Combinar memberships con información de usuarios
    const membersWithUsers = memberships.map(membership => {
      const user = users?.find(u => u.id === membership.user_id) || null;
      return {
        ...membership,
        user: user ? {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          role: user.role,
        } : null,
      };
    });

    return membersWithUsers;
  } catch (error: any) {
    console.error('[getTenantMembers] Error inesperado:', {
      message: error?.message || 'Error desconocido',
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      error: error,
    });
    // Retornar array vacío en caso de error para no romper la UI
    return [];
  }
}

/**
 * Agregar un usuario a un tenant
 */
export async function addUserToTenant(
  tenantId: string,
  userId: string,
  role: 'owner' | 'admin' | 'user'
): Promise<void> {
  try {
    const supabaseClient = getSupabaseClient();
    const { error } = await supabaseClient
      .from('memberships')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        role,
      });

    if (error) {
      console.error('[addUserToTenant] Error:', error);
      throw error;
    }
  } catch (error) {
    console.error('[addUserToTenant] Error:', error);
    throw error;
  }
}

/**
 * Actualizar rol de un usuario en un tenant
 */
export async function updateUserRoleInTenant(
  tenantId: string,
  userId: string,
  newRole: 'owner' | 'admin' | 'user'
): Promise<void> {
  try {
    const supabaseClient = getSupabaseClient();
    const { error } = await supabaseClient
      .from('memberships')
      .update({ role: newRole })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);

    if (error) {
      console.error('[updateUserRoleInTenant] Error:', error);
      throw error;
    }
  } catch (error) {
    console.error('[updateUserRoleInTenant] Error:', error);
    throw error;
  }
}

/**
 * Remover un usuario de un tenant
 */
export async function removeUserFromTenant(
  tenantId: string,
  userId: string
): Promise<void> {
  try {
    const supabaseClient = getSupabaseClient();
    const { error } = await supabaseClient
      .from('memberships')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);

    if (error) {
      console.error('[removeUserFromTenant] Error:', error);
      throw error;
    }
  } catch (error) {
    console.error('[removeUserFromTenant] Error:', error);
    throw error;
  }
}

