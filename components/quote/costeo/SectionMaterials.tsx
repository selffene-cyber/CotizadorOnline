'use client';

// Sección de Materiales
import { useState, useEffect } from 'react';
import { QuoteItemMaterial } from '@/types';
import { calculateMaterialSubtotal } from '@/utils/calculations/quoteTotals';
import { getMaterialsCatalog, saveMaterialsCatalog } from '@/firebase/catalogs';
import { MaterialCatalogItem } from '@/types';
import Button from '@/components/ui/Button';
import { ALL_UNITS } from '@/utils/units';

interface SectionMaterialsProps {
  items: QuoteItemMaterial[];
  onChange: (items: QuoteItemMaterial[]) => void;
}

export default function SectionMaterials({ items, onChange }: SectionMaterialsProps) {
  const [materialsCatalog, setMaterialsCatalog] = useState<MaterialCatalogItem[]>([]);
  const [unitCostInputs, setUnitCostInputs] = useState<{ [key: number]: string }>({});

  // Función para formatear número con separadores de miles
  const formatNumber = (value: number | undefined | null): string => {
    if (value === undefined || value === null || value === 0) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Función para parsear string con formato a número
  const parseNumber = (value: string): number => {
    // Remover todos los puntos (separadores de miles) y espacios
    const cleaned = value.replace(/\./g, '').replace(/\s/g, '');
    // Usar parseFloat para manejar números grandes correctamente
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.round(parsed);
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      const catalog = await getMaterialsCatalog();
      setMaterialsCatalog(catalog);
    } catch (error) {
      console.error('Error cargando catálogo de materiales:', error);
    }
  };

  const addItem = () => {
    const newItem: QuoteItemMaterial = {
      item: '',
      unidad: 'un',
      quantity: 0,
      unitCost: 0,
      mermaPct: 5,
      subtotal: 0,
    };
    const newIndex = items.length;
    onChange([...items, newItem]);
    setUnitCostInputs({ ...unitCostInputs, [newIndex]: '' });
  };

  const updateItem = async (index: number, updates: Partial<QuoteItemMaterial>, saveToCatalog: boolean = false) => {
    const updated = [...items];
    const item = { ...updated[index], ...updates };

    // Calcular subtotal con merma
    item.subtotal = calculateMaterialSubtotal(item.quantity, item.unitCost, item.mermaPct);

    updated[index] = item;
    onChange(updated);

    // Solo guardar en catálogo si se solicita explícitamente (onBlur) y se cumplen las condiciones
    if (saveToCatalog && item.item && item.unidad && item.unitCost > 0) {
      const existsInCatalog = materialsCatalog.some(cat => cat.name.toLowerCase() === item.item.toLowerCase());
      if (!existsInCatalog) {
        // Asegurar que el costo se guarde correctamente
        const defaultCost = item.unitCost !== undefined && item.unitCost !== null 
          ? parseFloat(item.unitCost.toString()) 
          : 0;
        
        const newCatalogItem: MaterialCatalogItem = {
          id: Date.now().toString(),
          name: item.item,
          unidad: item.unidad,
          defaultCost: defaultCost, // Agregar el costo unitario como defaultCost
          defaultMermaPct: item.mermaPct || 5,
          category: ''
        };
        console.log('[SectionMaterials] Guardando nuevo material en catálogo:', {
          ...newCatalogItem,
          originalUnitCost: item.unitCost,
          type: typeof item.unitCost,
          parsedDefaultCost: defaultCost
        });
        const updatedCatalog = [...materialsCatalog, newCatalogItem];
        setMaterialsCatalog(updatedCatalog);
        try {
          await saveMaterialsCatalog(updatedCatalog);
        } catch (error) {
          console.error('Error guardando en catálogo:', error);
        }
      }
    }
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const selectFromCatalog = (index: number, catalogItem: MaterialCatalogItem) => {
    updateItem(index, {
      item: catalogItem.name,
      unidad: catalogItem.unidad,
      mermaPct: catalogItem.defaultMermaPct,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Materiales</h3>
        <Button onClick={addItem} variant="outline">Agregar</Button>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No hay items de materiales</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Item</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Unidad</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Cantidad</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Costo Unit.</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Merma %</th>
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
                          const catalogItem = materialsCatalog.find(c => c.name === e.target.value);
                          if (catalogItem) {
                            selectFromCatalog(index, catalogItem);
                          }
                        }}
                        className="w-full px-2 py-1 border rounded text-sm mb-1"
                      >
                        <option value="">Seleccionar del catálogo...</option>
                        {materialsCatalog.map((cat) => (
                          <option key={cat.id || cat.name} value={cat.name}>
                            {cat.name} ({cat.unidad})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={item.item}
                        onChange={(e) => updateItem(index, { item: e.target.value })}
                        placeholder="Nombre del material"
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={item.unidad}
                      onChange={(e) => updateItem(index, { unidad: e.target.value })}
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
                      onChange={(e) => updateItem(index, { quantity: parseFloat(e.target.value) || 0 })}
                      className="w-24 px-2 py-1 border rounded"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={unitCostInputs[index] !== undefined ? unitCostInputs[index] : formatNumber(item.unitCost)}
                      onChange={(e) => {
                        const inputValue = e.target.value.replace(/[^0-9]/g, '');
                        const formatted = inputValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                        setUnitCostInputs({ ...unitCostInputs, [index]: formatted });
                        const numericValue = parseNumber(inputValue);
                        updateItem(index, { unitCost: numericValue }, false); // No guardar en catálogo todavía
                      }}
                      onBlur={(e) => {
                        const numericValue = parseNumber(e.target.value);
                        if (numericValue === 0) {
                          setUnitCostInputs({ ...unitCostInputs, [index]: '' });
                        }
                        // Guardar en catálogo cuando se completa el costo unitario
                        const item = items[index];
                        if (item && item.item && item.item.trim().length > 0 && item.unidad && numericValue > 0) {
                          updateItem(index, { unitCost: numericValue }, true); // Guardar en catálogo
                        }
                      }}
                      placeholder="0"
                      className="w-28 px-2 py-1 border rounded text-right"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={item.mermaPct || 0}
                      onChange={(e) => updateItem(index, { mermaPct: parseFloat(e.target.value) || 0 })}
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
                <td colSpan={5} className="px-4 py-2 text-right font-semibold">
                  Total Materiales:
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

