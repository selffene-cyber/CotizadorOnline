'use client';

// Vista de detalle de cotización
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getQuoteById, updateQuote, duplicateQuote, deleteQuote } from '@/firebase/quotes';
import { getClientById } from '@/firebase/clients';
import { Quote, Client, ProjectType, Modality, Costing } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { SkeletonCard, SkeletonText } from '@/components/ui/Skeleton';
import ExportButtons from '@/components/quote/ExportButtons';
import { 
  PencilIcon, 
  DocumentTextIcon,
  CalendarIcon,
  MapPinIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingGeneralInfo, setEditingGeneralInfo] = useState(false);
  const [editingScope, setEditingScope] = useState(false);
  const [editingExclusions, setEditingExclusions] = useState(false);
  const [editingAssumptions, setEditingAssumptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    type: '',
    modality: '',
    region: '',
    city: '',
    executionDeadline: 0,
    validity: 0,
    scope: '',
    exclusions: '',
    assumptions: '',
    paymentTerms: '',
  });

  useEffect(() => {
    loadData();
  }, [quoteId]);

  const loadData = async () => {
    try {
      const quoteData = await getQuoteById(quoteId);
      if (quoteData) {
        // Calcular totales desde quoteItems y costeos asociados
        let costoDirecto = 0;
        let indirectosObra = 0;
        let gastosGenerales = 0;
        let contingencia = 0;
        let costoTotal = 0;
        let margenBruto = 0;
        
        // Recopilar IDs de costeos únicos desde los items
        const costingIdsSet = new Set<string>();
        if (quoteData.quoteItems && quoteData.quoteItems.length > 0) {
          quoteData.quoteItems.forEach(item => {
            // Buscar si el item tiene referencia a costeo (puede venir en costeoReference o en algún campo relacionado)
            // Por ahora usamos costingReferences del quote
          });
        }
        
        // Si hay costeos asociados en costingReferences, sumar sus totales
        if (quoteData.costingReferences && quoteData.costingReferences.length > 0) {
          const { getCostingById } = await import('@/firebase/costings');
          for (const costingId of quoteData.costingReferences) {
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
        if (quoteData.quoteItems && quoteData.quoteItems.length > 0) {
          for (const item of quoteData.quoteItems) {
            // Si el item NO viene de un costeo (no tiene costingId), agregar su costo
            if (!item.costingId) {
              const itemCosto = (item.cost || 0) * item.quantity;
              costoDirecto += itemCosto; // Asumimos que es costo directo si no viene de costeo
              costoTotal += itemCosto;
              margenBruto += (item.margin || 0) * item.quantity;
            }
            // Si viene de un costeo (tiene costingId), ya fue sumado arriba desde costingReferences
          }
        }
        
        // Calcular subtotal desde quoteItems (precio de venta)
        const subtotal = quoteData.quoteItems && quoteData.quoteItems.length > 0
          ? quoteData.quoteItems.reduce((sum, item) => sum + item.subtotal, 0)
          : 0;
        
        const iva = Math.round(subtotal * 0.19);
        const totalConIva = subtotal + iva;
        
        // Calcular margen porcentual sobre el precio (no sobre el costo)
        // Margen % = (Margen Bruto / Precio Neto) * 100
        const margenPct = subtotal > 0 ? (margenBruto / subtotal) * 100 : 0;
        
        // Actualizar totals con los valores calculados
        quoteData.totals = {
          ...quoteData.totals,
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
        } as any as Quote['totals'];
        
        // Si no tiene utilityPercentage, intentar obtenerlo del costeo asociado
        if ((quoteData.utilityPercentage === undefined || quoteData.utilityPercentage === null || quoteData.utilityPercentage === 0) 
            && quoteData.costingReferences && quoteData.costingReferences.length > 0) {
          try {
            const { getCostingById } = await import('@/firebase/costings');
            // Tomar el primer costeo para obtener su utilityPercentage
            const firstCosting = await getCostingById(quoteData.costingReferences[0]);
            if (firstCosting && firstCosting.utilityPercentage) {
              quoteData.utilityPercentage = firstCosting.utilityPercentage;
            }
          } catch (err) {
            console.error('Error obteniendo utilityPercentage del costeo:', err);
          }
        }
        
        setQuote(quoteData);
                setEditForm({
                  type: quoteData.type || '',
                  modality: quoteData.modality || '',
                  region: quoteData.region || '',
                  city: quoteData.city || '',
                  executionDeadline: quoteData.executionDeadline || 0,
                  validity: quoteData.validity || 0,
                  scope: quoteData.scope || '',
                  exclusions: quoteData.exclusions || '',
                  assumptions: quoteData.assumptions || '',
                  paymentTerms: quoteData.paymentTerms || '',
                });
                if (quoteData.clientId) {
                  const clientData = await getClientById(quoteData.clientId);
                  setClient(clientData);
                }
              } else {
                alert('Cotización no encontrada');
                router.push('/dashboard');
              }
    } catch (error) {
      console.error('Error cargando cotización:', error);
      alert('Error al cargar la cotización');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: Quote['status']) => {
    if (!quote) return;
    
    try {
      await updateQuote(quote.id!, { status: newStatus });
      setQuote({ ...quote, status: newStatus });
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert('Error al actualizar el estado');
    }
  };

  const handleDuplicate = async () => {
    if (!quote?.id) return;
    
    try {
      const newQuoteId = await duplicateQuote(quote.id);
      router.push(`/quotes/${newQuoteId}/costeo`);
    } catch (error) {
      console.error('Error duplicando cotización:', error);
      alert('Error al duplicar la cotización');
    }
  };

  const handleDelete = async () => {
    if (!quote?.id) return;
    
    if (!confirm('¿Está seguro de eliminar esta cotización?')) {
      return;
    }

    try {
      await deleteQuote(quote.id);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error eliminando cotización:', error);
      alert('Error al eliminar la cotización');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleStartEditGeneralInfo = () => {
    if (quote) {
      setEditForm({
        type: quote.type || '',
        modality: quote.modality || '',
        region: quote.region || '',
        city: quote.city || '',
        executionDeadline: quote.executionDeadline || 0,
        validity: quote.validity || 0,
        scope: quote.scope || '',
        exclusions: quote.exclusions || '',
        assumptions: quote.assumptions || '',
        paymentTerms: quote.paymentTerms || '',
      });
      setEditingGeneralInfo(true);
    }
  };

  const handleCancelEditGeneralInfo = () => {
    setEditingGeneralInfo(false);
  };

  const handleSaveGeneralInfo = async () => {
    if (!quote) return;
    
    setSaving(true);
    try {
      const updatedQuote = {
        ...quote,
        type: editForm.type as ProjectType,
        modality: editForm.modality as Modality,
        region: editForm.region,
        city: editForm.city,
        executionDeadline: editForm.executionDeadline,
        validity: editForm.validity,
        paymentTerms: editForm.paymentTerms,
        updatedAt: new Date(),
      };
      
      await updateQuote(quoteId, updatedQuote);
      setQuote(updatedQuote);
      setEditingGeneralInfo(false);
      alert('Información general actualizada exitosamente');
    } catch (error) {
      console.error('Error guardando información general:', error);
      alert('Error al guardar la información general');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditScope = () => {
    if (quote) {
      setEditForm(prev => ({ ...prev, scope: quote.scope || '' }));
      setEditingScope(true);
    }
  };

  const handleCancelEditScope = () => {
    setEditingScope(false);
  };

  const handleSaveScope = async () => {
    if (!quote) return;
    
    setSaving(true);
    try {
      const updatedQuote = {
        ...quote,
        scope: editForm.scope,
        updatedAt: new Date(),
      };
      
      await updateQuote(quoteId, updatedQuote);
      setQuote(updatedQuote);
      setEditingScope(false);
      alert('Alcance actualizado exitosamente');
    } catch (error) {
      console.error('Error guardando alcance:', error);
      alert('Error al guardar el alcance');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditExclusions = () => {
    if (quote) {
      setEditForm(prev => ({ ...prev, exclusions: quote.exclusions || '' }));
      setEditingExclusions(true);
    }
  };

  const handleCancelEditExclusions = () => {
    setEditingExclusions(false);
  };

  const handleSaveExclusions = async () => {
    if (!quote) return;
    
    setSaving(true);
    try {
      const updatedQuote = {
        ...quote,
        exclusions: editForm.exclusions,
        updatedAt: new Date(),
      };
      
      await updateQuote(quoteId, updatedQuote);
      setQuote(updatedQuote);
      setEditingExclusions(false);
      alert('Exclusiones actualizadas exitosamente');
    } catch (error) {
      console.error('Error guardando exclusiones:', error);
      alert('Error al guardar las exclusiones');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditAssumptions = () => {
    if (quote) {
      setEditForm(prev => ({ ...prev, assumptions: quote.assumptions || '' }));
      setEditingAssumptions(true);
    }
  };

  const handleCancelEditAssumptions = () => {
    setEditingAssumptions(false);
  };

  const handleSaveAssumptions = async () => {
    if (!quote) return;
    
    setSaving(true);
    try {
      const updatedQuote = {
        ...quote,
        assumptions: editForm.assumptions,
        updatedAt: new Date(),
      };
      
      await updateQuote(quoteId, updatedQuote);
      setQuote(updatedQuote);
      setEditingAssumptions(false);
      alert('Supuestos actualizados exitosamente');
    } catch (error) {
      console.error('Error guardando supuestos:', error);
      alert('Error al guardar los supuestos');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SkeletonCard className="h-24 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Cotización no encontrada</p>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: Quote['status']): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
    const variants = {
      'Borrador': 'default' as const,
      'Enviada': 'info' as const,
      'Aprobada': 'success' as const,
      'Perdida': 'danger' as const,
    };
    return variants[status];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 animate-slide-down">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{quote.projectName}</h1>
                <Badge variant={getStatusBadgeVariant(quote.status)} size="md">
                  {quote.status}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {client && (
                  <div className="flex items-center gap-1.5">
                    <DocumentTextIcon className="w-4 h-4" />
                    <span className="font-medium">{client.name}</span>
                  </div>
                )}
                {(quote.region || quote.city || quote.location) && (
                  <div className="flex items-center gap-1.5">
                    <MapPinIcon className="w-4 h-4" />
                    <span>
                      {quote.region && quote.city 
                        ? `${quote.city}, ${quote.region}` 
                        : quote.location || `${quote.city || ''}${quote.region ? `, ${quote.region}` : ''}`
                      }
                    </span>
                  </div>
                )}
                {quote.createdAt && (
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{new Date(quote.createdAt).toLocaleDateString('es-CL')}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={quote.status}
                onChange={(e) => handleStatusChange(e.target.value as Quote['status'])}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Borrador">Borrador</option>
                <option value="Enviada">Enviada</option>
                <option value="Aprobada">Aprobada</option>
                <option value="Perdida">Perdida</option>
              </select>
              <Button icon={<PencilIcon className="w-5 h-5" />} iconPosition="left" onClick={() => router.push(`/quotes/${quote.id}/items`)}>
                Editar
              </Button>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-wrap gap-3 items-center">
            <ExportButtons quote={quote} client={client} />
            <div className="flex gap-3 ml-auto">
              <Button variant="outline" onClick={() => router.push(`/quotes/${quote.id}/costeo`)}>
                Editar Costeo
              </Button>
              <Button variant="outline" onClick={() => router.push(`/quotes/${quote.id}/items`)}>
                Items de Cotización
              </Button>
              <Button variant="outline" onClick={handleDuplicate}>
                Duplicar
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Eliminar
              </Button>
            </div>
          </div>
        </div>

        {/* Información General */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Información General</h2>
            {!editingGeneralInfo && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartEditGeneralInfo}
                icon={<PencilIcon className="w-4 h-4" />}
                iconPosition="left"
              >
                Editar
              </Button>
            )}
          </div>
        {editingGeneralInfo ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Proyecto
                </label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Fabricación">Fabricación</option>
                  <option value="Montaje">Montaje</option>
                  <option value="Obras Civiles">Obras Civiles</option>
                  <option value="Reparación">Reparación</option>
                  <option value="Eventos">Eventos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modalidad
                </label>
                <select
                  value={editForm.modality}
                  onChange={(e) => setEditForm({ ...editForm, modality: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Cerrado">Obra Vendida</option>
                  <option value="HH+Mat">HH + Materiales</option>
                  <option value="Mixto">Mixto</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  {editForm.modality === 'Cerrado' && 'Precio fijo total del proyecto'}
                  {editForm.modality === 'HH+Mat' && 'Cotización por horas hombre más materiales'}
                  {editForm.modality === 'Mixto' && 'Combinación de partidas cerradas y variables'}
                </p>
              </div>
              <Input
                label="Región"
                value={editForm.region}
                onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
              />
              <Input
                label="Ciudad"
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
              />
              <Input
                label="Plazo de Ejecución (días)"
                type="number"
                value={editForm.executionDeadline.toString()}
                onChange={(e) => setEditForm({ ...editForm, executionDeadline: parseInt(e.target.value) || 0 })}
              />
              <Input
                label="Validez (días)"
                type="number"
                value={editForm.validity.toString()}
                onChange={(e) => setEditForm({ ...editForm, validity: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="col-span-2">
              <Textarea
                label="Forma de Pago"
                value={editForm.paymentTerms}
                onChange={(e) => setEditForm({ ...editForm, paymentTerms: e.target.value })}
                rows={3}
                placeholder="Ej: 50% anticipo, 50% contra entrega"
              />
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t col-span-2">
              <Button
                variant="outline"
                onClick={handleCancelEditGeneralInfo}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveGeneralInfo}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">Tipo:</span>
              <span className="ml-2 font-medium">{quote.type || '-'}</span>
            </div>
            <div>
              <span className="text-gray-600">Modalidad:</span>
              <span className="ml-2 font-medium">
                {quote.modality === 'Cerrado' && 'Obra Vendida'}
                {quote.modality === 'HH+Mat' && 'HH + Materiales'}
                {quote.modality === 'Mixto' && 'Mixto'}
                {!quote.modality && '-'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Ubicación:</span>
              <span className="ml-2 font-medium">
                {quote.region && quote.city 
                  ? `${quote.city}, ${quote.region}` 
                  : quote.location || 'No especificada'
                }
              </span>
            </div>
            <div>
              <span className="text-gray-600">Plazo de Ejecución:</span>
              <span className="ml-2 font-medium">{quote.executionDeadline || 0} días</span>
            </div>
            <div>
              <span className="text-gray-600">Validez:</span>
              <span className="ml-2 font-medium">{quote.validity || 0} días</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">Forma de Pago:</span>
              <p className="mt-1 text-gray-700 whitespace-pre-line">{quote.paymentTerms || 'No especificada'}</p>
            </div>
          </div>
        )}
        </div>

        {/* Items de Cotización */}
        {quote.quoteItems && quote.quoteItems.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Items de Cotización</h2>
          <div className="overflow-x-auto">
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
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quote.quoteItems.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {item.itemNumber || idx + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.codigoInterno || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    SUB TOTAL:
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                    {formatCurrency(quote.quoteItems.reduce((sum, item) => sum + item.subtotal, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

        {/* Alcance */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Alcance</h2>
            {!editingScope && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartEditScope}
                icon={<PencilIcon className="w-4 h-4" />}
                iconPosition="left"
              >
                Editar
              </Button>
            )}
          </div>
        {editingScope ? (
          <div className="space-y-4">
            <RichTextEditor
              label="Alcance del Proyecto"
              value={editForm.scope}
              onChange={(value) => setEditForm({ ...editForm, scope: value })}
              rows={8}
              className="w-full"
              placeholder="Describe el alcance del proyecto..."
            />
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleCancelEditScope}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveScope}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <style jsx global>{`
              .rich-text-content ul,
              .rich-text-content ol {
                margin-left: 1.5rem !important;
                margin-top: 0.5rem !important;
                margin-bottom: 0.5rem !important;
                padding-left: 0.5rem !important;
              }
              .rich-text-content ul {
                list-style-type: disc !important;
                list-style-position: outside !important;
              }
              .rich-text-content ol {
                list-style-type: decimal !important;
                list-style-position: outside !important;
              }
              .rich-text-content ol[type="lower-alpha"],
              .rich-text-content ol[style*="list-style-type: lower-alpha"] {
                list-style-type: lower-alpha !important;
              }
              .rich-text-content ol[type="upper-alpha"],
              .rich-text-content ol[style*="list-style-type: upper-alpha"] {
                list-style-type: upper-alpha !important;
              }
              .rich-text-content ol[type="lower-roman"],
              .rich-text-content ol[style*="list-style-type: lower-roman"] {
                list-style-type: lower-roman !important;
              }
              .rich-text-content ol[type="upper-roman"],
              .rich-text-content ol[style*="list-style-type: upper-roman"] {
                list-style-type: upper-roman !important;
              }
              .rich-text-content li {
                margin-bottom: 0.25rem !important;
                padding-left: 0.25rem !important;
                display: list-item !important;
              }
              .rich-text-content p {
                margin-bottom: 0.5rem;
              }
              .rich-text-content strong {
                font-weight: 600;
              }
              .rich-text-content em {
                font-style: italic;
              }
              .rich-text-content u {
                text-decoration: underline;
              }
            `}</style>
            <div 
              className="text-gray-700 rich-text-content"
              style={{
                lineHeight: '1.6',
              }}
              dangerouslySetInnerHTML={{ 
                __html: quote.scope || '<span class="text-gray-400">No especificado</span>' 
              }}
            />
          </>
        )}
        </div>

        {/* Exclusiones */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Exclusiones</h2>
            {!editingExclusions && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartEditExclusions}
                icon={<PencilIcon className="w-4 h-4" />}
                iconPosition="left"
              >
                Editar
              </Button>
            )}
          </div>
          {editingExclusions ? (
            <div className="space-y-4">
              <RichTextEditor
                label="Exclusiones del Proyecto"
                value={editForm.exclusions}
                onChange={(value) => setEditForm({ ...editForm, exclusions: value })}
                rows={8}
                className="w-full"
                placeholder="Describe las exclusiones del proyecto..."
              />
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleCancelEditExclusions}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveExclusions}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="text-gray-700 rich-text-content"
              style={{
                lineHeight: '1.6',
              }}
              dangerouslySetInnerHTML={{ 
                __html: quote.exclusions || '<span class="text-gray-400">No especificado</span>' 
              }}
            />
          )}
        </div>

        {/* Supuestos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Supuestos</h2>
            {!editingAssumptions && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartEditAssumptions}
                icon={<PencilIcon className="w-4 h-4" />}
                iconPosition="left"
              >
                Editar
              </Button>
            )}
          </div>
          {editingAssumptions ? (
            <div className="space-y-4">
              <RichTextEditor
                label="Supuestos del Proyecto"
                value={editForm.assumptions}
                onChange={(value) => setEditForm({ ...editForm, assumptions: value })}
                rows={8}
                className="w-full"
                placeholder="Describe los supuestos del proyecto..."
              />
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleCancelEditAssumptions}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveAssumptions}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="text-gray-700 rich-text-content"
              style={{
                lineHeight: '1.6',
              }}
              dangerouslySetInnerHTML={{ 
                __html: quote.assumptions || '<span class="text-gray-400">No especificado</span>' 
              }}
            />
          )}
        </div>

        {/* Detalle de Items */}
        {(() => {
          const quoteWithCostingData = quote as Partial<Costing & typeof quote>;
          return quoteWithCostingData.itemsMO && quoteWithCostingData.itemsMO.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 animate-fade-in">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Mano de Obra</h2>
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Cargo</th>
                  <th className="px-4 py-2 text-left">HH</th>
                  <th className="px-4 py-2 text-left">Costo/HH</th>
                  <th className="px-4 py-2 text-left">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {quoteWithCostingData.itemsMO.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="px-4 py-2">{item.cargo}</td>
                    <td className="px-4 py-2">{item.hh}</td>
                    <td className="px-4 py-2">{formatCurrency(item.costHH)}</td>
                    <td className="px-4 py-2 font-medium">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
          );
        })()}

        {(() => {
          const quoteWithCostingData = quote as Partial<Costing & typeof quote>;
          return quoteWithCostingData.itemsMaterials && quoteWithCostingData.itemsMaterials.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 animate-fade-in">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Materiales</h2>
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Item</th>
                  <th className="px-4 py-2 text-left">Cantidad</th>
                  <th className="px-4 py-2 text-left">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {quoteWithCostingData.itemsMaterials.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="px-4 py-2">{item.item}</td>
                    <td className="px-4 py-2">{item.quantity} {item.unidad}</td>
                    <td className="px-4 py-2 font-medium">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* Resumen Ejecutivo */}
        {quote.totals && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center gap-2 mb-6">
              <BanknotesIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Resumen Ejecutivo</h2>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Costo Directo:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(quote.totals?.costoDirecto || 0)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Indirectos de Obra:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(quote.totals?.indirectosObra || 0)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Gastos Generales:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(quote.totals?.gastosGenerales || 0)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Contingencia:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(quote.totals?.contingencia || 0)}</span>
                </div>
              </div>
              <div className="flex justify-between border-t-2 border-gray-300 pt-3 mt-3">
                <span className="font-semibold text-gray-900">Costo Total:</span>
                <span className="font-bold text-lg text-gray-900">{formatCurrency(quote.totals?.costoTotal || 0)}</span>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl mt-4 space-y-3 border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg text-gray-900">Precio Neto:</span>
                  <span className="font-bold text-xl text-blue-900">
                    {formatCurrency(quote.totals?.precioNeto || quote.totals?.precioVenta || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-blue-300 pt-3">
                  <span className="text-gray-700 font-medium">IVA (19%):</span>
                  <span className="font-semibold text-lg text-blue-800">
                    {formatCurrency(quote.totals?.iva || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t-2 border-blue-400 pt-3 mt-2">
                  <span className="font-bold text-xl text-gray-900">TOTAL CON IVA:</span>
                  <span className="font-bold text-2xl text-blue-900">
                    {formatCurrency(quote.totals?.totalConIva || 0)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
                  <div className="text-sm text-gray-600 mb-1">Margen Bruto</div>
                  <div className="text-2xl font-bold text-green-700">
                    {formatCurrency(quote.totals?.margenBruto || 0)}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors">
                  <div className="text-sm text-gray-600 mb-1">Margen %</div>
                  <div className="text-2xl font-bold text-purple-700">
                    {quote.totals?.margenPct ? quote.totals.margenPct.toFixed(2) : '0.00'}%
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
                  <div className="text-sm text-gray-600 mb-1">Utilidad %</div>
                  <div className="text-2xl font-bold text-blue-700">
                    {(quote.utilityPercentage !== undefined && quote.utilityPercentage !== null) 
                      ? quote.utilityPercentage.toFixed(2) 
                      : ((quote as Partial<Costing & typeof quote>).ggPercentage !== undefined ? 'N/A' : '0.00')}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

