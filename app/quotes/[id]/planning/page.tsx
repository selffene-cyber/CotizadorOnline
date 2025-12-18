'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { getQuoteById } from '@/supabase/quotes';
import {
  getOrCreateGanttProjectByQuoteId,
  listGanttTasks,
  createGanttTask,
  updateGanttTask,
  deleteGanttTask,
  listDependencies,
  createDependency,
  deleteDependency,
} from '@/supabase/gantt';
import { 
  GanttProject, 
  GanttTask, 
  GanttDependency,
  computeProjectProgressWeighted,
  computeTaskDurationDays,
  Quote
} from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import GanttChart, { GanttChartRef } from '@/components/gantt/GanttChart';
import GanttTable from '@/components/gantt/GanttTable';
import SCurveChart from '@/components/gantt/SCurveChart';
import EstadoPagoModal from '@/components/gantt/EstadoPagoModal';
import { computeSCurve, computeSCurveWeekly } from '@/utils/planning/scurve';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { toPng } from 'html-to-image';

export default function PlanningPage() {
  const params = useParams();
  const quoteId = params.id as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [project, setProject] = useState<GanttProject | null>(null);
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [dependencies, setDependencies] = useState<GanttDependency[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ganttImageDataUrl, setGanttImageDataUrl] = useState<string | null>(null);
  const ganttChartRef = useRef<GanttChartRef>(null);
  const [ganttViewMode, setGanttViewMode] = useState<'chart' | 'table'>('table');
  const [ganttTableMode, setGanttTableMode] = useState<'day' | 'week' | 'month'>('day');
  
  // Estado para edición de tareas
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({
    name: '',
    resource: '',
    startPlan: '',
    endPlan: '',
    progress: 0,
  });

  // Estado para dependencias
  const [showDependencyForm, setShowDependencyForm] = useState(false);
  const [dependencyForm, setDependencyForm] = useState({
    predTaskId: '',
    succTaskId: '',
    lagDays: 0,
  });
  const [showEstadoPagoModal, setShowEstadoPagoModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [quoteId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar cotización
      const quoteData = await getQuoteById(quoteId);
      if (!quoteData) {
        console.error('Cotización no encontrada');
        return;
      }
      setQuote(quoteData);

      // Obtener o crear proyecto Gantt
      const projectData = await getOrCreateGanttProjectByQuoteId(quoteId);
      setProject(projectData);

      // Cargar tareas
      const tasksData = await listGanttTasks(projectData.id!);
      setTasks(tasksData);

      // Cargar dependencias
      const depsData = await listDependencies(projectData.id!);
      setDependencies(depsData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = () => {
    setEditingTaskId(null);
    setShowTaskForm(true);
    setTaskForm({
      name: '',
      resource: '',
      startPlan: '',
      endPlan: '',
      progress: 0,
    });
  };

  const handleEditTask = (task: GanttTask) => {
    setEditingTaskId(task.id!);
    setShowTaskForm(true);
    setTaskForm({
      name: task.name,
      resource: task.resource || '',
      startPlan: task.startPlan ? (typeof task.startPlan === 'string' ? task.startPlan : task.startPlan.toISOString().split('T')[0]) : '',
      endPlan: task.endPlan ? (typeof task.endPlan === 'string' ? task.endPlan : task.endPlan.toISOString().split('T')[0]) : '',
      progress: task.progress,
    });
  };

  const handleSaveTask = async () => {
    if (!project?.id) return;
    if (!taskForm.name.trim()) {
      alert('El nombre de la tarea es requerido');
      return;
    }

    // Validar fechas
    if (taskForm.startPlan && taskForm.endPlan) {
      const start = new Date(taskForm.startPlan);
      const end = new Date(taskForm.endPlan);
      if (end < start) {
        alert('La fecha de fin debe ser posterior a la fecha de inicio');
        return;
      }
    }

    // Validar progreso
    if (taskForm.progress < 0 || taskForm.progress > 100) {
      alert('El progreso debe estar entre 0 y 100');
      return;
    }

    try {
      setSaving(true);

      if (editingTaskId) {
        // Actualizar tarea existente
        await updateGanttTask(editingTaskId, {
          name: taskForm.name,
          resource: taskForm.resource || undefined,
          startPlan: taskForm.startPlan || undefined,
          endPlan: taskForm.endPlan || undefined,
          progress: taskForm.progress,
        });
      } else {
        // Crear nueva tarea
        await createGanttTask(project.id, {
          projectId: project.id,
          name: taskForm.name,
          resource: taskForm.resource || undefined,
          startPlan: taskForm.startPlan || undefined,
          endPlan: taskForm.endPlan || undefined,
          progress: taskForm.progress,
        });
      }

      // Recargar tareas
      const updatedTasks = await listGanttTasks(project.id);
      setTasks(updatedTasks);
      
      // Limpiar formulario
      setEditingTaskId(null);
      setShowTaskForm(false);
      setTaskForm({
        name: '',
        resource: '',
        startPlan: '',
        endPlan: '',
        progress: 0,
      });
    } catch (error) {
      console.error('Error guardando tarea:', error);
      alert('Error al guardar la tarea');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;

    try {
      await deleteGanttTask(taskId);
      const updatedTasks = await listGanttTasks(project!.id!);
      setTasks(updatedTasks);
      
      // Recargar dependencias (puede haber dependencias afectadas)
      const updatedDeps = await listDependencies(project!.id!);
      setDependencies(updatedDeps);
    } catch (error) {
      console.error('Error eliminando tarea:', error);
      alert('Error al eliminar la tarea');
    }
  };

  const handleAddDependency = async () => {
    if (!project?.id) return;
    if (!dependencyForm.predTaskId || !dependencyForm.succTaskId) {
      alert('Selecciona ambas tareas');
      return;
    }
    if (dependencyForm.predTaskId === dependencyForm.succTaskId) {
      alert('Una tarea no puede depender de sí misma');
      return;
    }

    try {
      await createDependency(
        project.id,
        dependencyForm.predTaskId,
        dependencyForm.succTaskId,
        dependencyForm.lagDays
      );
      
      const updatedDeps = await listDependencies(project.id);
      setDependencies(updatedDeps);
      
      setDependencyForm({
        predTaskId: '',
        succTaskId: '',
        lagDays: 0,
      });
      setShowDependencyForm(false);
    } catch (error: any) {
      console.error('Error creando dependencia:', error);
      alert(error.message || 'Error al crear dependencia');
    }
  };

  const handleDeleteDependency = async (depId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta dependencia?')) return;

    try {
      await deleteDependency(depId);
      const updatedDeps = await listDependencies(project!.id!);
      setDependencies(updatedDeps);
    } catch (error) {
      console.error('Error eliminando dependencia:', error);
      alert('Error al eliminar la dependencia');
    }
  };

  const progressWeighted = computeProjectProgressWeighted(tasks);
  
  // Calcular Curva S
  const sCurveData = computeSCurve(tasks);
  const sCurveWeeklyData = computeSCurveWeekly(tasks);

  const handleGenerateGanttImage = async () => {
    const container = ganttChartRef.current?.getContainer();
    if (!container) {
      alert('No se puede generar la imagen. El Gantt no está disponible.');
      return;
    }

    try {
      const dataUrl = await toPng(container, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      setGanttImageDataUrl(dataUrl);
      alert('Imagen del Gantt generada correctamente. Puedes verla en la vista previa abajo.');
    } catch (error) {
      console.error('Error generando imagen:', error);
      alert('Error al generar la imagen del Gantt');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!project || !quote) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <p className="text-red-600">Error: No se pudo cargar el proyecto de planificación</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600 mt-1">
            Avance total: <span className="font-semibold">{progressWeighted.toFixed(1)}%</span>
          </p>
        </div>
      </div>

      {/* Tabla de Tareas */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Tareas</h2>
          <Button onClick={handleAddTask} variant="primary">
            <PlusIcon className="w-5 h-5 mr-2" />
            Agregar Tarea
          </Button>
        </div>

        {/* Formulario de Tarea */}
        {showTaskForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombre de la tarea *"
                value={taskForm.name}
                onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                required
              />
              <Input
                label="Recurso"
                value={taskForm.resource}
                onChange={(e) => setTaskForm({ ...taskForm, resource: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Fecha inicio plan"
                type="date"
                value={taskForm.startPlan}
                onChange={(e) => setTaskForm({ ...taskForm, startPlan: e.target.value })}
              />
              <Input
                label="Fecha fin plan"
                type="date"
                value={taskForm.endPlan}
                onChange={(e) => setTaskForm({ ...taskForm, endPlan: e.target.value })}
              />
              <Input
                label="Progreso (%)"
                type="number"
                min="0"
                max="100"
                value={taskForm.progress}
                onChange={(e) => setTaskForm({ ...taskForm, progress: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveTask} disabled={saving} variant="primary">
                {saving ? 'Guardando...' : editingTaskId ? 'Actualizar' : 'Crear'}
              </Button>
              <Button 
                onClick={() => {
                  setEditingTaskId(null);
                  setShowTaskForm(false);
                  setTaskForm({
                    name: '',
                    resource: '',
                    startPlan: '',
                    endPlan: '',
                    progress: 0,
                  });
                }}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Tabla de Tareas */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recurso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inicio Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fin Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duración</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progreso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No hay tareas. Agrega una tarea para comenzar.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const duration = computeTaskDurationDays(task.startPlan, task.endPlan);
                  return (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.wbsOrder}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{task.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.resource || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.startPlan ? (typeof task.startPlan === 'string' ? task.startPlan.split('T')[0] : task.startPlan.toLocaleDateString()) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.endPlan ? (typeof task.endPlan === 'string' ? task.endPlan.split('T')[0] : task.endPlan.toLocaleDateString()) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{duration} días</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{task.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id!)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista Gantt */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Diagrama de Gantt</h2>
          <div className="flex gap-2 items-center">
            {/* Selector de vista */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setGanttViewMode('table')}
                className={`px-3 py-1 text-sm rounded ${
                  ganttViewMode === 'table'
                    ? 'bg-white text-blue-600 font-medium shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tabla
              </button>
              <button
                onClick={() => setGanttViewMode('chart')}
                className={`px-3 py-1 text-sm rounded ${
                  ganttViewMode === 'chart'
                    ? 'bg-white text-blue-600 font-medium shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Gráfico
              </button>
            </div>
            
            {/* Selector de granularidad (solo para tabla) */}
            {ganttViewMode === 'table' && (
              <select
                value={ganttTableMode}
                onChange={(e) => setGanttTableMode(e.target.value as 'day' | 'week' | 'month')}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="day">Día</option>
                <option value="week">Semana</option>
                <option value="month">Mes</option>
              </select>
            )}
            
            <Button onClick={handleGenerateGanttImage} variant="primary">
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Generar Imagen Gantt
            </Button>
          </div>
        </div>
        <div id="gantt-export-container">
          {ganttViewMode === 'table' ? (
            <GanttTable tasks={tasks} viewMode={ganttTableMode} />
          ) : (
            <GanttChart ref={ganttChartRef} tasks={tasks} />
          )}
        </div>
        
        {/* Vista previa de imagen generada */}
        {ganttImageDataUrl && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa de Imagen</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <img 
                src={ganttImageDataUrl} 
                alt="Vista previa del Gantt" 
                className="max-w-full h-auto border border-gray-300 rounded"
              />
              <p className="text-sm text-gray-600 mt-2">
                Esta imagen se incluirá en el PDF de la cotización cuando exportes.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Dependencias */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Dependencias</h2>
          <Button onClick={() => setShowDependencyForm(!showDependencyForm)} variant="primary">
            <PlusIcon className="w-5 h-5 mr-2" />
            Agregar Dependencia
          </Button>
        </div>

        {showDependencyForm && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tarea Predecesora
                </label>
                <select
                  value={dependencyForm.predTaskId}
                  onChange={(e) => setDependencyForm({ ...dependencyForm, predTaskId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Seleccionar...</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tarea Sucesora
                </label>
                <select
                  value={dependencyForm.succTaskId}
                  onChange={(e) => setDependencyForm({ ...dependencyForm, succTaskId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Seleccionar...</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Input
                  label="Días de retraso"
                  type="number"
                  value={dependencyForm.lagDays}
                  onChange={(e) => setDependencyForm({ ...dependencyForm, lagDays: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddDependency} variant="primary">
                Agregar
              </Button>
              <Button onClick={() => setShowDependencyForm(false)} variant="outline">
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {dependencies.length === 0 ? (
          <p className="text-gray-500">No hay dependencias. Agrega dependencias para relacionar tareas.</p>
        ) : (
          <ul className="space-y-2">
            {dependencies.map((dep) => {
              const predTask = tasks.find(t => t.id === dep.predTaskId);
              const succTask = tasks.find(t => t.id === dep.succTaskId);
              return (
                <li key={dep.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">
                    <span className="font-medium">{predTask?.name || dep.predTaskId}</span>
                    {' → '}
                    <span className="font-medium">{succTask?.name || dep.succTaskId}</span>
                    {dep.lagDays !== 0 && (
                      <span className="text-gray-500 ml-2">({dep.lagDays > 0 ? '+' : ''}{dep.lagDays} días)</span>
                    )}
                  </span>
                  <button
                    onClick={() => handleDeleteDependency(dep.id!)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Curva S */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ChartBarIcon className="w-6 h-6" />
            Curva S (Plan vs Real)
          </h2>
          <Button onClick={() => setShowEstadoPagoModal(true)} variant="primary">
            Generar Estado de Pago
          </Button>
        </div>
        {sCurveData.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Agrega tareas con fechas planificadas para visualizar la Curva S.
          </p>
        ) : (
          <SCurveChart data={sCurveData} height={400} />
        )}
      </div>

      {/* Modal Estado de Pago */}
      {quote && (
        <EstadoPagoModal
          isOpen={showEstadoPagoModal}
          onClose={() => setShowEstadoPagoModal(false)}
          quote={quote}
          tasks={tasks}
        />
      )}
    </div>
  );
}

