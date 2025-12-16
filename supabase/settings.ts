// Helpers para configuración de empresa con Supabase
import { CompanySettings } from '@/types';
import { supabase, hasValidSupabaseConfig } from './config';

function toSettings(row: any): CompanySettings {
  // Mapear desde la base de datos (solo campos básicos por ahora)
  // Los demás campos se pueden agregar después
  return {
    companyName: row.company_name || '',
    companyRUT: row.rut || '',
    companyGiro: '',
    companyAddress: row.address || '',
    companyCity: '',
    companyRegion: '',
    companyPhone: row.phone || '',
    companyEmail: row.email || '',
    companyWebsite: row.website || '',
    companySocialMedia: '',
    quoterName: '',
    quoterPosition: '',
    quoterEmail: '',
    quoterPhone: '',
    bankName: '',
    bankAccountType: '',
    bankAccountNumber: '',
    bankAccountRUT: '',
    companyLogo: row.logo_url || '',
  };
}

function toRow(settings: Partial<CompanySettings>): any {
  const row: any = {};
  if (settings.companyName !== undefined) row.company_name = settings.companyName;
  if (settings.companyRUT !== undefined) row.rut = settings.companyRUT;
  if (settings.companyAddress !== undefined) row.address = settings.companyAddress;
  if (settings.companyPhone !== undefined) row.phone = settings.companyPhone;
  if (settings.companyEmail !== undefined) row.email = settings.companyEmail;
  if (settings.companyWebsite !== undefined) row.website = settings.companyWebsite;
  if (settings.companyLogo !== undefined) row.logo_url = settings.companyLogo;
  return row;
}

export async function getCompanySettings(): Promise<CompanySettings | null> {
  if (!hasValidSupabaseConfig) {
    return null;
  }

  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return toSettings(data);
}

export async function saveCompanySettings(settings: CompanySettings): Promise<void> {
  if (!hasValidSupabaseConfig) {
    throw new Error('Supabase no está configurado');
  }

  // Verificar si ya existe
  const existing = await getCompanySettings();

  if (existing) {
    // Actualizar (obtener el primer registro)
    const { data: firstRecord } = await supabase
      .from('company_settings')
      .select('id')
      .limit(1)
      .single();
    
    if (firstRecord) {
      const { error } = await supabase
        .from('company_settings')
        .update(toRow(settings))
        .eq('id', firstRecord.id);

      if (error) {
        throw new Error(`Error al actualizar configuración: ${error.message}`);
      }
    }
  } else {
    // Crear nuevo
    const { error } = await supabase
      .from('company_settings')
      .insert(toRow(settings));

    if (error) {
      throw new Error(`Error al guardar configuración: ${error.message}`);
    }
  }
}
