'use client';

// Paso 3 del Wizard: Detalles del Proyecto
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';

interface WizardStep3DetailsProps {
  data: {
    scope: string;
    exclusions: string;
    assumptions: string;
    executionDeadline: number;
    validity: number;
    paymentTerms: string;
    warranties: string;
  };
  onChange: (data: Partial<WizardStep3DetailsProps['data']>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function WizardStep3Details({ data, onChange, onNext, onBack }: WizardStep3DetailsProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Paso 3: Detalles</h2>
        <p className="text-gray-600 mt-1">Información adicional del proyecto</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6 animate-fade-in">
        <Textarea
          label="Alcance del Proyecto *"
          value={data.scope || ''}
          onChange={(e) => onChange({ ...data, scope: e.target.value })}
          rows={4}
          required
          placeholder="Describe el alcance del trabajo a realizar..."
          helperText="Describe detalladamente qué incluye este proyecto"
        />

        <Textarea
          label="Exclusiones"
          value={data.exclusions || ''}
          onChange={(e) => onChange({ ...data, exclusions: e.target.value })}
          rows={3}
          placeholder="Trabajos o servicios que NO están incluidos..."
          helperText="Lista lo que NO está incluido en esta cotización"
        />

        <Textarea
          label="Supuestos"
          value={data.assumptions || ''}
          onChange={(e) => onChange({ ...data, assumptions: e.target.value })}
          rows={3}
          placeholder="Condiciones o supuestos bajo los cuales se basa esta cotización..."
          helperText="Condiciones que deben cumplirse para que la cotización sea válida"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Plazo de Ejecución (días) *"
            type="number"
            min="1"
            value={(data.executionDeadline ?? 30).toString()}
            onChange={(e) => onChange({ ...data, executionDeadline: parseInt(e.target.value) || 30 })}
            required
          />
          <Input
            label="Validez de Cotización (días) *"
            type="number"
            min="1"
            value={(data.validity ?? 30).toString()}
            onChange={(e) => onChange({ ...data, validity: parseInt(e.target.value) || 30 })}
            required
          />
        </div>

        <Textarea
          label="Forma de Pago *"
          value={data.paymentTerms || ''}
          onChange={(e) => onChange({ ...data, paymentTerms: e.target.value })}
          rows={2}
          required
          placeholder="Ej: 50% anticipo, 50% contra entrega"
          helperText="Especifica los términos y condiciones de pago"
        />

        <Textarea
          label="Garantías"
          value={data.warranties || ''}
          onChange={(e) => onChange({ ...data, warranties: e.target.value })}
          rows={2}
          placeholder="Ej: 90 días para materiales y mano de obra"
          helperText="Describe las garantías ofrecidas para este proyecto"
        />

        <div className="flex gap-4 pt-4">
          <button
            onClick={onBack}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Atrás
          </button>
          <button
            onClick={onNext}
            disabled={!(data.scope || '').trim() || !(data.paymentTerms || '').trim()}
            className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
              (data.scope || '').trim() && (data.paymentTerms || '').trim()
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Continuar a Costeo
          </button>
        </div>
      </div>
    </div>
  );
}

