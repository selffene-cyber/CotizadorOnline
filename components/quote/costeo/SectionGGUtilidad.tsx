'use client';

// Sección de Gastos Generales y Utilidad
import { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import Tooltip from '@/components/ui/Tooltip';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface SectionGGUtilidadProps {
  ggPercentage: number;
  utilityPercentage: number;
  utilityMin?: number;
  onChange: (gg: number, utility: number) => void;
}

export default function SectionGGUtilidad({ 
  ggPercentage, 
  utilityPercentage, 
  utilityMin = 20,
  onChange 
}: SectionGGUtilidadProps) {
  const ggOptions = [10, 12, 15];
  const [utilityInput, setUtilityInput] = useState<string>(utilityPercentage.toString());
  const [utilityError, setUtilityError] = useState<string>('');

  // Sincronizar el input cuando cambia utilityPercentage desde fuera
  useEffect(() => {
    const currentNum = parseFloat(utilityInput);
    // Solo actualizar si el valor externo cambió significativamente
    if (!isNaN(currentNum) && Math.abs(currentNum - utilityPercentage) < 0.01) {
      // Ya está sincronizado
      return;
    }
    // Si el input está vacío o no es un número válido, sincronizar con el valor externo
    if (utilityInput === '' || isNaN(parseFloat(utilityInput))) {
      setUtilityInput(utilityPercentage.toString());
    }
  }, [utilityPercentage]);

  const handleGGChange = (value: number) => {
    onChange(value, utilityPercentage);
  };

  const handleUtilityInputChange = (value: string) => {
    // Permitir escribir libremente (incluso borrar todo)
    setUtilityInput(value);
    setUtilityError('');
    
    // Si está vacío, no actualizar el valor
    if (value === '' || value === '-' || value === '.') {
      return;
    }
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      // Actualizar el valor mientras escribe (sin validar mínimo)
      onChange(ggPercentage, numValue);
    }
  };

  const handleUtilityBlur = () => {
    // Validar solo al perder el foco
    const numValue = parseFloat(utilityInput);
    
    if (isNaN(numValue) || utilityInput.trim() === '') {
      // Si está vacío o inválido, restaurar valor anterior
      setUtilityInput(utilityPercentage.toString());
      setUtilityError('');
      onChange(ggPercentage, utilityPercentage);
      return;
    }
    
    // Aplicar automáticamente el mínimo si es menor
    if (numValue < utilityMin) {
      const validatedValue = utilityMin;
      setUtilityInput(validatedValue.toString());
      onChange(ggPercentage, validatedValue);
      setUtilityError(`Se ajustó al mínimo de ${utilityMin}%`);
      // Limpiar el error después de 3 segundos
      setTimeout(() => setUtilityError(''), 3000);
    } else {
      setUtilityError('');
      onChange(ggPercentage, numValue);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Gastos Generales y Utilidad</h3>
      </div>

      <div className="space-y-6">
        {/* Gastos Generales */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Gastos Generales (%)
            </label>
            <Tooltip 
              id="gg-tooltip" 
              content="Los Gastos Generales (GG) se calculan como un porcentaje sobre el Subtotal de Costos (Costo Directo + Indirectos de Obra). Incluyen gastos administrativos, oficina, servicios básicos, etc. Valores comunes: 10-15%"
            >
              <InformationCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
            </Tooltip>
          </div>
          <div className="flex gap-2 mb-2">
            {ggOptions.map((option) => (
              <button
                key={option}
                onClick={() => handleGGChange(option)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  ggPercentage === option
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {option}%
              </button>
            ))}
          </div>
          <Input
            type="number"
            value={ggPercentage.toString()}
            onChange={(e) => handleGGChange(parseFloat(e.target.value) || 0)}
            min="0"
            step="0.1"
            placeholder="O ingrese un valor personalizado"
          />
        </div>

        {/* Utilidad */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Utilidad (%)
            </label>
            <Tooltip 
              id="utilidad-tooltip" 
              content="La Utilidad es el margen de ganancia que se aplica sobre el Costo Total. Se calcula como: Precio Neto = Costo Total × (1 + Utilidad%). Un rango típico es 45-65%, pero puede variar según el proyecto y mercado."
            >
              <InformationCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
            </Tooltip>
          </div>
          <div className="mb-2">
            <p className="text-sm text-gray-500 mb-1">
              Rango sugerido: 45% - 65% | Mínimo recomendado: {utilityMin}%
            </p>
          </div>
          <Input
            type="text"
            value={utilityInput}
            onChange={(e) => handleUtilityInputChange(e.target.value)}
            onBlur={handleUtilityBlur}
            placeholder="Ej: 55"
            error={utilityError}
            helperText="El precio de venta se calcula automáticamente aplicando este porcentaje al costo total"
          />
        </div>
      </div>
    </div>
  );
}
