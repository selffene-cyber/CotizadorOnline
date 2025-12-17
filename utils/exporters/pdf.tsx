// Exportador a PDF usando react-pdf
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Quote, Client, Costing, CompanySettings, QuoteTotals } from '@/types';
import { PDFExportOptions } from '@/components/quote/ExportPDFModal';

// Función para parsear HTML y convertirlo a componentes de React-PDF
const parseHTMLToPDF = (html: string): React.ReactElement[] => {
    if (!html) return [];

    const elements: React.ReactElement[] = [];

    // Remover espacios en blanco al inicio y final
    const cleanHtml = html.trim();

    // Detectar si es una lista ordenada
    const olMatch = cleanHtml.match(/<ol[^>]*>([\s\S]*?)<\/ol>/);
    if (olMatch) {
        const listContent = olMatch[1];
        const items = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/g) || [];

        items.forEach((item, index) => {
            // Extraer el contenido del <li> y limpiarlo
            const itemContent = item.replace(/<li[^>]*>|<\/li>/gi, '');
            // Remover todas las etiquetas HTML y normalizar espacios
            const itemText = itemContent
                .replace(/<br\s*\/?>/gi, '\n') // Convertir <br> a saltos de línea
                .replace(/<[^>]+>/g, ' ') // Remover otras etiquetas HTML
                .replace(/\s+/g, ' ') // Normalizar espacios múltiples
                .replace(/\n\s*/g, '\n') // Limpiar saltos de línea
                .trim();

            if (itemText) {
                // Dividir por saltos de línea si los hay
                const lines = itemText.split('\n').filter(line => line.trim());
                lines.forEach((line, lineIndex) => {
                    elements.push(
                        <Text key={`ol-item-${index}-${lineIndex}`} style={{ marginBottom: lineIndex === 0 ? 4 : 2, paddingLeft: lineIndex === 0 ? 10 : 20 }}>
                            {lineIndex === 0 ? `${index + 1}. ${line.trim()}` : line.trim()}
                        </Text>
                    );
                });
            }
        });
        return elements;
    }

    // Detectar si es una lista no ordenada
    const ulMatch = cleanHtml.match(/<ul[^>]*>([\s\S]*?)<\/ul>/);
    if (ulMatch) {
        const listContent = ulMatch[1];
        const items = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/g) || [];

        items.forEach((item, index) => {
            // Extraer el contenido del <li> y limpiarlo
            const itemContent = item.replace(/<li[^>]*>|<\/li>/gi, '');
            // Remover todas las etiquetas HTML y normalizar espacios
            const itemText = itemContent
                .replace(/<br\s*\/?>/gi, '\n') // Convertir <br> a saltos de línea
                .replace(/<[^>]+>/g, ' ') // Remover otras etiquetas HTML
                .replace(/\s+/g, ' ') // Normalizar espacios múltiples
                .replace(/\n\s*/g, '\n') // Limpiar saltos de línea
                .trim();

            if (itemText) {
                // Dividir por saltos de línea si los hay
                const lines = itemText.split('\n').filter(line => line.trim());
                lines.forEach((line, lineIndex) => {
                    elements.push(
                        <Text key={`ul-item-${index}-${lineIndex}`} style={{ marginBottom: lineIndex === 0 ? 4 : 2, paddingLeft: lineIndex === 0 ? 10 : 20 }}>
                            {lineIndex === 0 ? `• ${line.trim()}` : line.trim()}
                        </Text>
                    );
                });
            }
        });
        return elements;
    }

    // Si no es una lista, extraer párrafos
    const paragraphs = cleanHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/g) || [];
    if (paragraphs.length > 0) {
        paragraphs.forEach((para, index) => {
            const paraText = para.replace(/<p[^>]*>|<\/p>/g, '').replace(/<[^>]+>/g, ' ').trim();
            if (paraText) {
                elements.push(
                    <Text key={`para-${index}`} style={{ marginBottom: 6 }}>
                        {paraText}
                    </Text>
                );
            }
        });
        return elements;
    }

    // Si no hay etiquetas específicas, limpiar todo el HTML y mostrar como texto plano
    const plainText = cleanHtml
        .replace(/<[^>]+>/g, ' ') // Remover todas las etiquetas HTML
        .replace(/\s+/g, ' ') // Normalizar espacios
        .trim();

    if (plainText) {
        elements.push(
            <Text key="plain-text" style={{ marginBottom: 6 }}>
                {plainText}
            </Text>
        );
    }

    return elements;
};

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
    },
    // Header con logo y título
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 5,
        paddingBottom: 8,
        borderBottom: '2 solid #0066cc',
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    logoContainer: {
        marginBottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
    },
    companyName: {
        fontSize: 14, // Reducido de 18 a 14 (~22% menos, cerca del 25% solicitado)
        fontWeight: 'bold',
        color: '#0066cc',
        marginBottom: 2,
    },
    companySubname: {
        fontSize: 11, // Reducido proporcionalmente de 14 a 11
        fontWeight: 'bold',
        color: '#0066cc',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#003d7a',
        fontFamily: 'Helvetica-Bold',
    },
    // Información de contacto
    contactSection: {
        marginTop: 2,
        fontSize: 9,
        color: '#666666',
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    contactRow: {
        marginRight: 10,
        marginBottom: 2,
    },
    // Sección de datos del cliente
    clientSection: {
        marginBottom: 10,
        marginTop: 5,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    clientTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 8,
    },
    clientRow: {
        flexDirection: 'row',
        marginBottom: 4,
        fontSize: 9,
        width: '48%',
    },
    clientLabel: {
        width: '30%',
        fontWeight: 'bold',
        color: '#666666',
    },
    clientValue: {
        width: '70%',
        color: '#333333',
    },
    // Tabla de items
    itemsSection: {
        marginBottom: 5,
        marginTop: 5,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#0066cc',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    tableHeaderText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1 solid #e0e0e0',
        paddingVertical: 8,
        paddingHorizontal: 8,
        minHeight: 30,
    },
    tableCellNumber: {
        width: '5%',
        fontSize: 9,
        textAlign: 'center',
        color: '#333333',
    },
    tableCellCodigo: {
        width: '10%',
        fontSize: 9,
        textAlign: 'center',
        color: '#333333',
    },
    tableCellDescription: {
        width: '35%',
        fontSize: 9,
        color: '#333333',
    },
    tableCellUnit: {
        width: '10%',
        fontSize: 9,
        textAlign: 'center',
        color: '#333333',
    },
    tableCellQuantity: {
        width: '10%',
        fontSize: 9,
        textAlign: 'center',
        color: '#333333',
    },
    tableCellPrice: {
        width: '15%',
        fontSize: 9,
        textAlign: 'right',
        color: '#333333',
    },
    tableCellTotal: {
        width: '15%',
        fontSize: 9,
        textAlign: 'right',
        color: '#333333',
        fontWeight: 'bold',
    },
    // Totales
    totalsSection: {
        marginTop: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
    },
    termsBox: {
        width: '63%',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderStyle: 'solid',
        borderRadius: 2,
        backgroundColor: '#ffffff',
        padding: 5,
    },
    totalsBox: {
        width: '35%',
        backgroundColor: '#ffffff',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 3,
        paddingHorizontal: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        borderBottomStyle: 'solid',
    },
    totalLabel: {
        color: '#444444',
        fontSize: 9,
        fontWeight: 'bold',
    },
    totalValue: {
        fontSize: 9,
        color: '#333333',
        textAlign: 'right',
    },
    finalTotalBox: {
        backgroundColor: '#0066cc',
        paddingVertical: 5,
        paddingHorizontal: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    finalTotalLabel: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: 'Helvetica-Bold',
    },
    finalTotalValue: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: 'bold',
        fontFamily: 'Helvetica-Bold',
    },
    // Secciones de texto
    textSection: {
        marginTop: 10,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 5,
        paddingBottom: 3,
        borderBottom: '1 solid #e0e0e0',
    },
    sectionText: {
        fontSize: 9,
        color: '#666666',
        lineHeight: 1.5,
    },
    // Footer
    footer: {
        marginTop: 30,
        paddingTop: 15,
        borderTop: '1 solid #e0e0e0',
        fontSize: 8,
        color: '#999999',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    footerLeft: {
        width: '35%',
        borderRight: '1 solid #e0e0e0',
        paddingRight: 10,
    },
    footerRight: {
        width: '65%',
        paddingLeft: 10,
    },
    footerTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#666666',
        marginBottom: 5,
    },
    footerText: {
        fontSize: 8,
        color: '#999999',
        lineHeight: 1.4,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666666',
        marginTop: 5,
        marginBottom: 10,
    },
    table: {
        marginTop: 5,
    },
});

