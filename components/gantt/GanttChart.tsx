'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Gantt from 'frappe-gantt';
import { GanttTask } from '@/types';
import './gantt.css';

interface GanttChartProps {
  tasks: GanttTask[];
  dependencies?: Array<{ from: string; to: string }>;
  viewMode?: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month';
  onTaskClick?: (taskId: string) => void;
}

export interface GanttChartRef {
  getContainer: () => HTMLDivElement | null;
}

const GanttChart = forwardRef<GanttChartRef, GanttChartProps>(function GanttChart({ 
  tasks, 
  dependencies = [],
  viewMode = 'Day',
  onTaskClick 
}, ref) {
  const ganttContainerRef = useRef<HTMLDivElement>(null);
  const ganttInstanceRef = useRef<Gantt | null>(null);

  useImperativeHandle(ref, () => ({
    getContainer: () => ganttContainerRef.current,
  }));

  useEffect(() => {
    if (!ganttContainerRef.current || tasks.length === 0) return;

    // Convertir tasks a formato de frappe-gantt
    const ganttTasks = tasks.map((task) => {
      if (!task.id || !task.startPlan) {
        return null;
      }

      // Si no hay fecha de fin, calcular una fecha por defecto (1 día después del inicio)
      let endDate = task.endPlan;
      if (!endDate && task.startPlan) {
        const start = new Date(task.startPlan);
        start.setDate(start.getDate() + 1);
        endDate = start.toISOString().split('T')[0];
      }

      return {
        id: task.id,
        name: task.name,
        start: typeof task.startPlan === 'string' 
          ? task.startPlan.split('T')[0] 
          : (task.startPlan as Date).toISOString().split('T')[0],
        end: typeof endDate === 'string' 
          ? endDate.split('T')[0] 
          : (endDate as Date).toISOString().split('T')[0],
        progress: task.progress,
        custom_class: task.progress === 100 ? 'completed' : task.progress > 0 ? 'in-progress' : 'pending',
      };
    }).filter(Boolean) as any[];

    if (ganttTasks.length === 0) return;

    // Limpiar instancia anterior si existe
    if (ganttInstanceRef.current) {
      const container = ganttContainerRef.current;
      container.innerHTML = '';
    }

    // Crear nueva instancia de Gantt
    try {
      const gantt = new Gantt(ganttContainerRef.current, ganttTasks, {
        view_mode: viewMode,
        header_height: 50,
        column_width: 30,
        step: 24,
        bar_height: 30,
        bar_corner_radius: 3,
        arrow_curve: 5,
        padding: 18,
        date_format: 'YYYY-MM-DD',
        language: 'es',
        on_click: (task: any) => {
          if (onTaskClick) {
            onTaskClick(task.id);
          }
        },
        on_date_change: (task: any, start: Date, end: Date) => {
          // Aquí podrías actualizar las fechas en la base de datos
          console.log('Task date changed:', task.id, start, end);
        },
        on_progress_change: (task: any, progress: number) => {
          // Aquí podrías actualizar el progreso en la base de datos
          console.log('Task progress changed:', task.id, progress);
        },
        on_view_change: (mode: string) => {
          console.log('View mode changed:', mode);
        },
      });

      ganttInstanceRef.current = gantt;
    } catch (error) {
      console.error('Error creating Gantt chart:', error);
    }
  }, [tasks, viewMode, onTaskClick]);

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">No hay tareas para mostrar. Agrega tareas para visualizar el Gantt.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div ref={ganttContainerRef} className="gantt-container" />
      <style jsx>{`
        .gantt-container {
          min-height: 400px;
        }
        :global(.gantt-container svg) {
          font-family: system-ui, -apple-system, sans-serif;
        }
        :global(.completed .bar) {
          fill: #10b981;
        }
        :global(.in-progress .bar) {
          fill: #3b82f6;
        }
        :global(.pending .bar) {
          fill: #94a3b8;
        }
      `}</style>
    </div>
  );
});

export default GanttChart;

