#Instrucciones&Estructura-Cotizador
#Desarrollo de "Cotizador Pro" con Cursor IA
Rol del Desarrollador
Eres un ingeniero senior full-stack con experiencia en aplicaciones web modernas. Tu tarea es generar el código completo de un MVP para "Cotizador Pro", una aplicación web de cotizaciones profesionales. Prioriza un diseño limpio, funcional y rápido, usando componentes reutilizables, validaciones robustas y cálculos precisos. El stack recomendado es Opción A: Next.js + Firebase (Auth + Firestore + Storage) + generación de PDF, justificado por su velocidad para MVPs (desarrollo rápido con autenticación integrada, base de datos NoSQL escalable y almacenamiento en la nube, sin necesidad de servidores propios).

Descripción General de la Aplicación
"Cotizador Pro" es una herramienta web para generar cotizaciones en CLP (pesos chilenos) para una empresa especializada en:

Fabricación estructural y metalmecánica (estructuras livianas, perfiles, planchas, pernos, soldadura, gases, oxicorte).
Montaje industrial y obras civiles (herramientas menores, demoledores, taladros, extensiones, camioneta, etc.).
Reparaciones de vehículos industriales.
(Opcional por plantilla) Producción de eventos: DJ, banquetería, producción.
Objetivo principal: Crear cotizaciones con reglas de costeo claras: Costo Directo + Indirecto + GG + Utilidad + Precio Venta. Soporta modalidades: Lump Sum (proyecto cerrado), HH + Materiales, o Mixto.

Restricciones clave:

Moneda: CLP (redondeos apropiados).
Usuarios: 1 administrador inicial (dueño), con diseño extensible para roles futuros (Admin/Operador).
Exportación: PDF profesional, Word (DOCX) y opcional Excel.
Diseño: App simple, rápida y limpia; enfocada en funcionalidad, con UI responsiva (tablas en desktop, tarjetas en móvil).
Hosting: Data online con login (accesible desde cualquier lugar).
Stack y Justificación
Opción A (Implementada): Next.js (framework React para SSR/SSG, rápido en desarrollo), Firebase (Auth para login seguro, Firestore para datos NoSQL en tiempo real, Storage para archivos como PDFs). Generación de PDF con librerías como react-pdf o jsPDF.
Justificación: Velocidad para MVP (menos configuración que Supabase), escalabilidad en la nube, y facilidad para autenticación y almacenamiento. Evita costos iniciales altos y permite iteraciones rápidas.
Módulos y Pantallas Principales
La app debe tener navegación intuitiva (ej. sidebar o tabs) y un flujo wizard para nuevas cotizaciones.

Login: Pantalla simple con email/password. Usa Firebase Auth. Redirige a Dashboard tras login exitoso.

Dashboard:

Muestra cotizaciones recientes (últimas 10), con filtros por estado (Borrador/Enviada/Aprobada/Perdida).
Métricas: Margen promedio, totales por mes.
Acciones: Crear nueva cotización, editar existentes, duplicar para versionado.
Nueva Cotización (Wizard):

Paso 1: Cliente: Campos: nombre, RUT, contacto, email, teléfono, dirección, comuna/ciudad. Validación de RUT chileno.
Paso 2: Proyecto: Nombre, ubicación, tipo (dropdown: Fabricación/Montaje/Obras Civiles/Reparación/Eventos), modalidad (Cerrado/HH+Mat/Mixto).
Paso 3: Detalles: Alcance (textarea), Exclusiones, Supuestos (textareas). Plazo de ejecución (días), Validez (días), Forma de pago (dropdown), Garantías (textarea).
Costeo (Tab Principal con Secciones Plegables):

Cálculos automáticos y consistentes. Usa hooks React para estado y validaciones.
A) Mano de Obra: Tabla editable: cargo, HH estimadas, costo HH, recargo %, subtotal. Conversión: días * horas_día (default 9) * eficiencia (default 0.85) = HH.
B) Materiales: Tabla: ítem, unidad, cantidad, costo unitario, merma %, subtotal. Biblioteca de materiales frecuentes (acero, planchas, pernos, consumibles). Mermas por defecto: acero 5%, pernos 2%, consumibles 10%.
C) Equipos/Herramientas: Tabla: equipo, unidad (día/hora), cantidad, tarifa, subtotal. Biblioteca editable; si no hay tarifa, asignar % de MO (default 4%).
D) Logística/Traslados: Modos: (1) km * tarifa_km + peajes + horas conductor; (2) viático/día + alojamiento + movilización fija. Parametrizable.
E) Indirectos de Obra: Supervisión, HSEC, administración (como HH o ítems).
F) Gastos Generales (GG): Selector 10%/12%/15% o manual.
G) Contingencia/Riesgos: Checkboxes con % acumulables: Trabajo en altura +3%, Turno noche +5%, etc. (incluye "Otros" custom).
H) Utilidad: Rango sugerido 45–65%, configurable, con mínimo bloqueable (ej. 20%).
Resumen Ejecutivo (Auto-Calculado):

Fórmulas: Costo Directo = MO + Materiales + Equipos + Logística; Indirecto = Indirectos de obra; Subtotal Costo = Directo + Indirecto; GG = % * Subtotal; Base = Subtotal + GG; Contingencia = % * Base; Costo Total = Base + Contingencia; Precio Venta = Costo Total * (1 + Utilidad%); Margen Bruto y Mark-up.
Mostrar en cards o tabla, con gráficos simples (ej. barras para márgenes).
Sensibilidades (Simulador):

Botones: "MO +10%", "Plazo +1 semana", "Materiales +5%". Recalcula y muestra impacto en precio y margen.
Versionado:

Al duplicar, crea snapshot inmutable (v1/v2/v3). Pantalla comparativa: Diferencias en totales y partidas.
Exportación:

PDF: Profesional con portada, datos cliente, alcance, etc. Usa react-pdf.
Word (DOCX): Estructura similar, con docx library.
Excel: Hojas: Resumen, MO, Materiales, etc. Usa xlsx.
Data Model (Firestore)
clients: {id, name, rut, contact, email, phone, address, city}
quotes: {id, clientId, status, type, version, parentQuoteId, createdAt, updatedAt, fields..., totals...}
quote_items_mo: [{cargo, hh, cost_hh, recargo, subtotal}]
quote_items_materials: [{item, unidad, qty, unit_cost, merma_pct, subtotal}]
quote_items_equipment: Similar.
quote_items_logistics: Similar.
catalogs: materials_catalog, equipment_catalog, labor_catalog, risk_catalog, settings (gg_default, utilidad_default, tarifa_km, horas_dia, eficiencia)
Requisitos de Calidad
Validaciones: No utilidad negativa, HH sin costo, RUT válido, campos obligatorios.
UI/UX: Diseño moderno con Tailwind CSS o similar; tablas editables, modo tarjetas en móvil.
Cálculos: Consistentes, con redondeos CLP (ej. Math.round para centavos).
Código: Ordenado, con componentes reutilizables (ej. TableEditable, Calculator), hooks custom para lógica.
Seeds Iniciales: Incluye datos de ejemplo para catálogos y configuración editable.
Entrega del MVP
Proporciona:

Estructura de Carpetas: Ej. /components, /pages, /hooks, /utils, /firebase.
Pasos de Instalación: Comandos para Next.js, Firebase setup, variables de entorno (ej. .env.local con API keys).
Código Completo: Archivos clave (ej. pages/index.js, components/Costeo.js), con comentarios explicativos. Asegura modularidad para futuras expansiones.
Genera el código paso a paso, comenzando por la configuración inicial y el Dashboard.