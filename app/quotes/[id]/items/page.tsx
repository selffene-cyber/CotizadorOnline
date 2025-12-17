'use client';

// Página para gestionar items de cotización
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Quote, QuoteLineItem, Costing } from '@/types';
import { getQuoteById, updateQuote } from '@/supabase/quotes';
import { getClientById } from '@/supabase/clients';
import QuoteItemsEditor from '@/components/quote/QuoteItemsEditor';
import Button from '@/components/ui/Button';
import SelectCostingModal from '@/components/quote/SelectCostingModal';

export default function QuoteItemsPage() {
  const router = useRouter();
  const params = useParams();
  const quoteId = params.id as string;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<QuoteLineItem[]>([]);
  const [showCostingModal, setShowCostingModal] = useState(false);
  
  // Calcular totales locales para mostrar en pantalla
  const totalCost = items.reduce((sum, item) => sum + (item.cost || 0) * item.quantity, 0);
  const totalMargin = items.reduce((sum, item) => sum + (item.margin || 0) * item.quantity, 0);
  const totalSalePrice = items.reduce((sum, item) => sum + item.subtotal, 0);
  const weightedMarginPct = totalCost > 0 ? (totalMargin / totalCost) * 100 : 0;

  useEffect(() => {
    loadData();
  }, [quoteId]);

  const loadData = async () => {
    try {
      const quoteData = await getQuoteById(quoteId);
      if (quoteData) {
        setQuote(quoteData);
        // Asegurar que todos los items tengan número correlativo
        const itemsWithNumbers = (quoteData.quoteItems || []).map((item, idx) => ({
          ...item,
          itemNumber: item.itemNumber || idx + 1,
        }));
        setItems(itemsWithNumbers);
        if (quoteData.clientId) {
          const clientData = await getClientById(quoteData.clientId);
          setClient(clientData);
        }
      } else {
        alert('Cotización no encontrada');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error cargando cotización:', error);
      alert('Error al cargar la cotización');
    } finally {
      setLoading(false);
    }
  };

  const calculateQuoteTotals = async (quoteItems: QuoteLineItem[], costingRefs: string[]) => {
    const subtotal = quoteItems.reduce((sum, item) => sum + item.subtotal, 0);
    const iva = Math.round(subtotal * 0.19);
    const totalConIva = subtotal + iva;
    
    // Calcular totales de costeo desde los costings asociados
    let costoDirecto = 0;
    let indirectosObra = 0;
    let gastosGenerales = 0;
    let contingencia = 0;
    let costoTotal = 0;
    let margenBruto = 0;
    
    // Si hay costeos asociados, sumar sus totales
    if (costingRefs && costingRefs.length > 0) {
      const { getCostingById } = await import('@/supabase/costings');
      for (const costingId of costingRefs) {
        try {
          const costing = await getCostingById(costingId);
          if (costing && costing.totals) {
            costoDirecto += costing.totals.costoDirecto || 0;
            indirectosObra += costing.totals.indirectosObra || 0;
            gastosGenerales += costing.totals.gastosGenerales || 0;
            contingencia += costing.totals.contingencia || 0;
            costoTotal += costing.totals.costoTotal || 0;
            margenBruto += (costing.totals.margenBruto || 0);
          }
        } catch (err) {
          console.error(`Error cargando costeo ${costingId}:`, err);
        }
      }
    }
    
    // Para items agregados manualmente (sin costeo), usar el costo del item
    for (const item of quoteItems) {
      if (!item.costingId) {
        const itemCosto = (item.cost || 0) * item.quantity;
        costoDirecto += itemCosto;
        costoTotal += itemCosto;
        margenBruto += (item.margin || 0) * item.quantity;
      }
    }
    
    // Calcular margen porcentual
    const margenPct = costoTotal > 0 ? (margenBruto / costoTotal) * 100 : 0;
    
    return {
      subtotal,
      iva,
      totalConIva,
      costoDirecto,
      indirectosObra,
      gastosGenerales,
      contingencia,
      costoTotal,
      precioNeto: subtotal,
      precioVenta: subtotal,
      margenBruto,
      margenPct,
      subtotalCosto: costoDirecto + indirectosObra,
      base: (costoDirecto + indirectosObra) + gastosGenerales,
      markup: costoTotal > 0 ? (subtotal / costoTotal) - 1 : 0,
    };
  };

  const handleSave = async () => {
    if (!quote) return;
    
    setSaving(true);
    try {
      const costingReferences = Array.from(
        new Set(items.filter(item => item.costingId).map(item => item.costingId!))
      );
      
      const totals = await calculateQuoteTotals(items, costingReferences);
      
      await updateQuote(quoteId, {
        ...quote,
        quoteItems: items,
        totals,
        costingReferences,
        updatedAt: new Date(),
      });
      alert('Items de cotización guardados exitosamente');
      router.push(`/quotes/${quoteId}`);
    } catch (error) {
      console.error('Error guardando items:', error);
      alert('Error al guardar los items');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectCosting = (costing: Costing) => {
    // Agregar un item desde el costeo seleccionado
    if (!costing.totals || !costing.totals.precioNeto) {
      alert('El costeo seleccionado no tiene un precio válido');
      return;
    }

    // Calcular número correlativo (máximo itemNumber + 1 o items.length + 1)
    const maxItemNumber = items.length > 0 
      ? Math.max(...items.map(item => item.itemNumber || 0), items.length)
      : 0;
    const itemNumber = maxItemNumber + 1;

    const precioNeto = costing.totals.precioNeto;
    const costoTotal = costing.totals.costoTotal || 0;
    const margin = precioNeto - costoTotal;
    const marginPct = costoTotal > 0 ? (margin / costoTotal) * 100 : 0;

    const newItem: QuoteLineItem = {
      id: `item_${costing.id}_${Date.now()}`,
      itemNumber,
      codigoInterno: '', // Se puede editar después
      description: costing.name,
      quantity: 1,
      unit: 'un', // Unidad (en lugar de LS para Chile)
      cost: costoTotal, // Costo total del costeo
      margin: margin, // Margen calculado
      marginPct: marginPct, // Margen porcentual
      unitPrice: precioNeto, // Precio neto del costeo
      subtotal: precioNeto,
      costingId: costing.id, // Referencia al costeo
    };

    setItems([...items, newItem]);
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="p-6 text-center text-gray-500">
        Cotización no encontrada
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Items de Cotización</h1>
          <p className="text-gray-600 mt-1">{quote.projectName}</p>
          {client && (
            <p className="text-gray-600">{client.name}</p>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => router.push(`/quotes/${quoteId}`)}
            variant="outline"
          >
            Ver Cotización
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Items'}
          </Button>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-yellow-800">
          <strong>Nota:</strong> Los items de cotización son lo que se mostrará al cliente en el PDF. 
          Puedes agregar items manualmente o generarlos desde el costeo realizado previamente.
        </p>
      </div>

      {/* Resumen de Totales */}
      {items.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Subtotal (Precio Neto)</p>
              <p className="text-lg font-bold text-gray-900">
                {new Intl.NumberFormat('es-CL', {
                  style: 'currency',
                  currency: 'CLP',
                  minimumFractionDigits: 0,
                }).format(totalSalePrice)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">IVA (19%)</p>
              <p className="text-lg font-bold text-blue-700">
                {new Intl.NumberFormat('es-CL', {
                  style: 'currency',
                  currency: 'CLP',
                  minimumFractionDigits: 0,
                }).format(Math.round(totalSalePrice * 0.19))}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total con IVA</p>
              <p className="text-lg font-bold text-green-700">
                {new Intl.NumberFormat('es-CL', {
                  style: 'currency',
                  currency: 'CLP',
                  minimumFractionDigits: 0,
                }).format(totalSalePrice + Math.round(totalSalePrice * 0.19))}
              </p>
            </div>
          </div>
        </div>
      )}

      <QuoteItemsEditor
        items={items}
        onChange={setItems}
        onAddFromCosting={() => setShowCostingModal(true)}
      />

      {showCostingModal && (
        <SelectCostingModal
          onSelect={handleSelectCosting}
          onClose={() => setShowCostingModal(false)}
        />
      )}
    </div>
  );
}

