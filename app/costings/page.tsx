'use client';

// Página de listado de costeos
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Costing } from '@/types';
import { getAllCostings, deleteCosting, updateCosting } from '@/firebase/costings';
import Button from '@/components/ui/Button';
import ResponsiveTable, { TableColumn } from '@/components/ui/ResponsiveTable';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function CostingsPage() {
  const [costings, setCostings] = useState<Costing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCostings();
  }, []);

  const loadCostings = async () => {
    try {
      const allCostings = await getAllCostings();
      
      // Asignar números correlativos a costeos que no lo tengan y guardarlos
      const costingsWithoutNumber = allCostings.filter((c: Costing) => !c.costingNumber);
      
      if (costingsWithoutNumber.length > 0) {
        // Ordenar por fecha de creación (más antiguos primero)
        const sortedByDate = [...allCostings].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        });
        
        // Obtener el máximo número correlativo existente
        const existingNumbers = allCostings
          .filter((c: Costing) => c.costingNumber)
          .map((c: Costing) => c.costingNumber!)
          .filter((n: number) => n > 0);
        const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
        
        // Asignar números correlativos a los costeos sin número
        let nextNumber = maxNumber + 1;
        for (const costing of sortedByDate) {
          if (!costing.costingNumber && costing.id) {
            try {
              await updateCosting(costing.id, { costingNumber: nextNumber });
              nextNumber++;
            } catch (error) {
              console.error(`Error actualizando costeo ${costing.id}:`, error);
            }
          }
        }
        
        // Recargar los costeos después de actualizar
        const updatedCostings = await getAllCostings();
        setCostings(updatedCostings);
      } else {
        setCostings(allCostings);
      }
    } catch (error) {
      console.error('Error cargando costeos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (costingId: string, costingName: string) => {
    if (confirm(`¿Estás seguro de eliminar el costeo "${costingName}"? Esta acción no se puede deshacer.`)) {
      try {
        await deleteCosting(costingId);
        alert('Costeo eliminado exitosamente');
        loadCostings(); // Recargar la lista
      } catch (error) {
        console.error('Error eliminando costeo:', error);
        alert('Error al eliminar el costeo');
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const columns: TableColumn<Costing>[] = [
    {
      key: 'number',
      header: 'N°',
      render: (costing) => costing.costingNumber || '-',
      mobileLabel: 'N°',
      mobilePriority: 1,
    },
    {
      key: 'name',
      header: 'Nombre',
      render: (costing) => costing.name,
      mobileLabel: 'Nombre',
      mobilePriority: 2,
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (costing) => costing.type,
      mobileLabel: 'Tipo',
      mobilePriority: 4,
    },
    {
      key: 'modality',
      header: 'Modalidad',
      render: (costing) => costing.modality,
      mobileLabel: 'Modalidad',
      mobilePriority: 5,
    },
    {
      key: 'precioNeto',
      header: 'Precio Neto',
      render: (costing) => formatCurrency(costing.totals?.precioNeto || 0),
      align: 'right',
      mobileLabel: 'Precio Neto',
      mobilePriority: 3,
    },
    {
      key: 'totalConIva',
      header: 'Total con IVA',
      render: (costing) => formatCurrency(costing.totals?.totalConIva || 0),
      align: 'right',
      mobileLabel: 'Total con IVA',
      mobilePriority: 6,
    },
  ];

  const renderActions = (costing: Costing) => (
    <>
      <Link 
        href={`/costings/${costing.id}`} 
        className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
        title="Ver"
      >
        <EyeIcon className="w-5 h-5" />
      </Link>
      <Link 
        href={`/costings/${costing.id}/edit`} 
        className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
        title="Editar"
      >
        <PencilIcon className="w-5 h-5" />
      </Link>
      <button
        onClick={() => handleDelete(costing.id!, costing.name)}
        className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
        title="Eliminar"
      >
        <TrashIcon className="w-5 h-5" />
      </button>
    </>
  );

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Costeos</h1>
        <Link href="/costings/new">
          <Button>Nuevo Costeo</Button>
        </Link>
      </div>

      {costings.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <p className="text-gray-500 mb-4">No hay costeos creados</p>
          <Link href="/costings/new">
            <Button>Crear Primer Costeo</Button>
          </Link>
        </div>
      ) : (
        <ResponsiveTable
          data={costings}
          columns={columns}
          keyExtractor={(costing) => costing.id || ''}
          emptyMessage="No hay costeos creados"
          actions={renderActions}
        />
      )}
    </div>
  );
}

