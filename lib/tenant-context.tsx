'use client';

// Contexto para manejar el tenant actual
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { getAllTenants, getTenantById, type Tenant } from '@/supabase/tenants';
import { getTenantMembers } from '@/supabase/tenants';
import { useAuth } from './supabase-auth-context';

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

      // Extraer slug de la URL
      // Formato esperado: /{slug}/... o /{slug}
      const pathParts = pathname?.split('/').filter(Boolean) || [];
      const possibleSlug = pathParts[0];

      // Rutas que no son tenants
      const nonTenantRoutes = ['login', 'admin', 'dashboard', 'invite', 'api', '_next'];
      
      if (!possibleSlug || nonTenantRoutes.includes(possibleSlug)) {
        setTenantSlug(null);
        setCurrentTenant(null);
        setIsTenantAdmin(false);
        setIsTenantOwner(false);
        setLoading(false);
        return;
      }

      try {
        // Buscar tenant por slug
        const tenants = await getAllTenants();
        const tenant = tenants.find((t) => t.slug === possibleSlug);

        if (tenant) {
          setTenantSlug(possibleSlug);
          setCurrentTenant(tenant);

          // Verificar si el usuario es admin u owner de este tenant
          if (user) {
            try {
              const members = await getTenantMembers(tenant.id);
              const userMembership = members.find((m: any) => m.user_id === user.id);
              
              if (userMembership) {
                setIsTenantAdmin(userMembership.role === 'admin' || userMembership.role === 'owner');
                setIsTenantOwner(userMembership.role === 'owner');
              } else {
                setIsTenantAdmin(false);
                setIsTenantOwner(false);
              }
            } catch (error) {
              console.error('Error checking tenant membership:', error);
              setIsTenantAdmin(false);
              setIsTenantOwner(false);
            }
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

    detectTenant();
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

