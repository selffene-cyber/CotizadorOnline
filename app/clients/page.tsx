'use client';

// Página de gestión de clientes
import { useEffect, useState } from 'react';
import { getAllClients, deleteClient, updateClient, getClientById } from '@/firebase/clients';
import { getQuotesByClient } from '@/firebase/quotes';
import { Client, Quote } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { formatRUT, validateRUT } from '@/utils/validations/rut';
import { chileRegions } from '@/utils/chile-regions';
import Link from 'next/link';
import { MagnifyingGlassIcon, XMarkIcon, PencilIcon, DocumentTextIcon, TrashIcon } from '@heroicons/react/24/outline';
import ResponsiveTable, { TableColumn } from '@/components/ui/ResponsiveTable';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [nameFilter, setNameFilter] = useState<string>('');
  const [rutFilter, setRutFilter] = useState<string>('');
  const [contactFilter, setContactFilter] = useState<string>('');
  const [emailFilter, setEmailFilter] = useState<string>('');
  const [phoneFilter, setPhoneFilter] = useState<string>('');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Omit<Client, 'id'>>({
    name: '',
    rut: '',
    contact: '',
    email: '',
    phone: '',
    region: '',
    city: '',
    address: '',
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [showClientQuotes, setShowClientQuotes] = useState(false);
  const [selectedClientForQuotes, setSelectedClientForQuotes] = useState<Client | null>(null);
  const [clientQuotes, setClientQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const allClients = await getAllClients();
      setClients(allClients);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm('¿Está seguro de eliminar este cliente?')) {
      return;
    }

    try {
      await deleteClient(clientId);
      await loadClients();
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      alert('Error al eliminar el cliente');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setEditFormData({
      name: client.name || '',
      rut: client.rut || '',
      contact: client.contact || '',
      email: client.email || '',
      phone: client.phone || '',
      region: client.region || '',
      city: client.city || '',
      address: client.address || '',
    });
    
    // Configurar región y ciudades
    if (client.region) {
      const region = chileRegions.find(r => r.name === client.region);
      if (region) {
        setSelectedRegion(region.id);
        setAvailableCities(region.cities);
      }
    }
    
    setEditErrors({});
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingClient(null);
    setEditErrors({});
    setSelectedRegion('');
    setAvailableCities([]);
  };

  const handleSaveEdit = async () => {
    if (!editingClient?.id) return;

    // Validar campos requeridos
    const newErrors: Record<string, string> = {};
    
    if (!editFormData.name.trim()) {
      newErrors.name = 'La razón social es requerida';
    }
    
    if (!editFormData.rut.trim()) {
      newErrors.rut = 'El RUT es requerido';
    } else if (!validateRUT(editFormData.rut)) {
      newErrors.rut = 'El RUT no es válido';
    }
    
    if (!editFormData.contact.trim()) {
      newErrors.contact = 'El nombre de contacto es requerido';
    }
    
    if (!editFormData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      newErrors.email = 'El email no es válido';
    }
    
    if (!editFormData.region) {
      newErrors.region = 'La región es requerida';
    }
    
    if (!editFormData.city) {
      newErrors.city = 'La ciudad es requerida';
    }

    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      await updateClient(editingClient.id, {
        ...editFormData,
        updatedAt: new Date(),
      });
      await loadClients();
      handleCloseEditModal();
    } catch (error) {
      console.error('Error actualizando cliente:', error);
      alert('Error al actualizar el cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleViewClientQuotes = async (client: Client) => {
    setSelectedClientForQuotes(client);
    setShowClientQuotes(true);
    setLoadingQuotes(true);
    
    try {
      const quotes = await getQuotesByClient(client.id!);
      // Cargar datos de clientes y utilityPercentage para cada cotización
      const quotesWithClients = await Promise.all(
        quotes.map(async (quote) => {
          let updatedQuote = { ...quote };
          
          // Cargar cliente si no está presente
          if (!quote.client && quote.clientId) {
            try {
              const clientData = await getClientById(quote.clientId);
              // Convertir null a undefined para compatibilidad de tipos
              updatedQuote = { ...updatedQuote, client: clientData ?? undefined };
            } catch (error) {
              // Continuar sin cliente
            }
          }
          
          // Si no tiene utilityPercentage, intentar obtenerlo del costeo asociado
          if ((updatedQuote.utilityPercentage === undefined || updatedQuote.utilityPercentage === null || updatedQuote.utilityPercentage === 0) 
              && updatedQuote.costingReferences && updatedQuote.costingReferences.length > 0) {
            try {
              const { getCostingById } = await import('@/firebase/costings');
              // Tomar el primer costeo para obtener su utilityPercentage
              const firstCosting = await getCostingById(updatedQuote.costingReferences[0]);
              if (firstCosting && firstCosting.utilityPercentage) {
                updatedQuote.utilityPercentage = firstCosting.utilityPercentage;
              }
            } catch (err) {
              console.error('Error obteniendo utilityPercentage del costeo:', err);
            }
          }
          
          return updatedQuote;
        })
      );
      setClientQuotes(quotesWithClients);
    } catch (error) {
      console.error('Error cargando cotizaciones del cliente:', error);
      alert('Error al cargar las cotizaciones del cliente');
    } finally {
      setLoadingQuotes(false);
    }
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

  // Aplicar todos los filtros
  const filteredClients = clients.filter(client => {
    // Filtro por nombre
    if (nameFilter && client.name) {
      const clientName = client.name.toLowerCase();
      if (!clientName.includes(nameFilter.toLowerCase())) {
        return false;
      }
    }
    
    // Filtro por RUT
    if (rutFilter && client.rut) {
      const clientRut = client.rut.replace(/[.\-]/g, '').toLowerCase();
      const filterRut = rutFilter.replace(/[.\-]/g, '').toLowerCase();
      if (!clientRut.includes(filterRut)) {
        return false;
      }
    }
    
    // Filtro por contacto
    if (contactFilter && client.contact) {
      const clientContact = client.contact.toLowerCase();
      if (!clientContact.includes(contactFilter.toLowerCase())) {
        return false;
      }
    }
    
    // Filtro por email
    if (emailFilter && client.email) {
      const clientEmail = client.email.toLowerCase();
      if (!clientEmail.includes(emailFilter.toLowerCase())) {
        return false;
      }
    }
    
    // Filtro por teléfono
    if (phoneFilter && client.phone) {
      const clientPhone = client.phone.replace(/[\s\-\(\)]/g, '');
      const filterPhone = phoneFilter.replace(/[\s\-\(\)]/g, '');
      if (!clientPhone.includes(filterPhone)) {
        return false;
      }
    }
    
    // Filtro por fecha desde
    if (dateFromFilter && client.createdAt) {
      const clientDate = new Date(client.createdAt);
      const fromDate = new Date(dateFromFilter);
      fromDate.setHours(0, 0, 0, 0);
      if (clientDate < fromDate) {
        return false;
      }
    }
    
    // Filtro por fecha hasta
    if (dateToFilter && client.createdAt) {
      const clientDate = new Date(client.createdAt);
      const toDate = new Date(dateToFilter);
      toDate.setHours(23, 59, 59, 999);
      if (clientDate > toDate) {
        return false;
      }
    }
    
    return true;
  });

  const clearFilters = () => {
    setNameFilter('');
    setRutFilter('');
    setContactFilter('');
    setEmailFilter('');
    setPhoneFilter('');
    setDateFromFilter('');
    setDateToFilter('');
  };

  const hasActiveFilters = nameFilter || rutFilter || contactFilter || emailFilter || phoneFilter || dateFromFilter || dateToFilter;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">Gestiona todos tus clientes</p>
        </div>
        <Link href="/quotes/new">
          <Button>Nueva Cotización</Button>
        </Link>
      </div>

      {/* Filtros Avanzados */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
            Filtros Avanzados
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {[nameFilter, rutFilter, contactFilter, emailFilter, phoneFilter, dateFromFilter, dateToFilter].filter(Boolean).length}
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
            {/* Filtro por Nombre */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtro por RUT */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                RUT
              </label>
              <input
                type="text"
                value={rutFilter}
                onChange={(e) => setRutFilter(e.target.value)}
                placeholder="Buscar por RUT..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtro por Contacto */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Contacto
              </label>
              <input
                type="text"
                value={contactFilter}
                onChange={(e) => setContactFilter(e.target.value)}
                placeholder="Buscar por contacto..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtro por Email */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="text"
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                placeholder="Buscar por email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtro por Teléfono */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="text"
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
                placeholder="Buscar por teléfono..."
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

      <ResponsiveTable
        data={filteredClients}
        columns={[
          {
            key: 'number',
            header: 'N°',
            render: (client) => {
              const index = filteredClients.findIndex(c => c.id === client.id);
              return (index + 1).toString();
            },
            mobileLabel: 'N°',
            mobilePriority: 1,
          },
          {
            key: 'name',
            header: 'Nombre',
            render: (client) => client.name,
            mobileLabel: 'Nombre',
            mobilePriority: 2,
          },
          {
            key: 'rut',
            header: 'RUT',
            render: (client) => formatRUT(client.rut),
            mobileLabel: 'RUT',
            mobilePriority: 3,
          },
          {
            key: 'contact',
            header: 'Contacto',
            render: (client) => client.contact || '-',
            mobileLabel: 'Contacto',
            mobilePriority: 4,
          },
          {
            key: 'email',
            header: 'Email',
            render: (client) => client.email || '-',
            mobileLabel: 'Email',
            mobilePriority: 5,
          },
          {
            key: 'phone',
            header: 'Teléfono',
            render: (client) => client.phone || '-',
            mobileLabel: 'Teléfono',
            mobilePriority: 6,
          },
        ]}
        keyExtractor={(client) => client.id || ''}
        emptyMessage={
          hasActiveFilters 
            ? 'No se encontraron clientes con los filtros aplicados'
            : clients.length === 0
              ? 'No hay clientes registrados'
              : 'No hay clientes que coincidan con los filtros'
        }
        onRowClick={handleViewClientQuotes}
        actions={(client) => (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(client);
              }}
              className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
              title="Editar"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(client.id!);
              }}
              className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
              title="Eliminar"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </>
        )}
      />
      
      {!hasActiveFilters && clients.length === 0 && filteredClients.length === 0 && (
        <p className="text-sm text-gray-400 text-center mt-2">
          Los clientes se crearán automáticamente al crear una nueva cotización
        </p>
      )}

      {/* Modal de Edición */}
      {showEditModal && editingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Editar Cliente</h2>
            </div>
            
            <div className="p-6 space-y-4">
              {editErrors.general && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                  {editErrors.general}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Razón Social *"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  error={editErrors.name}
                  required
                />
                <Input
                  label="RUT *"
                  value={editFormData.rut}
                  onChange={(e) => {
                    const formatted = formatRUT(e.target.value);
                    setEditFormData({ ...editFormData, rut: formatted });
                    setEditErrors({ ...editErrors, rut: '' });
                  }}
                  error={editErrors.rut}
                  required
                />
              </div>

              <Input
                label="Nombre de Contacto *"
                value={editFormData.contact}
                onChange={(e) => setEditFormData({ ...editFormData, contact: e.target.value })}
                error={editErrors.contact}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email *"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => {
                    setEditFormData({ ...editFormData, email: e.target.value });
                    setEditErrors({ ...editErrors, email: '' });
                  }}
                  error={editErrors.email}
                  required
                />
                <Input
                  label="Teléfono"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Región *
                  </label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => {
                      const regionId = e.target.value;
                      setSelectedRegion(regionId);
                      const region = chileRegions.find(r => r.id === regionId);
                      const cities = region ? region.cities : [];
                      setAvailableCities(cities);
                      setEditFormData({ 
                        ...editFormData, 
                        region: region?.name || '',
                        city: '' // Limpiar ciudad al cambiar región
                      });
                      setEditErrors({ ...editErrors, region: '' });
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      editErrors.region ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Seleccionar región...</option>
                    {chileRegions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                  {editErrors.region && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.region}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad *
                  </label>
                  <select
                    value={editFormData.city}
                    onChange={(e) => {
                      setEditFormData({ ...editFormData, city: e.target.value });
                      setEditErrors({ ...editErrors, city: '' });
                    }}
                    disabled={!selectedRegion || availableCities.length === 0}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      editErrors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">
                      {selectedRegion ? 'Seleccionar ciudad...' : 'Primero seleccione región'}
                    </option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  {editErrors.city && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.city}</p>
                  )}
                </div>
              </div>

              <Input
                label="Dirección"
                value={editFormData.address}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
              />
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <Button
                onClick={handleCloseEditModal}
                variant="outline"
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cotizaciones del Cliente */}
      {showClientQuotes && selectedClientForQuotes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Cotizaciones de {selectedClientForQuotes.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  RUT: {formatRUT(selectedClientForQuotes.rut)}
                </p>
              </div>
              <Button
                onClick={() => {
                  setShowClientQuotes(false);
                  setSelectedClientForQuotes(null);
                  setClientQuotes([]);
                }}
                variant="outline"
              >
                Cerrar
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {loadingQuotes ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando cotizaciones...</p>
                  </div>
                </div>
              ) : clientQuotes.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    Este cliente no tiene cotizaciones registradas
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          N°
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Proyecto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total con IVA
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Utilidad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clientQuotes.map((quote) => (
                        <tr key={quote.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {quote.quoteNumber || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {quote.projectName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={getStatusBadgeVariant(quote.status)} size="sm">
                              {quote.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                            {formatCurrency(quote.totals?.totalConIva || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                            {quote.utilityPercentage !== undefined && quote.utilityPercentage !== null 
                              ? quote.utilityPercentage.toFixed(1) 
                              : '0.0'}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('es-CL') : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link 
                              href={`/quotes/${quote.id}`}
                              className="text-blue-600 hover:text-blue-900 font-medium transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Ver →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


