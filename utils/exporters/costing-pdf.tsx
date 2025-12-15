// Exportador de Costeo a PDF usando react-pdf
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Costing, CompanySettings, Client } from '@/types';

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
    },
    headerSeparator: {
        borderBottom: '2 solid #0066cc',
        marginBottom: 20,
        marginTop: 10,
        width: '100%',
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0066cc',
        marginBottom: 2,
    },
    companySubname: {
        fontSize: 14,
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
    // Sección de datos del documento
    docInfoSection: {
        marginBottom: 20,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    docInfoRow: {
        flexDirection: 'row',
        marginBottom: 4,
        fontSize: 9,
        width: '48%',
    },
    docInfoLabel: {
        width: 80,
        fontWeight: 'bold',
        color: '#666666',
    },
    docInfoValue: {
        flex: 1,
        color: '#333333',
    },
    // Secciones y Tablas
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 8,
        paddingBottom: 5,
        borderBottom: '1 solid #e0e0e0',
    },
    table: {
        marginBottom: 10,
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
        minHeight: 25,
    },
    tableCell: {
        fontSize: 9,
        color: '#333333',
    },
    // Styles específicos para celdas de tabla
    cellText: { textAlign: 'left' },
    cellNumber: { textAlign: 'right' },
    cellCenter: { textAlign: 'center' },

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

    // Totales y Resumen
    totalsSection: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    totalsBox: {
        width: '40%',
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
        marginTop: 5,
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
    subSectionTotal: {
        backgroundColor: '#f9f9f9',
        fontWeight: 'bold',
    }
});

// Función helper para generar el nombre del archivo (usada tanto en el PDF como en la descarga)
export const generateCostingFileName = (costing: Costing, client: Client | null): string => {
    // Formatear fecha como ddmmaaaa
    const fecha = costing.createdAt ? new Date(costing.createdAt) : new Date();
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const año = String(fecha.getFullYear());
    const fechaFormato = `${dia}${mes}${año}`;
    
    // Limpiar nombre del proyecto y cliente para el nombre del archivo
    const nombreProyecto = costing.name.replace(/[^a-z0-9]/gi, '-').toUpperCase();
    const nombreCliente = client?.name 
        ? client.name.replace(/[^a-z0-9]/gi, '-').toUpperCase() 
        : 'SIN-CLIENTE';
    
    // Usar el número correlativo del costeo
    const idCosteo = costing.costingNumber || '00';
    
    return `COSTEO-${idCosteo}-${nombreProyecto}-${nombreCliente}-${fechaFormato}.pdf`;
};

interface CostingPDFDocumentProps {
    costing: Costing;
    companySettings?: CompanySettings | null;
    client?: Client | null;
}

