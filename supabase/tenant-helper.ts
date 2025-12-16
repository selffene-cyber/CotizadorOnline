// Helper para obtener el tenant_id actual desde el contexto
// Este archivo se usa en funciones del servidor que necesitan el tenant_id

import { cookies } from 'next/headers';

/**
 * Obtener el tenant_id desde las cookies (establecido por el middleware o contexto)
 */
export async function getCurrentTenantId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get('tenant_id')?.value;
    return tenantId || null;
  } catch (error) {
    console.error('[getCurrentTenantId] Error:', error);
    return null;
  }
}

/**
 * Obtener el tenant_slug desde las cookies
 */
export async function getCurrentTenantSlug(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const tenantSlug = cookieStore.get('tenant_slug')?.value;
    return tenantSlug || null;
  } catch (error) {
    console.error('[getCurrentTenantSlug] Error:', error);
    return null;
  }
}

