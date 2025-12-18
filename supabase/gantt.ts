// Helpers para manejo de Planificación Gantt con Supabase
import { 
  GanttProject, 
  GanttTask, 
  GanttDependency,
  CreateGanttProjectDTO,
  UpdateGanttProjectDTO,
  CreateGanttTaskDTO,
  UpdateGanttTaskDTO,
  CreateGanttDependencyDTO
} from '@/types';
import { supabase, hasValidSupabaseConfig, createSupabaseClient } from './config';
import { getQuoteById } from './quotes';

// Helper para obtener el cliente correcto
function getSupabaseClient() {
  return typeof window !== 'undefined' ? createSupabaseClient() : supabase;
}

// Helper para obtener tenant_id del usuario actual
async function getCurrentTenantId(): Promise<string | null> {
  if (!hasValidSupabaseConfig()) {
    return null;
  }

  const supabaseClient = getSupabaseClient();
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  
  if (userError || !user) {
    return null;
  }

  const { data: memberships } = await supabaseClient
    .from('memberships')
    .select('tenant_id')
    .eq('user_id', user.id)
    .limit(1);

  if (memberships && memberships.length > 0) {
    return memberships[0].tenant_id;
  }

  return null;
}

// Función auxiliar para convertir de snake_case a camelCase (GanttProject)
function toGanttProject(row: any): GanttProject {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    quoteId: row.quote_id,
    name: row.name,
    baselineStart: row.baseline_start,
    baselineEnd: row.baseline_end,
    createdBy: row.created_by,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  };
}

// Función auxiliar para convertir de snake_case a camelCase (GanttTask)
function toGanttTask(row: any): GanttTask {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    wbsOrder: row.wbs_order,
    resource: row.resource,
    startPlan: row.start_plan,
    endPlan: row.end_plan,
    startActual: row.start_actual,
    endActual: row.end_actual,
    progress: row.progress,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  };
}

// Función auxiliar para convertir de snake_case a camelCase (GanttDependency)
function toGanttDependency(row: any): GanttDependency {
  return {
    id: row.id,
    projectId: row.project_id,
    predTaskId: row.pred_task_id,
    succTaskId: row.succ_task_id,
    type: row.type as 'FS',
    lagDays: row.lag_days,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
  };
}

// Función auxiliar para convertir de camelCase a snake_case (GanttProject)
function ganttProjectToRow(project: Partial<GanttProject>): any {
  const row: any = {};
  if (project.tenantId !== undefined) row.tenant_id = project.tenantId;
  if (project.quoteId !== undefined) row.quote_id = project.quoteId;
  if (project.name !== undefined) row.name = project.name;
  if (project.baselineStart !== undefined) row.baseline_start = project.baselineStart;
  if (project.baselineEnd !== undefined) row.baseline_end = project.baselineEnd;
  if (project.createdBy !== undefined) row.created_by = project.createdBy;
  return row;
}

// Función auxiliar para convertir de camelCase a snake_case (GanttTask)
function ganttTaskToRow(task: Partial<GanttTask>): any {
  const row: any = {};
  if (task.projectId !== undefined) row.project_id = task.projectId;
  if (task.name !== undefined) row.name = task.name;
  if (task.wbsOrder !== undefined) row.wbs_order = task.wbsOrder;
  if (task.resource !== undefined) row.resource = task.resource;
  if (task.startPlan !== undefined) row.start_plan = task.startPlan;
  if (task.endPlan !== undefined) row.end_plan = task.endPlan;
  if (task.startActual !== undefined) row.start_actual = task.startActual;
  if (task.endActual !== undefined) row.end_actual = task.endActual;
  if (task.progress !== undefined) row.progress = task.progress;
  return row;
}

// Función auxiliar para convertir de camelCase a snake_case (GanttDependency)
function ganttDependencyToRow(dep: Partial<GanttDependency>): any {
  const row: any = {};
  if (dep.projectId !== undefined) row.project_id = dep.projectId;
  if (dep.predTaskId !== undefined) row.pred_task_id = dep.predTaskId;
  if (dep.succTaskId !== undefined) row.succ_task_id = dep.succTaskId;
  if (dep.type !== undefined) row.type = dep.type;
  if (dep.lagDays !== undefined) row.lag_days = dep.lagDays;
  return row;
}

/**
 * Obtener o crear un proyecto Gantt para una cotización
 */
export async function getOrCreateGanttProjectByQuoteId(quoteId: string): Promise<GanttProject> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase no está configurado');
  }

  const supabaseClient = getSupabaseClient();

  // Intentar obtener el proyecto existente
  const { data: existing, error: fetchError } = await supabaseClient
    .from('gantt_projects')
    .select('*')
    .eq('quote_id', quoteId)
    .single();

  if (existing && !fetchError) {
    return toGanttProject(existing);
  }

  // Si no existe, crear uno nuevo
  const tenantId = await getCurrentTenantId();
  if (!tenantId) {
    throw new Error('No se pudo determinar el tenant_id. Asegúrate de estar autenticado y asociado a un tenant.');
  }

  // Obtener información de la cotización para generar nombre por defecto
  const quote = await getQuoteById(quoteId);
  const projectName = quote 
    ? `Planificación - ${quote.quoteNumber ? `COT-${quote.quoteNumber}` : quote.projectName}`
    : `Planificación - Cotización ${quoteId.substring(0, 8)}`;

  // Obtener usuario actual para created_by
  const { data: { user } } = await supabaseClient.auth.getUser();

  const newProject: any = {
    tenant_id: tenantId,
    quote_id: quoteId,
    name: projectName,
    created_by: user?.id || null,
  };

  const { data, error } = await supabaseClient
    .from('gantt_projects')
    .insert(newProject)
    .select()
    .single();

  if (error) {
    console.error('[getOrCreateGanttProjectByQuoteId] Error:', error);
    throw new Error(`Error al crear proyecto Gantt: ${error.message}`);
  }

  return toGanttProject(data);
}

