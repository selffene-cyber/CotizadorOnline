'use client';

import React from 'react';

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  accessor?: (item: T) => any;
  align?: 'left' | 'right' | 'center';
  mobileLabel?: string; // Etiqueta para mostrar en mobile
  mobilePriority?: number; // Prioridad para mostrar en mobile (1 = más importante)
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  actions?: (item: T) => React.ReactNode;
  className?: string;
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T) => string;
}

export default function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'No hay datos para mostrar',
  actions,
  className = '',
  onRowClick,
  rowClassName,
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="bg-white p-12 rounded-lg shadow text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  // Ordenar columnas por prioridad móvil (las más importantes primero)
  const sortedColumns = [...columns].sort((a, b) => {
    const priorityA = a.mobilePriority || 999;
    const priorityB = b.mobilePriority || 999;
    return priorityA - priorityB;
  });

  return (
    <div className={className}>
      {/* Vista de tabla para desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      column.align === 'right' ? 'text-right' : 
                      column.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {column.header}
                  </th>
                ))}
                {actions && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item) => (
                <tr 
                  key={keyExtractor(item)} 
                  className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''} ${rowClassName ? rowClassName(item) : ''}`}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => {
                    const content = column.render
                      ? column.render(item)
                      : column.accessor
                      ? column.accessor(item)
                      : null;
                    
                    return (
                      <td
                        key={column.key}
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          column.align === 'right' ? 'text-right' : 
                          column.align === 'center' ? 'text-center' : ''
                        } ${
                          column.key === columns[0]?.key 
                            ? 'font-medium text-gray-900' 
                            : 'text-gray-500'
                        }`}
                      >
                        {content}
                      </td>
                    );
                  })}
                  {actions && (
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        {actions(item)}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista de cards para mobile */}
      <div className="md:hidden space-y-4">
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            className={`bg-white rounded-lg shadow p-4 border border-gray-200 ${onRowClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${rowClassName ? rowClassName(item) : ''}`}
            onClick={() => onRowClick?.(item)}
          >
            <div className="space-y-3">
              {/* Mostrar las columnas más importantes primero (hasta 4-5 en mobile) */}
              {sortedColumns.slice(0, 5).map((column) => {
                const content = column.render
                  ? column.render(item)
                  : column.accessor
                  ? column.accessor(item)
                  : null;
                
                const label = column.mobileLabel || column.header;
                
                return (
                  <div key={column.key} className="flex justify-between items-start">
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      {label}:
                    </span>
                    <span className={`text-sm ${
                      column.key === columns[0]?.key 
                        ? 'font-semibold text-gray-900' 
                        : 'text-gray-700'
                    } text-right flex-1 ml-2`}>
                      {content}
                    </span>
                  </div>
                );
              })}
              
              {/* Acciones en mobile */}
              {actions && (
                <div 
                  className="pt-3 border-t border-gray-200 flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {actions(item)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

