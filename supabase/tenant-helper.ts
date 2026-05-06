'use client';

import { api } from '@/lib/api-client';

export async function getCurrentTenantId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const data = await api.auth.me();
    if (data.membership?.tenant_id) {
      return data.membership.tenant_id;
    }
  } catch {}
  return null;
}

export async function getCurrentTenantSlug(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const data = await api.auth.me();
    if (data.membership?.tenant_slug) {
      return data.membership.tenant_slug;
    }
  } catch {}
  return null;
}