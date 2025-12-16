// Cálculos de totales de cotización
import { Quote, QuoteTotals, Costing } from '@/types';

/**
 * Calcula todos los totales de una cotización
 */
export function calculateQuoteTotals(quote: Quote & Costing): QuoteTotals {
  // 1. Costo Directo = MO + Materiales + Equipos + Logística
  const totalMO = (quote.itemsMO || []).reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const totalMaterials = (quote.itemsMaterials || []).reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const totalEquipment = (quote.itemsEquipment || []).reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const totalLogistics = quote.itemsLogistics?.subtotal || 0;
  
  const costoDirecto = Math.round(totalMO + totalMaterials + totalEquipment + totalLogistics);
  
  // 2. Indirectos de Obra
  const indirectosObra = Math.round(
    (quote.itemsIndirects || []).reduce((sum, item) => sum + (item.subtotal || 0), 0)
  );
  
  // 3. Subtotal Costo = Directo + Indirectos
  const subtotalCosto = costoDirecto + indirectosObra;
  
  // 4. Gastos Generales = GG % * Subtotal
  const gastosGenerales = Math.round(subtotalCosto * ((quote.ggPercentage || 0) / 100));
  
  // 5. Base = Subtotal + GG
  const base = subtotalCosto + gastosGenerales;
  
  // 6. Contingencia = % acumulado * Base
  const contingencyPct = (quote.contingencyItems || []).reduce(
    (sum, item) => sum + (item.percentage || 0),
    0
  );
  const contingencia = Math.round(base * (contingencyPct / 100));
  
  // 7. Costo Total = Base + Contingencia
  const costoTotal = base + contingencia;
  
  // 8. Precio Neto (Precio Venta sin IVA) = Costo Total * (1 + Utilidad%)
  const precioNeto = Math.round(costoTotal * (1 + (quote.utilityPercentage || 0) / 100));
  
  // 9. IVA = 19% del Precio Neto
  const iva = Math.round(precioNeto * 0.19);
  
  // 10. Total con IVA = Precio Neto + IVA
  const totalConIva = precioNeto + iva;
  
  // 11. Margen Bruto = Precio Neto - Costo Total
  const margenBruto = precioNeto - costoTotal;
  
  // 12. Margen % = (Margen Bruto / Precio Neto) * 100
  const margenPct = precioNeto > 0 ? (margenBruto / precioNeto) * 100 : 0;
  
  // 13. Mark-up = (Precio Neto / Costo Total) - 1
  const markup = costoTotal > 0 ? (precioNeto / costoTotal) - 1 : 0;
  
  return {
    costoDirecto,
    indirectosObra,
    subtotalCosto,
    gastosGenerales,
    base,
    contingencia,
    costoTotal,
    precioVenta: precioNeto, // Mantener por compatibilidad
    precioNeto,
    iva,
    totalConIva,
    margenBruto,
    margenPct: Math.round(margenPct * 100) / 100, // Redondear a 2 decimales
    markup: Math.round(markup * 10000) / 100, // Redondear a 2 decimales
  };
}

/**
 * Calcula HH a partir de días
 */
export function calculateHH(
  days: number,
  hoursPerDay: number = 9,
  efficiency: number = 0.85
): number {
  return Math.round(days * hoursPerDay * efficiency);
}

/**
 * Calcula subtotal de Material con merma
 */
export function calculateMaterialSubtotal(
  quantity: number,
  unitCost: number,
  mermaPct: number
): number {
  const quantityWithMerma = quantity * (1 + mermaPct / 100);
  return Math.round(quantityWithMerma * unitCost);
}

