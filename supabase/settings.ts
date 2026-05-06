import { CompanySettings } from '@/types';
import { api } from '@/lib/api-client';

function toSettings(row: any): CompanySettings {
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
  try {
    const data = await api.settings.get(tenantId);
    return data.settings ? toSettings(data.settings) : null;
  } catch {
    return null;
  }
}

export async function saveCompanySettings(settings: CompanySettings, tenantId?: string): Promise<void> {
  await api.settings.save(toRow(settings), tenantId);
}