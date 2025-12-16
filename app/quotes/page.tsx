'use client';

// Página de todas las cotizaciones
import { useEffect, useState } from 'react';
import { getAllQuotes } from '@/firebase/quotes';
import { Quote } from '@/types';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton';
import { formatRUT } from '@/utils/validations/rut';
import { getClientById } from '@/firebase/clients';
import { PlusIcon, DocumentTextIcon, MagnifyingGlassIcon, XMarkIcon, CheckCircleIcon, PaperAirplaneIcon, XCircleIcon, ChartBarIcon, EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
import Input from '@/components/ui/Input';
import ResponsiveTable, { TableColumn } from '@/components/ui/ResponsiveTable';

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [clientFilter, setClientFilter] = useState<string>('');
  const [quoteNumberFilter, setQuoteNumberFilter] = useState<string>('');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      const allQuotes = await getAllQuotes();
      
      // Cargar clientes y recalcular totales
      const quotesWithTotals = await Promise.all(
        allQuotes.map(async (quote) => {
          let updatedQuote = { ...quote };
          
          // Cargar cliente si no está presente
          if (quote.clientId && !quote.client) {
            try {
              const client = await getClientById(quote.clientId);
              updatedQuote = { ...updatedQuote, client: client ?? undefined };
            } catch (error) {
              console.error(`Error cargando cliente ${quote.clientId}:`, error);
            }
          }
          
          // Cargar utilityPercentage desde el costeo asociado si no está presente
          if ((updatedQuote.utilityPercentage === undefined || updatedQuote.utilityPercentage === null) &&
              updatedQuote.costingReferences && updatedQuote.costingReferences.length > 0) {
            try {
              const { getCostingById } = await import('@/firebase/costings');
              const firstCosting = await getCostingById(updatedQuote.costingReferences[0]);
              if (firstCosting && (firstCosting.utilityPercentage !== undefined && firstCosting.utilityPercentage !== null)) {
                updatedQuote = { ...updatedQuote, utilityPercentage: firstCosting.utilityPercentage };
              }
            } catch (err) {
              console.error(`Error obteniendo utilityPercentage del costeo ${updatedQuote.costingReferences[0]}:`, err);
            }
          }
          
          // Si ya tiene margenPct calculado y es válido, retornar con cliente cargado
          if (updatedQuote.totals?.margenPct !== undefined && updatedQuote.totals.margenPct !== null) {
            return updatedQuote;
          }
          
          // Recalcular totales
          try {
            let costoDirecto = 0;
            let indirectosObra = 0;
            let gastosGenerales = 0;
            let contingencia = 0;
            let costoTotal = 0;
            let margenBruto = 0;
            
            // Si hay costeos asociados, sumar sus totales
            if (updatedQuote.costingReferences && updatedQuote.costingReferences.length > 0) {
              const { getCostingById } = await import('@/firebase/costings');
              for (const costingId of updatedQuote.costingReferences) {
                try {
                  const costing = await getCostingById(costingId);
                  if (costing && costing.totals) {
                    costoDirecto += costing.totals.costoDirecto || 0;
                    indirectosObra += costing.totals.indirectosObra || 0;
                    gastosGenerales += costing.totals.gastosGenerales || 0;
                    contingencia += costing.totals.contingencia || 0;
                    costoTotal += costing.totals.costoTotal || 0;
                    margenBruto += (costing.totals.margenBruto || 0);
                  }
                } catch (err) {
                  console.error(`Error cargando costeo ${costingId}:`, err);
                }
              }
            }
            
            // Para items agregados manualmente (sin costeo), usar el costo del item
            if (updatedQuote.quoteItems && updatedQuote.quoteItems.length > 0) {
              for (const item of updatedQuote.quoteItems) {
                if (!item.costingId) {
                  const itemCosto = (item.cost || 0) * item.quantity;
                  costoDirecto += itemCosto;
                  costoTotal += itemCosto;
                  margenBruto += (item.margin || 0) * item.quantity;
                }
              }
            }
            
            // Calcular subtotal desde quoteItems
            const subtotal = updatedQuote.quoteItems && updatedQuote.quoteItems.length > 0
              ? updatedQuote.quoteItems.reduce((sum, item) => sum + item.subtotal, 0)
              : 0;
            
            const iva = Math.round(subtotal * 0.19);
            const totalConIva = subtotal + iva;
            
            // Calcular margen porcentual
            const margenPct = costoTotal > 0 ? (margenBruto / costoTotal) * 100 : 0;
            
            // Actualizar totals (preservar utilityPercentage si ya fue cargado)
            return {
              ...updatedQuote,
              totals: {
                ...updatedQuote.totals,
                costoDirecto,
                indirectosObra,
                gastosGenerales,
                contingencia,
                costoTotal,
                precioNeto: subtotal,
                precioVenta: subtotal,
                margenBruto,
                margenPct,
                subtotal,
                iva,
                totalConIva,
              },
              // Preservar utilityPercentage si fue cargado desde el costeo
              utilityPercentage: updatedQuote.utilityPercentage,
            };
          } catch (error) {
            console.error(`Error calculando totales para cotización ${quote.id}:`, error);
            return updatedQuote;
          }
        })
      );
      
      setQuotes(quotesWithTotals);
    } catch (error) {
      console.error('Error cargando cotizaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar todos los filtros
  const filteredQuotes = quotes.filter(quote => {
    // Filtro por estado
    if (filter !== 'all' && quote.status !== filter) {
      return false;
    }
    
    // Filtro por cliente
    if (clientFilter && quote.client?.name) {
      const clientName = quote.client.name.toLowerCase();
      if (!clientName.includes(clientFilter.toLowerCase())) {
        return false;
      }
    }
    
    // Filtro por número de cotización
    if (quoteNumberFilter) {
      const quoteNum = quote.quoteNumber?.toString() || '';
      if (!quoteNum.includes(quoteNumberFilter)) {
        return false;
      }
    }
    
    // Filtro por fecha desde
    if (dateFromFilter && quote.createdAt) {
      const quoteDate = new Date(quote.createdAt);
      const fromDate = new Date(dateFromFilter);
      fromDate.setHours(0, 0, 0, 0);
      if (quoteDate < fromDate) {
        return false;
      }
    }
    
    // Filtro por fecha hasta
    if (dateToFilter && quote.createdAt) {
      const quoteDate = new Date(quote.createdAt);
      const toDate = new Date(dateToFilter);
      toDate.setHours(23, 59, 59, 999);
      if (quoteDate > toDate) {
        return false;
      }
    }
    
    return true;
  });

  const clearFilters = () => {
    setClientFilter('');
    setQuoteNumberFilter('');
    setDateFromFilter('');
    setDateToFilter('');
  };

  const hasActiveFilters = clientFilter || quoteNumberFilter || dateFromFilter || dateToFilter;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: Quote['status']): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
    const variants = {
      'Borrador': 'default' as const,
      'Enviada': 'info' as const,
      'Aprobada': 'success' as const,
      'Perdida': 'danger' as const,
    };
    return variants[status];
  };

  // Calcular métricas
  const aprobadas = quotes.filter(q => q.status === 'Aprobada').length;
  const enviadas = quotes.filter(q => q.status === 'Enviada').length;
  const perdidas = quotes.filter(q => q.status === 'Perdida').length;
  const winRate = (aprobadas + perdidas) > 0 
    ? ((aprobadas / (aprobadas + perdidas)) * 100).toFixed(1) 
    : '0.0';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <SkeletonCard className="h-20 mb-4" />
          </div>
          <SkeletonCard className="h-16 mb-6" />
          <SkeletonTable rows={8} cols={7} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-slide-down">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cotizaciones</h1>
            <p className="text-gray-600 mt-1">Gestiona todas tus cotizaciones</p>
          </div>
          <Link href="/quotes/new">
            <Button icon={<PlusIcon className="w-5 h-5" />} iconPosition="left">
              Nueva Cotización
            </Button>
          </Link>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-slide-down" style={{ animationDelay: '0.05s' }}>
          {/* Card Aprobadas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aprobadas</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{aprobadas}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Card Enviadas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Enviadas</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{enviadas}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <PaperAirplaneIcon className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Card Perdidas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Perdidas</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{perdidas}</p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <XCircleIcon className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>

          {/* Card Win Rate */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Win Rate</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{winRate}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {aprobadas} de {aprobadas + perdidas} finalizadas
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <ChartBarIcon className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 animate-slide-down" style={{ animationDelay: '0.1s' }}>
          {/* Filtros por Estado */}
          <div className="flex gap-2 flex-wrap mb-4">
            {['all', 'Borrador', 'Enviada', 'Aprobada', 'Perdida'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === status
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {status === 'all' ? 'Todas' : status}
              </button>
            ))}
          </div>

          {/* Filtros Avanzados */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
                Filtros Avanzados
                {hasActiveFilters && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {[clientFilter, quoteNumberFilter, dateFromFilter, dateToFilter].filter(Boolean).length}
                  </span>
                )}
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <XMarkIcon className="w-4 h-4" />
                  Limpiar filtros
                </button>
              )}
            </div>

            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                {/* Filtro por Cliente */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Cliente
                  </label>
                  <input
                    type="text"
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value)}
                    placeholder="Buscar por cliente..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Filtro por Número de Cotización */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    N° Cotización
                  </label>
                  <input
                    type="text"
                    value={quoteNumberFilter}
                    onChange={(e) => setQuoteNumberFilter(e.target.value)}
                    placeholder="Buscar por número..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Filtro por Fecha Desde */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Fecha Desde
                  </label>
                  <input
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Filtro por Fecha Hasta */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Fecha Hasta
                  </label>
                  <input
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                    min={dateFromFilter || undefined}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lista de cotizaciones */}
        <ResponsiveTable
          data={filteredQuotes}
          columns={[
            {
              key: 'number',
              header: 'N°',
              render: (quote) => quote.quoteNumber || 'N/A',
              mobileLabel: 'N°',
              mobilePriority: 1,
            },
            {
              key: 'client',
              header: 'Cliente',
              render: (quote) => quote.client?.name || 'N/A',
              mobileLabel: 'Cliente',
              mobilePriority: 2,
            },
            {
              key: 'project',
              header: 'Proyecto',
              render: (quote) => quote.projectName,
              mobileLabel: 'Proyecto',
              mobilePriority: 3,
            },
            {
              key: 'status',
              header: 'Estado',
              render: (quote) => (
                <Badge variant={getStatusBadgeVariant(quote.status)} size="sm">
                  {quote.status}
                </Badge>
              ),
              mobileLabel: 'Estado',
              mobilePriority: 4,
            },
            {
              key: 'total',
              header: 'Total con IVA',
              render: (quote) => formatCurrency(quote.totals?.totalConIva || 0),
              align: 'right',
              mobileLabel: 'Total con IVA',
              mobilePriority: 5,
            },
            {
              key: 'utility',
              header: 'Utilidad',
              render: (quote) => 
                (quote.utilityPercentage !== undefined && quote.utilityPercentage !== null 
                  ? quote.utilityPercentage.toFixed(1) 
                  : '0.0') + '%',
              align: 'right',
              mobileLabel: 'Utilidad',
              mobilePriority: 6,
            },
            {
              key: 'date',
              header: 'Fecha',
              render: (quote) => quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('es-CL') : 'N/A',
              mobileLabel: 'Fecha',
              mobilePriority: 7,
            },
          ]}
          keyExtractor={(quote) => quote.id || ''}
          emptyMessage={
            hasActiveFilters 
              ? 'No se encontraron cotizaciones con los filtros aplicados'
              : filter !== 'all' 
                ? `No hay cotizaciones con estado ${filter}`
                : 'No hay cotizaciones disponibles'
          }
          actions={(quote) => (
            <>
              <Link 
                href={`/quotes/${quote.id}`}
                className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                title="Ver"
              >
                <EyeIcon className="w-5 h-5" />
              </Link>
              {quote.status === 'Borrador' && (
                <Link 
                  href={`/quotes/${quote.id}/costeo`}
                  className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
                  title="Editar"
                >
                  <PencilIcon className="w-5 h-5" />
                </Link>
              )}
            </>
          )}
          className="animate-fade-in"
        />
      </div>
    </div>
  );
}

