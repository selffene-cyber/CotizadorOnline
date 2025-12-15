'use client';

// Sección de Indirectos de Obra
import { useState } from 'react';
import { QuoteItemIndirect } from '@/types';
import Button from '@/components/ui/Button';

interface SectionIndirectsProps {
  items: QuoteItemIndirect[];
  onChange: (items: QuoteItemIndirect[]) => void;
}

export default function SectionIndirects({ items, onChange }: SectionIndirectsProps) {
  const [rateInputs, setRateInputs] = useState<{ [key: number]: string }>({});
  const [amountInputs, setAmountInputs] = useState<{ [key: number]: string }>({});

  // Función para formatear número con separadores de miles
  const formatNumber = (value: number | undefined | null): string => {
    if (value === undefined || value === null || value === 0) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Función para parsear string con formato a número
  const parseNumber = (value: string): number => {
    const cleaned = value.replace(/\./g, '');
    return parseInt(cleaned) || 0;
  };
  const addItem = () => {
    const newItem: QuoteItemIndirect = {
      description: '',
      type: 'hh',
      hours: 0,
      rate: 0,
      amount: 0,
      subtotal: 0,
    };
    const newIndex = items.length;
    onChange([...items, newItem]);
    setRateInputs({ ...rateInputs, [newIndex]: '' });
    setAmountInputs({ ...amountInputs, [newIndex]: '' });
  };

  const updateItem = (index: number, updates: Partial<QuoteItemIndirect>) => {
    const updated = [...items];
    const item = { ...updated[index], ...updates };

    // Calcular subtotal según el tipo
    if (item.type === 'hh' && item.hours && item.rate) {
      item.subtotal = Math.round(item.hours * item.rate);
    } else if (item.type === 'fixed' && item.amount) {
      item.subtotal = Math.round(item.amount);
    } else {
      item.subtotal = 0;
    }

    updated[index] = item;
    onChange(updated);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Indirectos de Obra</h3>
        <Button onClick={addItem} variant="outline">Agregar</Button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Incluye supervisión, HSEC, administración de obra, etc.
      </p>

      {items.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No hay items de indirectos</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Descripción</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Tipo</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Cantidad</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Tarifa/Hora</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Monto Fijo</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Subtotal</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(index, { description: e.target.value })}
                      placeholder="Ej: Supervisión, HSEC..."
                      className="w-full px-2 py-1 border rounded"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={item.type}
                      onChange={(e) => {
                        const newType = e.target.value as 'hh' | 'fixed';
                        // Limpiar inputs cuando cambia el tipo
                        if (newType === 'hh') {
                          setAmountInputs({ ...amountInputs, [index]: '' });
                        } else {
                          setRateInputs({ ...rateInputs, [index]: '' });
                        }
                        updateItem(index, { type: newType });
                      }}
                      className="w-24 px-2 py-1 border rounded"
                    >
                      <option value="hh">HH</option>
                      <option value="fixed">Fijo</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    {item.type === 'hh' ? (
                      <input
                        type="number"
                        value={item.hours || 0}
                        onChange={(e) => updateItem(index, { hours: parseFloat(e.target.value) || 0 })}
                        className="w-20 px-2 py-1 border rounded"
                        min="0"
                        step="0.5"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {item.type === 'hh' ? (
                      <input
                        type="text"
                        value={rateInputs[index] !== undefined ? rateInputs[index] : formatNumber(item.rate)}
                        onChange={(e) => {
                          const inputValue = e.target.value.replace(/[^0-9]/g, '');
                          const formatted = inputValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                          setRateInputs({ ...rateInputs, [index]: formatted });
                          const numericValue = parseNumber(inputValue);
                          updateItem(index, { rate: numericValue });
                        }}
                        onBlur={(e) => {
                          const numericValue = parseNumber(e.target.value);
                          if (numericValue === 0) {
                            setRateInputs({ ...rateInputs, [index]: '' });
                          }
                        }}
                        placeholder="0"
                        className="w-24 px-2 py-1 border rounded text-right"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {item.type === 'fixed' ? (
                      <input
                        type="text"
                        value={amountInputs[index] !== undefined ? amountInputs[index] : formatNumber(item.amount)}
                        onChange={(e) => {
                          const inputValue = e.target.value.replace(/[^0-9]/g, '');
                          const formatted = inputValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                          setAmountInputs({ ...amountInputs, [index]: formatted });
                          const numericValue = parseNumber(inputValue);
                          updateItem(index, { amount: numericValue });
                        }}
                        onBlur={(e) => {
                          const numericValue = parseNumber(e.target.value);
                          if (numericValue === 0) {
                            setAmountInputs({ ...amountInputs, [index]: '' });
                          }
                        }}
                        placeholder="0"
                        className="w-28 px-2 py-1 border rounded text-right"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm font-medium">
                    ${item.subtotal.toLocaleString('es-CL')}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={5} className="px-4 py-2 text-right font-semibold">
                  Total Indirectos:
                </td>
                <td className="px-4 py-2 font-semibold text-gray-900">
                  ${items.reduce((sum, item) => sum + item.subtotal, 0).toLocaleString('es-CL')}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

