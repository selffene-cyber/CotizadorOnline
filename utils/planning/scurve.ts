// Cálculo de Curva S (Plan vs Real) para planificación Gantt
import { GanttTask } from '@/types';

export interface SCurveDataPoint {
  date: string; // YYYY-MM-DD
  planCum: number; // Acumulado planificado (0-100)
  realCum: number; // Acumulado real (0-100)
}

/**
 * Calcular serie de datos para Curva S
 * Inputs: tasks (array de tareas con fechas plan y real, y progreso)
 * Output: array de {date, planCum, realCum} para graficar
 */
export function computeSCurve(tasks: GanttTask[]): SCurveDataPoint[] {
  if (tasks.length === 0) {
    return [];
  }

  // Filtrar tareas que tienen fechas plan
  const tasksWithDates = tasks.filter(
    task => task.startPlan && task.endPlan
  );

  if (tasksWithDates.length === 0) {
    return [];
  }

  // Obtener rango de fechas (min start_plan a max end_plan)
  const dates: Date[] = [];
  tasksWithDates.forEach(task => {
    const startPlan = typeof task.startPlan === 'string' 
      ? new Date(task.startPlan) 
      : task.startPlan;
    const endPlan = typeof task.endPlan === 'string' 
      ? new Date(task.endPlan) 
      : task.endPlan;

    if (startPlan && endPlan && !isNaN(startPlan.getTime()) && !isNaN(endPlan.getTime())) {
      dates.push(startPlan, endPlan);
    }
  });

  if (dates.length === 0) {
    return [];
  }

  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

  // Generar serie diaria entre minDate y maxDate
  const series: SCurveDataPoint[] = [];
  const currentDate = new Date(minDate);

  // Calcular pesos totales (duraciones plan)
  const totalWeight = tasksWithDates.reduce((sum, task) => {
    const start = typeof task.startPlan === 'string' 
      ? new Date(task.startPlan) 
      : task.startPlan;
    const end = typeof task.endPlan === 'string' 
      ? new Date(task.endPlan) 
      : task.endPlan;

    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return sum;
    }

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return sum + Math.max(1, days);
  }, 0);

  while (currentDate <= maxDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    let planCum = 0;
    let realCum = 0;

    // Calcular acumulado planificado y real hasta esta fecha
    tasksWithDates.forEach(task => {
      const startPlan = typeof task.startPlan === 'string' 
        ? new Date(task.startPlan) 
        : task.startPlan;
      const endPlan = typeof task.endPlan === 'string' 
        ? new Date(task.endPlan) 
        : task.endPlan;

      if (!startPlan || !endPlan || isNaN(startPlan.getTime()) || isNaN(endPlan.getTime())) {
        return;
      }

      const taskDuration = Math.ceil(
        (endPlan.getTime() - startPlan.getTime()) / (1000 * 60 * 60 * 24)
      );
      const weight = Math.max(1, taskDuration);

      // PLAN: Distribuir peso por duración entre start_plan y end_plan
      if (currentDate >= startPlan && currentDate <= endPlan) {
        // Calcular porcentaje dentro del rango de la tarea
        const daysFromStart = Math.ceil(
          (currentDate.getTime() - startPlan.getTime()) / (1000 * 60 * 60 * 24)
        );
        const taskProgressPlan = Math.min(100, (daysFromStart / taskDuration) * 100);
        planCum += (taskProgressPlan / 100) * weight;
      } else if (currentDate > endPlan) {
        // Tarea completada según plan
        planCum += weight;
      }

      // REAL: Usar progress y fechas actualizadas (start_actual/end_actual); si no hay reales, asumir plan
      const startActual = task.startActual 
        ? (typeof task.startActual === 'string' ? new Date(task.startActual) : task.startActual)
        : startPlan;
      const endActual = task.endActual 
        ? (typeof task.endActual === 'string' ? new Date(task.endActual) : task.endActual)
        : endPlan;

      // Si no hay fechas reales, usar plan
      if (!startActual || !endActual || isNaN(startActual.getTime()) || isNaN(endActual.getTime())) {
        // Usar plan si no hay real
        if (currentDate >= startPlan && currentDate <= endPlan) {
          const daysFromStart = Math.ceil(
            (currentDate.getTime() - startPlan.getTime()) / (1000 * 60 * 60 * 24)
          );
          const taskProgressPlan = Math.min(100, (daysFromStart / taskDuration) * 100);
          realCum += (taskProgressPlan / 100) * weight;
        } else if (currentDate > endPlan) {
          realCum += weight;
        }
      } else {
        // Usar fechas reales y progreso actual
        const realDuration = Math.ceil(
          (endActual.getTime() - startActual.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (currentDate >= startActual && currentDate <= endActual) {
          // Calcular porcentaje basado en el progreso actual de la tarea
          const taskProgress = task.progress || 0;
          realCum += (taskProgress / 100) * weight;
        } else if (currentDate > endActual) {
          // Tarea completada según real (usar progreso)
          const taskProgress = task.progress || 0;
          realCum += (taskProgress / 100) * weight;
        }
      }
    });

    // Convertir a porcentajes acumulados
    const planCumPercent = totalWeight > 0 ? (planCum / totalWeight) * 100 : 0;
    const realCumPercent = totalWeight > 0 ? (realCum / totalWeight) * 100 : 0;

    series.push({
      date: dateStr,
      planCum: Math.round(planCumPercent * 100) / 100,
      realCum: Math.round(realCumPercent * 100) / 100,
    });

    // Avanzar un día
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return series;
}

/**
 * Calcular Curva S con granularidad semanal (más eficiente para rangos largos)
 */
export function computeSCurveWeekly(tasks: GanttTask[]): SCurveDataPoint[] {
  const daily = computeSCurve(tasks);
  
  if (daily.length === 0) {
    return [];
  }

  // Agrupar por semana (lunes a domingo)
  const weekly: Map<string, SCurveDataPoint> = new Map();

  daily.forEach(point => {
    const date = new Date(point.date);
    // Obtener el lunes de la semana
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Ajustar para que lunes = 1
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const weekKey = monday.toISOString().split('T')[0];

    const existing = weekly.get(weekKey);
    if (existing) {
      // Promedio de la semana
      existing.planCum = (existing.planCum + point.planCum) / 2;
      existing.realCum = (existing.realCum + point.realCum) / 2;
    } else {
      weekly.set(weekKey, { ...point });
    }
  });

  return Array.from(weekly.values()).sort((a, b) => 
    a.date.localeCompare(b.date)
  );
}


