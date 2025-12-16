// Funciones para gestión de tenants (empresas)
import { supabase } from './config';

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
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getAllTenants] Error:', error);
      throw error;
    }

    // Obtener información de miembros para cada tenant
    const tenantsWithMembers = await Promise.all(
      (tenants || []).map(async (tenant) => {
        // Contar miembros
        const { count } = await supabase
          .from('memberships')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id);

        // Obtener owner
        const { data: ownerMembership } = await supabase
          .from('memberships')
          .select('user_id')
          .eq('tenant_id', tenant.id)
          .eq('role', 'owner')
          .limit(1)
          .single();

        let owner = null;
        if (ownerMembership) {
          const { data: ownerUser } = await supabase
            .from('users')
            .select('id, email, display_name')
            .eq('id', ownerMembership.user_id)
            .single();

          owner = ownerUser;
        }

        return {
          ...tenant,
          member_count: count || 0,
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
    const { data, error } = await supabase
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
    // Verificar que el slug no exista
    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      throw new Error('El slug ya existe. Elige otro.');
    }

    const { data, error } = await supabase
      .from('tenants')
      .insert({
        name,
        slug,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      console.error('[createTenant] Error:', error);
      throw error;
    }

    return data;
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
    // Si se actualiza el slug, verificar que no exista
    if (updates.slug) {
      const { data: existing } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', updates.slug)
        .neq('id', tenantId)
        .single();

      if (existing) {
        throw new Error('El slug ya existe. Elige otro.');
      }
    }

    const { error } = await supabase
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
    // Eliminar tenant (esto debería cascadear a memberships, clients, quotes, etc.)
    const { error } = await supabase
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
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        *,
        user:users(id, email, display_name, role)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getTenantMembers] Error:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('[getTenantMembers] Error:', error);
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
    const { error } = await supabase
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
    const { error } = await supabase
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
    const { error } = await supabase
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

