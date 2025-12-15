// Hook para manejo de estado de cotización
import { useState, useEffect } from 'react';
import { Quote, Client } from '@/types';
import { calculateQuoteTotals } from '@/utils/calculations/quoteTotals';
import { getClientById } from '@/firebase/clients';

const initialQuote: Partial<Quote> = {
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
  const [quote, setQuote] = useState<Partial<Quote>>(() => {
    if (initialQuoteData) {
      // Si hay datos iniciales, calcular totales
      try {
        const calculatedTotals = calculateQuoteTotals(initialQuoteData as Quote);
        return { ...initialQuoteData, totals: calculatedTotals };
      } catch {
        return initialQuoteData;
      }
    }
    return initialQuote;
  });
  const [client, setClient] = useState<Client | null>(null);
  const [totals, setTotals] = useState(quote.totals);
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
  const updateQuote = (updates: Partial<Quote>) => {
    const updated = { ...quote, ...updates };
    setQuote(updated);
    
    // Recalcular totales siempre (esto asegura que siempre haya precioNeto, iva, totalConIva)
    try {
      const calculatedTotals = calculateQuoteTotals(updated as Quote);
      setTotals(calculatedTotals);
      updated.totals = calculatedTotals;
    } catch (error) {
      console.error('Error calculando totales:', error);
    }
  };

  // Actualizar items de MO
  const updateMOItems = (items: Quote['itemsMO']) => {
    const updated = { ...quote, itemsMO: items };
    setQuote(updated);
    try {
      const calculatedTotals = calculateQuoteTotals(updated as Quote);
      setTotals(calculatedTotals);
      updated.totals = calculatedTotals;
    } catch (error) {
      console.error('Error calculando totales:', error);
    }
  };

  // Actualizar items de Materiales
  const updateMaterialItems = (items: Quote['itemsMaterials']) => {
    const updated = { ...quote, itemsMaterials: items };
    setQuote(updated);
    try {
      const calculatedTotals = calculateQuoteTotals(updated as Quote);
      setTotals(calculatedTotals);
      updated.totals = calculatedTotals;
    } catch (error) {
      console.error('Error calculando totales:', error);
    }
  };

  // Actualizar items de Equipos
  const updateEquipmentItems = (items: Quote['itemsEquipment']) => {
    const updated = { ...quote, itemsEquipment: items };
    setQuote(updated);
    try {
      const calculatedTotals = calculateQuoteTotals(updated as Quote);
      setTotals(calculatedTotals);
      updated.totals = calculatedTotals;
    } catch (error) {
      console.error('Error calculando totales:', error);
    }
  };

  // Actualizar logística
  const updateLogistics = (logistics: Quote['itemsLogistics']) => {
    const updated = { ...quote, itemsLogistics: logistics };
    setQuote(updated);
    try {
      const calculatedTotals = calculateQuoteTotals(updated as Quote);
      setTotals(calculatedTotals);
      updated.totals = calculatedTotals;
    } catch (error) {
      console.error('Error calculando totales:', error);
    }
  };

  // Actualizar indirectos
  const updateIndirects = (indirects: Quote['itemsIndirects']) => {
    const updated = { ...quote, itemsIndirects: indirects };
    setQuote(updated);
    try {
      const calculatedTotals = calculateQuoteTotals(updated as Quote);
      setTotals(calculatedTotals);
      updated.totals = calculatedTotals;
    } catch (error) {
      console.error('Error calculando totales:', error);
    }
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

