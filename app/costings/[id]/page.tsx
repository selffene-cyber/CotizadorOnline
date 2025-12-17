'use client';

// Página de visualización de costeo
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCostingById, deleteCosting } from '@/supabase/costings';
import { getCompanySettings } from '@/supabase/settings';
import { getClientById } from '@/supabase/clients';
import { Costing, CompanySettings, Client } from '@/types';
import { generateCostingFileName } from '@/utils/exporters/costing-pdf';
import Button from '@/components/ui/Button';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import CostingPDFDocument from '@/utils/exporters/costing-pdf';
import { exportCostingToExcel } from '@/utils/exporters/costing-excel';
import { ArrowDownTrayIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export default function CostingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const costingId = params.id as string;
  const [costing, setCosting] = useState<Costing | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCosting();
    loadCompanySettings();
  }, [costingId]);

  // Cargar cliente cuando cambie el costing o clientId
  useEffect(() => {
    const loadClient = async () => {
      if (costing?.clientId && !client) {
        try {
          const clientData = await getClientById(costing.clientId);
          if (clientData) {
            setClient(clientData);
          }
        } catch (error) {
          console.error('Error cargando cliente:', error);
        }
      }
    };
    if (costing) {
      loadClient();
    }
  }, [costing?.clientId]);

  const loadCompanySettings = async () => {
    try {
      const settings = await getCompanySettings();
      setCompanySettings(settings);
    } catch (error) {
      console.error('Error cargando configuración de empresa:', error);
    }
  };

  const loadCosting = async () => {
    try {
      const costingData = await getCostingById(costingId);
      if (costingData) {
        setCosting(costingData);
        // Cargar cliente si existe
        if (costingData.clientId) {
          try {
            const clientData = await getClientById(costingData.clientId);
            setClient(clientData ?? null);
          } catch (error) {
            console.error('Error cargando cliente:', error);
          }
        }
      } else {
        alert('Costeo no encontrado');
        router.push('/costings');
      }
    } catch (error) {
      console.error('Error cargando costeo:', error);
      alert('Error al cargar el costeo');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!costing) return;
    
    setExporting('pdf');
    setShowExportDropdown(false);
    
    try {
      // Asegurarse de que el cliente esté cargado
      let clientToUse = client;
      if (!clientToUse && costing.clientId) {
        try {
          clientToUse = await getClientById(costing.clientId);
          if (clientToUse) {
            setClient(clientToUse);
          }
        } catch (error) {
          console.error('Error cargando cliente para PDF:', error);
        }
      }
      
      // Usar la misma función que el PDF para generar el nombre del archivo
      const fileName = generateCostingFileName(costing, clientToUse);
      
      // Validar que el nombre del archivo sea válido
      if (!fileName || fileName.trim() === '') {
        console.error('Nombre de archivo inválido:', fileName);
        alert('Error: No se pudo generar el nombre del archivo');
        return;
      }
      
      // Generar el blob del PDF
      const blob = await pdf(<CostingPDFDocument costing={costing} companySettings={companySettings} client={clientToUse} />).toBlob();
      
      // Verificar que el blob se haya generado correctamente
      if (!blob || blob.size === 0) {
        console.error('Error: El blob del PDF está vacío');
        alert('Error al generar el PDF');
        return;
      }
      
      // Crear URL del objeto blob directamente
      const url = URL.createObjectURL(blob);
      
      // Crear y configurar el link de descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName; // Establecer el nombre del archivo
      link.setAttribute('download', fileName); // Asegurar el atributo download
      link.style.display = 'none';
      
      // Agregar al DOM, hacer click y remover
      document.body.appendChild(link);
      link.click();
      
      // Limpiar después de un pequeño delay para asegurar la descarga
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error exportando PDF:', error);
      alert('Error al exportar PDF');
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = () => {
    if (!costing) return;
    
    setExporting('excel');
    setShowExportDropdown(false);
    
    try {
      exportCostingToExcel(costing);
    } catch (error) {
      console.error('Error exportando Excel:', error);
      alert('Error al exportar Excel');
    } finally {
      setExporting(null);
    }
  };

  const handlePreviewPDF = async () => {
    if (!costing) return;
    
    setShowExportDropdown(false);
    
    // Asegurarse de que el cliente esté cargado antes de mostrar la vista previa
    let clientToUse = client;
    if (!clientToUse && costing.clientId) {
      try {
        clientToUse = await getClientById(costing.clientId);
        if (clientToUse) {
          setClient(clientToUse);
        }
      } catch (error) {
        console.error('Error cargando cliente para vista previa:', error);
      }
    }
    
    setShowPDFPreview(true);
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    if (showExportDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  const handleDelete = async () => {
    if (!costing) return;
    
    if (confirm('¿Estás seguro de eliminar este costeo? Esta acción no se puede deshacer.')) {
      try {
        await deleteCosting(costingId);
        alert('Costeo eliminado exitosamente');
        router.push('/costings');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando costeo...</p>
        </div>
      </div>
    );
  }

  if (!costing) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Costeo no encontrado</p>
      </div>
    );
  }

  if (showPDFPreview && costing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
        <div className="bg-white rounded-lg w-full h-full max-w-6xl flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold">Vista Previa PDF - Costeo</h2>
            <Button onClick={() => setShowPDFPreview(false)} variant="outline">
              Cerrar Vista Previa
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <PDFViewer width="100%" height="100%">
              <CostingPDFDocument costing={costing} companySettings={companySettings} client={client} />
            </PDFViewer>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Costeo: {costing.name}</h1>
          <p className="text-gray-600 mt-1">
            {costing.type} - {costing.modality}
          </p>
          {costing.description && (
            <p className="text-gray-600 mt-1">{costing.description}</p>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push(`/costings/${costingId}/edit`)}>
            Editar
          </Button>
          
          {/* Botón de Exportación con Dropdown */}
          <div className="relative z-50" ref={dropdownRef}>
            <Button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              variant="outline"
              disabled={exporting !== null}
              icon={<ArrowDownTrayIcon className="w-5 h-5" />}
              iconPosition="left"
            >
              <span className="flex items-center gap-2">
                {exporting ? 'Exportando...' : 'Descargar'}
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
              </span>
            </Button>
            
            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[10000]" style={{ zIndex: 10000 }}>
                <button
                  onClick={handlePreviewPDF}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={exporting !== null}
                >
                  <span className="text-blue-600 font-semibold">👁</span>
                  <span>Vista Previa PDF</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={exporting !== null}
                >
                  <span className="text-red-600 font-semibold">PDF</span>
                  <span>{exporting === 'pdf' ? 'Exportando...' : 'Exportar PDF'}</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={exporting !== null}
                >
                  <span className="text-green-600 font-semibold">XLS</span>
                  <span>{exporting === 'excel' ? 'Exportando...' : 'Exportar Excel'}</span>
                </button>
              </div>
            )}
          </div>
          
          <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
            Eliminar
          </Button>
        </div>
      </div>

      {/* Resumen Ejecutivo */}
      {costing.totals && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen Ejecutivo</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Costo Directo</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(costing.totals.costoDirecto)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Indirectos de Obra</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(costing.totals.indirectosObra)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Subtotal Costo</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(costing.totals.subtotalCosto)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gastos Generales ({costing.ggPercentage}%)</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(costing.totals.gastosGenerales)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Base</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(costing.totals.base)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contingencia</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(costing.totals.contingencia)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Costo Total</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(costing.totals.costoTotal)}</p>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-sm text-gray-600">Utilidad ({costing.utilityPercentage}%)</p>
                <span className="text-xs text-gray-400" title="Utilidad: Porcentaje aplicado sobre el Costo Total. Precio = Costo × (1 + Utilidad%)">
                  ⓘ
                </span>
              </div>
              <p className="text-lg font-bold text-green-700">{formatCurrency(costing.totals.margenBruto)}</p>
              <p className="text-xs text-gray-500 mt-1">
                Sobre Costo Total
              </p>
            </div>
            <div className="col-span-2 md:col-span-4 border-t pt-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Precio Neto</p>
                  <p className="text-xl font-bold text-blue-900">{formatCurrency(costing.totals.precioNeto)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">IVA (19%)</p>
                  <p className="text-xl font-bold text-blue-700">{formatCurrency(costing.totals.iva)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total con IVA</p>
                  <p className="text-xl font-bold text-green-700">{formatCurrency(costing.totals.totalConIva)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-600">Margen Bruto</p>
                  <p className="text-lg font-bold">{formatCurrency(costing.totals.margenBruto)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm text-gray-600">Margen %</p>
                    <span className="text-xs text-gray-400" title="Margen: Porcentaje de ganancia sobre el Precio Neto. Margen% = (Ganancia / Precio) × 100">
                      ⓘ
                    </span>
                  </div>
                  <p className="text-lg font-bold">{costing.totals?.margenPct ? costing.totals.margenPct.toFixed(2) : '0.00'}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Sobre Precio Neto
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mark-up</p>
                  <p className="text-lg font-bold">{costing.totals?.markup ? (costing.totals.markup * 100).toFixed(2) : '0.00'}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Explicación Utilidad vs Margen */}
          <div className="mt-6 p-4 bg-white rounded-lg border border-blue-300">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">💡 Diferencia entre Utilidad y Margen</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-green-700">Utilidad {costing.utilityPercentage}%:</span>
                </div>
                <p className="text-gray-700 ml-4">
                  Es el porcentaje que <strong>aplicas sobre tu Costo Total</strong> para obtener el precio.
                </p>
                <p className="text-gray-600 ml-4 text-xs">
                  Fórmula: <strong>Precio Neto = Costo Total × (1 + {costing.utilityPercentage}%)</strong>
                </p>
                <p className="text-gray-600 ml-4 text-xs">
                  Ejemplo: ${costing.totals.costoTotal.toLocaleString('es-CL')} × 1.{costing.utilityPercentage} = ${costing.totals.precioNeto.toLocaleString('es-CL')}
                </p>
                <p className="text-gray-500 ml-4 text-xs italic">
                  "Quiero ganar {costing.utilityPercentage}% sobre mi costo"
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-purple-700">Margen {costing.totals?.margenPct ? costing.totals.margenPct.toFixed(2) : '0.00'}%:</span>
                </div>
                <p className="text-gray-700 ml-4">
                  Es el porcentaje de ganancia que representa del <strong>Precio Neto final</strong>.
                </p>
                <p className="text-gray-600 ml-4 text-xs">
                  Fórmula: <strong>Margen% = (Ganancia / Precio Neto) × 100</strong>
                </p>
                <p className="text-gray-600 ml-4 text-xs">
                  Ejemplo: (${costing.totals.margenBruto.toLocaleString('es-CL')} / ${costing.totals.precioNeto.toLocaleString('es-CL')}) × 100 = {costing.totals?.margenPct ? costing.totals.margenPct.toFixed(2) : '0.00'}%
                </p>
                <p className="text-gray-500 ml-4 text-xs italic">
                  "Del precio que cobro, el {costing.totals?.margenPct ? costing.totals.margenPct.toFixed(2) : '0.00'}% es ganancia"
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                <strong>Resumen:</strong> La Utilidad se calcula sobre el costo (70% = ganas 70% sobre lo que te costó). 
                El Margen se calcula sobre el precio (41.18% = del precio final, el 41.18% es ganancia). 
                Son dos formas diferentes de expresar la ganancia.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detalles por sección - Se pueden mostrar como resumen o simplemente indicar que se ve en el PDF/Excel */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Detalle del Costeo</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Items de Mano de Obra</p>
            <p className="text-lg font-semibold">{costing.itemsMO?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Items de Materiales</p>
            <p className="text-lg font-semibold">{costing.itemsMaterials?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Items de Equipos</p>
            <p className="text-lg font-semibold">{costing.itemsEquipment?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Items Indirectos</p>
            <p className="text-lg font-semibold">{costing.itemsIndirects?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Logística</p>
            <p className="text-lg font-semibold">
              {costing.itemsLogistics && costing.itemsLogistics.subtotal > 0 ? 'Incluida' : 'No incluida'}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Para ver el detalle completo de todos los items, exporta el costeo a PDF o Excel.
        </p>
      </div>
    </div>
  );
}

