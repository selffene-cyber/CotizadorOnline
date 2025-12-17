// Helpers para configuración de empresa con Supabase
import { CompanySettings } from '@/types';
import { supabase, hasValidSupabaseConfig, createSupabaseClient } from './config';

// Helper para obtener el cliente correcto
function getSupabaseClient() {
  return typeof window !== 'undefined' ? createSupabaseClient() : supabase;
}

function toSettings(row: any): CompanySettings {
  // Mapear todos los campos desde la base de datos
  return {
    companyName: row.company_name || '',
    companyRUT: row.rut || '',
    companyGiro: row.company_giro || '',
    companyAddress: row.address || '',
    companyCity: row.company_city || '',
    companyRegion: row.company_region || '',
    companyPhone: row.phone || '',
    companyEmail: row.email || '',
    companyWebsite: row.website || '',
    companySocialMedia: row.company_social_media || '',
    quoterName: row.quoter_name || '',
    quoterPosition: row.quoter_position || '',
    quoterEmail: row.quoter_email || '',
    quoterPhone: row.quoter_phone || '',
    bankAccountName: row.bank_account_name || '',
    bankAccountRUT: row.bank_account_rut || '',
    bankName: row.bank_name || '',
    bankAccountType: row.bank_account_type || '',
    bankAccountNumber: row.bank_account_number || '',
    bankEmail: row.bank_email || '',
    companyLogo: row.logo_url || '',
  };
}

function toRow(settings: Partial<CompanySettings>): any {
  const row: any = {};
  if (settings.companyName !== undefined) row.company_name = settings.companyName;
  if (settings.companyRUT !== undefined) row.rut = settings.companyRUT;
  if (settings.companyGiro !== undefined) row.company_giro = settings.companyGiro;
  if (settings.companyAddress !== undefined) row.address = settings.companyAddress;
  if (settings.companyCity !== undefined) row.company_city = settings.companyCity;
  if (settings.companyRegion !== undefined) row.company_region = settings.companyRegion;
  if (settings.companyPhone !== undefined) row.phone = settings.companyPhone;
  if (settings.companyEmail !== undefined) row.email = settings.companyEmail;
  if (settings.companyWebsite !== undefined) row.website = settings.companyWebsite;
  if (settings.companySocialMedia !== undefined) row.company_social_media = settings.companySocialMedia;
  if (settings.quoterName !== undefined) row.quoter_name = settings.quoterName;
  if (settings.quoterPosition !== undefined) row.quoter_position = settings.quoterPosition;
  if (settings.quoterEmail !== undefined) row.quoter_email = settings.quoterEmail;
  if (settings.quoterPhone !== undefined) row.quoter_phone = settings.quoterPhone;
  if (settings.bankAccountName !== undefined) row.bank_account_name = settings.bankAccountName;
  if (settings.bankAccountRUT !== undefined) row.bank_account_rut = settings.bankAccountRUT;
  if (settings.bankName !== undefined) row.bank_name = settings.bankName;
  if (settings.bankAccountType !== undefined) row.bank_account_type = settings.bankAccountType;
  if (settings.bankAccountNumber !== undefined) row.bank_account_number = settings.bankAccountNumber;
  if (settings.bankEmail !== undefined) row.bank_email = settings.bankEmail;
  if (settings.companyLogo !== undefined) row.logo_url = settings.companyLogo;
  return row;
}

export async function getCompanySettings(tenantId?: string): Promise<CompanySettings | null> {
  if (!hasValidSupabaseConfig()) {
    return null;
  }

  const supabaseClient = getSupabaseClient();
  let query = supabaseClient
    .from('company_settings')
    .select('*');

  // Filtrar por tenant_id si se proporciona
  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error || !data) {
    return null;
  }

  return toSettings(data);
}

export async function saveCompanySettings(settings: CompanySettings, tenantId?: string): Promise<void> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase no está configurado');
  }

  const supabaseClient = getSupabaseClient();
  
  // Obtener el usuario actual
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Usuario no autenticado. Debes iniciar sesión para guardar configuración.');
  }

  // Obtener tenant_id si no se proporciona
  let finalTenantId = tenantId;
  
  if (!finalTenantId) {
    // Buscar el tenant_id del usuario desde memberships
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

  // Verificar si ya existe configuración para este tenant
  const existing = await getCompanySettings(finalTenantId);

  const rowData = toRow(settings);
  rowData.tenant_id = finalTenantId;

  if (existing) {
    // Actualizar
    const { error } = await supabaseClient
      .from('company_settings')
      .update(rowData)
      .eq('tenant_id', finalTenantId);

    if (error) {
      console.error('[saveCompanySettings] Error actualizando:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw new Error(`Error al actualizar configuración: ${error.message || 'Error desconocido'}`);
    }
  } else {
    // Crear nuevo
    const { error } = await supabaseClient
      .from('company_settings')
      .insert(rowData)
      .select('id')
      .single();

    if (error) {
      console.error('[saveCompanySettings] Error insertando:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw new Error(`Error al guardar configuración: ${error.message || 'Error desconocido'}`);
    }
  }
}