interface PDFDocumentProps {
    quote: Quote;
    client: Client | null;
    options?: PDFExportOptions;
    costings?: Costing[]; // Costings asociados para mostrar detalles
    companySettings?: CompanySettings | null; // Configuración de la empresa
}

const PDFDocument: React.FC<PDFDocumentProps> = ({ quote, client, options, costings = [], companySettings = null }) => {
    const opts: PDFExportOptions = options || {
        includeScope: true,
        includeExclusions: true,
        includeAssumptions: true,
        includeMO: false,
        includeMaterials: false,
        includeMargins: false,
        includeCostSummary: false,
    };

    const formatCurrency = (amount: number) => {
        if (!amount && amount !== 0) return '$ 0';
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Calcular totales desde quoteItems
    const subtotal = quote.quoteItems?.reduce((sum, item) => sum + (item.subtotal || 0), 0) || 0;
    const iva = quote.totals?.iva || Math.round(subtotal * 0.19);
    const totalConIva = quote.totals?.totalConIva || (subtotal + iva);

    // Verificar si se deben mostrar detalles de costeo
    const showCostingDetails = opts.includeMO || opts.includeMaterials || opts.includeMargins || opts.includeCostSummary;

    // Formatear fecha como DDMMAAAA para el nombre del documento
    const formatDate = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}${month}${year}`;
    };

    const docName = `COT-${quote.quoteNumber || '00'}-${client?.name?.replace(/\s+/g, '') || 'CLIENTE'}-${formatDate(quote.createdAt ? new Date(quote.createdAt) : new Date())}.pdf`;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header Dinámico */}
                <View fixed style={{ marginBottom: 5 }}>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={styles.logoContainer}>
                                {companySettings?.companyLogo && (
                                    <Image
                                        src={companySettings.companyLogo}
                                        style={{ width: 80, height: 80, objectFit: 'contain', flexShrink: 0, marginRight: 10 }}
                                    />
                                )}
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.companyName}>
                                        {companySettings?.companyName || 'COTIZADOR PRO'}
                                    </Text>
                                    {companySettings?.companyGiro && (
                                        <Text style={styles.companySubname}>{companySettings.companyGiro}</Text>
                                    )}
                                    {companySettings?.companyRUT && (
                                        <Text style={{ fontSize: 8, color: '#666666', marginTop: 2 }}>
                                            RUT: {companySettings.companyRUT}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <View style={[styles.contactSection, { marginTop: 2 }]}>
                                {companySettings?.companyAddress && (
                                    <Text style={styles.contactRow}>
                                        {companySettings.companyAddress}
                                        {companySettings?.companyCity && `, ${companySettings.companyCity}`}
                                        {companySettings?.companyRegion && `, ${companySettings.companyRegion}`}
                                    </Text>
                                )}
                                {companySettings?.companyPhone && (
                                    <Text style={styles.contactRow}>Teléfono: {companySettings.companyPhone}</Text>
                                )}
                                {companySettings?.companyEmail && (
                                    <Text style={styles.contactRow}>Email: {companySettings.companyEmail}</Text>
                                )}
                                {companySettings?.companyWebsite && (
                                    <Text style={styles.contactRow}>Web: {companySettings.companyWebsite}</Text>
                                )}
                                {companySettings?.companySocialMedia && (
                                    <Text style={styles.contactRow}>{companySettings.companySocialMedia}</Text>
                                )}
                                {!companySettings && (
                                    <>
                                        <Text style={styles.contactRow}>Email: contacto@cotizadorpro.com</Text>
                                        <Text style={styles.contactRow}>Teléfono: +56 9 XXXX XXXX</Text>
                                        <Text style={styles.contactRow}>Dirección: Av. Principal 123, Santiago</Text>
                                    </>
                                )}
                            </View>
                        </View>
                        <View style={styles.headerRight}>
                            <Text style={{ fontSize: 8, color: '#666', marginBottom: 2, textAlign: 'right' }} render={({ pageNumber, totalPages }) => (
                                `${pageNumber} de ${totalPages}`
                            )} />
                            <Text style={styles.title}>COTIZACIÓN</Text>
                            {quote.quoteNumber && (
                                <Text style={[styles.contactSection, { marginTop: 5, textAlign: 'right' }]}>
                                    N°: {quote.quoteNumber}
                                </Text>
                            )}
                            <Text style={{ fontSize: 10, color: '#666', marginBottom: 2, textAlign: 'right' }}>
                                Fecha: {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('es-CL') : new Date().toLocaleDateString('es-CL')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Información del Cliente */}
                {client && (
                    <View style={styles.clientSection}>
                        <View style={styles.clientRow}>
                            <Text style={styles.clientLabel}>A:</Text>
                            <Text style={styles.clientValue}>{client.name}</Text>
                        </View>
                        <View style={styles.clientRow}>
                            <Text style={styles.clientLabel}>RUT:</Text>
                            <Text style={styles.clientValue}>{client.rut}</Text>
                        </View>
                        <View style={styles.clientRow}>
                            <Text style={styles.clientLabel}>Contacto:</Text>
                            <Text style={styles.clientValue}>{client.contact}</Text>
                        </View>
                        {(client.email || client.phone || client.address) && (
                            <>
                                {client.email && (
                                    <View style={styles.clientRow}>
                                        <Text style={styles.clientLabel}>Email:</Text>
                                        <Text style={styles.clientValue}>{client.email}</Text>
                                    </View>
                                )}
                                {client.phone && (
                                    <View style={styles.clientRow}>
                                        <Text style={styles.clientLabel}>Teléfono:</Text>
                                        <Text style={styles.clientValue}>{client.phone}</Text>
                                    </View>
                                )}
                                {client.address && (
                                    <View style={styles.clientRow}>
                                        <Text style={styles.clientLabel}>Dirección:</Text>
                                        <Text style={styles.clientValue}>
                                            {[client.address, client.city, client.region].filter(Boolean).join(', ')}
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                )}

                {/* Tabla de Items - SIEMPRE se muestra si hay items */}
                {quote.quoteItems && Array.isArray(quote.quoteItems) && quote.quoteItems.length > 0 ? (
                    <View style={styles.itemsSection}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderText, { width: '5%' }]}>N°</Text>
                            <Text style={[styles.tableHeaderText, { width: '10%' }]}>CÓDIGO</Text>
                            <Text style={[styles.tableHeaderText, { width: '35%', textAlign: 'left', paddingLeft: 5 }]}>DESCRIPCIÓN</Text>
                            <Text style={[styles.tableHeaderText, { width: '10%' }]}>UNIDAD</Text>
                            <Text style={[styles.tableHeaderText, { width: '10%' }]}>CANT.</Text>
                            <Text style={[styles.tableHeaderText, { width: '15%', textAlign: 'right' }]}>PRECIO</Text>
                            <Text style={[styles.tableHeaderText, { width: '15%', textAlign: 'right' }]}>TOTAL</Text>
                        </View>

                        {quote.quoteItems.map((item, idx) => (
                            <View key={item.id || `item-${idx}`} style={styles.tableRow}>
                                <Text style={styles.tableCellNumber}>
                                    {item.itemNumber || idx + 1}
                                </Text>
                                <Text style={styles.tableCellCodigo}>
                                    {item.codigoInterno || '-'}
                                </Text>
                                <Text style={styles.tableCellDescription}>
                                    {item.description || 'Sin descripción'}
                                </Text>
                                <Text style={styles.tableCellUnit}>
                                    {item.unit || ''}
                                </Text>
                                <Text style={styles.tableCellQuantity}>
                                    {item.quantity || 0}
                                </Text>
                                <Text style={styles.tableCellPrice}>
                                    {formatCurrency(item.unitPrice || 0)}
                                </Text>
                                <Text style={styles.tableCellTotal}>
                                    {formatCurrency(item.subtotal || 0)}
                                </Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.itemsSection}>
                        <Text style={styles.sectionTitle}>No hay items en esta cotización</Text>
                    </View>
                )}

                {/* Bloque agrupado de Totales y Pie de Página para evitar saltos */}
                <View wrap={false}>
                    {/* Totales y Términos */}
                    <View style={styles.totalsSection}>
                        {/* Términos y Condiciones (Izquierda) */}
                        <View style={styles.termsBox}>
                            <Text style={[styles.sectionTitle, { fontSize: 9, marginBottom: 4, borderBottomWidth: 0, color: '#666' }]}>
                                Términos y Condiciones:
                            </Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                {quote.paymentTerms && (
                                    <View style={{ width: '50%', marginBottom: 1 }}>
                                        <Text style={[styles.sectionText, { fontSize: 8 }]}>
                                            <Text style={{ fontWeight: 'bold' }}>Pago: </Text>{quote.paymentTerms}
                                        </Text>
                                    </View>
                                )}
                                {quote.executionDeadline && (
                                    <View style={{ width: '50%', marginBottom: 1 }}>
                                        <Text style={[styles.sectionText, { fontSize: 8 }]}>
                                            <Text style={{ fontWeight: 'bold' }}>Plazo de ejecución: </Text>{quote.executionDeadline} días
                                        </Text>
                                    </View>
                                )}
                                {quote.validity && (
                                    <View style={{ width: '50%', marginBottom: 1 }}>
                                        <Text style={[styles.sectionText, { fontSize: 8 }]}>
                                            <Text style={{ fontWeight: 'bold' }}>Validez: </Text>{quote.validity} días
                                        </Text>
                                    </View>
                                )}
                                {quote.warranties && (
                                    <View style={{ width: '50%', marginBottom: 1 }}>
                                        <Text style={[styles.sectionText, { fontSize: 8 }]}>
                                            <Text style={{ fontWeight: 'bold' }}>Garantía: </Text>{quote.warranties}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Caja de Totales (Derecha) */}
                        <View style={styles.totalsBox}>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>SUB TOTAL:</Text>
                                <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
                            </View>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>IMPUESTO (19%):</Text>
                                <Text style={styles.totalValue}>{formatCurrency(iva)}</Text>
                            </View>
                            {/* Remove additional finalTotalRow nesting since styling handles it */}
                            <View style={styles.finalTotalBox}>
                                <Text style={styles.finalTotalLabel}>TOTAL:</Text>
                                <Text style={styles.finalTotalValue}>{formatCurrency(totalConIva)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Footer - Movido e integrado aquí para que viaje junto con los totales */}
                    <View style={[styles.footer, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' }]}>
                        <View style={styles.footerRow}>
                            <View style={styles.footerLeft}>
                                {companySettings && (
                                    <>
                                        <Text style={[styles.footerTitle, { marginBottom: 2 }]}>Cotizador:</Text>
                                        {companySettings.quoterName && (
                                            <Text style={[styles.footerText, { fontWeight: 'bold' }]}>
                                                {companySettings.quoterName}
                                                {companySettings.quoterPosition && ` - ${companySettings.quoterPosition}`}
                                            </Text>
                                        )}
                                        {companySettings.quoterPhone && (
                                            <Text style={styles.footerText}>Tel: {companySettings.quoterPhone}</Text>
                                        )}
                                        {companySettings.quoterEmail && (
                                            <Text style={styles.footerText}>Email: {companySettings.quoterEmail}</Text>
                                        )}
                                    </>
                                )}
                            </View>
                            <View style={styles.footerRight}>
                                {/* Datos de cuenta bancaria */}
                                {companySettings && (companySettings.bankAccountName || companySettings.bankName || companySettings.bankAccountNumber) && (
                                    <View style={{ marginTop: 0, paddingTop: 0 }}>
                                        <Text style={[styles.footerTitle, { marginBottom: 3 }]}>Datos para Depósito/Transferencia:</Text>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                            {companySettings.bankAccountName && (
                                                <Text style={[styles.footerText, { width: '48%', marginBottom: 2 }]}>
                                                    <Text style={{ fontWeight: 'bold' }}>Titular: </Text>{companySettings.bankAccountName}
                                                    {companySettings.bankAccountRUT && ` (${companySettings.bankAccountRUT})`}
                                                </Text>
                                            )}
                                            {companySettings.bankName && (
                                                <Text style={[styles.footerText, { width: '48%', marginBottom: 2 }]}>
                                                    <Text style={{ fontWeight: 'bold' }}>Banco: </Text>{companySettings.bankName}
                                                </Text>
                                            )}
                                            {companySettings.bankAccountType && (
                                                <Text style={[styles.footerText, { width: '48%', marginBottom: 2 }]}>
                                                    <Text style={{ fontWeight: 'bold' }}>Tipo: </Text>{companySettings.bankAccountType}
                                                </Text>
                                            )}
                                            {companySettings.bankAccountNumber && (
                                                <Text style={[styles.footerText, { width: '48%', marginBottom: 2, fontWeight: 'bold' }]}>
                                                    N°: {companySettings.bankAccountNumber}
                                                </Text>
                                            )}
                                            {companySettings.bankEmail && (
                                                <Text style={[styles.footerText, { width: '100%', marginBottom: 2 }]}>
                                                    <Text style={{ fontWeight: 'bold' }}>Email: </Text>{companySettings.bankEmail}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Pie de página con Nombre del Documento Centrado */}
                <View fixed style={{ position: 'absolute', bottom: 20, left: 30, right: 30, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 8, color: '#999', textAlign: 'center' }}>
                        {docName}
                    </Text>
                </View>
            </Page>

            {/* Página de Notas (Alcance, Exclusiones, Supuestos) */}
            {((opts.includeScope && quote.scope) || (opts.includeExclusions && quote.exclusions) || (opts.includeAssumptions && quote.assumptions)) && (
                <Page size="A4" style={styles.page}>
                    {/* Header para Notas */}
                    <View fixed style={{ marginBottom: 3 }}>
                        <View style={{ borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 5, marginBottom: 5 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <View>
                                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#333' }}>
                                        {companySettings?.companyName || 'COTIZADOR PRO'}
                                    </Text>
                                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#000', marginTop: 2 }}>
                                        Otras consideraciones
                                    </Text>
                                </View>
                                <Text style={{ fontSize: 8, color: '#666', textAlign: 'right' }} render={({ pageNumber, totalPages }) => (
                                    `${pageNumber} de ${totalPages}`
                                )} />
                            </View>
                        </View>
                    </View>

                    <View style={styles.textSection}>
                        <View style={styles.sectionText}>
                            {opts.includeScope && quote.scope && (
                                <View style={{ marginBottom: 10 }}>
                                    <Text style={[styles.sectionText, { fontWeight: 'bold', marginBottom: 4 }]}>Alcance:</Text>
                                    <View style={{ paddingLeft: 5 }}>
                                        {parseHTMLToPDF(quote.scope)}
                                    </View>
                                </View>
                            )}
                            {opts.includeExclusions && quote.exclusions && (
                                <View style={{ marginBottom: 10 }}>
                                    <Text style={[styles.sectionText, { fontWeight: 'bold', marginBottom: 4 }]}>Exclusiones:</Text>
                                    <View style={{ paddingLeft: 5 }}>
                                        {parseHTMLToPDF(quote.exclusions)}
                                    </View>
                                </View>
                            )}
                            {opts.includeAssumptions && quote.assumptions && (
                                <View style={{ marginBottom: 10 }}>
                                    <Text style={[styles.sectionText, { fontWeight: 'bold', marginBottom: 4 }]}>Supuestos:</Text>
                                    <View style={{ paddingLeft: 5 }}>
                                        {parseHTMLToPDF(quote.assumptions)}
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Pie de página con Nombre del Documento Centrado */}
                    <View fixed style={{ position: 'absolute', bottom: 20, left: 30, right: 30, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 8, color: '#999', textAlign: 'center' }}>
                            {docName}
                        </Text>
                    </View>
                </Page>
            )}

            {/* Páginas adicionales con detalles de costeo si están habilitadas */}
            {showCostingDetails && costings.length > 0 && costings.map((costing, costingIdx) => (
                <Page key={`costing-${costing.id || costingIdx}`} size="A4" style={styles.page}>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={styles.logoContainer}>
                                {companySettings?.companyLogo && (
                                    <Image
                                        src={companySettings.companyLogo}
                                        style={{ width: 80, height: 80, objectFit: 'contain', flexShrink: 0, marginRight: 10 }}
                                    />
                                )}
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.companyName}>
                                        {companySettings?.companyName || 'COTIZADOR PRO'}
                                    </Text>
                                    {companySettings?.companyGiro && (
                                        <Text style={styles.companySubname}>{companySettings.companyGiro}</Text>
                                    )}
                                    {companySettings?.companyRUT && (
                                        <Text style={{ fontSize: 8, color: '#666666', marginTop: 2 }}>
                                            RUT: {companySettings.companyRUT}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>
                        <View style={styles.headerRight}>
                            <Text style={{ fontSize: 8, color: '#666', marginBottom: 2, textAlign: 'right' }} render={({ pageNumber, totalPages }) => (
                                `${pageNumber} de ${totalPages}`
                            )} />
                            <Text style={styles.title}>DETALLE DE COSTEO</Text>
                            <Text style={[styles.contactSection, { marginTop: 5, textAlign: 'right', fontSize: 10 }]}>
                                {costing.name}
                            </Text>
                            {quote.projectName && (
                                <Text style={[styles.contactSection, { marginTop: 2, textAlign: 'right', fontSize: 10 }]}>
                                    Proyecto: {quote.projectName}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Mano de Obra */}
                    {opts.includeMO && costing.itemsMO && costing.itemsMO.length > 0 && (
                        <View style={styles.itemsSection}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, { width: '40%', textAlign: 'left', paddingLeft: 5 }]}>CARGO</Text>
                                <Text style={[styles.tableHeaderText, { width: '20%' }]}>HH</Text>
                                <Text style={[styles.tableHeaderText, { width: '20%', textAlign: 'right' }]}>COSTO/HH</Text>
                                <Text style={[styles.tableHeaderText, { width: '20%', textAlign: 'right' }]}>SUBTOTAL</Text>
                            </View>
                            {costing.itemsMO.map((item, idx) => (
                                <View key={idx} style={styles.tableRow}>
                                    <Text style={[styles.tableCellDescription, { width: '40%' }]}>{item.cargo}</Text>
                                    <Text style={[styles.tableCellQuantity, { width: '20%' }]}>{item.hh}</Text>
                                    <Text style={[styles.tableCellPrice, { width: '20%' }]}>{formatCurrency(item.costHH)}</Text>
                                    <Text style={[styles.tableCellTotal, { width: '20%' }]}>{formatCurrency(item.subtotal)}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Materiales */}
                    {opts.includeMaterials && costing.itemsMaterials && costing.itemsMaterials.length > 0 && (
                        <View style={styles.itemsSection}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, { width: '40%', textAlign: 'left', paddingLeft: 5 }]}>ITEM</Text>
                                <Text style={[styles.tableHeaderText, { width: '15%' }]}>UNIDAD</Text>
                                <Text style={[styles.tableHeaderText, { width: '15%' }]}>CANT.</Text>
                                <Text style={[styles.tableHeaderText, { width: '30%', textAlign: 'right' }]}>SUBTOTAL</Text>
                            </View>
                            {costing.itemsMaterials.map((item, idx) => (
                                <View key={idx} style={styles.tableRow}>
                                    <Text style={[styles.tableCellDescription, { width: '40%' }]}>{item.item}</Text>
                                    <Text style={[styles.tableCellQuantity, { width: '15%' }]}>{item.unidad}</Text>
                                    <Text style={[styles.tableCellQuantity, { width: '15%' }]}>{item.quantity}</Text>
                                    <Text style={[styles.tableCellTotal, { width: '30%' }]}>{formatCurrency(item.subtotal)}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Equipos y Herramientas */}
                    {costing.itemsEquipment && costing.itemsEquipment.length > 0 && (
                        <View style={styles.itemsSection}>
                            <Text style={styles.sectionTitle}>EQUIPOS Y HERRAMIENTAS</Text>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, { width: '40%', textAlign: 'left', paddingLeft: 5 }]}>EQUIPO</Text>
                                <Text style={[styles.tableHeaderText, { width: '15%' }]}>UNIDAD</Text>
                                <Text style={[styles.tableHeaderText, { width: '15%' }]}>CANT.</Text>
                                <Text style={[styles.tableHeaderText, { width: '15%', textAlign: 'right' }]}>TARIFA</Text>
                                <Text style={[styles.tableHeaderText, { width: '15%', textAlign: 'right' }]}>SUBTOTAL</Text>
                            </View>
                            {costing.itemsEquipment.map((item, idx) => (
                                <View key={idx} style={styles.tableRow}>
                                    <Text style={[styles.tableCellDescription, { width: '40%' }]}>{item.equipment}</Text>
                                    <Text style={[styles.tableCellQuantity, { width: '15%' }]}>{item.unit}</Text>
                                    <Text style={[styles.tableCellQuantity, { width: '15%' }]}>{item.quantity}</Text>
                                    <Text style={[styles.tableCellPrice, { width: '15%' }]}>{formatCurrency(item.rate)}</Text>
                                    <Text style={[styles.tableCellTotal, { width: '15%' }]}>{formatCurrency(item.subtotal)}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Logística y Transporte */}
                    {costing.itemsLogistics && costing.itemsLogistics.subtotal > 0 && (
                        <View style={styles.itemsSection}>
                            <Text style={styles.sectionTitle}>LOGÍSTICA Y TRANSPORTE</Text>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, { width: '30%', textAlign: 'left', paddingLeft: 5 }]}>CONCEPTO</Text>
                                <Text style={[styles.tableHeaderText, { width: '20%' }]}>CANTIDAD</Text>
                                <Text style={[styles.tableHeaderText, { width: '25%', textAlign: 'right' }]}>TARIFA/COSTO</Text>
                                <Text style={[styles.tableHeaderText, { width: '25%', textAlign: 'right' }]}>SUBTOTAL</Text>
                            </View>
                            {costing.itemsLogistics.mode === 'km' && (
                                <>
                                    {costing.itemsLogistics.km && costing.itemsLogistics.ratePerKm && (
                                        <View style={styles.tableRow}>
                                            <Text style={[styles.tableCellDescription, { width: '30%' }]}>Kilómetros</Text>
                                            <Text style={[styles.tableCellQuantity, { width: '20%' }]}>{costing.itemsLogistics.km}</Text>
                                            <Text style={[styles.tableCellPrice, { width: '25%' }]}>{formatCurrency(costing.itemsLogistics.ratePerKm)}</Text>
                                            <Text style={[styles.tableCellTotal, { width: '25%' }]}>{formatCurrency((costing.itemsLogistics.km || 0) * (costing.itemsLogistics.ratePerKm || 0))}</Text>
                                        </View>
                                    )}
                                    {costing.itemsLogistics.tolls && costing.itemsLogistics.tolls > 0 && (
                                        <View style={styles.tableRow}>
                                            <Text style={[styles.tableCellDescription, { width: '30%' }]}>Peajes</Text>
                                            <Text style={[styles.tableCellQuantity, { width: '20%' }]}>-</Text>
                                            <Text style={[styles.tableCellPrice, { width: '25%' }]}>-</Text>
                                            <Text style={[styles.tableCellTotal, { width: '25%' }]}>{formatCurrency(costing.itemsLogistics.tolls)}</Text>
                                        </View>
                                    )}
                                    {costing.itemsLogistics.driverHours && costing.itemsLogistics.driverRate && (
                                        <View style={styles.tableRow}>
                                            <Text style={[styles.tableCellDescription, { width: '30%' }]}>Horas Conductor</Text>
                                            <Text style={[styles.tableCellQuantity, { width: '20%' }]}>{costing.itemsLogistics.driverHours}</Text>
                                            <Text style={[styles.tableCellPrice, { width: '25%' }]}>{formatCurrency(costing.itemsLogistics.driverRate)}</Text>
                                            <Text style={[styles.tableCellTotal, { width: '25%' }]}>{formatCurrency((costing.itemsLogistics.driverHours || 0) * (costing.itemsLogistics.driverRate || 0))}</Text>
                                        </View>
                                    )}
                                </>
                            )}
                            {costing.itemsLogistics.mode === 'viatico' && (
                                <>
                                    {costing.itemsLogistics.viaticoPerDay && costing.itemsLogistics.days && (
                                        <View style={styles.tableRow}>
                                            <Text style={[styles.tableCellDescription, { width: '30%' }]}>Viático por día</Text>
                                            <Text style={[styles.tableCellQuantity, { width: '20%' }]}>{costing.itemsLogistics.days}</Text>
                                            <Text style={[styles.tableCellPrice, { width: '25%' }]}>{formatCurrency(costing.itemsLogistics.viaticoPerDay)}</Text>
                                            <Text style={[styles.tableCellTotal, { width: '25%' }]}>{formatCurrency((costing.itemsLogistics.viaticoPerDay || 0) * (costing.itemsLogistics.days || 0))}</Text>
                                        </View>
                                    )}
                                    {costing.itemsLogistics.accommodation && costing.itemsLogistics.accommodation > 0 && (
                                        <View style={styles.tableRow}>
                                            <Text style={[styles.tableCellDescription, { width: '30%' }]}>Alojamiento</Text>
                                            <Text style={[styles.tableCellQuantity, { width: '20%' }]}>-</Text>
                                            <Text style={[styles.tableCellPrice, { width: '25%' }]}>-</Text>
                                            <Text style={[styles.tableCellTotal, { width: '25%' }]}>{formatCurrency(costing.itemsLogistics.accommodation)}</Text>
                                        </View>
                                    )}
                                    {costing.itemsLogistics.fixedMobilization && costing.itemsLogistics.fixedMobilization > 0 && (
                                        <View style={styles.tableRow}>
                                            <Text style={[styles.tableCellDescription, { width: '30%' }]}>Movilización Fija</Text>
                                            <Text style={[styles.tableCellQuantity, { width: '20%' }]}>-</Text>
                                            <Text style={[styles.tableCellPrice, { width: '25%' }]}>-</Text>
                                            <Text style={[styles.tableCellTotal, { width: '25%' }]}>{formatCurrency(costing.itemsLogistics.fixedMobilization)}</Text>
                                        </View>
                                    )}
                                </>
                            )}
                            <View style={[styles.tableRow, { backgroundColor: '#f5f5f5', fontWeight: 'bold' }]}>
                                <Text style={[styles.tableCellDescription, { width: '75%', fontWeight: 'bold' }]}>TOTAL LOGÍSTICA Y TRANSPORTE</Text>
                                <Text style={[styles.tableCellTotal, { width: '25%', fontWeight: 'bold' }]}>{formatCurrency(costing.itemsLogistics.subtotal)}</Text>
                            </View>
                        </View>
                    )}

                    {/* Indirectos de Obra */}
                    {costing.itemsIndirects && costing.itemsIndirects.length > 0 && (
                        <View style={styles.itemsSection}>
                            <Text style={styles.sectionTitle}>INDIRECTOS DE OBRA</Text>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, { width: '40%', textAlign: 'left', paddingLeft: 5 }]}>DESCRIPCIÓN</Text>
                                <Text style={[styles.tableHeaderText, { width: '20%' }]}>TIPO</Text>
                                <Text style={[styles.tableHeaderText, { width: '20%', textAlign: 'right' }]}>CANTIDAD/TARIFA</Text>
                                <Text style={[styles.tableHeaderText, { width: '20%', textAlign: 'right' }]}>SUBTOTAL</Text>
                            </View>
                            {costing.itemsIndirects.map((item, idx) => (
                                <View key={idx} style={styles.tableRow}>
                                    <Text style={[styles.tableCellDescription, { width: '40%' }]}>{item.description}</Text>
                                    <Text style={[styles.tableCellQuantity, { width: '20%' }]}>{item.type === 'hh' ? 'HH' : 'FIJO'}</Text>
                                    <Text style={[styles.tableCellPrice, { width: '20%' }]}>
                                        {item.type === 'hh' 
                                            ? `${item.hours || 0} HH × ${formatCurrency(item.rate || 0)}`
                                            : formatCurrency(item.amount || 0)
                                        }
                                    </Text>
                                    <Text style={[styles.tableCellTotal, { width: '20%' }]}>{formatCurrency(item.subtotal)}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Contingencias y Riesgos */}
                    {costing.contingencyItems && costing.contingencyItems.length > 0 && (
                        <View style={styles.itemsSection}>
                            <Text style={styles.sectionTitle}>CONTINGENCIAS Y RIESGOS</Text>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, { width: '60%', textAlign: 'left', paddingLeft: 5 }]}>CONCEPTO</Text>
                                <Text style={[styles.tableHeaderText, { width: '20%', textAlign: 'right' }]}>PORCENTAJE</Text>
                                <Text style={[styles.tableHeaderText, { width: '20%', textAlign: 'right' }]}>VALOR</Text>
                            </View>
                            {costing.contingencyItems.map((item, idx) => {
                                // Calcular el valor de la contingencia basado en el porcentaje
                                // Necesitamos la base para calcular el valor
                                const base = costing.totals?.base || 0;
                                const contingencyValue = (base * item.percentage) / 100;
                                return (
                                    <View key={idx} style={styles.tableRow}>
                                        <Text style={[styles.tableCellDescription, { width: '60%' }]}>{item.name}</Text>
                                        <Text style={[styles.tableCellPrice, { width: '20%' }]}>{item.percentage}%</Text>
                                        <Text style={[styles.tableCellTotal, { width: '20%' }]}>{formatCurrency(contingencyValue)}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* Resumen de Costos y Margen Bruto en 2 columnas */}
                    {(opts.includeCostSummary || opts.includeMargins) && costing.totals && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 10 }}>
                            {/* Columna 1: Resumen de Costos */}
                            {opts.includeCostSummary && (
                                <View style={{ width: '48%' }}>
                                    <Text style={styles.sectionTitle}>RESUMEN DE COSTOS</Text>
                                    <View style={[styles.totalsBox, { width: '100%' }]}>
                                        <View style={styles.totalRow}>
                                            <Text style={styles.totalLabel}>Costo Directo:</Text>
                                            <Text style={styles.totalValue}>{formatCurrency(costing.totals.costoDirecto || 0)}</Text>
                                        </View>
                                        <View style={styles.totalRow}>
                                            <Text style={styles.totalLabel}>Indirectos de Obra:</Text>
                                            <Text style={styles.totalValue}>{formatCurrency(costing.totals.indirectosObra || 0)}</Text>
                                        </View>
                                        <View style={styles.totalRow}>
                                            <Text style={styles.totalLabel}>Subtotal Costo:</Text>
                                            <Text style={styles.totalValue}>{formatCurrency(costing.totals.subtotalCosto || 0)}</Text>
                                        </View>
                                        <View style={styles.totalRow}>
                                            <Text style={styles.totalLabel}>Gastos Generales:</Text>
                                            <Text style={styles.totalValue}>{formatCurrency(costing.totals.gastosGenerales || 0)}</Text>
                                        </View>
                                        <View style={styles.totalRow}>
                                            <Text style={styles.totalLabel}>Base:</Text>
                                            <Text style={styles.totalValue}>{formatCurrency(costing.totals.base || 0)}</Text>
                                        </View>
                                        <View style={styles.totalRow}>
                                            <Text style={styles.totalLabel}>Contingencia:</Text>
                                            <Text style={styles.totalValue}>{formatCurrency(costing.totals.contingencia || 0)}</Text>
                                        </View>
                                        <View style={[styles.totalRow, { borderTop: '1 solid #ccc', paddingTop: 5, marginTop: 5 }]}>
                                            <Text style={[styles.totalLabel, { fontWeight: 'bold' }]}>Costo Total:</Text>
                                            <Text style={[styles.totalValue, { fontWeight: 'bold' }]}>{formatCurrency(costing.totals.costoTotal || 0)}</Text>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Columna 2: Margen Bruto */}
                            {opts.includeMargins && (
                                <View style={{ width: '48%' }}>
                                    <Text style={styles.sectionTitle}>MARGEN BRUTO</Text>
                                    <View style={[styles.totalsBox, { width: '100%' }]}>
                                        <View style={styles.totalRow}>
                                            <Text style={styles.totalLabel}>Margen Bruto:</Text>
                                            <Text style={styles.totalValue}>{formatCurrency(costing.totals.margenBruto || 0)}</Text>
                                        </View>
                                        <View style={styles.totalRow}>
                                            <Text style={styles.totalLabel}>Margen %:</Text>
                                            <Text style={styles.totalValue}>
                                                {costing.totals.margenPct ? `${costing.totals.margenPct.toFixed(2)}%` : '0.00%'}
                                            </Text>
                                        </View>
                                        <View style={styles.totalRow}>
                                            <Text style={styles.totalLabel}>Markup:</Text>
                                            <Text style={styles.totalValue}>
                                                {costing.totals.markup ? `${(costing.totals.markup * 100).toFixed(2)}%` : '0.00%'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Pie de página con Nombre del Documento Centrado */}
                    <View fixed style={{ position: 'absolute', bottom: 20, left: 30, right: 30, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 8, color: '#999', textAlign: 'center' }}>
                            {docName}
                        </Text>
                    </View>
                </Page>
            ))}

            {/* Resumen global de costos si se solicita y hay totals en la quote */}
            {showCostingDetails && quote.totals && (
                <Page size="A4" style={styles.page}>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={styles.logoContainer}>
                                {companySettings?.companyLogo && (
                                    <Image
                                        src={companySettings.companyLogo}
                                        style={{ width: 80, height: 80, objectFit: 'contain', flexShrink: 0, marginRight: 10 }}
                                    />
                                )}
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.companyName}>
                                        {companySettings?.companyName || 'COTIZADOR PRO'}
                                    </Text>
                                    {companySettings?.companyGiro && (
                                        <Text style={styles.companySubname}>{companySettings.companyGiro}</Text>
                                    )}
                                    {companySettings?.companyRUT && (
                                        <Text style={{ fontSize: 8, color: '#666666', marginTop: 2 }}>
                                            RUT: {companySettings.companyRUT}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>
                        <View style={styles.headerRight}>
                            <Text style={{ fontSize: 8, color: '#666', marginBottom: 2, textAlign: 'right' }} render={({ pageNumber, totalPages }) => (
                                `${pageNumber} de ${totalPages}`
                            )} />
                            <Text style={styles.title}>RESUMEN GENERAL</Text>
                            <Text style={[styles.contactSection, { marginTop: 5, textAlign: 'right', fontSize: 10 }]}>
                                DE COSTOS
                            </Text>
                            {quote.projectName && (
                                <Text style={[styles.contactSection, { marginTop: 2, textAlign: 'right', fontSize: 10 }]}>
                                    Proyecto: {quote.projectName}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Resumen consolidado de todos los costeos en 2 columnas */}
                    {(opts.includeCostSummary || opts.includeMargins) && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 10 }}>
                            {opts.includeCostSummary && (
                                <View style={{ width: '48%' }}>
                                    <Text style={styles.sectionTitle}>RESUMEN DE COSTOS CONSOLIDADO</Text>
                                    <View style={[styles.totalsBox, { width: '100%' }]}>
                                        <View style={styles.totalRow}>
                                            <Text style={styles.totalLabel}>Costo Directo:</Text>
                                            <Text style={styles.totalValue}>{formatCurrency((quote.totals as unknown as QuoteTotals)?.costoDirecto || 0)}</Text>
                                        </View>
                                        <View style={styles.totalRow}>
                                            <Text style={styles.totalLabel}>Indirectos de Obra:</Text>
                                            <Text style={styles.totalValue}>{formatCurrency((quote.totals as unknown as QuoteTotals)?.indirectosObra || 0)}</Text>
                                        </View>
                                        <View style={styles.totalRow}>
                                            <Text style={styles.totalLabel}>Gastos Generales:</Text>
                                            <Text style={styles.totalValue}>{formatCurrency((quote.totals as unknown as QuoteTotals)?.gastosGenerales || 0)}</Text>
                                        </View>
                                        <View style={styles.totalRow}>
                                            <Text style={styles.totalLabel}>Contingencia:</Text>
                                            <Text style={styles.totalValue}>{formatCurrency((quote.totals as unknown as QuoteTotals)?.contingencia || 0)}</Text>
                                        </View>
                                        <View style={[styles.totalRow, { borderTop: '1 solid #ccc', paddingTop: 5, marginTop: 5 }]}>
                                            <Text style={[styles.totalLabel, { fontWeight: 'bold' }]}>Costo Total:</Text>
                                            <Text style={[styles.totalValue, { fontWeight: 'bold' }]}>{formatCurrency((quote.totals as unknown as QuoteTotals)?.costoTotal || 0)}</Text>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {opts.includeMargins && (
                                <View style={{ width: '48%' }}>
                                    <Text style={styles.sectionTitle}>MARGEN BRUTO CONSOLIDADO</Text>
                                    <View style={[styles.totalsBox, { width: '100%' }]}>
                                        <View style={styles.totalRow}>
                                            <Text style={styles.totalLabel}>Margen Bruto:</Text>
                                            <Text style={styles.totalValue}>{formatCurrency((quote.totals as unknown as QuoteTotals)?.margenBruto || 0)}</Text>
                                        </View>
                                        <View style={styles.totalRow}>
                                            <Text style={styles.totalLabel}>Margen %:</Text>
                                            <Text style={styles.totalValue}>
                                                {(quote.totals as unknown as QuoteTotals)?.margenPct ? `${(quote.totals as unknown as QuoteTotals).margenPct.toFixed(2)}%` : '0.00%'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}
                    {/* Pie de página con Nombre del Documento Centrado */}
                    <View fixed style={{ position: 'absolute', bottom: 20, left: 30, right: 30, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 8, color: '#999', textAlign: 'center' }}>
                            {docName}
                        </Text>
                    </View>
                </Page>
            )}
        </Document>
    );
};

export default PDFDocument;
