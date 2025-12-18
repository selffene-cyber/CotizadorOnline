-- ============================================
-- MÓDULO PLANIFICACIÓN (GANTT) - Cotizador.PiwiSuite
-- ============================================
-- 
-- Este script crea las tablas para gestión de planificación Gantt por cotización
-- Ejecutar este script en el SQL Editor de Supabase
--
-- PREREQUISITOS:
-- - Las tablas tenants, memberships, quotes deben existir
-- - La función update_updated_at_column() debe existir
-- - La función check_user_tenant_membership() debe existir (para RLS)
-- ============================================

-- ============================================
-- TABLAS
-- ============================================

-- Tabla gantt_projects: Proyecto Gantt asociado a una cotización
CREATE TABLE IF NOT EXISTS public.gantt_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  baseline_start DATE,
  baseline_end DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un Gantt por cotización (1:1)
  UNIQUE(quote_id)
);

-- Tabla gantt_tasks: Tareas del proyecto Gantt
CREATE TABLE IF NOT EXISTS public.gantt_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.gantt_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  wbs_order INTEGER DEFAULT 1,
  resource TEXT,
  start_plan DATE,
  end_plan DATE,
  start_actual DATE,
  end_actual DATE,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla gantt_dependencies: Dependencias entre tareas (predecesoras)
CREATE TABLE IF NOT EXISTS public.gantt_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.gantt_projects(id) ON DELETE CASCADE,
  pred_task_id UUID NOT NULL REFERENCES public.gantt_tasks(id) ON DELETE CASCADE,
  succ_task_id UUID NOT NULL REFERENCES public.gantt_tasks(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'FS' CHECK (type IN ('FS')), -- Finish-to-Start
  lag_days INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Evitar dependencias duplicadas
  UNIQUE(project_id, pred_task_id, succ_task_id),
  
  -- Evitar dependencias circulares (no puede ser predecesor y sucesor de sí misma)
  CHECK (pred_task_id != succ_task_id)
);

-- ============================================
-- ÍNDICES
-- ============================================

-- Índices para mejorar rendimiento de queries
CREATE INDEX IF NOT EXISTS idx_gantt_projects_tenant_quote 
  ON public.gantt_projects(tenant_id, quote_id);

CREATE INDEX IF NOT EXISTS idx_gantt_tasks_project_wbs 
  ON public.gantt_tasks(project_id, wbs_order);

CREATE INDEX IF NOT EXISTS idx_gantt_dependencies_project 
  ON public.gantt_dependencies(project_id);

CREATE INDEX IF NOT EXISTS idx_gantt_dependencies_tasks 
  ON public.gantt_dependencies(pred_task_id, succ_task_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para actualizar updated_at automáticamente en gantt_projects
DROP TRIGGER IF EXISTS update_gantt_projects_updated_at ON public.gantt_projects;
CREATE TRIGGER update_gantt_projects_updated_at 
  BEFORE UPDATE ON public.gantt_projects
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at automáticamente en gantt_tasks
DROP TRIGGER IF EXISTS update_gantt_tasks_updated_at ON public.gantt_tasks;
CREATE TRIGGER update_gantt_tasks_updated_at 
  BEFORE UPDATE ON public.gantt_tasks
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en las 3 tablas
ALTER TABLE public.gantt_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gantt_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gantt_dependencies ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS PARA gantt_projects
-- ============================================

-- Eliminar políticas existentes antes de crear
DROP POLICY IF EXISTS "Users can view gantt_projects of their tenant" ON public.gantt_projects;
DROP POLICY IF EXISTS "Users can create gantt_projects in their tenant" ON public.gantt_projects;
DROP POLICY IF EXISTS "Users can update gantt_projects of their tenant" ON public.gantt_projects;
DROP POLICY IF EXISTS "Users can delete gantt_projects of their tenant" ON public.gantt_projects;

-- SELECT: Usuarios autenticados pueden ver proyectos Gantt de su tenant
CREATE POLICY "Users can view gantt_projects of their tenant" 
  ON public.gantt_projects
  FOR SELECT 
  USING (
    auth.role() = 'authenticated'
    AND check_user_tenant_membership(tenant_id, auth.uid())
  );

-- INSERT: Usuarios autenticados pueden crear proyectos Gantt en su tenant
CREATE POLICY "Users can create gantt_projects in their tenant" 
  ON public.gantt_projects
  FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated'
    AND check_user_tenant_membership(tenant_id, auth.uid())
  );

-- UPDATE: Usuarios autenticados pueden actualizar proyectos Gantt de su tenant
CREATE POLICY "Users can update gantt_projects of their tenant" 
  ON public.gantt_projects
  FOR UPDATE 
  USING (
    auth.role() = 'authenticated'
    AND check_user_tenant_membership(tenant_id, auth.uid())
  );

-- DELETE: Usuarios autenticados pueden eliminar proyectos Gantt de su tenant
CREATE POLICY "Users can delete gantt_projects of their tenant" 
  ON public.gantt_projects
  FOR DELETE 
  USING (
    auth.role() = 'authenticated'
    AND check_user_tenant_membership(tenant_id, auth.uid())
  );

