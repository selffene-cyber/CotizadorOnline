// Regiones y ciudades de Chile
export interface Region {
  id: string;
  name: string;
  cities: string[];
}

export const chileRegions: Region[] = [
  {
    id: 'arica',
    name: 'Arica y Parinacota',
    cities: ['Arica', 'Putre', 'Camarones', 'General Lagos'],
  },
  {
    id: 'tarapaca',
    name: 'Tarapacá',
    cities: ['Iquique', 'Alto Hospicio', 'Pozo Almonte', 'Pica', 'Huara', 'Camiña', 'Colchane'],
  },
  {
    id: 'antofagasta',
    name: 'Antofagasta',
    cities: ['Antofagasta', 'Calama', 'Tocopilla', 'Mejillones', 'Taltal', 'Sierra Gorda', 'Ollagüe', 'San Pedro de Atacama'],
  },
  {
    id: 'atacama',
    name: 'Atacama',
    cities: ['Copiapó', 'Vallenar', 'Caldera', 'Chañaral', 'Huasco', 'Freirina', 'Tierra Amarilla', 'Diego de Almagro', 'Alto del Carmen'],
  },
  {
    id: 'coquimbo',
    name: 'Coquimbo',
    cities: ['La Serena', 'Coquimbo', 'Ovalle', 'Illapel', 'Vicuña', 'Andacollo', 'Salamanca', 'Los Vilos', 'Monte Patria', 'Punitaqui', 'Combarbalá', 'Canela'],
  },
  {
    id: 'valparaiso',
    name: 'Valparaíso',
    cities: ['Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana', 'San Antonio', 'Los Andes', 'Quillota', 'La Calera', 'San Felipe', 'Limache', 'Nogales', 'La Ligua', 'Petorca', 'Cabildo', 'Papudo', 'Zapallar', 'Puchuncaví', 'Quintero', 'Algarrobo', 'El Quisco', 'El Tabo', 'Cartagena', 'San Antonio', 'Santo Domingo'],
  },
  {
    id: 'metropolitana',
    name: 'Región Metropolitana',
    cities: ['Santiago', 'Puente Alto', 'Maipú', 'La Florida', 'San Bernardo', 'Peñalolén', 'Las Condes', 'Providencia', 'Ñuñoa', 'Macul', 'La Reina', 'Vitacura', 'Lo Barnechea', 'San Miguel', 'La Cisterna', 'El Bosque', 'Pedro Aguirre Cerda', 'Lo Espejo', 'Estación Central', 'Cerrillos', 'Quilicura', 'Conchalí', 'Recoleta', 'Independencia', 'Huechuraba', 'Renca', 'Quinta Normal', 'Lo Prado', 'Pudahuel', 'Cerro Navia', 'Maipú', 'San Ramón', 'La Granja', 'La Pintana'],
  },
  {
    id: 'ohiggins',
    name: "Libertador General Bernardo O'Higgins",
    cities: ['Rancagua', 'San Fernando', 'Rengo', 'Graneros', 'San Vicente', 'Machalí', 'Doñihue', 'Coltauco', 'Peumo', 'Las Cabras', 'Pichidegua', 'Codegua', 'Coinco', 'Olivar', 'Requínoa', 'Mostazal', 'Chépica', 'Chimbarongo', 'Lolol', 'Nancagua', 'Palmilla', 'Peralillo', 'Placilla', 'Pumanque', 'Santa Cruz', 'Paredones', 'Marchihue', 'La Estrella', 'Litueche', 'Navidad', 'Pichilemu'],
  },
  {
    id: 'maule',
    name: 'Maule',
    cities: ['Talca', 'Curicó', 'Linares', 'Constitución', 'Cauquenes', 'Molina', 'San Javier', 'Parral', 'Yerbas Buenas', 'San Clemente', 'Pelarco', 'Pencahue', 'Maule', 'San Rafael', 'Curepto', 'Chanco', 'Pelluhue', 'Villa Alegre', 'Colbún', 'Longaví', 'Retiro', 'Villa Alhué'],
  },
  {
    id: 'nuble',
    name: 'Ñuble',
    cities: ['Chillán', 'San Carlos', 'Bulnes', 'Quirihue', 'Cobquecura', 'Coelemu', 'Ninhue', 'Portezuelo', 'Quillón', 'Ránquil', 'Treguaco', 'Chillán Viejo', 'El Carmen', 'Pemuco', 'Yungay', 'Pinto', 'Coihueco', 'Ñiquén', 'San Nicolás', 'San Fabián'],
  },
  {
    id: 'biobio',
    name: 'Biobío',
    cities: ['Concepción', 'Talcahuano', 'Los Ángeles', 'Coronel', 'Chiguayante', 'San Pedro de la Paz', 'Hualpén', 'Lota', 'Penco', 'Tomé', 'Arauco', 'Curanilahue', 'Lebu', 'Cañete', 'Contulmo', 'Tirúa', 'Los Álamos', 'Laja', 'Nacimiento', 'Negrete', 'Mulchén', 'Quilaco', 'Quilleco', 'San Rosendo', 'Santa Bárbara', 'Tucapel', 'Yumbel', 'Antuco', 'Cabrero', 'Yungay'],
  },
  {
    id: 'araucania',
    name: 'La Araucanía',
    cities: ['Temuco', 'Villarrica', 'Pucón', 'Angol', 'Victoria', 'Lautaro', 'Nueva Imperial', 'Carahue', 'Pitrufquén', 'Freire', 'Gorbea', 'Loncoche', 'Toltén', 'Vilcún', 'Cunco', 'Curarrehue', 'Melipeuco', 'Lonquimay', 'Curacautín', 'Collipulli', 'Ercilla', 'Los Sauces', 'Renaico', 'Traiguén', 'Lumaco', 'Purén', 'Galvarino', 'Perquenco', 'Cholchol'],
  },
  {
    id: 'rios',
    name: 'Los Ríos',
    cities: ['Valdivia', 'La Unión', 'Panguipulli', 'Paillaco', 'Los Lagos', 'Corral', 'Lanco', 'Mariquina', 'Máfil', 'Lago Ranco', 'Río Bueno', 'Futrono'],
  },
  {
    id: 'lagos',
    name: 'Los Lagos',
    cities: ['Puerto Montt', 'Osorno', 'Castro', 'Ancud', 'Puerto Varas', 'Frutillar', 'Calbuco', 'Llanquihue', 'Fresia', 'Purranque', 'Río Negro', 'Puyehue', 'San Juan de la Costa', 'Quellón', 'Quemchi', 'Queilén', 'Chonchi', 'Curaco de Vélez', 'Dalcahue', 'Puqueldón', 'Chaitén', 'Futaleufú', 'Hualaihué', 'Palena'],
  },
  {
    id: 'aysen',
    name: 'Aysén',
    cities: ['Coyhaique', 'Puerto Aysén', 'Puerto Chacabuco', 'Cisnes', 'Guaitecas', 'Chile Chico', 'Río Ibáñez', 'Cochrane', "O'Higgins", 'Tortel', "Villa O'Higgins"],
  },
  {
    id: 'magallanes',
    name: 'Magallanes y la Antártica Chilena',
    cities: ['Punta Arenas', 'Puerto Natales', 'Porvenir', 'Puerto Williams', 'Cabo de Hornos', 'Laguna Blanca', 'Río Verde', 'San Gregorio', 'Primavera', 'Timaukel', 'Torres del Paine', 'Natales'],
  },
];

export function getCitiesByRegion(regionId: string): string[] {
  const region = chileRegions.find(r => r.id === regionId);
  return region ? region.cities : [];
}

export function getRegionByName(name: string): Region | undefined {
  return chileRegions.find(r => r.name === name);
}

