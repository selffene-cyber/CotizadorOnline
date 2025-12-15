'use client';

// Resumen Ejecutivo con totales calculados
import { QuoteTotals } from '@/types';
import Tooltip from '@/components/ui/Tooltip';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface ResumenEjecutivoProps {
  totals: QuoteTotals;
}

export default function ResumenEjecutivo({ totals }: ResumenEjecutivoProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Resumen Ejecutivo</h3>

      <div className="space-y-4">
        {/* Costo Directo */}
        <div className="flex justify-between items-center py-2 border-b">
          <div className="flex items-center gap-2">
            <span className="text-gray-700">Costo Directo (MO + Materiales + Equipos + Logística)</span>
            <Tooltip 
              id="costo-directo-tooltip"
              content="Suma de todos los costos directamente relacionados con la ejecución del proyecto: mano de obra, materiales, equipos y logística."
            >
              <InformationCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
            </Tooltip>
          </div>
          <span className="font-semibold">{formatCurrency(totals.costoDirecto)}</span>
        </div>

        {/* Indirectos */}
        <div className="flex justify-between items-center py-2 border-b">
          <div className="flex items-center gap-2">
            <span className="text-gray-700">Indirectos de Obra</span>
            <Tooltip 
              id="indirectos-tooltip"
              content="Costos indirectos de ejecución como supervisión, seguridad, administración de obra, etc."
            >
              <InformationCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
            </Tooltip>
          </div>
          <span className="font-semibold">{formatCurrency(totals.indirectosObra)}</span>
        </div>

        {/* Subtotal Costo */}
        <div className="flex justify-between items-center py-2 border-b-2 border-gray-300">
          <span className="text-gray-900 font-medium">Subtotal Costo</span>
          <span className="font-bold text-gray-900">{formatCurrency(totals.subtotalCosto)}</span>
        </div>

        {/* Gastos Generales */}
        <div className="flex justify-between items-center py-2 border-b">
          <div className="flex items-center gap-2">
            <span className="text-gray-700">Gastos Generales</span>
            <Tooltip 
              id="gg-resumen-tooltip"
              content={`GG = ${totals.subtotalCosto.toLocaleString('es-CL')} × (GG% / 100). Incluye gastos administrativos y operativos generales de la empresa.`}
            >
              <InformationCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
            </Tooltip>
          </div>
          <span className="font-semibold">{formatCurrency(totals.gastosGenerales)}</span>
        </div>

        {/* Base */}
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-gray-700">Base (Subtotal + GG)</span>
          <span className="font-semibold">{formatCurrency(totals.base)}</span>
        </div>

        {/* Contingencia */}
        <div className="flex justify-between items-center py-2 border-b">
          <div className="flex items-center gap-2">
            <span className="text-gray-700">Contingencia</span>
            <Tooltip 
              id="contingencia-tooltip"
              content="Reserva para imprevistos y riesgos del proyecto. Se calcula como un porcentaje acumulado sobre la Base."
            >
              <InformationCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
            </Tooltip>
          </div>
          <span className="font-semibold">{formatCurrency(totals.contingencia)}</span>
        </div>

        {/* Costo Total */}
        <div className="flex justify-between items-center py-2 border-b-2 border-gray-400">
          <span className="text-gray-900 font-semibold">Costo Total</span>
          <span className="font-bold text-lg text-gray-900">{formatCurrency(totals.costoTotal)}</span>
        </div>

        {/* Precios con IVA */}
        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Precio Neto</span>
            <span className="font-bold text-lg text-blue-900">
              {formatCurrency(totals.precioNeto || totals.precioVenta || 0)}
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-blue-200 pt-2">
            <span className="text-gray-700">IVA (19%)</span>
            <span className="font-semibold text-blue-800">
              {formatCurrency(totals.iva || 0)}
            </span>
          </div>
          <div className="flex justify-between items-center border-t-2 border-blue-300 pt-2 mt-2">
            <span className="text-gray-900 font-bold text-lg">Total con IVA</span>
            <span className="font-bold text-2xl text-blue-900">
              {formatCurrency(totals.totalConIva || 0)}
            </span>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
          <Tooltip 
            id="margen-bruto-tooltip"
            content="Margen Bruto = Precio Neto - Costo Total. Es la ganancia absoluta antes de impuestos."
          >
            <div className="text-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-help">
              <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
                Margen Bruto
                <InformationCircleIcon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-green-700">{formatCurrency(totals.margenBruto)}</div>
            </div>
          </Tooltip>
          <Tooltip 
            id="margen-pct-tooltip"
            content={`Margen % = (Margen Bruto / Precio Neto) × 100 = ${formatPercent(totals.margenPct)}. Indica el porcentaje de ganancia sobre el precio de venta.`}
          >
            <div className="text-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-help">
              <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
                Margen %
                <InformationCircleIcon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-purple-700">{formatPercent(totals.margenPct)}</div>
            </div>
          </Tooltip>
          <Tooltip 
            id="markup-tooltip"
            content={`Mark-up = (Precio Neto / Costo Total) - 1 = ${formatPercent(totals.markup * 100)}. Indica cuántas veces el precio es mayor que el costo.`}
          >
            <div className="text-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors cursor-help">
              <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
                Mark-up
                <InformationCircleIcon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-orange-700">{formatPercent(totals.markup * 100)}</div>
            </div>
          </Tooltip>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Costo Total</div>
            <div className="text-2xl font-bold text-gray-700">{formatCurrency(totals.costoTotal)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