-- ============================================
-- POLÍTICAS RLS PARA gantt_tasks
-- ============================================

-- Eliminar políticas existentes antes de crear
DROP POLICY IF EXISTS "Users can view gantt_tasks of their tenant" ON public.gantt_tasks;
DROP POLICY IF EXISTS "Users can create gantt_tasks in their tenant" ON public.gantt_tasks;
DROP POLICY IF EXISTS "Users can update gantt_tasks of their tenant" ON public.gantt_tasks;
DROP POLICY IF EXISTS "Users can delete gantt_tasks of their tenant" ON public.gantt_tasks;

-- SELECT: Usuarios autenticados pueden ver tareas de proyectos de su tenant
CREATE POLICY "Users can view gantt_tasks of their tenant" 
  ON public.gantt_tasks
  FOR SELECT 
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.gantt_projects gp
      WHERE gp.id = gantt_tasks.project_id
      AND check_user_tenant_membership(gp.tenant_id, auth.uid())
    )
  );

-- INSERT: Usuarios autenticados pueden crear tareas en proyectos de su tenant
CREATE POLICY "Users can create gantt_tasks in their tenant" 
  ON public.gantt_tasks
  FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.gantt_projects gp
      WHERE gp.id = project_id
      AND check_user_tenant_membership(gp.tenant_id, auth.uid())
    )
  );

-- UPDATE: Usuarios autenticados pueden actualizar tareas de proyectos de su tenant
CREATE POLICY "Users can update gantt_tasks of their tenant" 
  ON public.gantt_tasks
  FOR UPDATE 
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.gantt_projects gp
      WHERE gp.id = gantt_tasks.project_id
      AND check_user_tenant_membership(gp.tenant_id, auth.uid())
    )
  );

-- DELETE: Usuarios autenticados pueden eliminar tareas de proyectos de su tenant
CREATE POLICY "Users can delete gantt_tasks of their tenant" 
  ON public.gantt_tasks
  FOR DELETE 
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.gantt_projects gp
      WHERE gp.id = gantt_tasks.project_id
      AND check_user_tenant_membership(gp.tenant_id, auth.uid())
    )
  );

-- ============================================
-- POLÍTICAS RLS PARA gantt_dependencies
-- ============================================

-- Eliminar políticas existentes antes de crear
DROP POLICY IF EXISTS "Users can view gantt_dependencies of their tenant" ON public.gantt_dependencies;
DROP POLICY IF EXISTS "Users can create gantt_dependencies in their tenant" ON public.gantt_dependencies;
DROP POLICY IF EXISTS "Users can update gantt_dependencies of their tenant" ON public.gantt_dependencies;
DROP POLICY IF EXISTS "Users can delete gantt_dependencies of their tenant" ON public.gantt_dependencies;

-- SELECT: Usuarios autenticados pueden ver dependencias de proyectos de su tenant
CREATE POLICY "Users can view gantt_dependencies of their tenant" 
  ON public.gantt_dependencies
  FOR SELECT 
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.gantt_projects gp
      WHERE gp.id = gantt_dependencies.project_id
      AND check_user_tenant_membership(gp.tenant_id, auth.uid())
    )
  );

-- INSERT: Usuarios autenticados pueden crear dependencias en proyectos de su tenant
CREATE POLICY "Users can create gantt_dependencies in their tenant" 
  ON public.gantt_dependencies
  FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.gantt_projects gp
      WHERE gp.id = project_id
      AND check_user_tenant_membership(gp.tenant_id, auth.uid())
    )
  );

-- UPDATE: Usuarios autenticados pueden actualizar dependencias de proyectos de su tenant
CREATE POLICY "Users can update gantt_dependencies of their tenant" 
  ON public.gantt_dependencies
  FOR UPDATE 
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.gantt_projects gp
      WHERE gp.id = gantt_dependencies.project_id
      AND check_user_tenant_membership(gp.tenant_id, auth.uid())
    )
  );

-- DELETE: Usuarios autenticados pueden eliminar dependencias de proyectos de su tenant
CREATE POLICY "Users can delete gantt_dependencies of their tenant" 
  ON public.gantt_dependencies
  FOR DELETE 
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.gantt_projects gp
      WHERE gp.id = gantt_dependencies.project_id
      AND check_user_tenant_membership(gp.tenant_id, auth.uid())
    )
  );

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que las tablas se crearon correctamente
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gantt_projects') THEN
    RAISE EXCEPTION 'La tabla gantt_projects no se creó correctamente';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gantt_tasks') THEN
    RAISE EXCEPTION 'La tabla gantt_tasks no se creó correctamente';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gantt_dependencies') THEN
    RAISE EXCEPTION 'La tabla gantt_dependencies no se creó correctamente';
  END IF;
  
  RAISE NOTICE 'Todas las tablas Gantt se crearon correctamente';
END $$;


