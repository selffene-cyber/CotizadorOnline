'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/mock-auth-context';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { 
  Bars3Icon, 
  XMarkIcon, 
  ChevronLeftIcon,
  HomeIcon,
  DocumentPlusIcon,
  FolderIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { useSidebar } from '@/contexts/SidebarContext';
import { useState, useEffect } from 'react';

interface SubmenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  submenu?: SubmenuItem[];
}

const navigation: NavigationItem[] = [
  { name: 'Inicio', href: '/dashboard', icon: HomeIcon, color: 'text-blue-600' },
  { 
    name: 'Costeos', 
    href: '/costings', 
    icon: FolderIcon, 
    color: 'text-orange-600',
    submenu: [
      { name: 'Listado', href: '/costings', icon: FolderIcon },
      { name: 'Nuevo Costeo', href: '/costings/new', icon: DocumentPlusIcon },
      { name: 'Catálogo', href: '/costings/catalog', icon: BookOpenIcon }
    ]
  },
  { 
    name: 'Cotizaciones', 
    href: '/quotes', 
    icon: ClipboardDocumentListIcon, 
    color: 'text-indigo-600',
    submenu: [
      { name: 'Listado', href: '/quotes', icon: ClipboardDocumentListIcon },
      { name: 'Nueva Cotización', href: '/quotes/new', icon: DocumentTextIcon }
    ]
  },
  { name: 'Clientes', href: '/clients', icon: UserGroupIcon, color: 'text-cyan-600' },
  { name: 'Configuración', href: '/settings', icon: Cog6ToothIcon, color: 'text-gray-600' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const router = useRouter();
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  const [isDesktop, setIsDesktop] = useState(true);
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkIsDesktop = () => {
      const desktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
      setIsDesktop(desktop);
      // En desktop, asegurar que el sidebar esté visible
      if (desktop && !isMobileOpen) {
        setIsMobileOpen(true);
      }
    };
    
    if (typeof window !== 'undefined') {
      checkIsDesktop();
      window.addEventListener('resize', checkIsDesktop);
      return () => window.removeEventListener('resize', checkIsDesktop);
    }
  }, [setIsMobileOpen, isMobileOpen]);

  // Abrir submenús automáticamente si la ruta actual está en un submenú
  useEffect(() => {
    navigation.forEach((item) => {
      if (item.submenu) {
        const isSubmenuActive = item.submenu.some(subItem => 
          pathname === subItem.href || pathname?.startsWith(subItem.href + '/')
        );
        if (isSubmenuActive) {
          setOpenSubmenus(prev => new Set(prev).add(item.name));
        }
      }
    });
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const toggleSidebar = () => {
    if (isDesktop) {
      setIsCollapsed(!isCollapsed);
    } else {
      setIsMobileOpen(!isMobileOpen);
    }
  };

  const closeSidebar = () => {
    if (isDesktop) {
      setIsCollapsed(true);
    } else {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Botón hamburguesa - Solo visible cuando el sidebar está colapsado o cerrado */}
      {(isCollapsed || !isMobileOpen) && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-[9999] w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg shadow-md transition-all duration-200"
          aria-label="Abrir menú"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
      )}

      {/* Overlay para móvil */}
      {isMobileOpen && !isDesktop && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[9997] transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`h-screen bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-300 text-gray-800 flex flex-col fixed left-0 top-0 z-[9998] transition-all duration-300 shadow-lg ${
          isCollapsed && isDesktop ? 'w-16' : 'w-64'
        } ${
          isDesktop || isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header del Sidebar */}
        <div className="p-4 border-b border-gray-300 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between min-h-[4rem]">
          {(!isCollapsed || !isDesktop) && (
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-800">Cotizador Pro</h1>
              {user && !isCollapsed && (
                <p className="text-xs text-gray-600 mt-1 truncate">{user.email}</p>
              )}
            </div>
          )}
          {isCollapsed && isDesktop && (
            <div className="flex items-center justify-center w-full">
              <HomeIcon className="w-6 h-6 text-blue-600" />
            </div>
          )}
          
          {/* Botón para cerrar/colapsar */}
          <button
            onClick={closeSidebar}
            className="ml-2 p-1.5 hover:bg-gray-200 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
            aria-label="Cerrar menú"
            title="Cerrar menú"
          >
            {isDesktop ? (
              <ChevronLeftIcon className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
            ) : (
              <XMarkIcon className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {/* Navegación */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const IconComponent = item.icon;
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isSubmenuOpen = openSubmenus.has(item.name);
            const isSubmenuItemActive = item.submenu?.some(subItem => 
              pathname === subItem.href || pathname?.startsWith(subItem.href + '/')
            );

            return (
              <div key={item.name}>
                {hasSubmenu ? (
                  <>
                    <button
                      onClick={() => {
                        const newOpenSubmenus = new Set(openSubmenus);
                        if (isSubmenuOpen) {
                          newOpenSubmenus.delete(item.name);
                        } else {
                          newOpenSubmenus.add(item.name);
                        }
                        setOpenSubmenus(newOpenSubmenus);
                      }}
                      title={isCollapsed && isDesktop ? item.name : undefined}
                      className={`
                        w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative border
                        ${isActive || isSubmenuItemActive
                          ? 'bg-blue-100 border-blue-300 text-blue-800 shadow-sm font-semibold' 
                          : 'text-gray-700 hover:bg-gray-200 hover:border-gray-300 border-transparent'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <IconComponent className={`w-5 h-5 flex-shrink-0 ${isActive || isSubmenuItemActive ? item.color : 'text-gray-500'}`} />
                        {(!isCollapsed || !isDesktop) && (
                          <span className="font-medium text-sm">{item.name}</span>
                        )}
                      </div>
                      {(!isCollapsed || !isDesktop) && (
                        isSubmenuOpen ? (
                          <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                        )
                      )}
                      {isCollapsed && isDesktop && (
                        <span className="absolute left-full ml-3 px-3 py-2 bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl transition-opacity border border-gray-600">
                          {item.name}
                        </span>
                      )}
                    </button>
                    {hasSubmenu && (!isCollapsed || !isDesktop) && isSubmenuOpen && (
                      <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-300 pl-2">
                        {item.submenu?.map((subItem) => {
                          const SubIconComponent = subItem.icon;
                          const isSubActive = pathname === subItem.href || pathname?.startsWith(subItem.href + '/');
                          return (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className={`
                                flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 text-sm
                                ${isSubActive
                                  ? 'bg-blue-50 border border-blue-200 text-blue-800 font-medium' 
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                                }
                              `}
                              onClick={() => {
                                if (!isDesktop) {
                                  setIsMobileOpen(false);
                                }
                              }}
                            >
                              <SubIconComponent className={`w-4 h-4 flex-shrink-0 ${isSubActive ? 'text-blue-600' : 'text-gray-500'}`} />
                              <span>{subItem.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    title={isCollapsed && isDesktop ? item.name : undefined}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative border
                      ${isActive 
                        ? 'bg-blue-100 border-blue-300 text-blue-800 shadow-sm font-semibold' 
                        : 'text-gray-700 hover:bg-gray-200 hover:border-gray-300 border-transparent'
                      }
                    `}
                    onClick={() => {
                      if (!isDesktop) {
                        setIsMobileOpen(false);
                      }
                    }}
                  >
                    <IconComponent className={`w-5 h-5 flex-shrink-0 ${isActive ? item.color : 'text-gray-500'}`} />
                    {(!isCollapsed || !isDesktop) && (
                      <span className="font-medium text-sm">{item.name}</span>
                    )}
                    {isCollapsed && isDesktop && (
                      <span className="absolute left-full ml-3 px-3 py-2 bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl transition-opacity border border-gray-600">
                        {item.name}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer del Sidebar */}
        <div className="p-3 border-t border-gray-300 bg-gray-50">
          {(!isCollapsed || !isDesktop) ? (
            <Button
              variant="outline"
              className="w-full text-gray-700 border-gray-300 hover:bg-gray-200 hover:border-gray-400 bg-white"
              onClick={handleSignOut}
            >
              Cerrar sesión
            </Button>
          ) : (
            <button
              onClick={handleSignOut}
              className="w-full p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors border border-gray-300"
              title="Cerrar sesión"
            >
              <XMarkIcon className="w-5 h-5 mx-auto" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
