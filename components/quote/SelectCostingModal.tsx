'use client';

import { useEffect, useState } from 'react';
import { getAllCostings } from '@/firebase/costings';
import { Costing } from '@/types';
import Button from '@/components/ui/Button';

interface SelectCostingModalProps {
  onSelect: (costing: Costing) => void;
  onClose: () => void;
}

export default function SelectCostingModal({ onSelect, onClose }: SelectCostingModalProps) {
  const [costings, setCostings] = useState<Costing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadCostings();
  }, []);

  const loadCostings = async () => {
    try {
      const allCostings = await getAllCostings();
      setCostings(allCostings);
    } catch (error) {
      console.error('Error cargando costeos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleConfirm = () => {
    const selected = costings.find(c => c.id === selectedId);
    if (selected) {
      onSelect(selected);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[80vh] flex flex-col">
        <h2 className="text-xl font-bold mb-4">Seleccionar Costeo</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : costings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No hay costeos disponibles</p>
            <p className="text-sm mt-2">Crea un costeo primero para agregarlo a la cotización</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"></th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Precio Neto</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total con IVA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {costings.map((costing) => (
                  <tr 
                    key={costing.id}
                    className={`cursor-pointer hover:bg-gray-50 ${selectedId === costing.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedId(costing.id || null)}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="radio"
                        checked={selectedId === costing.id}
                        onChange={() => setSelectedId(costing.id || null)}
                        className="w-4 h-4 text-blue-600"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{costing.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{costing.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(costing.totals?.precioNeto || 0)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(costing.totals?.totalConIva || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedId}>
            Agregar a Cotización
          </Button>
        </div>
      </div>
    </div>
  );
}



