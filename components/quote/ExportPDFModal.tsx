'use client';

// Modal para configurar qué secciones incluir en el PDF
import { useState } from 'react';
import { createPortal } from 'react-dom';
import Button from '@/components/ui/Button';

export interface PDFExportOptions {
  includeScope: boolean;
  includeExclusions: boolean;
  includeAssumptions: boolean;
  includeMO: boolean;
  includeMaterials: boolean;
  includeMargins: boolean; // Margen bruto en $ y %
  includeCostSummary: boolean; // Tabla de resumen de costos
}

interface ExportPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: PDFExportOptions) => void;
  defaultOptions?: Partial<PDFExportOptions>;
}

const defaultOptions: PDFExportOptions = {
  includeScope: true,
  includeExclusions: true,
  includeAssumptions: true,
  includeMO: true,
  includeMaterials: true,
  includeMargins: true,
  includeCostSummary: true,
};

export default function ExportPDFModal({ 
  isOpen, 
  onClose, 
  onExport,
  defaultOptions: userDefaults 
}: ExportPDFModalProps) {
  const [options, setOptions] = useState<PDFExportOptions>({
    ...defaultOptions,
    ...userDefaults,
  });

  const handleToggle = (key: keyof PDFExportOptions) => {
    setOptions(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleExport = () => {
    onExport(options);
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 10004 }}
      onClick={(e) => {
        // Cerrar al hacer click fuera del contenido
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Opciones de Exportación PDF</h2>
          <p className="text-sm text-gray-600 mt-1">Selecciona qué secciones incluir en la cotización</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                checked={options.includeScope}
                onChange={() => handleToggle('includeScope')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 font-medium">Alcance del proyecto</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                checked={options.includeExclusions}
                onChange={() => handleToggle('includeExclusions')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 font-medium">Exclusiones</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                checked={options.includeAssumptions}
                onChange={() => handleToggle('includeAssumptions')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 font-medium">Supuestos</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                checked={options.includeMO}
                onChange={() => handleToggle('includeMO')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 font-medium">Mano de obra</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                checked={options.includeMaterials}
                onChange={() => handleToggle('includeMaterials')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 font-medium">Materiales</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                checked={options.includeMargins}
                onChange={() => handleToggle('includeMargins')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 font-medium">Margen bruto (en $ y %)</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                checked={options.includeCostSummary}
                onChange={() => handleToggle('includeCostSummary')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 font-medium">Tabla de resumen de costos</span>
            </label>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            variant="primary"
          >
            Exportar PDF
          </Button>
        </div>
      </div>
    </div>
  );

  // Renderizar usando portal si está disponible
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}


