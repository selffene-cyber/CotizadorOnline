'use client';

// Componente de layout compartido para todas las rutas protegidas
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/mock-auth-context';
import Sidebar from '@/components/dashboard/Sidebar';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import BackButton from '@/components/ui/BackButton';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen } = useSidebar();
  const [isDesktop, setIsDesktop] = useState(true);
  
  // Ocultar botón "Volver" en páginas principales
  const hideBackButton = pathname === '/dashboard' || 
                         pathname === '/quotes' || 
                         pathname === '/costings' || 
                         pathname === '/clients' ||
                         pathname === '/costings/new' ||
                         pathname === '/quotes/new';

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const checkIsDesktop = () => {
      if (typeof window !== 'undefined') {
        setIsDesktop(window.innerWidth >= 1024);
      }
    };
    
    checkIsDesktop();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkIsDesktop);
      return () => window.removeEventListener('resize', checkIsDesktop);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const sidebarWidth = isDesktop 
    ? (isCollapsed ? 64 : 256)
    : 0;

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      {!hideBackButton && <BackButton />}
      <main 
        className="flex-1 bg-gray-50 overflow-y-auto transition-all duration-300"
        style={{ 
          marginLeft: `${sidebarWidth}px`,
          paddingTop: !hideBackButton ? (isDesktop ? '5rem' : '6rem') : (isDesktop ? '2rem' : '5rem'),
          paddingBottom: '2rem'
        }}
      >
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}


