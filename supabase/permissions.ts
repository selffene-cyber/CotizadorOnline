// Funciones para verificar permisos de usuarios
import { createSupabaseClient } from './config';
import { getTenantMembers } from './tenants';
import { isSuperAdmin } from './admin';

/**
 * Verificar si un usuario es admin de un tenant específico
 */
export async function isTenantAdmin(userId: string, tenantId: string): Promise<boolean> {
  try {
    const members = await getTenantMembers(tenantId);
    const userMembership = members.find((m: any) => m.user_id === userId);
    return userMembership?.role === 'admin' || userMembership?.role === 'owner';
  } catch (error) {
    console.error('[isTenantAdmin] Error:', error);
    return false;
  }
}

/**
 * Verificar si un usuario es owner de un tenant específico
 */
export async function isTenantOwner(userId: string, tenantId: string): Promise<boolean> {
  try {
    const members = await getTenantMembers(tenantId);
    const userMembership = members.find((m: any) => m.user_id === userId);
    return userMembership?.role === 'owner';
  } catch (error) {
    console.error('[isTenantOwner] Error:', error);
    return false;
  }
}

/**
 * Verificar si un usuario tiene acceso a un tenant (es miembro)
 */
export async function hasTenantAccess(userId: string, tenantId: string): Promise<boolean> {
  try {
    const members = await getTenantMembers(tenantId);
    return members.some((m: any) => m.user_id === userId);
  } catch (error) {
    console.error('[hasTenantAccess] Error:', error);
    return false;
  }
}

/**
 * Verificar si un usuario puede gestionar un tenant
 * (es super admin O es admin/owner del tenant)
 */
export async function canManageTenant(userId: string, tenantId: string): Promise<boolean> {
  try {
    // Super admin puede gestionar cualquier tenant
    const isSuper = await isSuperAdmin(userId);
    if (isSuper) return true;

    // Admin u owner del tenant pueden gestionarlo
    return await isTenantAdmin(userId, tenantId);
  } catch (error) {
    console.error('[canManageTenant] Error:', error);
    return false;
  }
}

/**
 * Verificar si un usuario puede gestionar usuarios de un tenant
 * (es super admin O es admin/owner del tenant)
 */
export async function canManageTenantUsers(userId: string, tenantId: string): Promise<boolean> {
  return canManageTenant(userId, tenantId);
}

/**
 * Verificar si un usuario puede ver datos de un tenant
 * (es super admin O es miembro del tenant)
 */
export async function canViewTenantData(userId: string, tenantId: string): Promise<boolean> {
  try {
    // Super admin puede ver cualquier tenant
    const isSuper = await isSuperAdmin(userId);
    if (isSuper) return true;

    // Miembros del tenant pueden ver sus datos
    return await hasTenantAccess(userId, tenantId);
  } catch (error) {
    console.error('[canViewTenantData] Error:', error);
    return false;
  }
}

