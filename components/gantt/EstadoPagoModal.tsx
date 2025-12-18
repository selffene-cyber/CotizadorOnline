'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Quote, GanttTask } from '@/types';
import { generateEstadoPago } from '@/utils/planning/estado-pago';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { pdf } from '@react-pdf/renderer';
import EstadoPagoPDFDocument from '@/utils/exporters/estado-pago-pdf';
import { getCompanySettings } from '@/supabase/settings';
import { CompanySettings } from '@/types';

interface EstadoPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote;
  tasks: GanttTask[];
}

export default function EstadoPagoModal({ 
  isOpen, 
  onClose, 
  quote, 
  tasks 
}: EstadoPagoModalProps) {
  const [periodoDesde, setPeriodoDesde] = useState('');
  const [periodoHasta, setPeriodoHasta] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [generating, setGenerating] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);

  // Cargar configuración de empresa al montar
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getCompanySettings();
        setCompanySettings(settings);
      } catch (error) {
        console.error('Error cargando configuración:', error);
      }
    };
    loadSettings();
  }, []);

  const handleGenerate = async () => {
    if (!periodoDesde || !periodoHasta) {
      alert('Por favor completa las fechas del período');
      return;
    }

    if (new Date(periodoDesde) > new Date(periodoHasta)) {
      alert('La fecha de inicio debe ser anterior a la fecha de fin');
      return;
    }

    try {
      setGenerating(true);

      // Generar estado de pago
      const estadoPago = generateEstadoPago(
        quote,
        tasks,
        periodoDesde,
        periodoHasta,
        observaciones
      );

      // Generar PDF
      const blob = await pdf(
        <EstadoPagoPDFDocument 
          quote={quote} 
          estadoPago={estadoPago}
          companySettings={companySettings}
        />
      ).toBlob();

      // Descargar PDF
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Nombre del archivo
      const desde = periodoDesde.replace(/-/g, '');
      const hasta = periodoHasta.replace(/-/g, '');
      a.download = `EP-${quote.quoteNumber || '00'}-${desde}-${hasta}.pdf`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onClose();
    } catch (error) {
      console.error('Error generando estado de pago:', error);
      alert('Error al generar el estado de pago');
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 10005 }}
      onClick={(e) => {
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
          <h2 className="text-xl font-bold text-gray-900">Generar Estado de Pago</h2>
          <p className="text-sm text-gray-600 mt-1">Ingresa el período para calcular el estado de pago</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha Inicio del Período *"
              type="date"
              value={periodoDesde}
              onChange={(e) => setPeriodoDesde(e.target.value)}
              required
            />
            <Input
              label="Fecha Fin del Período *"
              type="date"
              value={periodoHasta}
              onChange={(e) => setPeriodoHasta(e.target.value)}
              required
            />
          </div>

          <Textarea
            label="Observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={4}
            placeholder="Observaciones adicionales sobre el estado de pago..."
          />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> El estado de pago se calculará basado en el avance de las tareas del proyecto Gantt.
            </p>
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
            onClick={handleGenerate}
            variant="primary"
            disabled={generating || !periodoDesde || !periodoHasta}
          >
            {generating ? 'Generando...' : 'Generar PDF'}
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

