'use client';

// Página de Nueva Cotización - Wizard
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import WizardStep1Client from '@/components/quote/WizardStep1Client';
import WizardStep2Project from '@/components/quote/WizardStep2Project';
import WizardStep3Details from '@/components/quote/WizardStep3Details';
import { useQuote } from '@/hooks/useQuote';
import { createQuote } from '@/firebase/quotes';
import { Quote } from '@/types';

export default function NewQuotePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState<string>('');
  const [projectData, setProjectData] = useState({
    projectName: '',
    location: '',
    region: '',
    city: '',
    type: 'Fabricación' as Quote['type'],
    modality: 'Cerrado' as Quote['modality'],
  });
  const [detailsData, setDetailsData] = useState({
    scope: '',
    exclusions: '',
    assumptions: '',
    executionDeadline: 30,
    validity: 30,
    paymentTerms: '50% anticipo, 50% contra entrega',
    warranties: '90 días',
  });

  const { quote, updateQuote } = useQuote();

  const handleStep1Next = (selectedClientId: string) => {
    setClientId(selectedClientId);
    setStep(2);
  };

  const handleStep2Next = () => {
    setStep(3);
  };

  const handleStep3Next = async () => {
    // Combinar todos los datos y crear la cotización (sin costeo, solo datos básicos)
    const newQuote: Omit<Quote, 'id' | 'totals'> = {
      clientId,
      status: 'Borrador',
      version: 1,
      projectName: projectData.projectName,
      location: projectData.location, // Mantener por compatibilidad
      region: projectData.region,
      city: projectData.city,
      type: projectData.type, // Tipo de proyecto (Fabricación, Montaje, etc.)
      modality: projectData.modality, // Modalidad (Cerrado, HH+Mat, Mixto)
      scope: detailsData.scope,
      exclusions: detailsData.exclusions,
      assumptions: detailsData.assumptions,
      executionDeadline: detailsData.executionDeadline,
      validity: detailsData.validity,
      paymentTerms: detailsData.paymentTerms,
      warranties: detailsData.warranties,
      quoteItems: [], // Items de cotización vacíos inicialmente
      costingReferences: [], // Referencias a costeos usados
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const quoteId = await createQuote(newQuote);
      router.push(`/quotes/${quoteId}/items`); // Ir directo a items de cotización
    } catch (error) {
      console.error('Error creando cotización:', error);
      alert('Error al crear la cotización. Por favor, intenta nuevamente.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Indicador de pasos */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step === stepNumber
                      ? 'bg-blue-600 text-white'
                      : step > stepNumber
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step > stepNumber ? '✓' : stepNumber}
                </div>
                <span className="mt-2 text-sm text-gray-600">
                  {stepNumber === 1 && 'Cliente'}
                  {stepNumber === 2 && 'Proyecto'}
                  {stepNumber === 3 && 'Detalles'}
                </span>
              </div>
              {stepNumber < 3 && (
                <div
                  className={`h-1 flex-1 mx-2 ${
                    step > stepNumber ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contenido del paso actual */}
      {step === 1 && (
        <WizardStep1Client clientId={clientId} onNext={handleStep1Next} />
      )}

      {step === 2 && (
        <WizardStep2Project
          data={projectData}
          onChange={(updates) => setProjectData({ ...projectData, ...updates })}
          onNext={handleStep2Next}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <WizardStep3Details
          data={detailsData}
          onChange={(updates) => setDetailsData({ ...detailsData, ...updates })}
          onNext={handleStep3Next}
          onBack={() => setStep(2)}
        />
      )}
    </div>
  );
}