const CostingPDFDocument: React.FC<CostingPDFDocumentProps> = ({ costing, companySettings = null, client = null }) => {

    const formatCurrency = (amount: number | undefined) => {
        if (amount === undefined) return '$ 0';
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const docName = generateCostingFileName(costing, client);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header Dinámico (Igual que en Quotation) */}
                <View fixed style={{ marginBottom: 20 }} render={({ pageNumber }) => (
                    pageNumber === 1 ? (
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
                                <Text style={{ fontSize: 8, color: '#666', marginBottom: 2, textAlign: 'right' }} render={({ pageNumber }) => (
                                    `${pageNumber}`
                                )} />
                                <Text style={styles.title}>COSTEO DE PROYECTO</Text>
                                <Text style={[styles.contactSection, { marginTop: 5, textAlign: 'right' }]}>
                                    ID: {costing.costingNumber || 'N/A'}
                                </Text>
                                <Text style={{ fontSize: 10, color: '#666', marginBottom: 2, textAlign: 'right' }}>
                                    Fecha: {costing.createdAt ? new Date(costing.createdAt).toLocaleDateString('es-CL') : new Date().toLocaleDateString('es-CL')}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <View style={{ borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 10, marginBottom: 10 }}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', textAlign: 'center', color: '#333' }}>
                                Continuación de Costeo: {costing.name}
                            </Text>
                            <Text style={{ fontSize: 8, color: '#666', marginTop: 2, textAlign: 'right' }}>
                                {pageNumber}
                            </Text>
                        </View>
                    )
                )} />

                {/* Información del Costeo */}
                <View style={styles.docInfoSection}>
                    <View style={styles.docInfoRow}>
                        <Text style={styles.docInfoLabel}>Nombre Proyecto:</Text>
                        <Text style={styles.docInfoValue}>{costing.name}</Text>
                    </View>
                    <View style={styles.docInfoRow}>
                        <Text style={styles.docInfoLabel}>Tipo:</Text>
                        <Text style={styles.docInfoValue}>{costing.type || 'N/A'}</Text>
                    </View>
                    <View style={styles.docInfoRow}>
                        <Text style={styles.docInfoLabel}>Modalidad:</Text>
                        <Text style={styles.docInfoValue}>{costing.modality || 'N/A'}</Text>
                    </View>
                    {costing.description && (
                        <View style={[styles.docInfoRow, { width: '100%' }]}>
                            <Text style={styles.docInfoLabel}>Descripción:</Text>
                            <Text style={styles.docInfoValue}>{costing.description}</Text>
                        </View>
                    )}
                </View>

                {/* Mano de Obra */}
                {costing.itemsMO && costing.itemsMO.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>MANO DE OBRA</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, { width: '40%', textAlign: 'left' }]}>CARGO</Text>
                                <Text style={[styles.tableHeaderText, { width: '20%' }]}>HH</Text>
                                <Text style={[styles.tableHeaderText, { width: '20%' }]}>COSTO/HH</Text>
                                <Text style={[styles.tableHeaderText, { width: '20%', textAlign: 'right' }]}>SUBTOTAL</Text>
                            </View>
                            {costing.itemsMO.map((item, idx) => (
                                <View key={idx} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, styles.cellText, { width: '40%' }]}>{item.cargo}</Text>
                                    <Text style={[styles.tableCell, styles.cellCenter, { width: '20%' }]}>{item.hh}</Text>
                                    <Text style={[styles.tableCell, styles.cellNumber, { width: '20%' }]}>{formatCurrency(item.costHH)}</Text>
                                    <Text style={[styles.tableCell, styles.cellNumber, { width: '20%', fontWeight: 'bold' }]}>{formatCurrency(item.subtotal)}</Text>
                                </View>
                            ))}
                            <View style={[styles.tableRow, styles.subSectionTotal]}>
                                <Text style={[styles.tableCell, { width: '80%', textAlign: 'right', fontWeight: 'bold' }]}>TOTAL MANO DE OBRA:</Text>
                                <Text style={[styles.tableCell, styles.cellNumber, { width: '20%', fontWeight: 'bold' }]}>
                                    {formatCurrency(costing.itemsMO.reduce((sum, i) => sum + i.subtotal, 0))}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Materiales */}
                {costing.itemsMaterials && costing.itemsMaterials.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>MATERIALES</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, { width: '35%', textAlign: 'left' }]}>ITEM</Text>
                                <Text style={[styles.tableHeaderText, { width: '15%' }]}>CANT.</Text>
                                <Text style={[styles.tableHeaderText, { width: '10%' }]}>UNID.</Text>
                                <Text style={[styles.tableHeaderText, { width: '15%' }]}>COSTO UNIT.</Text>
                                <Text style={[styles.tableHeaderText, { width: '10%' }]}>MERMA</Text>
                                <Text style={[styles.tableHeaderText, { width: '15%', textAlign: 'right' }]}>SUBTOTAL</Text>
                            </View>
                            {costing.itemsMaterials.map((item, idx) => (
                                <View key={idx} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, styles.cellText, { width: '35%' }]}>{item.item}</Text>
                                    <Text style={[styles.tableCell, styles.cellCenter, { width: '15%' }]}>{item.quantity}</Text>
                                    <Text style={[styles.tableCell, styles.cellCenter, { width: '10%' }]}>{item.unidad}</Text>
                                    <Text style={[styles.tableCell, styles.cellNumber, { width: '15%' }]}>{formatCurrency(item.unitCost)}</Text>
                                    <Text style={[styles.tableCell, styles.cellCenter, { width: '10%' }]}>{item.mermaPct?.toFixed(1) || '0'}%</Text>
                                    <Text style={[styles.tableCell, styles.cellNumber, { width: '15%', fontWeight: 'bold' }]}>{formatCurrency(item.subtotal)}</Text>
                                </View>
                            ))}
                            <View style={[styles.tableRow, styles.subSectionTotal]}>
                                <Text style={[styles.tableCell, { width: '85%', textAlign: 'right', fontWeight: 'bold' }]}>TOTAL MATERIALES:</Text>
                                <Text style={[styles.tableCell, styles.cellNumber, { width: '15%', fontWeight: 'bold' }]}>
                                    {formatCurrency(costing.itemsMaterials.reduce((sum, i) => sum + i.subtotal, 0))}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Equipos */}
                {costing.itemsEquipment && costing.itemsEquipment.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>EQUIPOS Y HERRAMIENTAS</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, { width: '40%', textAlign: 'left' }]}>ITEM</Text>
                                <Text style={[styles.tableHeaderText, { width: '15%' }]}>UNIDAD</Text>
                                <Text style={[styles.tableHeaderText, { width: '15%' }]}>CANT.</Text>
                                <Text style={[styles.tableHeaderText, { width: '15%' }]}>TARIFA</Text>
                                <Text style={[styles.tableHeaderText, { width: '15%', textAlign: 'right' }]}>SUBTOTAL</Text>
                            </View>
                            {costing.itemsEquipment.map((item, idx) => (
                                <View key={idx} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, styles.cellText, { width: '40%' }]}>{item.equipment}</Text>
                                    <Text style={[styles.tableCell, styles.cellCenter, { width: '15%' }]}>{item.unit}</Text>
                                    <Text style={[styles.tableCell, styles.cellCenter, { width: '15%' }]}>{item.quantity}</Text>
                                    <Text style={[styles.tableCell, styles.cellNumber, { width: '15%' }]}>{formatCurrency(item.rate)}</Text>
                                    <Text style={[styles.tableCell, styles.cellNumber, { width: '15%', fontWeight: 'bold' }]}>{formatCurrency(item.subtotal)}</Text>
                                </View>
                            ))}
                            <View style={[styles.tableRow, styles.subSectionTotal]}>
                                <Text style={[styles.tableCell, { width: '85%', textAlign: 'right', fontWeight: 'bold' }]}>TOTAL EQUIPOS:</Text>
                                <Text style={[styles.tableCell, styles.cellNumber, { width: '15%', fontWeight: 'bold' }]}>
                                    {formatCurrency(costing.itemsEquipment.reduce((sum, i) => sum + i.subtotal, 0))}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Logística */}
                {costing.itemsLogistics && costing.itemsLogistics.subtotal > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>LOGÍSTICA Y TRASLADOS</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 }}>
                            <View>
                                <Text style={{ fontSize: 9, color: '#666', marginBottom: 2 }}>
                                    <Text style={{ fontWeight: 'bold' }}>Modo: </Text>
                                    {costing.itemsLogistics.mode === 'km' ? 'Por Kilómetros' :
                                        costing.itemsLogistics.mode === 'viatico' ? 'Viático' :
                                            'Monto Fijo'}
                                </Text>
                            </View>
                            <View>
                                <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#333' }}>
                                    Total: {formatCurrency(costing.itemsLogistics.subtotal)}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Indirectos */}
                {costing.itemsIndirects && costing.itemsIndirects.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>INDIRECTOS DE OBRA</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, { width: '50%', textAlign: 'left' }]}>DESCRIPCIÓN</Text>
                                <Text style={[styles.tableHeaderText, { width: '20%' }]}>TIPO</Text>
                                <Text style={[styles.tableHeaderText, { width: '15%' }]}>CANT/HRS</Text>
                                <Text style={[styles.tableHeaderText, { width: '15%', textAlign: 'right' }]}>SUBTOTAL</Text>
                            </View>
                            {costing.itemsIndirects.map((item, idx) => (
                                <View key={idx} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, styles.cellText, { width: '50%' }]}>{item.description}</Text>
                                    <Text style={[styles.tableCell, styles.cellCenter, { width: '20%' }]}>
                                        {item.type === 'hh' ? 'Horas-Hombre' : 'Monto Fijo'}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.cellCenter, { width: '15%' }]}>
                                        {item.type === 'hh' ? `${item.hours || 0}` : '-'}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.cellNumber, { width: '15%', fontWeight: 'bold' }]}>{formatCurrency(item.subtotal)}</Text>
                                </View>
                            ))}
                            <View style={[styles.tableRow, styles.subSectionTotal]}>
                                <Text style={[styles.tableCell, { width: '85%', textAlign: 'right', fontWeight: 'bold' }]}>TOTAL INDIRECTOS:</Text>
                                <Text style={[styles.tableCell, styles.cellNumber, { width: '15%', fontWeight: 'bold' }]}>
                                    {formatCurrency(costing.itemsIndirects.reduce((sum, i) => sum + i.subtotal, 0))}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Resumen Ejecutivo (Totales) */}
                {costing.totals && (
                    <View wrap={false} style={styles.totalsSection}>
                        <View style={styles.totalsBox}>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>COSTO DIRECTO:</Text>
                                <Text style={styles.totalValue}>{formatCurrency(costing.totals.costoDirecto)}</Text>
                            </View>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>INDIRECTOS OBRA:</Text>
                                <Text style={styles.totalValue}>{formatCurrency(costing.totals.indirectosObra)}</Text>
                            </View>
                            <View style={[styles.totalRow, { backgroundColor: '#f0f0f0' }]}>
                                <Text style={styles.totalLabel}>SUBTOTAL COSTO:</Text>
                                <Text style={[styles.totalValue, { fontWeight: 'bold' }]}>{formatCurrency(costing.totals.subtotalCosto)}</Text>
                            </View>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>GASTOS GENERALES ({costing.ggPercentage}%):</Text>
                                <Text style={styles.totalValue}>{formatCurrency(costing.totals.gastosGenerales)}</Text>
                            </View>
                            {/* Contingencias */}
                            {costing.contingencyItems && costing.contingencyItems.map((cont, idx) => (
                            <View key={idx} style={styles.totalRow}>
                                <Text style={styles.totalLabel}>{cont.name} ({cont.percentage}%):</Text>
                                <Text style={styles.totalValue}>{formatCurrency((costing.totals?.base || 0) * cont.percentage / 100)}</Text>
                            </View>
                            ))}
                            <View style={[styles.totalRow, { backgroundColor: '#e6f2ff' }]}>
                                <Text style={styles.totalLabel}>COSTO TOTAL:</Text>
                                <Text style={[styles.totalValue, { fontWeight: 'bold' }]}>{formatCurrency(costing.totals.costoTotal)}</Text>
                            </View>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>UTILIDAD ({costing.utilityPercentage}%):</Text>
                                <Text style={styles.totalValue}>{formatCurrency(costing.totals.margenBruto)}</Text>
                            </View>
                            <View style={[styles.finalTotalBox, { marginTop: 10, backgroundColor: '#333' }]}>
                                <Text style={styles.finalTotalLabel}>PRECIO NETO:</Text>
                                <Text style={styles.finalTotalValue}>{formatCurrency(costing.totals.precioNeto)}</Text>
                            </View>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>IVA (19%):</Text>
                                <Text style={styles.totalValue}>{formatCurrency(costing.totals.iva)}</Text>
                            </View>
                            <View style={styles.finalTotalBox}>
                                <Text style={styles.finalTotalLabel}>TOTAL CON IVA:</Text>
                                <Text style={styles.finalTotalValue}>{formatCurrency(costing.totals.totalConIva)}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Footer del documento */}
                <View style={[styles.footer, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' }]} fixed>
                    <View style={styles.footerRow}>
                        <View style={styles.footerLeft}>
                            {companySettings && (
                                <>
                                    <Text style={[styles.footerTitle, { marginBottom: 2 }]}>Emitido por:</Text>
                                    {companySettings.quoterName && (
                                        <Text style={[styles.footerText, { fontWeight: 'bold' }]}>
                                            {companySettings.quoterName}
                                            {companySettings.quoterPosition && ` - ${companySettings.quoterPosition}`}
                                        </Text>
                                    )}
                                    {companySettings.quoterEmail && (
                                        <Text style={styles.footerText}>{companySettings.quoterEmail}</Text>
                                    )}
                                </>
                            )}
                        </View>
                        <View style={styles.footerRight}>
                            <Text style={{ fontSize: 8, color: '#999', textAlign: 'right', marginBottom: 5 }}>
                                Este documento es un costeo interno y reservado.
                            </Text>
                        </View>
                    </View>
                    <View style={{ position: 'absolute', bottom: -20, left: 0, right: 0, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 8, color: '#ccc', textAlign: 'center' }}>
                            {docName} - Generado el {new Date().toLocaleString('es-CL')}
                        </Text>
                    </View>
                </View>

            </Page>
        </Document>
    );
};

export default CostingPDFDocument;
