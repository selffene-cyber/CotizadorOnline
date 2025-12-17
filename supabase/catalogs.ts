// Helpers para catálogos con Supabase
import { MaterialCatalogItem, EquipmentCatalogItem, LaborCatalogItem, RiskCatalogItem, Settings } from '@/types';
import { supabase, hasValidSupabaseConfig, createSupabaseClient } from './config';

// Helper para obtener el cliente correcto
function getSupabaseClient() {
  return typeof window !== 'undefined' ? createSupabaseClient() : supabase;
}

// Materiales
export async function getMaterialsCatalog(tenantId?: string): Promise<MaterialCatalogItem[]> {
  if (!hasValidSupabaseConfig()) {
    return [];
  }

  const supabaseClient = getSupabaseClient();
  let query = supabaseClient
    .from('material_catalog')
    .select('*');

  // Filtrar por tenant_id si se proporciona
  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  } else {
    // Si no se proporciona tenant_id, obtenerlo automáticamente
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (!userError && user) {
      const { data: memberships } = await supabaseClient
        .from('memberships')
        .select('tenant_id')
        .eq('user_id', user.id)
        .limit(1);

      if (memberships && memberships.length > 0) {
        query = query.eq('tenant_id', memberships[0].tenant_id);
      }
    }
  }

  const { data, error } = await query.order('name');

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => {
    // Extraer el número del código si está en formato tenant_id-number-uuid
    let number: number | undefined;
    if (row.code) {
      // El código puede estar en formato: tenant_id-number-uuid o solo ser un número
      const parts = row.code.split('-');
      if (parts.length >= 2) {
        // Intentar parsear la segunda parte como número
        const parsed = parseInt(parts[1]);
        if (!isNaN(parsed) && parsed > 0) {
          number = parsed;
        }
      } else {
        // Si no tiene formato, intentar parsear directamente
        const parsed = parseInt(row.code);
        if (!isNaN(parsed) && parsed > 0) {
          number = parsed;
        }
      }
    }
    
    // Asegurar que defaultCost se cargue correctamente (puede ser null en la BD)
    const defaultCost = row.default_cost !== null && row.default_cost !== undefined 
      ? parseFloat(row.default_cost) 
      : 0;
    
    console.log('[getMaterialsCatalog] Row loaded:', {
      name: row.name,
      default_cost: row.default_cost,
      parsedDefaultCost: defaultCost,
      type: typeof row.default_cost
    });
    
    return {
      id: row.id,
      number: number,
      name: row.name,
      unidad: row.unit,
      defaultCost: defaultCost,
      defaultMermaPct: row.default_merma || 0,
      category: row.category,
    };
  });
}

