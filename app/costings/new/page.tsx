'use client';

// Página de Nuevo Costeo - Wizard
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import WizardStep1Client from '@/components/quote/WizardStep1Client';
import WizardStep2Project from '@/components/quote/WizardStep2Project';
import { Costing, ProjectType, Modality } from '@/types';
import { createCosting } from '@/firebase/costings';

export default function NewCostingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState<string>('');
  const [projectData, setProjectData] = useState({
    projectName: '',
    location: '',
    region: '',
    city: '',
    type: 'Fabricación' as ProjectType,
    modality: 'Cerrado' as Modality,
  });

  const handleStep1Next = (selectedClientId: string) => {
    setClientId(selectedClientId);
    setStep(2);
  };

  const handleStep2Next = async () => {
    // Validar que se haya seleccionado un cliente
    if (!clientId) {
      alert('Debes seleccionar un cliente para crear el costeo');
      return;
    }

    // Crear el costeo con datos básicos (sin alcance, exclusiones, etc. - esos son de cotización)
    const newCosting: Omit<Costing, 'id' | 'totals'> = {
      name: projectData.projectName,
      description: '', // El costeo no tiene alcance/exclusiones, esos son de la cotización
      type: projectData.type,
      modality: projectData.modality,
      clientId: clientId, // Guardar el cliente asociado al costeo
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const costingId = await createCosting(newCosting);
      router.push(`/costings/${costingId}/edit`);
    } catch (error) {
      console.error('Error creando costeo:', error);
      alert('Error al crear el costeo. Por favor, intenta nuevamente.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Costeo</h1>
        <p className="text-gray-600 mt-1">Crea un nuevo costeo de proyecto/servicio</p>
      </div>

      {step === 1 && (
        <WizardStep1Client 
          clientId={clientId}
          onNext={handleStep1Next}
        />
      )}

      {step === 2 && (
        <WizardStep2Project
          data={projectData}
          onChange={setProjectData}
          onNext={handleStep2Next}
          onBack={() => setStep(1)}
          nextButtonText="Crear Costeo"
        />
      )}
    </div>
  );
}

