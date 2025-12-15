'use client';

// Sección de Contingencias/Riesgos
import { useState, useEffect } from 'react';
import { ContingencyItem, RiskCatalogItem } from '@/types';
import { getRiskCatalog } from '@/firebase/catalogs';
import Input from '@/components/ui/Input';

interface SectionContingenciaProps {
  items: ContingencyItem[];
  onChange: (items: ContingencyItem[]) => void;
}

export default function SectionContingencia({ items, onChange }: SectionContingenciaProps) {
  const [riskCatalog, setRiskCatalog] = useState<RiskCatalogItem[]>([]);
  const [customRiskName, setCustomRiskName] = useState('');
  const [customRiskPct, setCustomRiskPct] = useState('');

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      const catalog = await getRiskCatalog();
      setRiskCatalog(catalog);
    } catch (error) {
      console.error('Error cargando catálogo de riesgos:', error);
    }
  };

  const toggleRisk = (risk: RiskCatalogItem) => {
    const exists = items.findIndex(item => item.name === risk.name);
    
    if (exists >= 0) {
      onChange(items.filter(item => item.name !== risk.name));
    } else {
      onChange([...items, { name: risk.name, percentage: risk.percentage }]);
    }
  };

  const addCustomRisk = () => {
    if (customRiskName.trim() && customRiskPct) {
      const pct = parseFloat(customRiskPct);
      if (pct > 0) {
        onChange([...items, { name: customRiskName, percentage: pct, custom: true }]);
        setCustomRiskName('');
        setCustomRiskPct('');
      }
    }
  };

  const removeItem = (name: string) => {
    onChange(items.filter(item => item.name !== name));
  };

  const totalPct = items.reduce((sum, item) => sum + item.percentage, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contingencias y Riesgos</h3>

      {/* Catálogo de riesgos */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Riesgos Predefinidos
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {riskCatalog.map((risk) => {
            const isSelected = items.some(item => item.name === risk.name);
            return (
              <button
                key={risk.id || risk.name}
                onClick={() => toggleRisk(risk)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm">{risk.name}</div>
                    {risk.description && (
                      <div className="text-xs text-gray-500 mt-1">{risk.description}</div>
                    )}
                  </div>
                  <span className={`text-sm font-semibold ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                    +{risk.percentage}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Riesgo personalizado */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Agregar Riesgo Personalizado
        </label>
        <div className="flex gap-2">
          <Input
            value={customRiskName}
            onChange={(e) => setCustomRiskName(e.target.value)}
            placeholder="Nombre del riesgo"
            className="flex-1"
          />
          <Input
            type="number"
            value={customRiskPct}
            onChange={(e) => setCustomRiskPct(e.target.value)}
            placeholder="%"
            className="w-24"
            min="0"
            step="0.1"
          />
          <button
            onClick={addCustomRisk}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Agregar
          </button>
        </div>
      </div>

      {/* Items seleccionados */}
      {items.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contingencias Aplicadas
          </label>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.name}
                className="flex justify-between items-center p-3 bg-blue-50 rounded-lg"
              >
                <div>
                  <span className="font-medium text-sm">{item.name}</span>
                  {item.custom && (
                    <span className="ml-2 text-xs text-gray-500">(Personalizado)</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-blue-600">+{item.percentage}%</span>
                  <button
                    onClick={() => removeItem(item.name)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-900">Total Contingencia:</span>
          <span className="text-xl font-bold text-blue-600">{totalPct.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
}