export async function saveMaterialsCatalog(items: MaterialCatalogItem[], tenantId?: string): Promise<void> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase no está configurado');
  }

  const supabaseClient = getSupabaseClient();
  
  // Obtener el usuario actual
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Usuario no autenticado. Debes iniciar sesión para guardar catálogos.');
  }

  // Obtener tenant_id si no se proporciona
  let finalTenantId = tenantId;
  
  if (!finalTenantId) {
    const { data: memberships, error: membershipError } = await supabaseClient
      .from('memberships')
      .select('tenant_id')
      .eq('user_id', user.id)
      .limit(1);

    if (membershipError || !memberships || memberships.length === 0) {
      throw new Error('No se encontró un tenant asociado. Asegúrate de estar asociado a una empresa.');
    }

    finalTenantId = memberships[0].tenant_id;
  }

  if (!finalTenantId) {
    throw new Error('No se pudo determinar el tenant_id. Proporciona un tenant_id o asegúrate de estar asociado a una empresa.');
  }

  // Eliminar todos los existentes del tenant
  const { error: deleteError } = await supabaseClient
    .from('material_catalog')
    .delete()
    .eq('tenant_id', finalTenantId);

  if (deleteError) {
    console.warn('[saveMaterialsCatalog] Error eliminando catálogo existente:', deleteError);
  }

  // Insertar nuevos
  if (items.length > 0) {
    // Generar códigos únicos usando UUID para evitar conflictos
    // El código será único por tenant usando el formato: tenant_id-number-uuid
    const rows = items.map((item, index) => {
      let code: string | undefined;
      if (item.number && item.number > 0) {
        // Usar un formato único que combine tenant_id, número y un UUID corto
        // Esto asegura que sea único globalmente pero mantenga el número correlativo
        const shortId = `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
        code = `${finalTenantId}-${item.number}-${shortId}`;
      } else {
        // Si no hay número, usar un código único temporal
        code = `${finalTenantId}-temp-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Asegurar que defaultCost se guarde correctamente
      const defaultCost = item.defaultCost !== undefined && item.defaultCost !== null 
        ? parseFloat(item.defaultCost.toString()) 
        : 0;
      
      console.log('[saveMaterialsCatalog] Item:', {
        name: item.name,
        defaultCost: item.defaultCost,
        parsedDefaultCost: defaultCost,
        type: typeof item.defaultCost
      });
      
      return {
        code: code,
        name: item.name,
        unit: item.unidad,
        default_cost: defaultCost,
        default_merma: item.defaultMermaPct,
        category: item.category,
        tenant_id: finalTenantId,
      };
    });

    const { error } = await supabaseClient.from('material_catalog').insert(rows);
    if (error) {
      console.error('[saveMaterialsCatalog] Error completo:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw new Error(`Error al guardar catálogo de materiales: ${error.message || 'Error desconocido'}`);
    }
  }
}

// Equipos
export async function getEquipmentCatalog(tenantId?: string): Promise<EquipmentCatalogItem[]> {
  if (!hasValidSupabaseConfig()) {
    return [];
  }

  const supabaseClient = getSupabaseClient();
  let query = supabaseClient
    .from('equipment_catalog')
    .select('*');

  // Filtrar por tenant_id si se proporciona
  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  } else {
    // Si no se proporciona tenant_id, obtenerlo automáticamente
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (!userError && user) {
      const { data: memberships } = await supabaseClient
        .from('memberships')
        .select('tenant_id')
        .eq('user_id', user.id)
        .limit(1);

      if (memberships && memberships.length > 0) {
        query = query.eq('tenant_id', memberships[0].tenant_id);
      }
    }
  }

  const { data, error } = await query.order('name');

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    number: row.code ? parseInt(row.code) || undefined : undefined,
    name: row.name,
    unit: row.unit as 'día' | 'hora',
    defaultRate: row.default_rate,
    category: row.category,
  }));
}

