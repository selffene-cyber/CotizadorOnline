// Exportador de Estado de Pago a PDF usando react-pdf
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Quote, CompanySettings } from '@/types';
import { EstadoPagoData } from '@/utils/planning/estado-pago';

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
        marginBottom: 10,
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
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0066cc',
        marginBottom: 2,
    },
    companySubname: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0066cc',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#003d7a',
        fontFamily: 'Helvetica-Bold',
        marginBottom: 5,
    },
    contactSection: {
        marginTop: 2,
        fontSize: 9,
        color: '#666666',
    },
    contactRow: {
        marginBottom: 2,
    },
    // Sección de información
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 8,
        borderBottom: '1 solid #e5e7eb',
        paddingBottom: 4,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 6,
        fontSize: 9,
    },
    infoLabel: {
        width: '40%',
        fontWeight: 'bold',
        color: '#666666',
    },
    infoValue: {
        width: '60%',
        color: '#333333',
    },
    // Avances
    avanceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        padding: 10,
        backgroundColor: '#f3f4f6',
        borderRadius: 4,
    },
    avanceItem: {
        flex: 1,
        alignItems: 'center',
    },
    avanceLabel: {
        fontSize: 8,
        color: '#666666',
        marginBottom: 4,
    },
    avanceValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0066cc',
    },
    // Lista de tareas
    taskList: {
        marginTop: 5,
    },
    taskItem: {
        flexDirection: 'row',
        marginBottom: 6,
        paddingLeft: 10,
        fontSize: 9,
    },
    taskNumber: {
        width: 20,
        fontWeight: 'bold',
        color: '#666666',
    },
    taskName: {
        flex: 1,
        color: '#333333',
    },
    taskDetail: {
        fontSize: 8,
        color: '#666666',
        fontStyle: 'italic',
    },
    // Observaciones
    observacionesBox: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#fff9e6',
        border: '1 solid #fbbf24',
        borderRadius: 4,
    },
    observacionesText: {
        fontSize: 9,
        color: '#333333',
        lineHeight: 1.4,
    },
});

interface EstadoPagoPDFProps {
    quote: Quote;
    estadoPago: EstadoPagoData;
    companySettings?: CompanySettings | null;
}

const EstadoPagoPDFDocument: React.FC<EstadoPagoPDFProps> = ({ 
    quote, 
    estadoPago, 
    companySettings = null 
}) => {
    const formatDate = (dateStr: string): string => {
        return new Date(dateStr).toLocaleDateString('es-CL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.logoContainer}>
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
                        <View style={styles.contactSection}>
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
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.title}>ESTADO DE PAGO</Text>
                        <Text style={[styles.contactSection, { marginTop: 5, textAlign: 'right', fontSize: 10 }]}>
                            {quote.projectName}
                        </Text>
                        {quote.quoteNumber && (
                            <Text style={[styles.contactSection, { marginTop: 2, textAlign: 'right', fontSize: 9 }]}>
                                Cotización N°: {quote.quoteNumber}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Información del Período */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>INFORMACIÓN DEL PERÍODO</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Período:</Text>
                        <Text style={styles.infoValue}>
                            {formatDate(estadoPago.periodoDesde)} al {formatDate(estadoPago.periodoHasta)}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Fecha de Reporte:</Text>
                        <Text style={styles.infoValue}>{formatDate(estadoPago.fechaReporte)}</Text>
                    </View>
                </View>

                {/* Avances */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>AVANCE DEL PROYECTO</Text>
                    <View style={styles.avanceContainer}>
                        <View style={styles.avanceItem}>
                            <Text style={styles.avanceLabel}>Avance Inicio</Text>
                            <Text style={styles.avanceValue}>
                                {estadoPago.avanceInicioPeriodo.toFixed(1)}%
                            </Text>
                        </View>
                        <View style={styles.avanceItem}>
                            <Text style={styles.avanceLabel}>Avance Fin</Text>
                            <Text style={styles.avanceValue}>
                                {estadoPago.avanceFinPeriodo.toFixed(1)}%
                            </Text>
                        </View>
                        <View style={styles.avanceItem}>
                            <Text style={styles.avanceLabel}>Avance Período</Text>
                            <Text style={[styles.avanceValue, { color: '#10b981' }]}>
                                {estadoPago.avancePeriodo.toFixed(1)}%
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Tareas Finalizadas */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        TAREAS FINALIZADAS EN EL PERÍODO ({estadoPago.tareasFinalizadasEnPeriodo.length})
                    </Text>
                    {estadoPago.tareasFinalizadasEnPeriodo.length === 0 ? (
                        <Text style={{ fontSize: 9, color: '#666666', fontStyle: 'italic', marginTop: 5 }}>
                            No hay tareas finalizadas en este período.
                        </Text>
                    ) : (
                        <View style={styles.taskList}>
                            {estadoPago.tareasFinalizadasEnPeriodo.map((tarea, index) => (
                                <View key={tarea.id} style={styles.taskItem}>
                                    <Text style={styles.taskNumber}>{index + 1}.</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.taskName}>{tarea.name}</Text>
                                        {tarea.fechaFinalizacion && (
                                            <Text style={styles.taskDetail}>
                                                Finalizada: {formatDate(tarea.fechaFinalizacion)}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Tareas en Progreso */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        TAREAS EN PROGRESO ({estadoPago.tareasEnProgreso.length})
                    </Text>
                    {estadoPago.tareasEnProgreso.length === 0 ? (
                        <Text style={{ fontSize: 9, color: '#666666', fontStyle: 'italic', marginTop: 5 }}>
                            No hay tareas en progreso.
                        </Text>
                    ) : (
                        <View style={styles.taskList}>
                            {estadoPago.tareasEnProgreso.map((tarea, index) => (
                                <View key={tarea.id} style={styles.taskItem}>
                                    <Text style={styles.taskNumber}>{index + 1}.</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.taskName}>
                                            {tarea.name} - {tarea.progreso}%
                                        </Text>
                                        {tarea.fechaFinPlan && (
                                            <Text style={styles.taskDetail}>
                                                Plan: {formatDate(tarea.fechaFinPlan)}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Observaciones */}
                {estadoPago.observaciones && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>OBSERVACIONES</Text>
                        <View style={styles.observacionesBox}>
                            <Text style={styles.observacionesText}>{estadoPago.observaciones}</Text>
                        </View>
                    </View>
                )}
            </Page>
        </Document>
    );
};

export default EstadoPagoPDFDocument;


