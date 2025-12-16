// Exportador a Word (DOCX)
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
import { Quote, Client, Costing } from '@/types';

export async function exportToWord(quote: Quote & Costing, client: Client | null): Promise<Blob> {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const sections: any[] = [];

  // Título
  sections.push({
    children: [
      new Paragraph({
        text: 'COTIZACIÓN',
        heading: 'Heading1',
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `N° Cotización: ${quote.quoteNumber || 'N/A'}`, bold: true }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Proyecto: ${quote.projectName}`, bold: true }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Tipo: ${quote.type} - ${quote.modality}` }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Fecha: ${quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('es-CL') : 'N/A'}`,
          }),
        ],
        spacing: { after: 400 },
      }),
    ],
  });

  // Datos del Cliente
  if (client) {
    sections.push({
      children: [
        new Paragraph({
          text: 'DATOS DEL CLIENTE',
          heading: 'Heading2',
          spacing: { before: 200, after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `Nombre: ${client.name}` })],
        }),
        new Paragraph({
          children: [new TextRun({ text: `RUT: ${client.rut}` })],
        }),
        new Paragraph({
          children: [new TextRun({ text: `Contacto: ${client.contact}` })],
        }),
        new Paragraph({
          children: [new TextRun({ text: `Email: ${client.email}` })],
        }),
        new Paragraph({
          children: [new TextRun({ text: `Teléfono: ${client.phone}` })],
        }),
      new Paragraph({
        children: [new TextRun({ text: `Dirección: ${client.address}` })],
      }),
      new Paragraph({
        children: [new TextRun({ text: `Región: ${client.region || ''}` })],
      }),
      new Paragraph({
        children: [new TextRun({ text: `Ciudad: ${client.city || ''}` })],
        spacing: { after: 400 },
      }),
      ],
    });
  }

  // Alcance
  sections.push({
    children: [
      new Paragraph({
        text: 'ALCANCE DEL PROYECTO',
        heading: 'Heading2',
        spacing: { before: 200, after: 200 },
      }),
      new Paragraph({
        text: quote.scope,
        spacing: { after: 400 },
      }),
    ],
  });

  // Mano de Obra
  if (quote.itemsMO && quote.itemsMO.length > 0) {
    const moRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Cargo')] }),
          new TableCell({ children: [new Paragraph('HH')] }),
          new TableCell({ children: [new Paragraph('Costo/HH')] }),
          new TableCell({ children: [new Paragraph('Subtotal')] }),
        ],
      }),
      ...quote.itemsMO.map((item) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(item.cargo)] }),
            new TableCell({ children: [new Paragraph(item.hh.toString())] }),
            new TableCell({ children: [new Paragraph(formatCurrency(item.costHH))] }),
            new TableCell({ children: [new Paragraph(formatCurrency(item.subtotal))] }),
          ],
        })
      ),
    ];

    sections.push({
      children: [
        new Paragraph({
          text: 'MANO DE OBRA',
          heading: 'Heading2',
          spacing: { before: 200, after: 200 },
        }),
        new Table({
          rows: moRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
      ],
    });
  }

  // Materiales
  if (quote.itemsMaterials && quote.itemsMaterials.length > 0) {
    const materialRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Item')] }),
          new TableCell({ children: [new Paragraph('Cantidad')] }),
          new TableCell({ children: [new Paragraph('Subtotal')] }),
        ],
      }),
      ...quote.itemsMaterials.map((item) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(item.item)] }),
            new TableCell({ children: [new Paragraph(`${item.quantity} ${item.unidad}`)] }),
            new TableCell({ children: [new Paragraph(formatCurrency(item.subtotal))] }),
          ],
        })
      ),
    ];

    sections.push({
      children: [
        new Paragraph({
          text: 'MATERIALES',
          heading: 'Heading2',
          spacing: { before: 200, after: 200 },
        }),
        new Table({
          rows: materialRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
      ],
    });
  }

  // Resumen de Costos
  if (quote.totals) {
    sections.push({
      children: [
        new Paragraph({
          text: 'RESUMEN DE COSTOS',
          heading: 'Heading2',
          spacing: { before: 200, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Costo Directo: ${formatCurrency(quote.totals.costoDirecto)}` }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Indirectos de Obra: ${formatCurrency(quote.totals.indirectosObra)}` }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Subtotal Costo: ${formatCurrency(quote.totals.subtotalCosto)}` }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Gastos Generales (${quote.ggPercentage}%): ${formatCurrency(quote.totals.gastosGenerales)}`,
            }),
          ],
        }),
        new Paragraph({
          children: [new TextRun({ text: `Base: ${formatCurrency(quote.totals.base)}` })],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Contingencia: ${formatCurrency(quote.totals.contingencia)}` }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Costo Total: ${formatCurrency(quote.totals.costoTotal)}` }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Precio Neto: ${formatCurrency(quote.totals?.precioNeto || quote.totals?.precioVenta || 0)}`,
              bold: true,
            }),
          ],
          spacing: { before: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `IVA (19%): ${formatCurrency(quote.totals?.iva || 0)}`,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `TOTAL CON IVA: ${formatCurrency(quote.totals?.totalConIva || 0)}`,
              bold: true,
              size: 32,
            }),
          ],
          spacing: { before: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Margen Bruto: ${formatCurrency(quote.totals.margenBruto)}` }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Margen %: ${quote.totals?.margenPct ? quote.totals.margenPct.toFixed(2) : '0.00'}%` }),
          ],
        }),
      ],
    });
  }

  // Términos y Condiciones
  sections.push({
    children: [
      new Paragraph({
        text: 'TÉRMINOS Y CONDICIONES',
        heading: 'Heading2',
        spacing: { before: 200, after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Plazo de Ejecución: ${quote.executionDeadline} días` })],
      }),
      new Paragraph({
        children: [new TextRun({ text: `Validez de Cotización: ${quote.validity} días` })],
      }),
      new Paragraph({
        children: [new TextRun({ text: `Forma de Pago: ${quote.paymentTerms}` })],
      }),
      ...(quote.warranties
        ? [
            new Paragraph({
              children: [new TextRun({ text: `Garantías: ${quote.warranties}` })],
            }),
          ]
        : []),
    ],
  });

  const doc = new Document({
    sections: [{ children: sections }],
  });

  return await Packer.toBlob(doc);
}