export async function saveEquipmentCatalog(items: EquipmentCatalogItem[], tenantId?: string): Promise<void> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase no está configurado');
  }

  const supabaseClient = getSupabaseClient();
  
  // Obtener el usuario actual
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Usuario no autenticado. Debes iniciar sesión para guardar catálogos.');
  }

  // Obtener tenant_id si no se proporciona
  let finalTenantId = tenantId;
  
  if (!finalTenantId) {
    const { data: memberships, error: membershipError } = await supabaseClient
      .from('memberships')
      .select('tenant_id')
      .eq('user_id', user.id)
      .limit(1);

    if (membershipError || !memberships || memberships.length === 0) {
      throw new Error('No se encontró un tenant asociado. Asegúrate de estar asociado a una empresa.');
    }

    finalTenantId = memberships[0].tenant_id;
  }

  if (!finalTenantId) {
    throw new Error('No se pudo determinar el tenant_id. Proporciona un tenant_id o asegúrate de estar asociado a una empresa.');
  }

  // Eliminar todos los existentes del tenant
  const { error: deleteError } = await supabaseClient
    .from('equipment_catalog')
    .delete()
    .eq('tenant_id', finalTenantId);

  if (deleteError) {
    console.warn('[saveEquipmentCatalog] Error eliminando catálogo existente:', deleteError);
  }

  // Insertar nuevos
  if (items.length > 0) {
    const rows = items.map(item => {
      // Normalizar y validar unit
      // La base de datos solo acepta 'día' o 'hora'
      let normalizedUnit: 'día' | 'hora' = 'día'; // Valor por defecto
      
      if (item.unit) {
        const unitLower = item.unit.toLowerCase().trim();
        
        // Mapear valores de tiempo a 'día' o 'hora'
        // Valores que se mapean a 'día'
        const dayValues = ['dia', 'día', 'dias', 'días', 'd', 'day', 'days', 'jornada', 'jornadas', 'semana', 'semanas', 'mes', 'meses'];
        // Valores que se mapean a 'hora'
        const hourValues = ['hora', 'horas', 'h', 'hh', 'hr', 'hrs', 'hour', 'hours', 'hombre hora', 'hombre-hora'];
        
        if (dayValues.includes(unitLower)) {
          normalizedUnit = 'día';
        } else if (hourValues.includes(unitLower)) {
          normalizedUnit = 'hora';
        } else if (item.unit === 'día' || item.unit === 'hora') {
          // Si ya es el valor correcto, usarlo directamente
          normalizedUnit = item.unit;
        } else {
          // Si no coincide con ningún patrón conocido, usar 'día' por defecto y loguear
          console.warn(`[saveEquipmentCatalog] Valor de unit no reconocido: "${item.unit}", usando "día" por defecto`);
          normalizedUnit = 'día';
        }
      }

      return {
        code: item.number?.toString() || undefined,
        name: item.name,
        unit: normalizedUnit,
        default_rate: item.defaultRate || 0,
        category: item.category,
        tenant_id: finalTenantId,
      };
    });

    const { error } = await supabaseClient.from('equipment_catalog').insert(rows);
    if (error) {
      console.error('[saveEquipmentCatalog] Error completo:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        rows: rows.map(r => ({ name: r.name, unit: r.unit })), // Log de los valores que se intentaron insertar
      });
      throw new Error(`Error al guardar catálogo de equipos: ${error.message || 'Error desconocido'}`);
    }
  }
}

// Labor, Risk y Settings - Por ahora usar localStorage como fallback
// TODO: Crear tablas en Supabase si es necesario
export async function getLaborCatalog(): Promise<LaborCatalogItem[]> {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem('labor-catalog');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error cargando catálogo de labor:', error);
  }

  return [];
}

export async function saveLaborCatalog(items: LaborCatalogItem[]): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem('labor-catalog', JSON.stringify(items));
  } catch (error) {
    console.error('Error guardando catálogo de labor:', error);
    throw error;
  }
}

export async function getRiskCatalog(): Promise<RiskCatalogItem[]> {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem('risk-catalog');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error cargando catálogo de riesgos:', error);
  }

  return [];
}

export async function saveRiskCatalog(items: RiskCatalogItem[]): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem('risk-catalog', JSON.stringify(items));
  } catch (error) {
    console.error('Error guardando catálogo de riesgos:', error);
    throw error;
  }
}

export async function getSettings(): Promise<Settings> {
  if (typeof window === 'undefined') {
    return {
      ggDefault: 12,
      utilityDefault: 55,
      utilityMin: 45,
      ratePerKm: 0,
      hoursPerDay: 9,
      efficiency: 0.85,
      equipmentPercentageMO: 4,
    };
  }

  try {
    const stored = localStorage.getItem('settings');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error cargando configuración:', error);
  }

  return {
    ggDefault: 12,
    utilityDefault: 55,
    utilityMin: 45,
    ratePerKm: 0,
    hoursPerDay: 9,
    efficiency: 0.85,
    equipmentPercentageMO: 4,
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem('settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error guardando configuración:', error);
    throw error;
  }
}

