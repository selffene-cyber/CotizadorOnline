'use client';

// Sección de Logística/Traslados
import { QuoteItemLogistics } from '@/types';
import { useState } from 'react';

interface SectionLogisticsProps {
  logistics: QuoteItemLogistics;
  onChange: (logistics: QuoteItemLogistics) => void;
  ratePerKm?: number;
}

export default function SectionLogistics({ logistics, onChange, ratePerKm = 450 }: SectionLogisticsProps) {
  const [mode, setMode] = useState<'km' | 'viatico'>(logistics.mode || 'km');

  const updateLogistics = (updates: Partial<QuoteItemLogistics>) => {
    const updated = { ...logistics, ...updates };
    
    // Calcular subtotal según el modo
    if (updated.mode === 'km') {
      const kmCost = (updated.km || 0) * (updated.ratePerKm || ratePerKm);
      const tollsCost = updated.tolls || 0;
      const driverCost = (updated.driverHours || 0) * (updated.driverRate || 0);
      updated.subtotal = Math.round(kmCost + tollsCost + driverCost);
    } else {
      const viaticoCost = (updated.viaticoPerDay || 0) * (updated.days || 0);
      const accommodationCost = updated.accommodation || 0;
      const mobilizationCost = updated.fixedMobilization || 0;
      updated.subtotal = Math.round(viaticoCost + accommodationCost + mobilizationCost);
    }
    
    onChange(updated);
  };

  const handleModeChange = (newMode: 'km' | 'viatico') => {
    setMode(newMode);
    
    if (newMode === 'km') {
      updateLogistics({
        mode: 'km',
        km: logistics.km || 0,
        ratePerKm: logistics.ratePerKm || ratePerKm,
        tolls: logistics.tolls || 0,
        driverHours: logistics.driverHours || 0,
        driverRate: logistics.driverRate || 0,
        viaticoPerDay: undefined,
        days: undefined,
        accommodation: undefined,
        fixedMobilization: undefined,
      });
    } else {
      updateLogistics({
        mode: 'viatico',
        viaticoPerDay: logistics.viaticoPerDay || 0,
        days: logistics.days || 0,
        accommodation: logistics.accommodation || 0,
        fixedMobilization: logistics.fixedMobilization || 0,
        km: undefined,
        ratePerKm: undefined,
        tolls: undefined,
        driverHours: undefined,
        driverRate: undefined,
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Logística y Traslados</h3>

      {/* Selector de modo */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Modo de Cálculo</label>
        <div className="flex gap-2">
          <button
            onClick={() => handleModeChange('km')}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              mode === 'km'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            Por Kilometraje
          </button>
          <button
            onClick={() => handleModeChange('viatico')}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              mode === 'viatico'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            Por Viáticos
          </button>
        </div>
      </div>

      {/* Formulario según modo */}
      {mode === 'km' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kilómetros
              </label>
              <input
                type="number"
                value={logistics.km || 0}
                onChange={(e) => updateLogistics({ km: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tarifa por km
              </label>
              <input
                type="number"
                value={logistics.ratePerKm || ratePerKm}
                onChange={(e) => updateLogistics({ ratePerKm: parseInt(e.target.value) || ratePerKm })}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peajes
              </label>
              <input
                type="number"
                value={logistics.tolls || 0}
                onChange={(e) => updateLogistics({ tolls: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horas Conductor
              </label>
              <input
                type="number"
                value={logistics.driverHours || 0}
                onChange={(e) => updateLogistics({ driverHours: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
                step="0.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tarifa por Hora Conductor
            </label>
            <input
              type="number"
              value={logistics.driverRate || 0}
              onChange={(e) => updateLogistics({ driverRate: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg"
              min="0"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Viático por Día
              </label>
              <input
                type="number"
                value={logistics.viaticoPerDay || 0}
                onChange={(e) => updateLogistics({ viaticoPerDay: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Días
              </label>
              <input
                type="number"
                value={logistics.days || 0}
                onChange={(e) => updateLogistics({ days: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alojamiento
              </label>
              <input
                type="number"
                value={logistics.accommodation || 0}
                onChange={(e) => updateLogistics({ accommodation: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Movilización Fija
              </label>
              <input
                type="number"
                value={logistics.fixedMobilization || 0}
                onChange={(e) => updateLogistics({ fixedMobilization: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Total */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-900">Total Logística:</span>
          <span className="text-xl font-bold text-blue-600">
            ${logistics.subtotal.toLocaleString('es-CL')}
          </span>
        </div>
      </div>
    </div>
  );
}

