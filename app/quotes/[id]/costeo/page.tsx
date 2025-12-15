'use client';

// Página de Costeo de Cotización
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getQuoteById, updateQuote as updateQuoteFirebase } from '@/firebase/quotes';
import { Quote, QuoteTotals } from '@/types';
import { useQuote } from '@/hooks/useQuote';
import SectionMO from '@/components/quote/costeo/SectionMO';
import SectionMaterials from '@/components/quote/costeo/SectionMaterials';
import SectionEquipment from '@/components/quote/costeo/SectionEquipment';
import SectionLogistics from '@/components/quote/costeo/SectionLogistics';
import SectionIndirects from '@/components/quote/costeo/SectionIndirects';
import ResumenEjecutivo from '@/components/quote/costeo/ResumenEjecutivo';
import SectionGGUtilidad from '@/components/quote/costeo/SectionGGUtilidad';
import SectionContingencia from '@/components/quote/costeo/SectionContingencia';
import Button from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { getSettings } from '@/firebase/catalogs';
import { Settings } from '@/types';
import { 
  ArrowLeftIcon, 
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function CosteoPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings | null>(null);
  
  const {
    quote,
    totals,
    updateMOItems,
    updateMaterialItems,
    updateEquipmentItems,
    updateLogistics,
    updateIndirects,
    toggleContingency,
    updateQuote,
  } = useQuote();

  useEffect(() => {
    loadQuote();
    loadSettings();
  }, [quoteId]);

  const loadQuote = async () => {
    try {
      const quoteData = await getQuoteById(quoteId);
      if (quoteData) {
        // Si no tiene totales o le faltan los nuevos campos de IVA, recalcular
        if (!quoteData.totals || !('precioNeto' in quoteData.totals) || !quoteData.totals.iva || !quoteData.totals.totalConIva) {
          const { calculateQuoteTotals } = await import('@/utils/calculations/quoteTotals');
          quoteData.totals = calculateQuoteTotals(quoteData) as any as typeof quoteData.totals;
        }
        updateQuote(quoteData);
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

  const loadSettings = async () => {
    try {
      const settingsData = await getSettings();
      setSettings(settingsData);
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  };

  const handleSave = async () => {
    if (!quote.id) return;

    try {
      await updateQuoteFirebase(quote.id, {
        ...quote,
        totals,
        updatedAt: new Date(),
      } as Quote);
      alert('Costeo guardado exitosamente');
      // Opción: redirigir a items o dejar que el usuario decida
      if (confirm('¿Deseas configurar los items de cotización ahora?')) {
        router.push(`/quotes/${quote.id}/items`);
      } else {
        router.push(`/quotes/${quote.id}`);
      }
    } catch (error) {
      console.error('Error guardando cotización:', error);
      alert('Error al guardar la cotización');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SkeletonCard className="h-24 mb-6" />
          <SkeletonCard className="mb-6" />
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!quote.id) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Cotización no encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 animate-slide-down">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Costeo de Cotización</h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <DocumentTextIcon className="w-4 h-4" />
                {quote.projectName}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => router.push(`/quotes/${quote.id}/items`)}>
                Items de Cotización
              </Button>
              <Button variant="outline" onClick={() => router.push(`/quotes/${quote.id}`)}>
                Ver Cotización
              </Button>
              <Button icon={<CheckCircleIcon className="w-5 h-5" />} iconPosition="left" onClick={handleSave}>
                Guardar Costeo
              </Button>
            </div>
          </div>
        </div>

        {/* Resumen Ejecutivo - Siempre visible */}
        {totals && (
          <div className="mb-6 animate-fade-in">
            <ResumenEjecutivo totals={totals as unknown as QuoteTotals} />
          </div>
        )}

        {/* Secciones de Costeo */}
        <div className="space-y-6">
        <SectionMO
          items={quote.itemsMO || []}
          onChange={updateMOItems}
          hoursPerDay={settings?.hoursPerDay}
          efficiency={settings?.efficiency}
        />

        <SectionMaterials
          items={quote.itemsMaterials || []}
          onChange={updateMaterialItems}
        />

        <SectionEquipment
          items={quote.itemsEquipment || []}
          onChange={updateEquipmentItems}
          moTotal={totals ? quote.itemsMO?.reduce((sum, item) => sum + item.subtotal, 0) || 0 : 0}
          equipmentPercentageMO={settings?.equipmentPercentageMO}
        />

        <SectionLogistics
          logistics={quote.itemsLogistics || { mode: 'km', subtotal: 0 }}
          onChange={updateLogistics}
          ratePerKm={settings?.ratePerKm}
        />

        <SectionIndirects
          items={quote.itemsIndirects || []}
          onChange={updateIndirects}
        />

        <SectionContingencia
          items={quote.contingencyItems || []}
          onChange={(items) => updateQuote({ contingencyItems: items })}
        />

        <SectionGGUtilidad
          ggPercentage={quote.ggPercentage || 12}
          utilityPercentage={quote.utilityPercentage || 55}
          utilityMin={settings?.utilityMin}
          onChange={(gg, utility) => updateQuote({ ggPercentage: gg, utilityPercentage: utility })}
        />
      </div>

        {/* Botones de acción */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex justify-end gap-3 animate-fade-in">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Cancelar
          </Button>
          <Button icon={<CheckCircleIcon className="w-5 h-5" />} iconPosition="left" onClick={handleSave}>
            Guardar Cotización
          </Button>
        </div>
      </div>
    </div>
  );
}

