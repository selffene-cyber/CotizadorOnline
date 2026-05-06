import { Quote, QuoteStatus } from '@/types';
import { api } from '@/lib/api-client';

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
    quoteItems: typeof row.quote_items === 'string' ? JSON.parse(row.quote_items) : (row.quote_items || []),
    costingReferences: typeof row.costing_references === 'string' ? JSON.parse(row.costing_references) : (row.costing_references || []),
    utilityPercentage: row.utility_percentage,
    totals: typeof row.totals === 'string' ? JSON.parse(row.totals) : row.totals,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    createdBy: row.created_by,
  };
}

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

export async function createQuote(quoteData: Omit<Quote, 'id'>, tenantId?: string): Promise<string> {
  const data = await api.quotes.create(toRow(quoteData), tenantId);
  return data.quote.id;
}

export async function getQuoteById(quoteId: string, tenantId?: string): Promise<Quote | null> {
  try {
    const data = await api.quotes.getById(quoteId, tenantId);
    return data.quote ? toQuote(data.quote) : null;
  } catch {
    return null;
  }
}

export async function getAllQuotes(tenantId?: string): Promise<Quote[]> {
  try {
    const data = await api.quotes.getAll(tenantId);
    return (data.quotes || []).map(toQuote);
  } catch {
    return [];
  }
}

export async function getQuotesByStatus(status: QuoteStatus): Promise<Quote[]> {
  try {
    const data = await api.quotes.getAll(undefined, status);
    return (data.quotes || []).map(toQuote);
  } catch {
    return [];
  }
}

export async function getQuotesByClient(clientId: string): Promise<Quote[]> {
  try {
    const data = await api.quotes.getAll(undefined, undefined, clientId);
    return (data.quotes || []).map(toQuote);
  } catch {
    return [];
  }
}

export async function getQuoteVersions(parentQuoteId: string): Promise<Quote[]> {
  try {
    const all = await getAllQuotes();
    return all.filter(q => q.parentQuoteId === parentQuoteId);
  } catch {
    return [];
  }
}

export async function updateQuote(quoteId: string, quoteData: Partial<Quote>): Promise<void> {
  await api.quotes.update(quoteId, toRow(quoteData));
}

export async function deleteQuote(quoteId: string): Promise<void> {
  await api.quotes.delete(quoteId);
}

export async function duplicateQuote(quoteId: string): Promise<string> {
  const data = await api.quotes.duplicate(quoteId);
  return data.quote.id;
}