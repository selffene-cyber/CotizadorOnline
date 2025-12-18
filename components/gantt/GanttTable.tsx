'use client';

import { useMemo } from 'react';
import { GanttTask } from '@/types';
import { computeTaskDurationDays } from '@/types';

interface GanttTableProps {
  tasks: GanttTask[];
  viewMode?: 'day' | 'week' | 'month';
}

export default function GanttTable({ tasks, viewMode = 'day' }: GanttTableProps) {
  // Filtrar tareas que tienen fechas plan
  const tasksWithDates = tasks.filter(task => task.startPlan && task.endPlan);

  // Calcular rango de fechas
  const dateRange = useMemo(() => {
    if (tasksWithDates.length === 0) return { start: null, end: null, dates: [] };

    const dates: Date[] = [];
    tasksWithDates.forEach(task => {
      const start = typeof task.startPlan === 'string' 
        ? new Date(task.startPlan) 
        : task.startPlan;
      const end = typeof task.endPlan === 'string' 
        ? new Date(task.endPlan) 
        : task.endPlan;

      if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
        dates.push(start, end);
      }
    });

    if (dates.length === 0) return { start: null, end: null, dates: [] };

    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // Generar array de fechas según viewMode
    const dateArray: Date[] = [];
    const current = new Date(minDate);

    while (current <= maxDate) {
      dateArray.push(new Date(current));
      
      if (viewMode === 'day') {
        current.setDate(current.getDate() + 1);
      } else if (viewMode === 'week') {
        current.setDate(current.getDate() + 7);
      } else if (viewMode === 'month') {
        current.setMonth(current.getMonth() + 1);
      }
    }

    return {
      start: minDate,
      end: maxDate,
      dates: dateArray,
    };
  }, [tasksWithDates, viewMode]);

  // Función para obtener el índice de columna de una fecha
  const getDateColumnIndex = (date: Date | string): number => {
    if (!dateRange.dates.length) return -1;
    
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(targetDate.getTime())) return -1;

    // Encontrar la fecha más cercana
    for (let i = 0; i < dateRange.dates.length; i++) {
      if (targetDate <= dateRange.dates[i]) {
        return i;
      }
    }
    return dateRange.dates.length - 1;
  };

  // Función para calcular el ancho de una barra (en número de columnas)
  const getBarWidth = (startDate: Date | string, endDate: Date | string): number => {
    const startIdx = getDateColumnIndex(startDate);
    const endIdx = getDateColumnIndex(endDate);
    
    if (startIdx === -1 || endIdx === -1) return 0;
    return Math.max(1, endIdx - startIdx + 1);
  };

  // Función para obtener el color según el progreso
  const getBarColor = (progress: number): string => {
    if (progress === 100) return '#10b981'; // Verde - completado
    if (progress > 0) return '#3b82f6'; // Azul - en progreso
    return '#94a3b8'; // Gris - pendiente
  };

  if (tasksWithDates.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">
          No hay tareas con fechas para mostrar. Agrega tareas con fechas de inicio y fin planificadas.
        </p>
      </div>
    );
  }

  if (!dateRange.start || !dateRange.end) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">No se pudo calcular el rango de fechas.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0 z-10">
          {/* Fila de encabezados de fechas */}
          <tr>
            <th className="sticky left-0 z-20 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200 min-w-[200px]">
              Tarea
            </th>
            {dateRange.dates.map((date, index) => {
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <th
                  key={index}
                  className={`px-2 py-2 text-center text-xs font-medium text-gray-500 border-r border-gray-200 min-w-[80px] ${
                    isToday ? 'bg-blue-100 font-bold' : ''
                  }`}
                >
                  <div className="flex flex-col">
                    <span>{date.toLocaleDateString('es-CL', { weekday: 'short' })}</span>
                    <span className="font-semibold">{date.getDate()}</span>
                    <span className="text-[10px] text-gray-400">
                      {date.toLocaleDateString('es-CL', { month: 'short' })}
                    </span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tasksWithDates.map((task, taskIndex) => {
            const startDate = typeof task.startPlan === 'string' 
              ? new Date(task.startPlan) 
              : task.startPlan;
            const endDate = typeof task.endPlan === 'string' 
              ? new Date(task.endPlan) 
              : task.endPlan;

            if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
              return null;
            }

            const startCol = getDateColumnIndex(startDate);
            const barWidth = getBarWidth(startDate, endDate);
            const barColor = getBarColor(task.progress);
            const duration = computeTaskDurationDays(startDate, endDate);

            return (
              <tr key={task.id || taskIndex} className="hover:bg-gray-50">
                {/* Columna de nombre de tarea (sticky) */}
                <td className="sticky left-0 z-10 bg-white px-4 py-3 text-sm border-r border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-gray-900">{task.name}</div>
                    {task.resource && (
                      <span className="text-xs text-gray-500">({task.resource})</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {duration} días • {task.progress}%
                  </div>
                </td>

                {/* Celdas de fechas con barras */}
                {dateRange.dates.map((date, colIndex) => {
                  const isInRange = colIndex >= startCol && colIndex < startCol + barWidth;
                  const isStart = colIndex === startCol;
                  const isEnd = colIndex === startCol + barWidth - 1;
                  const isToday = date.toDateString() === new Date().toDateString();

                  return (
                    <td
                      key={colIndex}
                      className={`px-1 py-2 text-center text-xs border-r border-gray-100 relative ${
                        isToday ? 'bg-blue-50' : ''
                      }`}
                    >
                      {isInRange && (
                        <div
                          className={`absolute inset-y-1 left-0 right-0 rounded flex items-center justify-center text-white text-[10px] font-medium ${
                            isStart ? 'rounded-l-md' : ''
                          } ${isEnd ? 'rounded-r-md' : ''}`}
                          style={{
                            backgroundColor: barColor,
                            width: '100%',
                            opacity: 0.9,
                          }}
                        >
                          {isStart && (
                            <span className="px-1 truncate">{task.name}</span>
                          )}
                          {!isStart && !isEnd && task.progress > 0 && (
                            <div
                              className="absolute left-0 top-0 bottom-0 rounded-l"
                              style={{
                                width: `${task.progress}%`,
                                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                              }}
                            />
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


