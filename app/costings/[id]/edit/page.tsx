'use client';

// Página de Edición de Costeo
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCostingById, updateCosting } from '@/firebase/costings';
import { Costing } from '@/types';
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
import { getSettings } from '@/firebase/catalogs';
import { Settings } from '@/types';

export default function EditCostingPage() {
  const params = useParams();
  const router = useRouter();
  const costingId = params.id as string;
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
    loadCosting();
    loadSettings();
  }, [costingId]);

  const loadCosting = async () => {
    try {
      const costingData = await getCostingById(costingId);
      if (costingData) {
        // Convertir costing a formato compatible con useQuote
        const quoteData = {
          ...costingData,
          id: costingData.id,
          projectName: costingData.name,
          scope: costingData.description || '',
          exclusions: '',
          assumptions: '',
          executionDeadline: 30,
          validity: 30,
          paymentTerms: '',
          warranties: '',
          clientId: '',
          status: 'Borrador' as const,
          version: 1,
          quoteItems: [],
        };
        updateQuote(quoteData);
      } else {
        alert('Costeo no encontrado');
        router.push('/costings');
      }
    } catch (error) {
      console.error('Error cargando costeo:', error);
      alert('Error al cargar el costeo');
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
      // Type assertion: quote contiene propiedades de Costing porque viene de useQuote con datos de Costing
      // Cuando se carga un Costing, se hace spread que incluye todas las propiedades de Costing
      const quoteWithCostingData = quote as Partial<Costing & typeof quote>;
      
      await updateCosting(quote.id, {
        name: quote.projectName || '',
        description: quote.scope || '',
        type: quoteWithCostingData.type as ProjectType,
        modality: quoteWithCostingData.modality as Modality,
        itemsMO: (quoteWithCostingData.itemsMO || []) as QuoteItemMO[],
        itemsMaterials: (quoteWithCostingData.itemsMaterials || []) as QuoteItemMaterial[],
        itemsEquipment: (quoteWithCostingData.itemsEquipment || []) as QuoteItemEquipment[],
        itemsLogistics: (quoteWithCostingData.itemsLogistics || { mode: 'km', subtotal: 0 }) as QuoteItemLogistics,
        itemsIndirects: (quoteWithCostingData.itemsIndirects || []) as QuoteItemIndirect[],
        ggPercentage: quoteWithCostingData.ggPercentage || 12,
        contingencyItems: (quoteWithCostingData.contingencyItems || []) as ContingencyItem[],
        utilityPercentage: quote.utilityPercentage || 55,
        totals,
        updatedAt: new Date(),
      } as Partial<Costing>);
      alert('Costeo guardado exitosamente');
      router.push(`/costings/${quote.id}`);
    } catch (error) {
      console.error('Error guardando costeo:', error);
      alert('Error al guardar el costeo');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando costeo...</p>
        </div>
      </div>
    );
  }

  if (!quote.id) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Costeo no encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Costeo</h1>
          <p className="text-gray-600 mt-1">{quote.projectName}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push(`/costings/${quote.id}`)}>
            Ver Costeo
          </Button>
          <Button onClick={handleSave}>Guardar Costeo</Button>
        </div>
      </div>

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
          moTotal={totals?.costoDirecto || 0}
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

      {totals && <ResumenEjecutivo totals={totals} />}

      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button variant="outline" onClick={() => router.push('/costings')}>
          Cancelar
        </Button>
        <Button onClick={handleSave}>
          Guardar Costeo
        </Button>
      </div>
    </div>
  );
}

