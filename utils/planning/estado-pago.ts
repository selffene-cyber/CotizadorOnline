// Generador de Estado de Pago (EP) basado en avance
import { GanttTask, Quote } from '@/types';
import { computeProjectProgressWeighted } from '@/types';

export interface EstadoPagoData {
  // Avances
  avanceInicioPeriodo: number; // % de avance al inicio del período
  avanceFinPeriodo: number; // % de avance al final del período
  avancePeriodo: number; // Diferencia de avance en el período
  
  // Tareas
  tareasFinalizadasEnPeriodo: Array<{
    id: string;
    name: string;
    fechaFinalizacion?: string;
    progreso: number;
  }>;
  tareasEnProgreso: Array<{
    id: string;
    name: string;
    progreso: number;
    fechaInicio?: string;
    fechaFinPlan?: string;
  }>;
  
  // Metadatos
  periodoDesde: string; // YYYY-MM-DD
  periodoHasta: string; // YYYY-MM-DD
  fechaReporte: string; // YYYY-MM-DD
  observaciones?: string;
}

/**
 * Calcular estado de pago basado en avance de tareas
 * 
 * @param quote - Cotización asociada
 * @param tasks - Tareas del proyecto Gantt
 * @param periodoDesde - Fecha inicio del período (YYYY-MM-DD)
 * @param periodoHasta - Fecha fin del período (YYYY-MM-DD)
 * @param observaciones - Observaciones opcionales
 * @returns Datos del estado de pago
 */
export function generateEstadoPago(
  quote: Quote,
  tasks: GanttTask[],
  periodoDesde: string,
  periodoHasta: string,
  observaciones?: string
): EstadoPagoData {
  const desde = new Date(periodoDesde);
  const hasta = new Date(periodoHasta);
  
  // Calcular avance al inicio del período
  // Simular estado de tareas al inicio del período (asumiendo progreso hasta esa fecha)
  const tasksAlInicio = tasks.map(task => {
    const endActual = task.endActual 
      ? (typeof task.endActual === 'string' ? new Date(task.endActual) : task.endActual)
      : task.endPlan 
        ? (typeof task.endPlan === 'string' ? new Date(task.endPlan) : task.endPlan)
        : null;
    
    // Si la tarea terminó antes del inicio del período, tiene 100% de progreso
    if (endActual && endActual < desde) {
      return { ...task, progress: 100 };
    }
    
    // Si la tarea aún no ha empezado al inicio del período, tiene 0% de progreso
    const startActual = task.startActual 
      ? (typeof task.startActual === 'string' ? new Date(task.startActual) : task.startActual)
      : task.startPlan 
        ? (typeof task.startPlan === 'string' ? new Date(task.startPlan) : task.startPlan)
        : null;
    
    if (startActual && startActual > desde) {
      return { ...task, progress: 0 };
    }
    
    // Si la tarea está en progreso al inicio, estimar progreso basado en fechas
    // Por simplicidad, usar el progreso actual (en una implementación más sofisticada,
    // se podría calcular el progreso esperado basado en las fechas)
    return task;
  });
  
  const avanceInicioPeriodo = computeProjectProgressWeighted(tasksAlInicio);
  
  // Calcular avance al final del período (usar progreso actual de las tareas)
  const avanceFinPeriodo = computeProjectProgressWeighted(tasks);
  
  // Diferencia de avance en el período
  const avancePeriodo = avanceFinPeriodo - avanceInicioPeriodo;
  
  // Identificar tareas finalizadas en el período
  const tareasFinalizadasEnPeriodo = tasks
    .filter(task => {
      const endActual = task.endActual 
        ? (typeof task.endActual === 'string' ? new Date(task.endActual) : task.endActual)
        : null;
      
      // Tarea finalizada si tiene progreso 100% y fecha de fin en el período
      if (task.progress >= 100 && endActual) {
        return endActual >= desde && endActual <= hasta;
      }
      
      // O si alcanzó 100% durante el período (sin fecha de fin, usar progreso)
      if (task.progress >= 100 && !endActual) {
        // Asumir que se completó durante el período si no tiene fecha
        return true;
      }
      
      return false;
    })
    .map(task => ({
      id: task.id || '',
      name: task.name,
      fechaFinalizacion: task.endActual 
        ? (typeof task.endActual === 'string' ? task.endActual : task.endActual.toISOString().split('T')[0])
        : undefined,
      progreso: task.progress,
    }));
  
  // Identificar tareas en progreso al final del período
  const tareasEnProgreso = tasks
    .filter(task => {
      // Tarea en progreso si tiene progreso > 0 y < 100
      return task.progress > 0 && task.progress < 100;
    })
    .map(task => ({
      id: task.id || '',
      name: task.name,
      progreso: task.progress,
      fechaInicio: (() => {
        const fecha = task.startActual || task.startPlan;
        if (!fecha) return undefined;
        if (typeof fecha === 'string') return fecha;
        return fecha.toISOString().split('T')[0];
      })(),
      fechaFinPlan: task.endPlan
        ? (typeof task.endPlan === 'string' ? task.endPlan : task.endPlan.toISOString().split('T')[0])
        : undefined,
    }));
  
  return {
    avanceInicioPeriodo: Math.round(avanceInicioPeriodo * 100) / 100,
    avanceFinPeriodo: Math.round(avanceFinPeriodo * 100) / 100,
    avancePeriodo: Math.round(avancePeriodo * 100) / 100,
    tareasFinalizadasEnPeriodo,
    tareasEnProgreso,
    periodoDesde,
    periodoHasta,
    fechaReporte: new Date().toISOString().split('T')[0],
    observaciones: observaciones || '',
  };
}

