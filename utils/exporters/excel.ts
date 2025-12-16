// Exportador a Excel
import * as XLSX from 'xlsx';
import { Quote, Client, QuoteTotals, Costing } from '@/types';

export function exportToExcel(quote: Quote & Costing, client: Client | null, fileName?: string): void {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const workbook = XLSX.utils.book_new();

  // Hoja 1: Resumen
  const resumenData = [
    ['COTIZACIÓN', quote.projectName],
    ['N° Cotización', quote.quoteNumber || 'N/A'],
    ['Tipo', quote.type],
    ['Modalidad', quote.modality],
    ['Fecha', quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('es-CL') : 'N/A'],
    [''],
    ['DATOS DEL CLIENTE'],
    ['Nombre', client?.name || ''],
    ['RUT', client?.rut || ''],
    ['Contacto', client?.contact || ''],
    ['Email', client?.email || ''],
    ['Teléfono', client?.phone || ''],
    ['Dirección', client?.address || ''],
    ['Región', client?.region || ''],
    ['Ciudad', client?.city || ''],
    [''],
    ['RESUMEN DE COSTOS'],
    ['Costo Directo', quote.totals ? formatCurrency((quote.totals as unknown as QuoteTotals).costoDirecto) : ''],
    ['Indirectos de Obra', quote.totals ? formatCurrency((quote.totals as unknown as QuoteTotals).indirectosObra) : ''],
    ['Subtotal Costo', quote.totals ? formatCurrency((quote.totals as unknown as QuoteTotals).subtotalCosto) : ''],
    [`Gastos Generales (${(quote as unknown as Costing).ggPercentage || 0}%)`, quote.totals ? formatCurrency((quote.totals as unknown as QuoteTotals).gastosGenerales) : ''],
    ['Base', quote.totals ? formatCurrency((quote.totals as unknown as QuoteTotals).base) : ''],
    ['Contingencia', quote.totals ? formatCurrency((quote.totals as unknown as QuoteTotals).contingencia) : ''],
    ['Costo Total', quote.totals ? formatCurrency((quote.totals as unknown as QuoteTotals).costoTotal) : ''],
    ['Precio Neto', quote.totals ? formatCurrency((quote.totals as unknown as QuoteTotals).precioNeto) : ''],
    ['IVA (19%)', quote.totals ? formatCurrency((quote.totals as unknown as QuoteTotals).iva) : ''],
    ['TOTAL CON IVA', quote.totals ? formatCurrency((quote.totals as unknown as QuoteTotals).totalConIva) : ''],
    ['Margen Bruto', quote.totals ? formatCurrency((quote.totals as unknown as QuoteTotals).margenBruto) : ''],
    ['Margen %', quote.totals ? `${(quote.totals as unknown as QuoteTotals).margenPct.toFixed(2)}%` : ''],
  ];

  const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(workbook, resumenSheet, 'Resumen');

  // Hoja 2: Mano de Obra
  if (quote.itemsMO && quote.itemsMO.length > 0) {
    const moData = [
      ['Cargo', 'HH', 'Costo/HH', 'Recargo %', 'Subtotal'],
      ...quote.itemsMO.map((item) => [
        item.cargo,
        item.hh,
        item.costHH,
        item.recargoPct,
        item.subtotal,
      ]),
      ['', '', '', 'TOTAL', quote.itemsMO.reduce((sum, item) => sum + item.subtotal, 0)],
    ];
    const moSheet = XLSX.utils.aoa_to_sheet(moData);
    XLSX.utils.book_append_sheet(workbook, moSheet, 'Mano de Obra');
  }

  // Hoja 3: Materiales
  if (quote.itemsMaterials && quote.itemsMaterials.length > 0) {
    const materialsData = [
      ['Item', 'Unidad', 'Cantidad', 'Costo Unitario', 'Merma %', 'Subtotal'],
      ...quote.itemsMaterials.map((item) => [
        item.item,
        item.unidad,
        item.quantity,
        item.unitCost,
        item.mermaPct,
        item.subtotal,
      ]),
      ['', '', '', '', 'TOTAL', quote.itemsMaterials.reduce((sum, item) => sum + item.subtotal, 0)],
    ];
    const materialsSheet = XLSX.utils.aoa_to_sheet(materialsData);
    XLSX.utils.book_append_sheet(workbook, materialsSheet, 'Materiales');
  }

  // Hoja 4: Equipos
  if (quote.itemsEquipment && quote.itemsEquipment.length > 0) {
    const equipmentData = [
      ['Equipo', 'Unidad', 'Cantidad', 'Tarifa', 'Subtotal'],
      ...quote.itemsEquipment.map((item) => [
        item.equipment,
        item.unit,
        item.quantity,
        item.rate,
        item.subtotal,
      ]),
      ['', '', '', 'TOTAL', quote.itemsEquipment.reduce((sum, item) => sum + item.subtotal, 0)],
    ];
    const equipmentSheet = XLSX.utils.aoa_to_sheet(equipmentData);
    XLSX.utils.book_append_sheet(workbook, equipmentSheet, 'Equipos');
  }

  // Hoja 5: Indirectos
  if (quote.itemsIndirects && quote.itemsIndirects.length > 0) {
    const indirectsData = [
      ['Descripción', 'Tipo', 'Horas', 'Tarifa/Hora', 'Monto Fijo', 'Subtotal'],
      ...quote.itemsIndirects.map((item) => [
        item.description,
        item.type,
        item.hours || '',
        item.rate || '',
        item.amount || '',
        item.subtotal,
      ]),
      ['', '', '', '', 'TOTAL', quote.itemsIndirects.reduce((sum, item) => sum + item.subtotal, 0)],
    ];
    const indirectsSheet = XLSX.utils.aoa_to_sheet(indirectsData);
    XLSX.utils.book_append_sheet(workbook, indirectsSheet, 'Indirectos');
  }

  // Descargar
  const finalFileName = fileName || `Cotizacion_${quote.projectName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.xlsx`;
  XLSX.writeFile(workbook, finalFileName);
}

