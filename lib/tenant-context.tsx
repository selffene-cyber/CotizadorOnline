'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api-client';
import type { Tenant } from '@/supabase/tenants';
import { useAuth } from './jwt-auth-context';

interface TenantContextType {
  currentTenant: Tenant | null;
  tenantSlug: string | null;
  loading: boolean;
  isTenantAdmin: boolean;
  isTenantOwner: boolean;
}

const TenantContext = createContext<TenantContextType>({
  currentTenant: null,
  tenantSlug: null,
  loading: true,
  isTenantAdmin: false,
  isTenantOwner: false,
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTenantAdmin, setIsTenantAdmin] = useState(false);
  const [isTenantOwner, setIsTenantOwner] = useState(false);

  useEffect(() => {
    const detectTenant = async () => {
      setLoading(true);

      const pathParts = pathname?.split('/').filter(Boolean) || [];
      const possibleSlug = pathParts[0];

      const nonTenantRoutes = ['login', 'admin', 'dashboard', 'invite', 'api', '_next', 'auth', 'onboarding'];

      if (!possibleSlug || nonTenantRoutes.includes(possibleSlug)) {
        setTenantSlug(null);
        setCurrentTenant(null);
        setIsTenantAdmin(false);
        setIsTenantOwner(false);
        setLoading(false);
        return;
      }

      try {
        const data = await api.tenants.getMy();
        const tenants = data.tenants || [];
        const tenant = tenants.find((t: any) => t.slug === possibleSlug);

        if (tenant) {
          setTenantSlug(possibleSlug);
          setCurrentTenant(tenant as Tenant);

          const membershipRole = tenant.membership_role;
          if (membershipRole) {
            setIsTenantAdmin(membershipRole === 'admin' || membershipRole === 'owner');
            setIsTenantOwner(membershipRole === 'owner');
          } else {
            setIsTenantAdmin(false);
            setIsTenantOwner(false);
          }
        } else {
          setTenantSlug(null);
          setCurrentTenant(null);
          setIsTenantAdmin(false);
          setIsTenantOwner(false);
        }
      } catch (error) {
        console.error('Error detecting tenant:', error);
        setTenantSlug(null);
        setCurrentTenant(null);
        setIsTenantAdmin(false);
        setIsTenantOwner(false);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      detectTenant();
    } else {
      setLoading(false);
    }
  }, [pathname, user]);

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        tenantSlug,
        loading,
        isTenantAdmin,
        isTenantOwner,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}