/**
 * Formatear datos de estado de pago para texto legible
 */
export function formatEstadoPagoTexto(data: EstadoPagoData, quote: Quote): string {
  const desde = new Date(data.periodoDesde).toLocaleDateString('es-CL');
  const hasta = new Date(data.periodoHasta).toLocaleDateString('es-CL');
  const fechaReporte = new Date(data.fechaReporte).toLocaleDateString('es-CL');
  
  let texto = `ESTADO DE PAGO - ${quote.projectName}\n`;
  texto += `Período: ${desde} al ${hasta}\n`;
  texto += `Fecha de Reporte: ${fechaReporte}\n\n`;
  
  texto += `AVANCES:\n`;
  texto += `- Avance al inicio del período: ${data.avanceInicioPeriodo.toFixed(2)}%\n`;
  texto += `- Avance al final del período: ${data.avanceFinPeriodo.toFixed(2)}%\n`;
  texto += `- Avance en el período: ${data.avancePeriodo.toFixed(2)}%\n\n`;
  
  texto += `TAREAS FINALIZADAS EN EL PERÍODO (${data.tareasFinalizadasEnPeriodo.length}):\n`;
  if (data.tareasFinalizadasEnPeriodo.length === 0) {
    texto += `- No hay tareas finalizadas en este período.\n\n`;
  } else {
    data.tareasFinalizadasEnPeriodo.forEach((tarea, index) => {
      texto += `${index + 1}. ${tarea.name}`;
      if (tarea.fechaFinalizacion) {
        texto += ` (Finalizada: ${new Date(tarea.fechaFinalizacion).toLocaleDateString('es-CL')})`;
      }
      texto += `\n`;
    });
    texto += `\n`;
  }
  
  texto += `TAREAS EN PROGRESO (${data.tareasEnProgreso.length}):\n`;
  if (data.tareasEnProgreso.length === 0) {
    texto += `- No hay tareas en progreso.\n\n`;
  } else {
    data.tareasEnProgreso.forEach((tarea, index) => {
      texto += `${index + 1}. ${tarea.name} - ${tarea.progreso}%`;
      if (tarea.fechaFinPlan) {
        texto += ` (Plan: ${new Date(tarea.fechaFinPlan).toLocaleDateString('es-CL')})`;
      }
      texto += `\n`;
    });
    texto += `\n`;
  }
  
  if (data.observaciones) {
    texto += `OBSERVACIONES:\n${data.observaciones}\n`;
  }
  
  return texto;
}