/**
 * Obtener un proyecto Gantt por ID
 */
export async function getGanttProject(projectId: string): Promise<GanttProject | null> {
  if (!hasValidSupabaseConfig()) {
    return null;
  }

  const supabaseClient = getSupabaseClient();
  const { data, error } = await supabaseClient
    .from('gantt_projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error || !data) {
    return null;
  }

  return toGanttProject(data);
}

/**
 * Obtener todas las tareas de un proyecto
 */
export async function listGanttTasks(projectId: string): Promise<GanttTask[]> {
  if (!hasValidSupabaseConfig()) {
    return [];
  }

  const supabaseClient = getSupabaseClient();
  const { data, error } = await supabaseClient
    .from('gantt_tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('wbs_order', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map(toGanttTask);
}

/**
 * Crear una nueva tarea
 */
export async function createGanttTask(projectId: string, payload: CreateGanttTaskDTO): Promise<string> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase no está configurado');
  }

  const supabaseClient = getSupabaseClient();

  // Si no se proporciona wbs_order, obtener el siguiente disponible
  let wbsOrder = payload.wbsOrder;
  if (wbsOrder === undefined) {
    const existingTasks = await listGanttTasks(projectId);
    wbsOrder = existingTasks.length > 0 
      ? Math.max(...existingTasks.map(t => t.wbsOrder)) + 1
      : 1;
  }

  const taskData = {
    ...ganttTaskToRow(payload),
    project_id: projectId,
    wbs_order: wbsOrder,
    progress: payload.progress ?? 0,
  };

  const { data, error } = await supabaseClient
    .from('gantt_tasks')
    .insert(taskData)
    .select('id')
    .single();

  if (error) {
    console.error('[createGanttTask] Error:', error);
    throw new Error(`Error al crear tarea: ${error.message}`);
  }

  return data.id;
}

/**
 * Actualizar una tarea
 */
export async function updateGanttTask(taskId: string, patch: UpdateGanttTaskDTO): Promise<void> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase no está configurado');
  }

  const supabaseClient = getSupabaseClient();
  const rowData = ganttTaskToRow(patch);

  const { error } = await supabaseClient
    .from('gantt_tasks')
    .update(rowData)
    .eq('id', taskId);

  if (error) {
    console.error('[updateGanttTask] Error:', error);
    throw new Error(`Error al actualizar tarea: ${error.message}`);
  }
}

/**
 * Eliminar una tarea
 */
export async function deleteGanttTask(taskId: string): Promise<void> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase no está configurado');
  }

  const supabaseClient = getSupabaseClient();

  const { error } = await supabaseClient
    .from('gantt_tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('[deleteGanttTask] Error:', error);
    throw new Error(`Error al eliminar tarea: ${error.message}`);
  }
}

/**
 * Obtener todas las dependencias de un proyecto
 */
export async function listDependencies(projectId: string): Promise<GanttDependency[]> {
  if (!hasValidSupabaseConfig()) {
    return [];
  }

  const supabaseClient = getSupabaseClient();
  const { data, error } = await supabaseClient
    .from('gantt_dependencies')
    .select('*')
    .eq('project_id', projectId);

  if (error || !data) {
    return [];
  }

  return data.map(toGanttDependency);
}

/**
 * Crear una dependencia
 */
export async function createDependency(
  projectId: string,
  predId: string,
  succId: string,
  lagDays: number = 0
): Promise<string> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase no está configurado');
  }

  if (predId === succId) {
    throw new Error('Una tarea no puede depender de sí misma');
  }

  const supabaseClient = getSupabaseClient();

  const depData = {
    project_id: projectId,
    pred_task_id: predId,
    succ_task_id: succId,
    type: 'FS' as const,
    lag_days: lagDays,
  };

  const { data, error } = await supabaseClient
    .from('gantt_dependencies')
    .insert(depData)
    .select('id')
    .single();

  if (error) {
    console.error('[createDependency] Error:', error);
    throw new Error(`Error al crear dependencia: ${error.message}`);
  }

  return data.id;
}

/**
 * Eliminar una dependencia
 */
export async function deleteDependency(depId: string): Promise<void> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase no está configurado');
  }

  const supabaseClient = getSupabaseClient();

  const { error } = await supabaseClient
    .from('gantt_dependencies')
    .delete()
    .eq('id', depId);

  if (error) {
    console.error('[deleteDependency] Error:', error);
    throw new Error(`Error al eliminar dependencia: ${error.message}`);
  }
}


