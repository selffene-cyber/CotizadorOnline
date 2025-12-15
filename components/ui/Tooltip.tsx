'use client';

import { ReactNode } from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';

interface TooltipProps {
  id: string;
  content: string;
  children: ReactNode;
  place?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export default function Tooltip({ 
  id, 
  content, 
  children, 
  place = 'top',
  className = '' 
}: TooltipProps) {
  return (
    <>
      <div 
        data-tooltip-id={id}
        data-tooltip-content={content}
        className={className}
      >
        {children}
      </div>
      <ReactTooltip 
        id={id}
        place={place}
        className="!bg-gray-900 !text-white !text-xs !py-2 !px-3 !rounded-lg !shadow-lg !z-50 !max-w-xs"
        style={{
          backgroundColor: '#111827',
          color: '#ffffff',
          fontSize: '12px',
          padding: '8px 12px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          maxWidth: '250px',
          zIndex: 9999,
        }}
      />
    </>
  );
}



