// Exportador de Costeo a Excel
import * as XLSX from 'xlsx';
import { Costing } from '@/types';

export function exportCostingToExcel(costing: Costing): void {
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
    ['COSTEO DE PROYECTO', costing.name],
    ['Tipo', costing.type],
    ['Modalidad', costing.modality],
    ['Fecha', costing.createdAt ? new Date(costing.createdAt).toLocaleDateString('es-CL') : 'N/A'],
    ['Descripción', costing.description || ''],
    [''],
    ['RESUMEN EJECUTIVO'],
    ['Costo Directo', costing.totals ? formatCurrency(costing.totals.costoDirecto) : ''],
    ['Indirectos de Obra', costing.totals ? formatCurrency(costing.totals.indirectosObra) : ''],
    ['Subtotal Costo', costing.totals ? formatCurrency(costing.totals.subtotalCosto) : ''],
    [`Gastos Generales (${costing.ggPercentage}%)`, costing.totals ? formatCurrency(costing.totals.gastosGenerales) : ''],
    ['Base', costing.totals ? formatCurrency(costing.totals.base) : ''],
    ['Contingencia', costing.totals ? formatCurrency(costing.totals.contingencia) : ''],
    ['Costo Total', costing.totals ? formatCurrency(costing.totals.costoTotal) : ''],
    ['Utilidad', costing.totals ? formatCurrency(costing.totals.margenBruto) : ''],
    ['Precio Neto', costing.totals ? formatCurrency(costing.totals.precioNeto) : ''],
    ['IVA (19%)', costing.totals ? formatCurrency(costing.totals.iva) : ''],
    ['TOTAL CON IVA', costing.totals ? formatCurrency(costing.totals.totalConIva) : ''],
    ['Margen Bruto', costing.totals ? formatCurrency(costing.totals.margenBruto) : ''],
    ['Margen %', costing.totals ? `${costing.totals.margenPct.toFixed(2)}%` : ''],
    ['Mark-up', costing.totals ? `${costing.totals.markup.toFixed(2)}%` : ''],
  ];

  const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(workbook, resumenSheet, 'Resumen');

  // Hoja 2: Mano de Obra
  if (costing.itemsMO && costing.itemsMO.length > 0) {
    const moData = [
      ['CARGO', 'HH', 'COSTO/HH', 'SUBTOTAL'],
      ...costing.itemsMO.map(item => [
        item.cargo,
        item.hh,
        formatCurrency(item.costHH),
        formatCurrency(item.subtotal),
      ]),
      ['TOTAL', '', '', formatCurrency(costing.itemsMO.reduce((sum, item) => sum + item.subtotal, 0))],
    ];
    const moSheet = XLSX.utils.aoa_to_sheet(moData);
    XLSX.utils.book_append_sheet(workbook, moSheet, 'Mano de Obra');
  }

  // Hoja 3: Materiales
  if (costing.itemsMaterials && costing.itemsMaterials.length > 0) {
    const materialsData = [
      ['ITEM', 'CANTIDAD', 'UNIDAD', 'COSTO UNITARIO', 'MERMA %', 'SUBTOTAL'],
      ...costing.itemsMaterials.map(item => [
        item.item,
        item.quantity,
        item.unidad,
        formatCurrency(item.unitCost),
        `${item.mermaPct?.toFixed(1) || 0}%`,
        formatCurrency(item.subtotal),
      ]),
      ['TOTAL', '', '', '', '', formatCurrency(costing.itemsMaterials.reduce((sum, item) => sum + item.subtotal, 0))],
    ];
    const materialsSheet = XLSX.utils.aoa_to_sheet(materialsData);
    XLSX.utils.book_append_sheet(workbook, materialsSheet, 'Materiales');
  }

  // Hoja 4: Equipos
  if (costing.itemsEquipment && costing.itemsEquipment.length > 0) {
    const equipmentData = [
      ['ITEM', 'UNIDAD', 'CANTIDAD', 'TARIFA', 'SUBTOTAL'],
      ...costing.itemsEquipment.map(item => [
        item.item,
        item.unit,
        item.quantity,
        formatCurrency(item.rate),
        formatCurrency(item.subtotal),
      ]),
      ['TOTAL', '', '', '', formatCurrency(costing.itemsEquipment.reduce((sum, item) => sum + item.subtotal, 0))],
    ];
    const equipmentSheet = XLSX.utils.aoa_to_sheet(equipmentData);
    XLSX.utils.book_append_sheet(workbook, equipmentSheet, 'Equipos');
  }

  // Hoja 5: Logística
  if (costing.itemsLogistics && costing.itemsLogistics.subtotal > 0) {
    const logisticsData = [
      ['MODO', costing.itemsLogistics.mode === 'km' ? 'Por Kilómetros' :
                costing.itemsLogistics.mode === 'viatico' ? 'Viático' :
                costing.itemsLogistics.mode === 'fixed' ? 'Monto Fijo' : costing.itemsLogistics.mode],
    ];

    if (costing.itemsLogistics.mode === 'km') {
      if (costing.itemsLogistics.km) logisticsData.push(['Kilómetros', costing.itemsLogistics.km]);
      if (costing.itemsLogistics.ratePerKm) logisticsData.push(['Tarifa por Km', formatCurrency(costing.itemsLogistics.ratePerKm)]);
    }

    if (costing.itemsLogistics.mode === 'viatico') {
      if (costing.itemsLogistics.days) logisticsData.push(['Días', costing.itemsLogistics.days]);
      if (costing.itemsLogistics.viaticoPerDay) logisticsData.push(['Viático por Día', formatCurrency(costing.itemsLogistics.viaticoPerDay)]);
      if (costing.itemsLogistics.accommodation) logisticsData.push(['Alojamiento', formatCurrency(costing.itemsLogistics.accommodation)]);
    }

    if (costing.itemsLogistics.mode === 'fixed' && costing.itemsLogistics.fixedMobilization) {
      logisticsData.push(['Monto Fijo', formatCurrency(costing.itemsLogistics.fixedMobilization)]);
    }

    logisticsData.push(['TOTAL', formatCurrency(costing.itemsLogistics.subtotal)]);

    const logisticsSheet = XLSX.utils.aoa_to_sheet(logisticsData);
    XLSX.utils.book_append_sheet(workbook, logisticsSheet, 'Logística');
  }

  // Hoja 6: Indirectos
  if (costing.itemsIndirects && costing.itemsIndirects.length > 0) {
    const indirectsData = [
      ['DESCRIPCIÓN', 'TIPO', 'CANTIDAD', 'TARIFA/MONTO', 'SUBTOTAL'],
      ...costing.itemsIndirects.map(item => [
        item.description,
        item.type === 'hh' ? 'Horas-Hombre' : 'Monto Fijo',
        item.type === 'hh' ? `${item.hours} HH` : '-',
        item.type === 'hh' ? formatCurrency(item.rate || 0) : formatCurrency(item.amount || 0),
        formatCurrency(item.subtotal),
      ]),
      ['TOTAL', '', '', '', formatCurrency(costing.itemsIndirects.reduce((sum, item) => sum + item.subtotal, 0))],
    ];
    const indirectsSheet = XLSX.utils.aoa_to_sheet(indirectsData);
    XLSX.utils.book_append_sheet(workbook, indirectsSheet, 'Indirectos');
  }

  // Generar nombre de archivo
  const fileName = `Costeo_${costing.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

  // Descargar
  XLSX.writeFile(workbook, fileName);
}



