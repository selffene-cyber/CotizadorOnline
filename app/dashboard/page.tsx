'use client';

// Página principal del Dashboard
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton';
import { Quote } from '@/types';
import { getAllQuotes } from '@/firebase/quotes';
import { getClientById } from '@/firebase/clients';
import { 
  PlusIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import ResponsiveTable, { TableColumn } from '@/components/ui/ResponsiveTable';

export default function DashboardPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      const allQuotes = await getAllQuotes();
      // Ordenar por fecha de creación descendente y tomar las últimas 10
      const recentQuotes = allQuotes
        .sort((a, b) => {
          const aDate = parseDate(a.createdAt) || new Date(0);
          const bDate = parseDate(b.createdAt) || new Date(0);
          return bDate.getTime() - aDate.getTime();
        })
        .slice(0, 10);
      
      // Cargar los clientes y recalcular totales para cada cotización
      const quotesWithClients = await Promise.all(
        recentQuotes.map(async (quote) => {
          let updatedQuote = { ...quote };
          
          // Cargar cliente si no está presente
          if (quote.clientId && !quote.client) {
            try {
              const client = await getClientById(quote.clientId);
              updatedQuote = { ...updatedQuote, client };
            } catch (error) {
              console.error(`Error cargando cliente ${quote.clientId}:`, error);
            }
          }
          
          // Recalcular totales si no tiene margenPct o si necesita recálculo
          if (!updatedQuote.totals?.margenPct || updatedQuote.totals.margenPct === 0) {
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
              
              // Calcular subtotal desde quoteItems (precio de venta)
              const subtotal = updatedQuote.quoteItems && updatedQuote.quoteItems.length > 0
                ? updatedQuote.quoteItems.reduce((sum, item) => sum + item.subtotal, 0)
                : 0;
              
              const iva = Math.round(subtotal * 0.19);
              const totalConIva = subtotal + iva;
              
              // Calcular margen porcentual
              const margenPct = costoTotal > 0 ? (margenBruto / costoTotal) * 100 : 0;
              
              // Actualizar totals
              updatedQuote.totals = {
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
              };
            } catch (error) {
              console.error(`Error calculando totales para cotización ${quote.id}:`, error);
            }
          }
          
          return updatedQuote;
        })
      );
      
      setQuotes(quotesWithClients);
    } catch (error) {
      console.error('Error cargando cotizaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotes = filter === 'all' 
    ? quotes 
    : quotes.filter(q => q.status === filter);

  // Helper para parsear fechas (Date, string ISO, o Timestamp de Firestore)
  const parseDate = (date: any): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof date === 'string') return new Date(date);
    if (date && typeof date.toDate === 'function') return date.toDate();
    return null;
  };

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

  const totalValue = quotes.reduce((sum, q) => sum + (q.totals?.totalConIva || 0), 0);
  const avgMargin = quotes.length > 0
    ? quotes.reduce((sum, q) => sum + (q.totals?.margenPct || 0), 0) / quotes.length
    : 0;
  const thisMonth = quotes.filter(q => {
    const created = parseDate(q.createdAt) || new Date(0);
    const now = new Date();
    return created.getMonth() === now.getMonth() && 
           created.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Resumen de tus cotizaciones</p>
          </div>
          <Link href="/quotes/new">
            <Button icon={<PlusIcon className="w-5 h-5" />} iconPosition="left">
              Nueva Cotización
            </Button>
          </Link>
        </div>

        {/* Métricas - Cards mejoradas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Cotizaciones</p>
                <p className="text-3xl font-bold text-gray-900">{quotes.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Valor Total</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Margen Promedio</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-gray-900">{avgMargin.toFixed(1)}%</p>
                        <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Este Mes</p>
                <p className="text-3xl font-bold text-gray-900">{thisMonth}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Cotizaciones Recientes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">Cotizaciones Recientes</h2>
              <div className="flex flex-wrap gap-2">
                {['all', 'Borrador', 'Enviada', 'Aprobada', 'Perdida'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filter === status
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    {status === 'all' ? 'Todas' : status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando cotizaciones...</p>
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="p-12 text-center">
              <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                No hay cotizaciones {filter !== 'all' ? `con estado ${filter}` : 'disponibles'}
              </p>
            </div>
          ) : (
            <ResponsiveTable
              data={filteredQuotes}
              columns={[
                {
                  key: 'client',
                  header: 'Cliente',
                  render: (quote) => quote.client?.name || 'N/A',
                  mobileLabel: 'Cliente',
                  mobilePriority: 1,
                },
                {
                  key: 'project',
                  header: 'Proyecto',
                  render: (quote) => quote.projectName,
                  mobileLabel: 'Proyecto',
                  mobilePriority: 2,
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
                  mobilePriority: 3,
                },
                {
                  key: 'total',
                  header: 'Total con IVA',
                  render: (quote) => formatCurrency(quote.totals?.totalConIva || 0),
                  align: 'right',
                  mobileLabel: 'Total con IVA',
                  mobilePriority: 4,
                },
                {
                  key: 'margin',
                  header: 'Margen',
                  render: (quote) => 
                    (quote.totals?.margenPct !== undefined && quote.totals.margenPct !== null 
                      ? quote.totals.margenPct.toFixed(1) 
                      : '0.0') + '%',
                  align: 'right',
                  mobileLabel: 'Margen',
                  mobilePriority: 5,
                },
                {
                  key: 'date',
                  header: 'Fecha',
                  render: (quote) => quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('es-CL') : 'N/A',
                  mobileLabel: 'Fecha',
                  mobilePriority: 6,
                },
              ]}
              keyExtractor={(quote) => quote.id || ''}
              emptyMessage={`No hay cotizaciones ${filter !== 'all' ? `con estado ${filter}` : 'disponibles'}`}
              actions={(quote) => (
                <Link 
                  href={`/quotes/${quote.id}`}
                  className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                  title="Ver detalles"
                >
                  <EyeIcon className="w-5 h-5" />
                </Link>
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}

