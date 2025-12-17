'use client';

// Paso 1 del Wizard: Datos del Cliente
import { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Client } from '@/types';
import { validateRUT, formatRUT } from '@/utils/validations/rut';
import { getClientByRUT, createClient, getAllClients } from '@/supabase/clients';
import { chileRegions, getCitiesByRegion } from '@/utils/chile-regions';

interface WizardStep1ClientProps {
  clientId?: string;
  onNext: (clientId: string) => void;
}

export default function WizardStep1Client({ clientId, onNext }: WizardStep1ClientProps) {
  const [searchRUT, setSearchRUT] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [formData, setFormData] = useState<Omit<Client, 'id'>>({
    name: '',
    rut: '',
    contact: '',
    email: '',
    phone: '',
    region: '',
    city: '',
    address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const allClients = await getAllClients();
      setClients(allClients);
      
      if (clientId) {
        const client = allClients.find(c => c.id === clientId);
        if (client) {
          setSelectedClient(client);
          // Si el cliente tiene región, configurar el selector
          if (client.region) {
            const region = chileRegions.find(r => r.name === client.region);
            if (region) {
              setSelectedRegion(region.id);
              setAvailableCities(region.cities);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchRUT || !validateRUT(searchRUT)) {
      setErrors({ rut: 'RUT inválido' });
      return;
    }

    setLoading(true);
    try {
      const client = await getClientByRUT(searchRUT.replace(/[.\-]/g, ''));
      if (client) {
        setSelectedClient(client);
        setShowNewForm(false);
        setErrors({});
      } else {
        setSelectedClient(null);
        setShowNewForm(true);
        // Pre-llenar RUT en el formulario
        setFormData(prev => ({ ...prev, rut: formatRUT(searchRUT) }));
      }
    } catch (error) {
      console.error('Error buscando cliente:', error);
      setErrors({ rut: 'Error al buscar cliente' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    // Validaciones
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Nombre requerido';
    if (!formData.rut || !validateRUT(formData.rut)) {
      newErrors.rut = 'RUT inválido';
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      newErrors.email = 'Email inválido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const newClientId = await createClient({
        ...formData,
        rut: formData.rut.replace(/[.\-]/g, ''), // Guardar sin formato
      });
      await loadClients();
      const newClient = await getClientByRUT(formData.rut.replace(/[.\-]/g, ''));
      if (newClient) {
        setSelectedClient(newClient);
        setShowNewForm(false);
        setErrors({});
        // Si tiene región, configurarla
        if (newClient.region) {
          const region = chileRegions.find(r => r.name === newClient.region);
          if (region) {
            setSelectedRegion(region.id);
            setAvailableCities(region.cities);
          }
        }
        // Avanzar automáticamente a la siguiente pantalla
        onNext(newClient.id);
      } else {
        // Si no se encontró el cliente pero se creó, usar el ID retornado
        if (newClientId) {
          onNext(newClientId);
        } else {
          setErrors({ general: 'Cliente creado pero no se pudo obtener la información' });
        }
      }
    } catch (error) {
      console.error('Error creando cliente:', error);
      setErrors({ general: 'Error al crear cliente' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setShowNewForm(false);
  };

  const handleNext = () => {
    if (selectedClient?.id) {
      onNext(selectedClient.id);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Paso 1: Cliente</h2>
        <p className="text-gray-600 mt-1">Busca o crea un cliente para la cotización</p>
      </div>

      {/* Búsqueda por RUT */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <Input
              label="Buscar por RUT"
              value={searchRUT}
              onChange={(e) => {
                setSearchRUT(e.target.value);
                setErrors({});
              }}
              placeholder="12.345.678-9"
              error={errors.rut}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSearch} disabled={loading}>
              Buscar
            </Button>
          </div>
        </div>
        <div className="text-center">
            <button
              onClick={() => {
                setShowNewForm(true);
                setSelectedClient(null);
                setSearchRUT('');
                setSelectedRegion('');
                setAvailableCities([]);
                setFormData({
                  name: '',
                  rut: '',
                  contact: '',
                  email: '',
                  phone: '',
                  region: '',
                  city: '',
                  address: '',
                });
              }}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              + Crear nuevo cliente
            </button>
        </div>
      </div>

      {/* Seleccionar cliente existente */}
      {!showNewForm && clients.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-gray-900 mb-4">Seleccionar cliente existente</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => handleSelectClient(client)}
                className={`w-full text-left p-3 rounded border transition-colors ${
                  selectedClient?.id === client.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{client.name}</div>
                <div className="text-sm text-gray-600">
                  {formatRUT(client.rut)} - {client.email}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Formulario nuevo cliente */}
      {showNewForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-gray-900 mb-4">Crear nuevo cliente</h3>
          
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              {errors.general}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Razón Social *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                required
              />
              <Input
                label="RUT *"
                value={formData.rut}
                onChange={(e) => {
                  const formatted = formatRUT(e.target.value);
                  setFormData({ ...formData, rut: formatted });
                  setErrors({ ...errors, rut: '' });
                }}
                error={errors.rut}
                required
              />
            </div>

            <Input
              label="Nombre de Contacto *"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  setErrors({ ...errors, email: '' });
                }}
                error={errors.email}
                required
              />
              <Input
                label="Teléfono"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                    setFormData({ 
                      ...formData, 
                      region: region?.name || '',
                      city: '' // Limpiar ciudad al cambiar región
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar región...</option>
                  {chileRegions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad *
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={!selectedRegion || availableCities.length === 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">
                    {selectedRegion ? 'Seleccionar ciudad...' : 'Primero seleccione región'}
                  </option>
                  {availableCities.map((city, index) => (
                    <option key={`${city}-${index}`} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Dirección"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Calle, número, etc."
            />

            <Button onClick={handleCreateClient} disabled={loading} className="w-full">
              {loading ? 'Creando...' : 'Crear Cliente'}
            </Button>

            <button
              onClick={() => {
                setShowNewForm(false);
                setFormData({
                  name: '',
                  rut: '',
                  contact: '',
                  email: '',
                  phone: '',
                  address: '',
                  region: '',
                  city: '',
                });
              }}
              className="w-full text-sm text-gray-600 hover:text-gray-900"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Cliente seleccionado */}
      {selectedClient && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-blue-900">{selectedClient.name}</h3>
              <p className="text-sm text-blue-700">
                {formatRUT(selectedClient.rut)} - {selectedClient.email}
              </p>
              {selectedClient.phone && (
                <p className="text-sm text-blue-700">{selectedClient.phone}</p>
              )}
            </div>
            <Button onClick={handleNext} disabled={loading}>
              Continuar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

