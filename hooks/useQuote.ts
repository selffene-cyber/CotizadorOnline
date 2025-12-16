// Hook para manejo de estado de cotización
import { useState, useEffect } from 'react';
import { Quote, Client, Costing, QuoteTotals } from '@/types';
import { calculateQuoteTotals } from '@/utils/calculations/quoteTotals';
import { getClientById } from '@/firebase/clients';

const initialQuote: Partial<Quote & Costing> = {
  status: 'Borrador',
  version: 1,
  type: 'Fabricación',
  modality: 'Cerrado',
  projectName: '',
  location: '',
  scope: '',
  exclusions: '',
  assumptions: '',
  executionDeadline: 30,
  validity: 30,
  paymentTerms: '50% anticipo, 50% contra entrega',
  warranties: '90 días',
  itemsMO: [],
  itemsMaterials: [],
  itemsEquipment: [],
  itemsLogistics: {
    mode: 'km',
    subtotal: 0,
  },
  itemsIndirects: [],
  ggPercentage: 12,
  contingencyItems: [],
  utilityPercentage: 55,
  quoteItems: [],
};

export function useQuote(initialQuoteData?: Partial<Quote>) {
  const [quote, setQuote] = useState<Partial<Quote & Costing>>(() => {
    if (initialQuoteData) {
      // Si hay datos iniciales, calcular totales
      try {
        const calculatedTotals = calculateQuoteTotals(initialQuoteData as any);
        return { ...initialQuoteData, totals: calculatedTotals } as Partial<Quote & Costing>;
      } catch {
        return initialQuoteData as Partial<Quote & Costing>;
      }
    }
    return initialQuote;
  });
  const [client, setClient] = useState<Client | null>(null);
  const [totals, setTotals] = useState<QuoteTotals | undefined>(quote.totals as QuoteTotals | undefined);
  const [loading, setLoading] = useState(false);

  // Cargar datos del cliente si hay clientId
  useEffect(() => {
    if (quote.clientId && !client) {
      loadClient(quote.clientId);
    }
  }, [quote.clientId]);

  const loadClient = async (clientId: string) => {
    setLoading(true);
    try {
      const clientData = await getClientById(clientId);
      setClient(clientData);
    } catch (error) {
      console.error('Error cargando cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar cotización
  const updateQuote = (updates: Partial<Quote & Costing>) => {
    const updated = { ...quote, ...updates };
    
    // Recalcular totales siempre (esto asegura que siempre haya precioNeto, iva, totalConIva)
    try {
      const calculatedTotals = calculateQuoteTotals(updated as any);
      setTotals(calculatedTotals);
      (updated as any).totals = calculatedTotals;
    } catch (error) {
      console.error('Error calculando totales:', error);
    }
    
    setQuote(updated as Partial<Quote & Costing>);
  };

  // Actualizar items de MO
  const updateMOItems = (items: Costing['itemsMO']) => {
    const updated = { ...quote, itemsMO: items };
    try {
      const calculatedTotals = calculateQuoteTotals(updated as any);
      setTotals(calculatedTotals);
      (updated as any).totals = calculatedTotals;
    } catch (error) {
      console.error('Error calculando totales:', error);
    }
    setQuote(updated as Partial<Quote & Costing>);
  };

  // Actualizar items de Materiales
  const updateMaterialItems = (items: Costing['itemsMaterials']) => {
    const updated = { ...quote, itemsMaterials: items };
    try {
      const calculatedTotals = calculateQuoteTotals(updated as any);
      setTotals(calculatedTotals);
      (updated as any).totals = calculatedTotals;
    } catch (error) {
      console.error('Error calculando totales:', error);
    }
    setQuote(updated as Partial<Quote & Costing>);
  };

  // Actualizar items de Equipos
  const updateEquipmentItems = (items: Costing['itemsEquipment']) => {
    const updated = { ...quote, itemsEquipment: items };
    try {
      const calculatedTotals = calculateQuoteTotals(updated as any);
      setTotals(calculatedTotals);
      (updated as any).totals = calculatedTotals;
    } catch (error) {
      console.error('Error calculando totales:', error);
    }
    setQuote(updated as Partial<Quote & Costing>);
  };

  // Actualizar logística
  const updateLogistics = (logistics: Costing['itemsLogistics']) => {
    const updated = { ...quote, itemsLogistics: logistics };
    try {
      const calculatedTotals = calculateQuoteTotals(updated as any);
      setTotals(calculatedTotals);
      (updated as any).totals = calculatedTotals;
    } catch (error) {
      console.error('Error calculando totales:', error);
    }
    setQuote(updated as Partial<Quote & Costing>);
  };

  // Actualizar indirectos
  const updateIndirects = (indirects: Costing['itemsIndirects']) => {
    const updated = { ...quote, itemsIndirects: indirects };
    try {
      const calculatedTotals = calculateQuoteTotals(updated as any);
      setTotals(calculatedTotals);
      (updated as any).totals = calculatedTotals;
    } catch (error) {
      console.error('Error calculando totales:', error);
    }
    setQuote(updated as Partial<Quote & Costing>);
  };

  // Agregar/remover contingencia
  const toggleContingency = (riskName: string, percentage: number) => {
    const current = quote.contingencyItems || [];
    const exists = current.findIndex(item => item.name === riskName);
    
    if (exists >= 0) {
      updateQuote({
        contingencyItems: current.filter(item => item.name !== riskName),
      });
    } else {
      updateQuote({
        contingencyItems: [...current, { name: riskName, percentage }],
      });
    }
  };

  return {
    quote,
    client,
    totals,
    loading,
    updateQuote,
    updateMOItems,
    updateMaterialItems,
    updateEquipmentItems,
    updateLogistics,
    updateIndirects,
    toggleContingency,
  };
}

