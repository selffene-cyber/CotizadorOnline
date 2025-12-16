// Helpers para manejo de Cotizaciones con Supabase
import { Quote, QuoteStatus } from '@/types';
import { supabase, hasValidSupabaseConfig } from './config';

// Función auxiliar para convertir de snake_case a camelCase
function toQuote(row: any): Quote {
  return {
    id: row.id,
    clientId: row.client_id,
    status: row.status as QuoteStatus,
    version: row.version,
    parentQuoteId: row.parent_quote_id,
    quoteNumber: row.quote_number,
    projectName: row.project_name,
    location: row.location,
    region: row.region,
    city: row.city,
    type: row.type,
    modality: row.modality,
    scope: row.scope || '',
    exclusions: row.exclusions || '',
    assumptions: row.assumptions || '',
    executionDeadline: row.execution_deadline || 30,
    validity: row.validity || 30,
    paymentTerms: row.payment_terms || '',
    warranties: row.warranties || '',
    quoteItems: row.quote_items || [],
    costingReferences: row.costing_references || [],
    utilityPercentage: row.utility_percentage,
    totals: row.totals,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    createdBy: row.created_by,
  };
}

// Función auxiliar para convertir de camelCase a snake_case
function toRow(quote: Partial<Quote>): any {
  const row: any = {};
  if (quote.clientId !== undefined) row.client_id = quote.clientId;
  if (quote.status !== undefined) row.status = quote.status;
  if (quote.version !== undefined) row.version = quote.version;
  if (quote.parentQuoteId !== undefined) row.parent_quote_id = quote.parentQuoteId;
  if (quote.quoteNumber !== undefined) row.quote_number = quote.quoteNumber;
  if (quote.projectName !== undefined) row.project_name = quote.projectName;
  if (quote.location !== undefined) row.location = quote.location;
  if (quote.region !== undefined) row.region = quote.region;
  if (quote.city !== undefined) row.city = quote.city;
  if (quote.type !== undefined) row.type = quote.type;
  if (quote.modality !== undefined) row.modality = quote.modality;
  if (quote.scope !== undefined) row.scope = quote.scope;
  if (quote.exclusions !== undefined) row.exclusions = quote.exclusions;
  if (quote.assumptions !== undefined) row.assumptions = quote.assumptions;
  if (quote.executionDeadline !== undefined) row.execution_deadline = quote.executionDeadline;
  if (quote.validity !== undefined) row.validity = quote.validity;
  if (quote.paymentTerms !== undefined) row.payment_terms = quote.paymentTerms;
  if (quote.warranties !== undefined) row.warranties = quote.warranties;
  if (quote.quoteItems !== undefined) row.quote_items = quote.quoteItems;
  if (quote.costingReferences !== undefined) row.costing_references = quote.costingReferences;
  if (quote.utilityPercentage !== undefined) row.utility_percentage = quote.utilityPercentage;
  if (quote.totals !== undefined) row.totals = quote.totals;
  return row;
}

// Función para obtener el siguiente número correlativo
async function getNextQuoteNumber(): Promise<number> {
  if (!hasValidSupabaseConfig()) {
    return 1;
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('quote_number')
    .not('quote_number', 'is', null)
    .order('quote_number', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return 1;
  }

  return (data[0].quote_number || 0) + 1;
}

export async function createQuote(quoteData: Omit<Quote, 'id'>): Promise<string> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase no está configurado');
  }

  // Si no tiene número asignado, asignar el siguiente correlativo
  const quoteNumber = quoteData.quoteNumber || await getNextQuoteNumber();

  const { data, error } = await supabase
    .from('quotes')
    .insert({
      ...toRow(quoteData),
      quote_number: quoteNumber,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Error al crear cotización: ${error.message}`);
  }

  return data.id;
}

export async function getQuoteById(quoteId: string): Promise<Quote | null> {
  if (!hasValidSupabaseConfig()) {
    return null;
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .single();

  if (error || !data) {
    return null;
  }

  return toQuote(data);
}

export async function getAllQuotes(): Promise<Quote[]> {
  if (!hasValidSupabaseConfig()) {
    return [];
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(toQuote);
}

export async function getQuotesByStatus(status: QuoteStatus): Promise<Quote[]> {
  if (!hasValidSupabaseConfig()) {
    return [];
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(toQuote);
}

export async function getQuotesByClient(clientId: string): Promise<Quote[]> {
  if (!hasValidSupabaseConfig()) {
    return [];
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(toQuote);
}

export async function getQuoteVersions(parentQuoteId: string): Promise<Quote[]> {
  if (!hasValidSupabaseConfig()) {
    return [];
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('parent_quote_id', parentQuoteId)
    .order('version', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map(toQuote);
}

export async function updateQuote(quoteId: string, quoteData: Partial<Quote>): Promise<void> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase no está configurado');
  }

  const { error } = await supabase
    .from('quotes')
    .update(toRow(quoteData))
    .eq('id', quoteId);

  if (error) {
    throw new Error(`Error al actualizar cotización: ${error.message}`);
  }
}

export async function deleteQuote(quoteId: string): Promise<void> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase no está configurado');
  }

  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', quoteId);

  if (error) {
    throw new Error(`Error al eliminar cotización: ${error.message}`);
  }
}

export async function duplicateQuote(quoteId: string): Promise<string> {
  const original = await getQuoteById(quoteId);
  if (!original) {
    throw new Error('Cotización no encontrada');
  }

  const versions = await getQuoteVersions(original.id || quoteId);
  const nextVersion = versions.length > 0 
    ? Math.max(...versions.map(v => v.version)) + 1
    : original.version + 1;

  const newQuote: Omit<Quote, 'id'> = {
    ...original,
    version: nextVersion,
    parentQuoteId: original.id || quoteId,
    status: 'Borrador',
    quoteNumber: undefined, // Se asignará automáticamente el siguiente número
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return await createQuote(newQuote);
}

