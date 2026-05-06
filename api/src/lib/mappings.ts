// Bidirectional mapping between DB (ASCII) values and frontend (accented) values
// DB stores ASCII to avoid encoding issues in SQLite CHECK constraints

const typeMap: Record<string, string> = {
  'Fabricacion': 'Fabricaci\u00f3n',
  'Reparacion': 'Reparaci\u00f3n',
};

const unitMap: Record<string, string> = {
  'dia': 'd\u00eda',
  'hora': 'hora',
};

function forward(map: Record<string, string>, value: string | null | undefined): string | null | undefined {
  if (!value) return value;
  return map[value] || value;
}

function reverse(map: Record<string, string>, value: string | null | undefined): string | null | undefined {
  if (!value) return value;
  const entry = Object.entries(map).find(([, v]) => v === value);
  return entry ? entry[0] : value;
}

// Normalize frontend values to DB values (accented -> ASCII)
export const toDB = {
  type: (v: string | null | undefined) => reverse(typeMap, v),
  unit: (v: string | null | undefined) => reverse(unitMap, v),
};

// Map DB values to frontend values (ASCII -> accented)
export const toFrontend = {
  type: (v: string | null | undefined) => forward(typeMap, v),
  unit: (v: string | null | undefined) => forward(unitMap, v),
};

// Normalize unit for equipment catalog
export function normalizeUnit(u: string): string {
  const lower = (u || '').toLowerCase().trim();
  const hourValues = ['hora', 'horas', 'h', 'hh', 'hr', 'hrs', 'hour', 'hours'];
  if (hourValues.includes(lower)) return 'hora';
  return 'dia';
}