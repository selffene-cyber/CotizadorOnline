'use client';

import { useState, useEffect } from 'react';
import { 
  LaborCatalogItem, 
  MaterialCatalogItem, 
  EquipmentCatalogItem 
} from '@/types';
import { 
  getLaborCatalog, 
  saveLaborCatalog,
  getMaterialsCatalog,
  saveMaterialsCatalog,
  getEquipmentCatalog,
  saveEquipmentCatalog
} from '@/firebase/catalogs';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ALL_UNITS } from '@/utils/units';
import ResponsiveTable, { TableColumn } from '@/components/ui/ResponsiveTable';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

type CatalogTab = 'labor' | 'materials' | 'equipment';

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState<CatalogTab>('labor');
  
  // Estados para cada catálogo
  const [laborItems, setLaborItems] = useState<LaborCatalogItem[]>([]);
  const [materialsItems, setMaterialsItems] = useState<MaterialCatalogItem[]>([]);
  const [equipmentItems, setEquipmentItems] = useState<EquipmentCatalogItem[]>([]);
  
  // Estados para formularios de edición
  const [editingLabor, setEditingLabor] = useState<LaborCatalogItem | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<MaterialCatalogItem | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentCatalogItem | null>(null);

  useEffect(() => {
    loadCatalogs();
  }, []);

  const loadCatalogs = async () => {
    try {
      const [labor, materials, equipment] = await Promise.all([
        getLaborCatalog(),
        getMaterialsCatalog(),
        getEquipmentCatalog()
      ]);
      
      // Asignar números correlativos a items que no lo tengan
      const laborWithNumbers = assignCorrelativeNumbers(labor);
      const materialsWithNumbers = assignCorrelativeNumbers(materials);
      const equipmentWithNumbers = assignCorrelativeNumbers(equipment);
      
      // Verificar si hubo cambios (si algún item no tenía número válido)
      const laborHasMissingNumbers = labor.some(item => {
        const num = item.number;
        return num === undefined || num === null || num === 0 || typeof num !== 'number';
      });
      const materialsHasMissingNumbers = materials.some(item => {
        const num = item.number;
        return num === undefined || num === null || num === 0 || typeof num !== 'number';
      });
      const equipmentHasMissingNumbers = equipment.some(item => {
        const num = item.number;
        return num === undefined || num === null || num === 0 || typeof num !== 'number';
      });
      
      // Guardar siempre si hubo cambios o si los arrays tienen diferente longitud
      if (laborHasMissingNumbers || labor.length !== laborWithNumbers.length) {
        await saveLaborCatalog(laborWithNumbers);
      }
      if (materialsHasMissingNumbers || materials.length !== materialsWithNumbers.length) {
        await saveMaterialsCatalog(materialsWithNumbers);
      }
      if (equipmentHasMissingNumbers || equipment.length !== equipmentWithNumbers.length) {
        await saveEquipmentCatalog(equipmentWithNumbers);
      }
      
      setLaborItems(laborWithNumbers);
      setMaterialsItems(materialsWithNumbers);
      setEquipmentItems(equipmentWithNumbers);
    } catch (error) {
      console.error('Error cargando catálogos:', error);
    }
  };

  // Función helper para asignar números correlativos
  const assignCorrelativeNumbers = <T extends { number?: number }>(items: T[]): T[] => {
    if (items.length === 0) return items;
    
    // Encontrar el número máximo existente
    let maxNumber = 0;
    items.forEach(item => {
      if (item.number && typeof item.number === 'number' && item.number > maxNumber) {
        maxNumber = item.number;
      }
    });
    
    // Asignar números a items que no lo tengan
    let currentNumber = maxNumber;
    const updated = items.map(item => {
      // Verificar si el item no tiene número válido
      if (item.number === undefined || item.number === null || item.number === 0 || typeof item.number !== 'number') {
        currentNumber++;
        return { ...item, number: currentNumber };
      }
      return item;
    });
    
    return updated;
  };

  // ===== MANO DE OBRA =====
  const handleAddLabor = () => {
    setEditingLabor({
      cargo: '',
      defaultCostHH: 0,
      category: ''
    });
  };

  const handleSaveLabor = async () => {
    if (!editingLabor || !editingLabor.cargo.trim()) return;
    
    const updated = [...laborItems];
    if (editingLabor.id) {
      // Editar existente
      const index = updated.findIndex(item => item.id === editingLabor.id);
      if (index >= 0) {
        updated[index] = editingLabor;
      }
    } else {
      // Agregar nuevo - generar número correlativo
      const maxNumber = laborItems.reduce((max, item) => {
        return item.number && item.number > max ? item.number : max;
      }, 0);
      const newItem: LaborCatalogItem = {
        ...editingLabor,
        id: Date.now().toString(),
        number: maxNumber + 1
      };
      updated.push(newItem);
    }
    
    setLaborItems(updated);
    await saveLaborCatalog(updated);
    setEditingLabor(null);
  };

  const handleDeleteLabor = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este item del catálogo?')) return;
    const updated = laborItems.filter(item => item.id !== id);
    setLaborItems(updated);
    await saveLaborCatalog(updated);
  };

  // ===== MATERIALES =====
  const handleAddMaterial = () => {
    setEditingMaterial({
      name: '',
      unidad: 'un',
      defaultMermaPct: 5,
      category: ''
    });
  };

  const handleSaveMaterial = async () => {
    if (!editingMaterial || !editingMaterial.name.trim()) return;
    
    const updated = [...materialsItems];
    if (editingMaterial.id) {
      const index = updated.findIndex(item => item.id === editingMaterial.id);
      if (index >= 0) {
        updated[index] = editingMaterial;
      }
    } else {
      // Agregar nuevo - generar número correlativo
      const maxNumber = materialsItems.reduce((max, item) => {
        return item.number && item.number > max ? item.number : max;
      }, 0);
      const newItem: MaterialCatalogItem = {
        ...editingMaterial,
        id: Date.now().toString(),
        number: maxNumber + 1
      };
      updated.push(newItem);
    }
    
    setMaterialsItems(updated);
    await saveMaterialsCatalog(updated);
    setEditingMaterial(null);
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este item del catálogo?')) return;
    const updated = materialsItems.filter(item => item.id !== id);
    setMaterialsItems(updated);
    await saveMaterialsCatalog(updated);
  };

  // ===== EQUIPOS =====
  const handleAddEquipment = () => {
    setEditingEquipment({
      name: '',
      unit: 'día',
      defaultRate: 0,
      category: ''
    });
  };

  const handleSaveEquipment = async () => {
    if (!editingEquipment || !editingEquipment.name.trim()) return;
    
    const updated = [...equipmentItems];
    if (editingEquipment.id) {
      const index = updated.findIndex(item => item.id === editingEquipment.id);
      if (index >= 0) {
        updated[index] = editingEquipment;
      }
    } else {
      // Agregar nuevo - generar número correlativo
      const maxNumber = equipmentItems.reduce((max, item) => {
        return item.number && item.number > max ? item.number : max;
      }, 0);
      const newItem: EquipmentCatalogItem = {
        ...editingEquipment,
        id: Date.now().toString(),
        number: maxNumber + 1
      };
      updated.push(newItem);
    }
    
    setEquipmentItems(updated);
    await saveEquipmentCatalog(updated);
    setEditingEquipment(null);
  };

  const handleDeleteEquipment = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este item del catálogo?')) return;
    const updated = equipmentItems.filter(item => item.id !== id);
    setEquipmentItems(updated);
    await saveEquipmentCatalog(updated);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo</h1>
        <p className="text-gray-600 mt-1">Gestiona los catálogos de Mano de Obra, Materiales y Equipos</p>
      </div>

      {/* Pestañas */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('labor')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'labor'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Mano de Obra
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'materials'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Materiales
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'equipment'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Equipos y Herramientas
          </button>
        </nav>
      </div>

      {/* Contenido de Mano de Obra */}
      {activeTab === 'labor' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Mano de Obra</h2>
            <Button onClick={handleAddLabor} variant="outline">Agregar</Button>
          </div>

          {editingLabor && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">
                {editingLabor.id ? 'Editar' : 'Nuevo'} Item
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cargo *
                  </label>
                  <Input
                    value={editingLabor.cargo}
                    onChange={(e) => setEditingLabor({ ...editingLabor, cargo: e.target.value })}
                    placeholder="Ej: Soldador"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo por HH ($) *
                  </label>
                  <Input
                    type="number"
                    value={editingLabor.defaultCostHH}
                    onChange={(e) => setEditingLabor({ ...editingLabor, defaultCostHH: parseFloat(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <Input
                    value={editingLabor.category || ''}
                    onChange={(e) => setEditingLabor({ ...editingLabor, category: e.target.value })}
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSaveLabor}>Guardar</Button>
                <Button variant="outline" onClick={() => setEditingLabor(null)}>Cancelar</Button>
              </div>
            </div>
          )}

          <ResponsiveTable
            data={laborItems}
            columns={[
              {
                key: 'number',
                header: 'N°',
                render: (item) => item.number !== undefined && item.number !== null && item.number > 0 ? item.number : '-',
                mobileLabel: 'N°',
                mobilePriority: 1,
              },
              {
                key: 'cargo',
                header: 'Cargo',
                render: (item) => item.cargo,
                mobileLabel: 'Cargo',
                mobilePriority: 2,
              },
              {
                key: 'cost',
                header: 'Costo/HH',
                render: (item) => `$${item.defaultCostHH.toLocaleString('es-CL')}`,
                mobileLabel: 'Costo/HH',
                mobilePriority: 3,
              },
              {
                key: 'category',
                header: 'Categoría',
                render: (item) => item.category || '-',
                mobileLabel: 'Categoría',
                mobilePriority: 4,
              },
            ]}
            keyExtractor={(item) => item.id || ''}
            emptyMessage="No hay items en el catálogo"
            actions={(item) => (
              <>
                <button
                  onClick={() => setEditingLabor(item)}
                  className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
                  title="Editar"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteLabor(item.id!)}
                  className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                  title="Eliminar"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </>
            )}
          />
        </div>
      )}

      {/* Contenido de Materiales */}
      {activeTab === 'materials' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Materiales</h2>
            <Button onClick={handleAddMaterial} variant="outline">Agregar</Button>
          </div>

          {editingMaterial && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">
                {editingMaterial.id ? 'Editar' : 'Nuevo'} Item
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <Input
                    value={editingMaterial.name}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, name: e.target.value })}
                    placeholder="Ej: Acero A36"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad *
                  </label>
                  <select
                    value={editingMaterial.unidad}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, unidad: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ALL_UNITS.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.value}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Merma % *
                  </label>
                  <Input
                    type="number"
                    value={editingMaterial.defaultMermaPct}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, defaultMermaPct: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <Input
                    value={editingMaterial.category || ''}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, category: e.target.value })}
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSaveMaterial}>Guardar</Button>
                <Button variant="outline" onClick={() => setEditingMaterial(null)}>Cancelar</Button>
              </div>
            </div>
          )}

          <ResponsiveTable
            data={materialsItems}
            columns={[
              {
                key: 'number',
                header: 'N°',
                render: (item) => item.number !== undefined && item.number !== null && item.number > 0 ? item.number : '-',
                mobileLabel: 'N°',
                mobilePriority: 1,
              },
              {
                key: 'name',
                header: 'Nombre',
                render: (item) => item.name,
                mobileLabel: 'Nombre',
                mobilePriority: 2,
              },
              {
                key: 'unidad',
                header: 'Unidad',
                render: (item) => item.unidad,
                mobileLabel: 'Unidad',
                mobilePriority: 3,
              },
              {
                key: 'merma',
                header: 'Merma %',
                render: (item) => `${item.defaultMermaPct}%`,
                mobileLabel: 'Merma %',
                mobilePriority: 4,
              },
              {
                key: 'category',
                header: 'Categoría',
                render: (item) => item.category || '-',
                mobileLabel: 'Categoría',
                mobilePriority: 5,
              },
            ]}
            keyExtractor={(item) => item.id || ''}
            emptyMessage="No hay items en el catálogo"
            actions={(item) => (
              <>
                <button
                  onClick={() => setEditingMaterial(item)}
                  className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
                  title="Editar"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteMaterial(item.id!)}
                  className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                  title="Eliminar"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </>
            )}
          />
        </div>
      )}

      {/* Contenido de Equipos */}
      {activeTab === 'equipment' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Equipos y Herramientas</h2>
            <Button onClick={handleAddEquipment} variant="outline">Agregar</Button>
          </div>

          {editingEquipment && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">
                {editingEquipment.id ? 'Editar' : 'Nuevo'} Item
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <Input
                    value={editingEquipment.name}
                    onChange={(e) => setEditingEquipment({ ...editingEquipment, name: e.target.value })}
                    placeholder="Ej: Grúa Horquilla"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad *
                  </label>
                  <select
                    value={editingEquipment.unit}
                    onChange={(e) => setEditingEquipment({ ...editingEquipment, unit: e.target.value as 'día' | 'hora' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="día">día</option>
                    <option value="hora">hora</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tarifa por Defecto ($)
                  </label>
                  <Input
                    type="number"
                    value={editingEquipment.defaultRate || 0}
                    onChange={(e) => setEditingEquipment({ ...editingEquipment, defaultRate: parseFloat(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <Input
                    value={editingEquipment.category || ''}
                    onChange={(e) => setEditingEquipment({ ...editingEquipment, category: e.target.value })}
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSaveEquipment}>Guardar</Button>
                <Button variant="outline" onClick={() => setEditingEquipment(null)}>Cancelar</Button>
              </div>
            </div>
          )}

          <ResponsiveTable
            data={equipmentItems}
            columns={[
              {
                key: 'number',
                header: 'N°',
                render: (item) => item.number !== undefined && item.number !== null && item.number > 0 ? item.number : '-',
                mobileLabel: 'N°',
                mobilePriority: 1,
              },
              {
                key: 'name',
                header: 'Nombre',
                render: (item) => item.name,
                mobileLabel: 'Nombre',
                mobilePriority: 2,
              },
              {
                key: 'unit',
                header: 'Unidad',
                render: (item) => item.unit,
                mobileLabel: 'Unidad',
                mobilePriority: 3,
              },
              {
                key: 'rate',
                header: 'Tarifa',
                render: (item) => item.defaultRate ? `$${item.defaultRate.toLocaleString('es-CL')}` : '-',
                mobileLabel: 'Tarifa',
                mobilePriority: 4,
              },
              {
                key: 'category',
                header: 'Categoría',
                render: (item) => item.category || '-',
                mobileLabel: 'Categoría',
                mobilePriority: 5,
              },
            ]}
            keyExtractor={(item) => item.id || ''}
            emptyMessage="No hay items en el catálogo"
            actions={(item) => (
              <>
                <button
                  onClick={() => setEditingEquipment(item)}
                  className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
                  title="Editar"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteEquipment(item.id!)}
                  className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                  title="Eliminar"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </>
            )}
          />
        </div>
      )}
    </div>
  );
}

