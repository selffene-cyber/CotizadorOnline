'use client';

// Sección de Mano de Obra
import { useState, useEffect } from 'react';
import { QuoteItemMO } from '@/types';
import { getLaborCatalog, saveLaborCatalog } from '@/firebase/catalogs';
import { LaborCatalogItem } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface SectionMOProps {
  items: QuoteItemMO[];
  onChange: (items: QuoteItemMO[]) => void;
  hoursPerDay?: number;
  efficiency?: number;
}

export default function SectionMO({ items, onChange, hoursPerDay = 9, efficiency = 0.85 }: SectionMOProps) {
  const [laborCatalog, setLaborCatalog] = useState<LaborCatalogItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [costHHInputs, setCostHHInputs] = useState<{ [key: number]: string }>({});

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

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      const catalog = await getLaborCatalog();
      setLaborCatalog(catalog);
    } catch (error) {
      console.error('Error cargando catálogo de mano de obra:', error);
    }
  };

  const addItem = () => {
    const newItem: QuoteItemMO = {
      cargo: '',
      hh: 0,
      costHH: 0,
      recargoPct: 0,
      subtotal: 0,
    };
    const newIndex = items.length;
    onChange([...items, newItem]);
    setEditingIndex(newIndex);
    setCostHHInputs({ ...costHHInputs, [newIndex]: '' });
  };

  const updateItem = async (index: number, updates: Partial<QuoteItemMO>) => {
    const updated = [...items];
    let item = { ...updated[index], ...updates };

    // Calcular subtotal basado en HH directamente
    item.subtotal = Math.round((item.hh || 0) * (item.costHH || 0) * (1 + (item.recargoPct || 0) / 100));

    updated[index] = item;
    onChange(updated);

    // Si se completó un cargo manualmente (tiene cargo y costHH), agregarlo al catálogo si no existe
    if (item.cargo && item.costHH > 0) {
      const existsInCatalog = laborCatalog.some(cat => cat.cargo.toLowerCase() === item.cargo.toLowerCase());
      if (!existsInCatalog) {
        const newCatalogItem: LaborCatalogItem = {
          id: Date.now().toString(),
          cargo: item.cargo,
          defaultCostHH: item.costHH,
          category: ''
        };
        const updatedCatalog = [...laborCatalog, newCatalogItem];
        setLaborCatalog(updatedCatalog);
        try {
          await saveLaborCatalog(updatedCatalog);
        } catch (error) {
          console.error('Error guardando en catálogo:', error);
        }
      }
    }
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const selectFromCatalog = (index: number, catalogItem: LaborCatalogItem) => {
    const formatted = formatNumber(catalogItem.defaultCostHH);
    setCostHHInputs({ ...costHHInputs, [index]: formatted });
    updateItem(index, {
      cargo: catalogItem.cargo,
      costHH: catalogItem.defaultCostHH,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Mano de Obra</h3>
        <Button onClick={addItem} variant="outline">Agregar</Button>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No hay items de mano de obra</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Cargo</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">HH</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Costo/HH</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Recargo %</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Subtotal</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2">
                    {editingIndex === index ? (
                      <div>
                        <select
                          value={item.cargo}
                          onChange={(e) => {
                            const catalogItem = laborCatalog.find(c => c.cargo === e.target.value);
                            if (catalogItem) {
                              selectFromCatalog(index, catalogItem);
                            } else {
                              updateItem(index, { cargo: e.target.value });
                            }
                          }}
                          className="w-full px-2 py-1 border rounded"
                          onBlur={() => setEditingIndex(null)}
                        >
                          <option value="">Seleccionar...</option>
                          {laborCatalog.map((cat) => (
                            <option key={cat.id || cat.cargo} value={cat.cargo}>
                              {cat.cargo} (${cat.defaultCostHH.toLocaleString()}/HH)
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={item.cargo}
                          onChange={(e) => updateItem(index, { cargo: e.target.value })}
                          placeholder="O escribir manualmente"
                          className="mt-1 w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingIndex(index)}
                        className="text-left hover:text-blue-600"
                      >
                        {item.cargo || 'Click para editar'}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={item.hh || 0}
                      onChange={(e) => updateItem(index, { hh: parseFloat(e.target.value) || 0 })}
                      className="w-20 px-2 py-1 border rounded"
                      min="0"
                      step="0.5"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={costHHInputs[index] !== undefined ? costHHInputs[index] : formatNumber(item.costHH)}
                      onChange={(e) => {
                        const inputValue = e.target.value.replace(/[^0-9]/g, '');
                        const formatted = inputValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                        setCostHHInputs({ ...costHHInputs, [index]: formatted });
                        const numericValue = parseNumber(inputValue);
                        updateItem(index, { costHH: numericValue });
                      }}
                      onBlur={(e) => {
                        const numericValue = parseNumber(e.target.value);
                        if (numericValue === 0) {
                          setCostHHInputs({ ...costHHInputs, [index]: '' });
                        }
                      }}
                      placeholder="0"
                      className="w-24 px-2 py-1 border rounded text-right"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={item.recargoPct || 0}
                      onChange={(e) => updateItem(index, { recargoPct: parseFloat(e.target.value) || 0 })}
                      className="w-20 px-2 py-1 border rounded"
                      min="0"
                      step="0.1"
                    />
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
                <td colSpan={4} className="px-4 py-2 text-right font-semibold">
                  Total MO:
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

