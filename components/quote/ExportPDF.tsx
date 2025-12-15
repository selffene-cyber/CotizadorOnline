'use client';

// Componente para exportar a PDF
import { useState } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import PDFDocument from '@/utils/exporters/pdf';
import { Quote, Client } from '@/types';
import Button from '@/components/ui/Button';

interface ExportPDFProps {
  quote: Quote;
  client: Client | null;
}

export default function ExportPDF({ quote, client }: ExportPDFProps) {
  const [showPreview, setShowPreview] = useState(false);

  const handleDownload = () => {
    // Para descargar, necesitaríamos usar @react-pdf/renderer con blob
    // Por ahora mostramos preview
    setShowPreview(true);
  };

  if (showPreview) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-full h-full max-w-6xl flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold">Vista Previa PDF</h2>
            <Button onClick={() => setShowPreview(false)} variant="outline">
              Cerrar
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <PDFViewer width="100%" height="100%">
              <PDFDocument quote={quote} client={client} />
            </PDFViewer>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button onClick={handleDownload} variant="outline">
      Exportar a PDF
    </Button>
  );
}



