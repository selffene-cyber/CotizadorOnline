// Lista estándar de Unidades de Medida
// Para fabricación, montaje, obras civiles, servicios y eventos

export const UNITS = {
  // Unidades Básicas / Conteo
  BASIC: [
    { value: 'un', label: 'un - Unidad' },
    { value: 'pz', label: 'pz - Pieza' },
    { value: 'set', label: 'set - Set / Conjunto' },
    { value: 'kit', label: 'kit - Kit' },
    { value: 'par', label: 'par - Par' },
    { value: 'juego', label: 'juego - Juego' },
    { value: 'lote', label: 'lote - Lote' },
  ],
  
  // Longitud
  LENGTH: [
    { value: 'mm', label: 'mm - Milímetro' },
    { value: 'cm', label: 'cm - Centímetro' },
    { value: 'm', label: 'm - Metro lineal' },
    { value: 'ml', label: 'ml - Metro lineal (alternativo)' },
    { value: 'km', label: 'km - Kilómetro' },
    { value: 'pulg', label: 'pulg - Pulgada' },
  ],
  
  // Superficie
  AREA: [
    { value: 'm²', label: 'm² - Metro cuadrado' },
    { value: 'cm²', label: 'cm² - Centímetro cuadrado' },
  ],
  
  // Volumen
  VOLUME: [
    { value: 'm³', label: 'm³ - Metro cúbico' },
    { value: 'l', label: 'l - Litro' },
    { value: 'ml', label: 'ml - Mililitro' },
  ],
  
  // Peso / Masa
  WEIGHT: [
    { value: 'g', label: 'g - Gramo' },
    { value: 'kg', label: 'kg - Kilogramo' },
    { value: 'ton', label: 'ton - Tonelada' },
  ],
  
  // Tiempo
  TIME: [
    { value: 'h', label: 'h - Hora' },
    { value: 'hh', label: 'hh - Hora hombre' },
    { value: 'día', label: 'día - Día' },
    { value: 'jornada', label: 'jornada - Jornada' },
    { value: 'semana', label: 'semana - Semana' },
    { value: 'mes', label: 'mes - Mes' },
  ],
  
  // Mano de Obra (servicios)
  LABOR: [
    { value: 'hh', label: 'hh - Hora Hombre' },
    { value: 'hd', label: 'hd - Hombre Día' },
    { value: 'hm', label: 'hm - Hombre Mes' },
    { value: 'turno', label: 'turno - Turno' },
  ],
  
  // Energía / Consumo
  ENERGY: [
    { value: 'kWh', label: 'kWh - Kilowatt hora' },
    { value: 'W', label: 'W - Watt' },
    { value: 'A', label: 'A - Ampere' },
    { value: 'V', label: 'V - Volt' },
  ],
  
  // Transporte / Logística
  TRANSPORT: [
    { value: 'km', label: 'km - Kilómetro' },
    { value: 'viaje', label: 'viaje - Viaje' },
    { value: 'carga', label: 'carga - Carga' },
    { value: 'flete', label: 'flete - Flete' },
  ],
  
  // Equipos / Arriendos
  EQUIPMENT: [
    { value: 'h', label: 'h - Hora' },
    { value: 'día', label: 'día - Día' },
    { value: 'semana', label: 'semana - Semana' },
    { value: 'mes', label: 'mes - Mes' },
  ],
  
  // Obras Civiles / Construcción
  CONSTRUCTION: [
    { value: 'm³', label: 'm³ - Hormigón / Excavación' },
    { value: 'm²', label: 'm² - Encofrado / Pintura / Revestimiento' },
    { value: 'ml', label: 'ml - Zanjas / Canales' },
  ],
  
  // Eventos / Servicios
  SERVICES: [
    { value: 'evento', label: 'evento - Evento' },
    { value: 'jornada', label: 'jornada - Jornada' },
    { value: 'servicio', label: 'servicio - Servicio' },
    { value: 'presentación', label: 'presentación - Presentación' },
  ],
};

// Lista completa de todas las unidades (sin duplicados)
export const ALL_UNITS = [
  ...UNITS.BASIC,
  ...UNITS.LENGTH,
  ...UNITS.AREA,
  ...UNITS.VOLUME,
  ...UNITS.WEIGHT,
  ...UNITS.TIME,
  ...UNITS.LABOR,
  ...UNITS.ENERGY,
  ...UNITS.TRANSPORT,
  ...UNITS.EQUIPMENT,
  ...UNITS.CONSTRUCTION,
  ...UNITS.SERVICES,
].filter((unit, index, self) => 
  index === self.findIndex(u => u.value === unit.value)
);

// Unidades agrupadas por categoría para selectores con grupos
export const UNITS_GROUPED = [
  { group: 'Unidades Básicas / Conteo', units: UNITS.BASIC },
  { group: 'Longitud', units: UNITS.LENGTH },
  { group: 'Superficie', units: UNITS.AREA },
  { group: 'Volumen', units: UNITS.VOLUME },
  { group: 'Peso / Masa', units: UNITS.WEIGHT },
  { group: 'Tiempo', units: UNITS.TIME },
  { group: 'Mano de Obra', units: UNITS.LABOR },
  { group: 'Energía / Consumo', units: UNITS.ENERGY },
  { group: 'Transporte / Logística', units: UNITS.TRANSPORT },
  { group: 'Equipos / Arriendos', units: UNITS.EQUIPMENT },
  { group: 'Obras Civiles / Construcción', units: UNITS.CONSTRUCTION },
  { group: 'Eventos / Servicios', units: UNITS.SERVICES },
];


