'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useSidebar } from '@/contexts/SidebarContext';
import { useEffect, useState } from 'react';

export default function BackButton() {
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const [isDesktop, setIsDesktop] = useState(true);

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

  const handleBack = () => {
    router.back();
  };

  // Calcular posición izquierda según el sidebar
  const sidebarWidth = isDesktop ? (isCollapsed ? 64 : 256) : 0;
  const leftPosition = sidebarWidth + 16; // 16px de margen desde el sidebar

  return (
    <button
      onClick={handleBack}
      className="fixed top-4 z-[10000] bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      style={{ 
        left: `${leftPosition}px`,
        zIndex: 10000
      }}
      aria-label="Volver"
      title="Volver"
    >
      <ArrowLeftIcon className="w-6 h-6" />
    </button>
  );
}

