// Mock de quotes.ts para desarrollo local
import { Quote } from '@/types';
import { mockQuotes } from '@/lib/mock-storage';

function convertDates(quote: any): Quote {
  return {
    ...quote,
    createdAt: quote.createdAt ? new Date(quote.createdAt) : undefined,
    updatedAt: quote.updatedAt ? new Date(quote.updatedAt) : undefined,
  } as Quote;
}

// Función para obtener el siguiente número correlativo
function getNextQuoteNumber(): number {
  const allQuotes = mockQuotes.getAll();
  if (allQuotes.length === 0) {
    return 1;
  }
  
  // Obtener el máximo número de cotización existente
  const maxNumber = allQuotes.reduce((max, quote) => {
    const quoteNum = quote.quoteNumber || 0;
    return quoteNum > max ? quoteNum : max;
  }, 0);
  
  return maxNumber + 1;
}

export async function createQuote(quoteData: Omit<Quote, 'id'>): Promise<string> {
  // Si no tiene número asignado, asignar el siguiente correlativo
  const quoteWithNumber = {
    ...quoteData,
    quoteNumber: quoteData.quoteNumber || getNextQuoteNumber(),
  };
  
  return mockQuotes.create(quoteWithNumber);
}

export async function getQuoteById(quoteId: string): Promise<Quote | null> {
  const quote = mockQuotes.getById(quoteId);
  return quote ? convertDates(quote) : null;
}

export async function getAllQuotes(): Promise<Quote[]> {
  const allQuotes = mockQuotes.getAll();
  
  // Asignar números a cotizaciones que no los tengan
  const quotesWithoutNumber = allQuotes.filter(q => !q.quoteNumber);
  
  if (quotesWithoutNumber.length > 0) {
    // Ordenar por fecha de creación (más antiguas primero)
    quotesWithoutNumber.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });
    
    // Obtener el máximo número existente
    const maxNumber = allQuotes.reduce((max, quote) => {
      const quoteNum = quote.quoteNumber || 0;
      return quoteNum > max ? quoteNum : max;
    }, 0);
    
    // Asignar números correlativos empezando desde maxNumber + 1
    quotesWithoutNumber.forEach((quote, index) => {
      const newNumber = maxNumber + index + 1;
      mockQuotes.update(quote.id, { quoteNumber: newNumber });
    });
  }
  
  return mockQuotes.getAll().map(convertDates);
}

export async function getQuotesByStatus(status: Quote['status']): Promise<Quote[]> {
  return mockQuotes.getAll()
    .filter(q => q.status === status)
    .map(convertDates);
}

export async function getQuotesByClient(clientId: string): Promise<Quote[]> {
  return mockQuotes.getAll()
    .filter(q => q.clientId === clientId)
    .map(convertDates);
}

export async function getQuoteVersions(parentQuoteId: string): Promise<Quote[]> {
  return mockQuotes.getAll()
    .filter(q => q.parentQuoteId === parentQuoteId)
    .map(convertDates);
}

export async function updateQuote(quoteId: string, quoteData: Partial<Quote>): Promise<void> {
  mockQuotes.update(quoteId, quoteData);
}

export async function deleteQuote(quoteId: string): Promise<void> {
  mockQuotes.delete(quoteId);
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


