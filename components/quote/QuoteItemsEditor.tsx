'use client';

// Editor de items de cotización (líneas de productos/servicios)
import { useState } from 'react';
import { QuoteLineItem } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ALL_UNITS } from '@/utils/units';

interface QuoteItemsEditorProps {
  items: QuoteLineItem[];
  onChange: (items: QuoteLineItem[]) => void;
  onAddFromCosting?: () => void; // Opción para agregar desde el costeo
}

export default function QuoteItemsEditor({ 
  items, 
  onChange,
  onAddFromCosting 
}: QuoteItemsEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<QuoteLineItem>>({});
  const [newItem, setNewItem] = useState<Partial<QuoteLineItem>>({
    description: '',
    quantity: 1,
    unit: 'pz',
    cost: 0,
    margin: 0,
    marginPct: 0,
    unitPrice: 0,
    subtotal: 0,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateSubtotal = (quantity: number, unitPrice: number) => {
    return Math.round(quantity * unitPrice);
  };

  const calculateUnitPrice = (cost: number, marginPct: number) => {
    return Math.round(cost * (1 + marginPct / 100));
  };

  const calculateMargin = (cost: number, marginPct: number) => {
    return Math.round(cost * (marginPct / 100));
  };

  const calculateMarginPct = (cost: number, margin: number) => {
    if (cost === 0) return 0;
    return (margin / cost) * 100;
  };

  const handleAddItem = () => {
    if (!newItem.description || !newItem.quantity || !newItem.cost) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const cost = newItem.cost || 0;
    const marginPct = newItem.marginPct || 0;
    const margin = calculateMargin(cost, marginPct);
    const unitPrice = calculateUnitPrice(cost, marginPct);
    const subtotal = calculateSubtotal(newItem.quantity || 0, unitPrice);
    
    // Calcular número correlativo (máximo itemNumber + 1 o items.length + 1)
    const maxItemNumber = items.length > 0 
      ? Math.max(...items.map(item => item.itemNumber || 0), items.length)
      : 0;
    const itemNumber = maxItemNumber + 1;

    const item: QuoteLineItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      itemNumber,
      codigoInterno: newItem.codigoInterno || '',
      description: newItem.description || '',
      quantity: newItem.quantity || 0,
      unit: newItem.unit || 'pz',
      cost,
      margin,
      marginPct,
      unitPrice,
      subtotal,
    };

    onChange([...items, item]);
    setNewItem({
      description: '',
      codigoInterno: '',
      quantity: 1,
      unit: 'pz',
      cost: 0,
      margin: 0,
      marginPct: 0,
      unitPrice: 0,
      subtotal: 0,
    });
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingItem({ ...items[index] });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingItem({});
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    
    const item = { ...editingItem } as QuoteLineItem;
    // Recalcular subtotal
    item.subtotal = calculateSubtotal(item.quantity, item.unitPrice);
    
    const updatedItems = [...items];
    updatedItems[editingIndex] = item;
    onChange(updatedItems);
    setEditingIndex(null);
    setEditingItem({});
  };

  const handleEditFieldChange = (field: keyof QuoteLineItem, value: any) => {
    setEditingItem(prev => {
      const updated = { ...prev, [field]: value };
      // Recalcular subtotal si cambió cantidad o precio
      if (field === 'quantity' || field === 'unitPrice') {
        updated.subtotal = calculateSubtotal(
          field === 'quantity' ? value : (updated.quantity || 0),
          field === 'unitPrice' ? value : (updated.unitPrice || 0)
        );
      }
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (confirm('¿Estás seguro de eliminar este item?')) {
      const updatedItems = items.filter((_, i) => i !== index);
      onChange(updatedItems);
    }
  };

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Items de Cotización</h3>
        {onAddFromCosting && (
          <Button
            onClick={onAddFromCosting}
            variant="outline"
            className="text-sm"
          >
            + Agregar desde Costeo
          </Button>
        )}
      </div>

      {/* Tabla de Items */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                N°
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código Interno
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cantidad
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unidad
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio Unitario
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item, index) => (
              <tr key={item.id || index} className="hover:bg-gray-50">
                {editingIndex === index ? (
                  <>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-500">
                      {item.itemNumber || index + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Input
                        value={editingItem.codigoInterno || ''}
                        onChange={(e) => handleEditFieldChange('codigoInterno', e.target.value)}
                        className="w-full"
                        placeholder="Código interno"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Input
                        value={editingItem.description || ''}
                        onChange={(e) => handleEditFieldChange('description', e.target.value)}
                        className="w-full"
                        autoFocus
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Input
                        type="number"
                        value={editingItem.quantity?.toString() || '0'}
                        onChange={(e) => handleEditFieldChange('quantity', parseFloat(e.target.value) || 0)}
                        className="w-20"
                        step="0.01"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <select
                        value={editingItem.unit || 'pz'}
                        onChange={(e) => handleEditFieldChange('unit', e.target.value)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-400 transition-all"
                      >
                        {ALL_UNITS.map((unit) => (
                          <option key={unit.value} value={unit.value}>
                            {unit.value}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {editingItem.costingId ? (
                        <div className="inline-block px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 text-sm">
                          {formatNumber(editingItem.unitPrice || 0)}
                        </div>
                      ) : (
                        <Input
                          type="text"
                          value={editingItem.unitPrice ? formatNumber(editingItem.unitPrice) : '0'}
                          onChange={(e) => {
                            const numericValue = e.target.value.replace(/\./g, '');
                            const numValue = parseFloat(numericValue) || 0;
                            handleEditFieldChange('unitPrice', numValue);
                          }}
                          className="w-32 text-sm text-right"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      {formatCurrency(editingItem.subtotal || 0)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={handleSaveEdit}
                        className="text-green-600 hover:text-green-800 text-sm mr-3 font-medium"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                      >
                        Cancelar
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {item.itemNumber || index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.codigoInterno || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">{item.quantity}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-blue-900 text-right">
                      {formatNumber(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(item.subtotal)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleStartEdit(index)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No hay items. Agrega items usando el formulario debajo.
                </td>
              </tr>
            )}
          </tbody>
          {items.length > 0 && (
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={6} className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                  TOTAL:
                </td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                  {formatCurrency(total)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Formulario para agregar nuevo item */}
      <div className="border-t pt-4">
        <h4 className="text-md font-medium text-gray-900 mb-4">Agregar Nuevo Item</h4>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-32">
            <Input
              label="Código Interno"
              value={newItem.codigoInterno || ''}
              onChange={(e) => setNewItem({ ...newItem, codigoInterno: e.target.value })}
              placeholder="Código interno"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <Input
              label="Descripción"
              value={newItem.description || ''}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              placeholder="Descripción del producto/servicio"
            />
          </div>
          <div className="w-24">
            <Input
              label="Cantidad"
              type="number"
              value={newItem.quantity?.toString() || '1'}
              onChange={(e) => {
                const qty = parseFloat(e.target.value) || 0;
                const unitPrice = calculateUnitPrice(newItem.cost || 0, newItem.marginPct || 0);
                setNewItem({ 
                  ...newItem, 
                  quantity: qty,
                  subtotal: calculateSubtotal(qty, unitPrice),
                });
              }}
              step="0.01"
            />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Unidad
            </label>
            <select
              value={newItem.unit || 'pz'}
              onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-400 transition-all"
            >
              {ALL_UNITS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <Input
              label="Costo"
              type="text"
              value={newItem.cost ? formatNumber(newItem.cost) : '0'}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/\./g, '');
                const cost = parseFloat(numericValue) || 0;
                const marginPct = newItem.marginPct || 0;
                const margin = calculateMargin(cost, marginPct);
                const unitPrice = calculateUnitPrice(cost, marginPct);
                setNewItem({ 
                  ...newItem, 
                  cost,
                  margin,
                  unitPrice,
                  subtotal: calculateSubtotal(newItem.quantity || 0, unitPrice),
                });
              }}
            />
          </div>
          <div className="w-32">
            <Input
              label="Margen (%)"
              type="number"
              value={newItem.marginPct?.toString() || '0'}
              onChange={(e) => {
                const marginPct = parseFloat(e.target.value) || 0;
                const cost = newItem.cost || 0;
                const margin = calculateMargin(cost, marginPct);
                const unitPrice = calculateUnitPrice(cost, marginPct);
                setNewItem({ 
                  ...newItem, 
                  marginPct,
                  margin,
                  unitPrice,
                  subtotal: calculateSubtotal(newItem.quantity || 0, unitPrice),
                });
              }}
              placeholder="%"
              step="0.1"
              min="0"
            />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio Unit.</label>
            <div className="px-3 py-2.5 border border-gray-300 rounded-lg bg-blue-50 text-blue-900 font-semibold text-sm text-center h-[42px] flex items-center justify-center">
              {formatNumber(calculateUnitPrice(newItem.cost || 0, newItem.marginPct || 0))}
            </div>
          </div>
          <div className="w-32">
            <Button
              onClick={handleAddItem}
              variant="primary"
              className="w-full"
            >
              Agregar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

