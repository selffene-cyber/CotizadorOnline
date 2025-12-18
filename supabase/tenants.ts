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
 * Obtener un tenant por slug
 * Esta función permite a cualquier usuario buscar un tenant por slug
 * (necesario para acceder a rutas como /mic)
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  try {
    const supabaseClient = getSupabaseClient();
    const { data, error } = await supabaseClient
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('[getTenantBySlug] Error:', error);
      // Si es un error de permisos RLS, intentar con una consulta más permisiva
      if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
        console.warn('[getTenantBySlug] Error de permisos RLS. Verifica las políticas en Supabase.');
      }
      return null;
    }

    if (!data) {
      console.log('[getTenantBySlug] No se encontró tenant con slug:', slug);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[getTenantBySlug] Error:', error);
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
    
    // Verificar que el usuario esté autenticado
    const { data: { user: currentUser }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !currentUser) {
      throw new Error('Usuario no autenticado. Debes iniciar sesión para agregar miembros.');
    }

    // Verificar que el tenant existe
    const { data: tenant, error: tenantError } = await supabaseClient
      .from('tenants')
      .select('id, created_by')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      throw new Error(`No se encontró el tenant con ID: ${tenantId}`);
    }

    // Verificar que el usuario a agregar existe
    const { data: userToAdd, error: userToAddError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userToAddError || !userToAdd) {
      throw new Error(`No se encontró el usuario con ID: ${userId}`);
    }

    // Verificar si ya existe un membership
    const { data: existingMembership, error: checkError } = await supabaseClient
      .from('memberships')
      .select('id, role')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.warn('[addUserToTenant] Error verificando membership existente:', {
        message: checkError.message,
        code: checkError.code,
        details: checkError.details,
      });
    }

    if (existingMembership) {
      throw new Error(`El usuario ya es miembro de esta empresa con el rol: ${existingMembership.role || 'desconocido'}`);
    }

    // Insertar el membership
    const { data, error } = await supabaseClient
      .from('memberships')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        role,
      })
      .select('id')
      .single();

    if (error) {
      // Logging mejorado para ver el error completo
      const errorInfo = {
        message: error.message || 'Sin mensaje',
        code: error.code || 'Sin código',
        details: error.details || 'Sin detalles',
        hint: error.hint || 'Sin hint',
        statusCode: (error as any).statusCode || 'Sin statusCode',
        statusText: (error as any).statusText || 'Sin statusText',
      };
      
      console.error('[addUserToTenant] Error completo:', errorInfo);
      console.error('[addUserToTenant] Error objeto completo:', error);
      console.error('[addUserToTenant] Error string:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      // Mensajes de error más descriptivos
      if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
        throw new Error('No tienes permisos para agregar miembros a esta empresa. Verifica que seas super admin o admin/owner del tenant.');
      } else if (error.code === '23505' || error.message?.includes('unique constraint') || error.message?.includes('duplicate key')) {
        throw new Error('El usuario ya es miembro de esta empresa.');
      } else if (error.code === '23503' || error.message?.includes('foreign key')) {
        throw new Error('El tenant o usuario especificado no existe.');
      } else {
        const errorMsg = error.message || `Error desconocido (código: ${error.code || 'N/A'})`;
        throw new Error(`Error al agregar miembro: ${errorMsg}`);
      }
    }

    if (!data) {
      throw new Error('No se pudo crear el membership. No se recibió confirmación del servidor.');
    }
  } catch (error: any) {
    console.error('[addUserToTenant] Error capturado:', {
      message: error?.message || 'Error desconocido',
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
      error: error,
    });
    
    // Si el error ya tiene un mensaje descriptivo, lanzarlo tal cual
    if (error?.message && typeof error.message === 'string') {
      throw error;
    }
    
    // Si no, crear un error con mensaje genérico
    throw new Error(error?.message || 'Error desconocido al agregar miembro a la empresa');
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

