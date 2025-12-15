'use client';

// Componentes de exportación
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PDFViewer } from '@react-pdf/renderer';
import PDFDocument from '@/utils/exporters/pdf';
import { exportToWord } from '@/utils/exporters/word';
import { exportToExcel } from '@/utils/exporters/excel';
import { Quote, Client, CompanySettings } from '@/types';
import Button from '@/components/ui/Button';
import ExportPDFModal, { PDFExportOptions } from './ExportPDFModal';
import { ArrowDownTrayIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { getCompanySettings } from '@/firebase/settings';

interface ExportButtonsProps {
  quote: Quote;
  client: Client | null;
}

export default function ExportButtons({ quote, client }: ExportButtonsProps) {
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState<PDFExportOptions | null>(null);
  const [exporting, setExporting] = useState<'pdf' | 'word' | 'excel' | null>(null);
  const [costings, setCostings] = useState<any[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Cargar configuración de empresa al montar el componente
  useEffect(() => {
    const loadCompanySettings = async () => {
      try {
        const settings = await getCompanySettings();
        setCompanySettings(settings);
      } catch (error) {
        console.error('Error cargando configuración de empresa:', error);
      }
    };
    loadCompanySettings();
  }, []);

  const handleExportPDFClick = () => {
    setShowDropdown(false);
    setShowExportModal(true);
  };

  const handleExportPDF = async (options: PDFExportOptions) => {
    setExportOptions(options);
    
    // Si se requieren detalles de costeo, cargar los costings
    if (options.includeMO || options.includeMaterials || options.includeMargins || options.includeCostSummary) {
      if (quote.costingReferences && quote.costingReferences.length > 0) {
        try {
          const { getCostingById } = await import('@/firebase/costings');
          const loadedCostings = await Promise.all(
            quote.costingReferences.map(id => getCostingById(id))
          );
          setCostings(loadedCostings.filter(c => c !== null) as any[]);
        } catch (error) {
          console.error('Error cargando costings:', error);
          setCostings([]);
        }
      } else {
        setCostings([]);
      }
    } else {
      setCostings([]);
    }
    
    setShowPDFPreview(true);
  };

  // Función helper para generar el nombre del archivo
  const getExportFileName = (extension: string): string => {
    const quoteNumber = quote.quoteNumber || 'N/A';
    const clientName = client?.name || 'SinCliente';
    
    // Formatear fecha como DDMMAAAA
    const formatDate = (date: Date): string => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}${month}${year}`;
    };
    
    const date = quote.createdAt 
      ? formatDate(new Date(quote.createdAt))
      : formatDate(new Date());
    
    // Limpiar nombre del cliente para usar en archivo
    const cleanClientName = clientName.replace(/[^a-z0-9]/gi, '').substring(0, 30);
    
    return `COT-${quoteNumber}-${cleanClientName}-${date}.${extension}`;
  };

  const handleDownloadPDF = async () => {
    if (!quote || !client) return;
    
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const blob = await pdf(<PDFDocument quote={quote} client={client} options={exportOptions || undefined} costings={costings} companySettings={companySettings} />).toBlob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getExportFileName('pdf');
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error descargando PDF:', error);
      alert('Error al descargar PDF');
    }
  };

  const handleExportWord = async () => {
    setExporting('word');
    setShowDropdown(false);
    try {
      const blob = await exportToWord(quote, client);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getExportFileName('docx');
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exportando a Word:', error);
      alert('Error al exportar a Word');
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = () => {
    setExporting('excel');
    setShowDropdown(false);
    try {
      exportToExcel(quote, client, getExportFileName('xlsx'));
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      alert('Error al exportar a Excel');
    } finally {
      setExporting(null);
    }
  };

  // Calcular posición del dropdown
  useEffect(() => {
    if (showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right + window.scrollX - 192, // 192px = w-48 (ancho del dropdown)
      });
    }
  }, [showDropdown]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
          dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Renderizar modal de vista previa usando portal
  const pdfPreviewModal = showPDFPreview && typeof window !== 'undefined' ? createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 10003 }}
      onClick={(e) => {
        // Cerrar al hacer click fuera del contenido
        if (e.target === e.currentTarget) {
          setShowPDFPreview(false);
        }
      }}
    >
      <div 
        className="bg-white rounded-lg w-full h-full max-w-6xl flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Vista Previa PDF</h2>
          <div className="flex gap-3">
            <Button onClick={handleDownloadPDF} variant="primary">
              Descargar PDF
            </Button>
            <Button onClick={() => setShowPDFPreview(false)} variant="outline">
              Cerrar
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <PDFViewer width="100%" height="100%">
            <PDFDocument quote={quote} client={client} options={exportOptions || undefined} costings={costings} companySettings={companySettings} />
          </PDFViewer>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      {pdfPreviewModal}
      <ExportPDFModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportPDF}
      />
      <div className="relative" ref={buttonRef}>
        <Button
          onClick={() => setShowDropdown(!showDropdown)}
          variant="outline"
          disabled={exporting !== null}
          icon={<ArrowDownTrayIcon className="w-5 h-5" />}
          iconPosition="left"
        >
          <span className="flex items-center gap-2">
            {exporting ? 'Exportando...' : 'Descargar'}
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </span>
        </Button>
      </div>
      
      {showDropdown && typeof window !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[10002]"
          style={{ 
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            zIndex: 10002
          }}
        >
          <button
            onClick={handleExportPDFClick}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={exporting !== null}
          >
            <span className="text-red-600 font-semibold">PDF</span>
            <span>{exporting === 'pdf' ? 'Exportando...' : 'Exportar PDF'}</span>
          </button>
          <button
            onClick={handleExportWord}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={exporting !== null}
          >
            <span className="text-blue-600 font-semibold">DOC</span>
            <span>{exporting === 'word' ? 'Exportando...' : 'Exportar Word'}</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={exporting !== null}
          >
            <span className="text-green-600 font-semibold">XLS</span>
            <span>{exporting === 'excel' ? 'Exportando...' : 'Exportar Excel'}</span>
          </button>
        </div>,
        document.body
      )}
    </>
  );
}

