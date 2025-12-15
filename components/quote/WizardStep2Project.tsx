'use client';

// Paso 2 del Wizard: Datos del Proyecto
import { useState } from 'react';
import { ProjectType, Modality } from '@/types';
import Input from '@/components/ui/Input';
import { chileRegions, getCitiesByRegion } from '@/utils/chile-regions';

interface WizardStep2ProjectProps {
  data: {
    projectName: string;
    location?: string;
    region?: string;
    city?: string;
    type: ProjectType;
    modality: Modality;
  };
  onChange: (data: Partial<WizardStep2ProjectProps['data']>) => void;
  onNext: () => void;
  onBack: () => void;
  nextButtonText?: string; // Texto personalizado para el botón "Continuar"
}

export default function WizardStep2Project({ data, onChange, onNext, onBack, nextButtonText = 'Continuar' }: WizardStep2ProjectProps) {
  const projectTypes: ProjectType[] = ['Fabricación', 'Montaje', 'Obras Civiles', 'Reparación', 'Eventos'];
  const modalities: Modality[] = ['Cerrado', 'HH+Mat', 'Mixto'];
  
  const [selectedRegion, setSelectedRegion] = useState<string>(() => {
    // Si hay región guardada, buscar su ID
    if (data.region) {
      const region = chileRegions.find(r => r.name === data.region);
      return region ? region.id : '';
    }
    return '';
  });
  
  const [availableCities, setAvailableCities] = useState<string[]>(() => {
    if (selectedRegion) {
      return getCitiesByRegion(selectedRegion);
    }
    return [];
  });

  const canContinue = (data.projectName || '').trim() !== '' && data.region && data.city;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Paso 2: Proyecto</h2>
        <p className="text-gray-600 mt-1">Información del proyecto a cotizar</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-6">
        <Input
          label="Nombre del Proyecto *"
          value={data.projectName || ''}
          onChange={(e) => onChange({ ...data, projectName: e.target.value })}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Región *
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => {
                const regionId = e.target.value;
                setSelectedRegion(regionId);
                const region = chileRegions.find(r => r.id === regionId);
                const cities = region ? region.cities : [];
                setAvailableCities(cities);
                onChange({ 
                  ...data,
                  region: region?.name || '',
                  city: '', // Limpiar ciudad al cambiar región
                  location: undefined,
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar región...</option>
              {chileRegions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ciudad *
            </label>
            <select
              value={data.city || ''}
              onChange={(e) => onChange({ ...data, city: e.target.value, location: undefined })}
              disabled={!selectedRegion || availableCities.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
            >
              <option value="">
                {selectedRegion ? 'Seleccionar ciudad...' : 'Primero seleccione región'}
              </option>
              {availableCities.map((city, index) => (
                <option key={`${city}-${index}`} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Proyecto *
          </label>
          <select
            value={data.type || ''}
            onChange={(e) => onChange({ ...data, type: e.target.value as ProjectType })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {projectTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Modalidad *
          </label>
          <select
            value={data.modality || ''}
            onChange={(e) => onChange({ ...data, modality: e.target.value as Modality })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {modalities.map((modality) => (
              <option key={modality} value={modality}>
                {modality === 'Cerrado' && 'Obra Vendida'}
                {modality === 'HH+Mat' && 'HH + Materiales'}
                {modality === 'Mixto' && 'Mixto'}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            {data.modality === 'Cerrado' && 'Precio fijo total del proyecto'}
            {data.modality === 'HH+Mat' && 'Cotización por horas hombre más materiales'}
            {data.modality === 'Mixto' && 'Combinación de partidas cerradas y variables'}
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            onClick={onBack}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Atrás
          </button>
          <button
            onClick={onNext}
            disabled={!canContinue}
            className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
              canContinue
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {nextButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}

