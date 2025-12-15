'use client';

// Página de configuración de empresa
import { useEffect, useState, useRef } from 'react';
import { CompanySettings } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { getCompanySettings, saveCompanySettings } from '@/firebase/settings';
import { formatRUT, validateRUT } from '@/utils/validations/rut';
import { chileRegions } from '@/utils/chile-regions';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CompanySettings>({
    companyName: '',
    companyRUT: '',
    companyGiro: '',
    companyAddress: '',
    companyCity: '',
    companyRegion: '',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    companySocialMedia: '',
    quoterName: '',
    quoterPosition: '',
    quoterEmail: '',
    quoterPhone: '',
    bankAccountName: '',
    bankAccountRUT: '',
    bankName: '',
    bankAccountType: '',
    bankAccountNumber: '',
    bankEmail: '',
    companyLogo: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getCompanySettings();
      if (settings) {
        setFormData(settings);
        setLogoPreview(settings.companyLogo || '');
        
        // Configurar región y ciudades si existe
        if (settings.companyRegion) {
          const region = chileRegions.find(r => r.name === settings.companyRegion);
          if (region) {
            setSelectedRegion(region.id);
            setAvailableCities(region.cities);
          }
        }
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen');
        return;
      }
      
      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('El logo debe ser menor a 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({ ...formData, companyLogo: base64String });
        setLogoPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, companyLogo: '' });
    setLogoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    // Validar campos requeridos
    const newErrors: Record<string, string> = {};
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'El nombre de la empresa es requerido';
    }
    
    if (!formData.companyRUT.trim()) {
      newErrors.companyRUT = 'El RUT de la empresa es requerido';
    } else if (!validateRUT(formData.companyRUT)) {
      newErrors.companyRUT = 'El RUT no es válido';
    }
    
    if (!formData.quoterName.trim()) {
      newErrors.quoterName = 'El nombre del cotizador es requerido';
    }
    
    if (!formData.quoterEmail.trim()) {
      newErrors.quoterEmail = 'El email del cotizador es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.quoterEmail)) {
      newErrors.quoterEmail = 'El email no es válido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      await saveCompanySettings(formData);
      alert('Configuración guardada exitosamente');
      setErrors({});
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600 mt-1">Configura los datos de tu empresa y cotizador</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>

      {/* Logo de la Empresa */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Logo de la Empresa</h2>
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            {logoPreview ? (
              <div className="relative">
                <img
                  src={logoPreview}
                  alt="Logo de la empresa"
                  className="w-32 h-32 object-contain border border-gray-300 rounded-lg p-2 bg-white"
                />
                <button
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  title="Eliminar logo"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                <PhotoIcon className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-3">
              Sube el logo de tu empresa. Se mostrará en las cotizaciones exportadas.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              id="logo-upload"
            />
            <label htmlFor="logo-upload">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                icon={<PhotoIcon className="w-5 h-5" />}
                iconPosition="left"
              >
                {logoPreview ? 'Cambiar Logo' : 'Subir Logo'}
              </Button>
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Formatos: JPG, PNG, GIF. Tamaño máximo: 2MB
            </p>
          </div>
        </div>
      </div>

      {/* Datos de la Empresa */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Datos de la Empresa</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre de la Empresa *"
            value={formData.companyName}
            onChange={(e) => {
              setFormData({ ...formData, companyName: e.target.value });
              setErrors({ ...errors, companyName: '' });
            }}
            error={errors.companyName}
            required
          />
          <Input
            label="RUT de la Empresa *"
            value={formData.companyRUT}
            onChange={(e) => {
              const formatted = formatRUT(e.target.value);
              setFormData({ ...formData, companyRUT: formatted });
              setErrors({ ...errors, companyRUT: '' });
            }}
            error={errors.companyRUT}
            required
          />
          <Input
            label="Giro"
            value={formData.companyGiro}
            onChange={(e) => setFormData({ ...formData, companyGiro: e.target.value })}
            placeholder="Ej: Fabricación y montaje de estructuras metálicas"
          />
          <div className="md:col-span-2">
            <Input
              label="Dirección"
              value={formData.companyAddress}
              onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Región
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
                  companyRegion: region?.name || '',
                  companyCity: '' // Limpiar ciudad al cambiar región
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              Ciudad
            </label>
            <select
              value={formData.companyCity}
              onChange={(e) => setFormData({ ...formData, companyCity: e.target.value })}
              disabled={!selectedRegion || availableCities.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
          </div>
          <Input
            label="Teléfono"
            value={formData.companyPhone}
            onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
            placeholder="+56 9 1234 5678"
          />
          <Input
            label="Email"
            type="email"
            value={formData.companyEmail}
            onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
            placeholder="contacto@empresa.cl"
          />
          <Input
            label="Sitio Web"
            value={formData.companyWebsite}
            onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
            placeholder="https://www.empresa.cl"
          />
          <Input
            label="Redes Sociales"
            value={formData.companySocialMedia}
            onChange={(e) => setFormData({ ...formData, companySocialMedia: e.target.value })}
            placeholder="Facebook, Instagram, LinkedIn, etc."
          />
        </div>
      </div>

      {/* Datos del Cotizador */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Datos del Cotizador</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre del Cotizador *"
            value={formData.quoterName}
            onChange={(e) => {
              setFormData({ ...formData, quoterName: e.target.value });
              setErrors({ ...errors, quoterName: '' });
            }}
            error={errors.quoterName}
            required
          />
          <Input
            label="Cargo *"
            value={formData.quoterPosition}
            onChange={(e) => setFormData({ ...formData, quoterPosition: e.target.value })}
            placeholder="Ej: Jefe de Proyectos"
            required
          />
          <Input
            label="Email del Cotizador *"
            type="email"
            value={formData.quoterEmail}
            onChange={(e) => {
              setFormData({ ...formData, quoterEmail: e.target.value });
              setErrors({ ...errors, quoterEmail: '' });
            }}
            error={errors.quoterEmail}
            required
          />
          <Input
            label="Teléfono del Cotizador"
            value={formData.quoterPhone}
            onChange={(e) => setFormData({ ...formData, quoterPhone: e.target.value })}
            placeholder="+56 9 1234 5678"
          />
        </div>
      </div>

      {/* Datos de Cuenta Bancaria */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Datos de Cuenta Bancaria</h2>
        <p className="text-sm text-gray-600 mb-4">
          Estos datos se mostrarán en el pie de página de las cotizaciones para facilitar los depósitos y transferencias.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre del Titular"
            value={formData.bankAccountName || ''}
            onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
            placeholder="Nombre completo del titular de la cuenta"
          />
          <Input
            label="RUT del Titular"
            value={formData.bankAccountRUT || ''}
            onChange={(e) => {
              const formatted = formatRUT(e.target.value);
              setFormData({ ...formData, bankAccountRUT: formatted });
            }}
            placeholder="12.345.678-9"
          />
          <Input
            label="Banco"
            value={formData.bankName || ''}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            placeholder="Ej: Banco de Chile, Banco Santander, etc."
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Cuenta
            </label>
            <select
              value={formData.bankAccountType || ''}
              onChange={(e) => setFormData({ ...formData, bankAccountType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar tipo...</option>
              <option value="Corriente">Cuenta Corriente</option>
              <option value="Ahorro">Cuenta de Ahorro</option>
              <option value="Vista">Cuenta Vista</option>
              <option value="RUT">Cuenta RUT</option>
            </select>
          </div>
          <Input
            label="Número de Cuenta"
            value={formData.bankAccountNumber || ''}
            onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
            placeholder="Número de cuenta bancaria"
          />
          <Input
            label="Email para Transferencias (Opcional)"
            type="email"
            value={formData.bankEmail || ''}
            onChange={(e) => setFormData({ ...formData, bankEmail: e.target.value })}
            placeholder="email@ejemplo.cl"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>
    </div>
  );
}

