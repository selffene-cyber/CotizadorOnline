'use client';

// Sección de Equipos/Herramientas
import { useState, useEffect } from 'react';
import { QuoteItemEquipment } from '@/types';
import { getEquipmentCatalog, saveEquipmentCatalog } from '@/supabase/catalogs';
import { EquipmentCatalogItem } from '@/types';
import Button from '@/components/ui/Button';
import { ALL_UNITS } from '@/utils/units';

interface SectionEquipmentProps {
  items: QuoteItemEquipment[];
  onChange: (items: QuoteItemEquipment[]) => void;
  moTotal?: number; // Total de MO para calcular % automático
  equipmentPercentageMO?: number; // % de MO por defecto
}

export default function SectionEquipment({ 
  items, 
  onChange, 
  moTotal = 0,
  equipmentPercentageMO = 4 
}: SectionEquipmentProps) {
  const [equipmentCatalog, setEquipmentCatalog] = useState<EquipmentCatalogItem[]>([]);
  const [rateInputs, setRateInputs] = useState<{ [key: number]: string }>({});

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
      const catalog = await getEquipmentCatalog();
      setEquipmentCatalog(catalog);
    } catch (error) {
      console.error('Error cargando catálogo de equipos:', error);
    }
  };

  const addItem = () => {
    const newItem: QuoteItemEquipment = {
      equipment: '',
      unit: 'día',
      quantity: 0,
      rate: 0,
      subtotal: 0,
    };
    const newIndex = items.length;
    onChange([...items, newItem]);
    setRateInputs({ ...rateInputs, [newIndex]: '' });
  };

  const updateItem = async (index: number, updates: Partial<QuoteItemEquipment>, saveToCatalog: boolean = false) => {
    const updated = [...items];
    const item = { ...updated[index], ...updates };
    
    // Calcular subtotal
    item.subtotal = Math.round(item.quantity * item.rate);

    updated[index] = item;
    onChange(updated);

    // Solo guardar en catálogo si se solicita explícitamente (onBlur) y se cumplen las condiciones
    if (saveToCatalog && item.equipment && item.equipment.trim().length > 0 && item.unit && item.rate > 0) {
      const existsInCatalog = equipmentCatalog.some(cat => cat.name.toLowerCase() === item.equipment.toLowerCase().trim());
      if (!existsInCatalog) {
        const newCatalogItem: EquipmentCatalogItem = {
          id: Date.now().toString(),
          name: item.equipment.trim(),
          unit: item.unit,
          defaultRate: item.rate,
          category: ''
        };
        const updatedCatalog = [...equipmentCatalog, newCatalogItem];
        setEquipmentCatalog(updatedCatalog);
        try {
          await saveEquipmentCatalog(updatedCatalog);
        } catch (error) {
          console.error('Error guardando en catálogo:', error);
        }
      }
    }
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const selectFromCatalog = (index: number, catalogItem: EquipmentCatalogItem) => {
    const formatted = formatNumber(catalogItem.defaultRate || 0);
    setRateInputs({ ...rateInputs, [index]: formatted });
    updateItem(index, {
      equipment: catalogItem.name,
      unit: catalogItem.unit,
      rate: catalogItem.defaultRate || 0,
    }, false); // No guardar en catálogo porque ya existe
  };

  const applyPercentageMO = () => {
    if (moTotal > 0 && equipmentPercentageMO > 0) {
      const calculatedRate = Math.round((moTotal * equipmentPercentageMO) / 100);
      const formatted = formatNumber(calculatedRate);
      
      // Si no hay items, crear uno
      if (items.length === 0) {
        const newItem: QuoteItemEquipment = {
          equipment: 'Equipos y Herramientas (Estimado)',
          unit: 'día',
          quantity: 1,
          rate: calculatedRate,
          subtotal: calculatedRate,
        };
        onChange([newItem]);
        setRateInputs({ ...rateInputs, [0]: formatted });
      } else {
        // Actualizar el primer item
        setRateInputs({ ...rateInputs, [0]: formatted });
        updateItem(0, {
          rate: calculatedRate,
          quantity: items[0].quantity || 1,
        });
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Equipos y Herramientas</h3>
        <div className="flex gap-2">
          {moTotal > 0 && (
            <Button 
              variant="outline" 
              onClick={applyPercentageMO}
              className="text-sm"
            >
              Aplicar {equipmentPercentageMO}% de MO
            </Button>
          )}
          <Button onClick={addItem} variant="outline">Agregar</Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No hay items de equipos</p>
          {moTotal > 0 && (
            <Button variant="outline" onClick={applyPercentageMO}>
              Estimar con {equipmentPercentageMO}% de MO
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Equipo</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Unidad</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Cantidad</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Tarifa</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Subtotal</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2">
                    <div>
                      <select
                        value=""
                        onChange={(e) => {
                          const catalogItem = equipmentCatalog.find(c => c.name === e.target.value);
                          if (catalogItem) {
                            selectFromCatalog(index, catalogItem);
                          }
                        }}
                        className="w-full px-2 py-1 border rounded text-sm mb-1"
                      >
                        <option value="">Seleccionar del catálogo...</option>
                        {equipmentCatalog.map((cat) => (
                          <option key={cat.id || cat.name} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={item.equipment}
                        onChange={(e) => updateItem(index, { equipment: e.target.value }, false)}
                        onBlur={() => {
                          // Guardar en catálogo solo cuando el usuario termine de escribir
                          if (item.equipment && item.equipment.trim().length > 0 && item.unit && item.rate > 0) {
                            updateItem(index, {}, true);
                          }
                        }}
                        placeholder="Nombre del equipo"
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={item.unit}
                      onChange={(e) => updateItem(index, { unit: e.target.value as 'día' | 'hora' }, false)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-400 transition-all"
                    >
                      {ALL_UNITS.map((unit) => (
                        <option key={unit.value} value={unit.value}>
                          {unit.value}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={item.quantity || 0}
                      onChange={(e) => updateItem(index, { quantity: parseFloat(e.target.value) || 0 }, false)}
                      className="w-24 px-2 py-1 border rounded"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={rateInputs[index] !== undefined ? rateInputs[index] : formatNumber(item.rate)}
                      onChange={(e) => {
                        const inputValue = e.target.value.replace(/[^0-9]/g, '');
                        const formatted = inputValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                        setRateInputs({ ...rateInputs, [index]: formatted });
                        const numericValue = parseNumber(inputValue);
                        updateItem(index, { rate: numericValue }, false);
                      }}
                      onBlur={(e) => {
                        const numericValue = parseNumber(e.target.value);
                        if (numericValue === 0) {
                          setRateInputs({ ...rateInputs, [index]: '' });
                        }
                        // Guardar en catálogo cuando se completa el rate
                        if (item.equipment && item.equipment.trim().length > 0 && item.unit && numericValue > 0) {
                          updateItem(index, { rate: numericValue }, true);
                        }
                      }}
                      placeholder="0"
                      className="w-28 px-2 py-1 border rounded text-right"
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
                  Total Equipos:
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

