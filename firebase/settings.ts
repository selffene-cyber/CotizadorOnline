// Funciones para manejar configuración de empresa
import { CompanySettings } from '@/types';
import { mockCatalogs } from '@/lib/mock-storage';

const COMPANY_SETTINGS_KEY = 'company-settings';

export async function getCompanySettings(): Promise<CompanySettings | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(COMPANY_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error cargando configuración de empresa:', error);
  }

  return null;
}

export async function saveCompanySettings(settings: CompanySettings): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(COMPANY_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error guardando configuración de empresa:', error);
    throw error;
  }
}


