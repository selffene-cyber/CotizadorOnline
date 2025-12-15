// Validación de RUT chileno
// Función propia de validación (más confiable que la librería)

/**
 * Valida un RUT chileno usando el algoritmo módulo 11
 * @param rut RUT con o sin puntos ni guión
 * @returns true si es válido
 */
export function validateRUT(rut: string): boolean {
  if (!rut || rut.trim() === '') return false;
  
  // Limpiar RUT: remover puntos y guiones
  const cleanRUT = rut.replace(/\./g, '').replace(/-/g, '').trim();
  
  // Debe tener al menos 2 caracteres (1 dígito + 1 dígito verificador)
  if (cleanRUT.length < 2) return false;
  
  // Separar cuerpo y dígito verificador
  const cuerpo = cleanRUT.slice(0, -1);
  const dv = cleanRUT.slice(-1).toUpperCase();
  
  // El cuerpo debe ser numérico
  if (!/^\d+$/.test(cuerpo)) return false;
  
  // El dígito verificador debe ser numérico o K
  if (!/^[0-9Kk]$/.test(dv)) return false;
  
  // Calcular dígito verificador esperado usando módulo 11
  let suma = 0;
  let multiplo = 2;
  
  // Recorrer el cuerpo de derecha a izquierda
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i)) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }
  
  // Calcular dígito verificador esperado
  const dvEsperado = 11 - (suma % 11);
  const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
  
  // Comparar con el dígito ingresado
  return dvCalculado === dv;
}

/**
 * Formatea un RUT chileno (agrega puntos y guión)
 * @param rut RUT sin formato
 * @returns RUT formateado
 */
export function formatRUT(rut: string): string {
  if (!rut) return '';
  
  // Remover formato existente
  const cleanRUT = rut.replace(/[.\-]/g, '').trim();
  
  if (cleanRUT.length < 2) return rut;
  
  const body = cleanRUT.slice(0, -1);
  const dv = cleanRUT.slice(-1).toUpperCase();
  
  // Agregar puntos cada 3 dígitos desde la derecha
  let formattedBody = '';
  for (let i = body.length - 1, count = 0; i >= 0; i--, count++) {
    if (count > 0 && count % 3 === 0) {
      formattedBody = '.' + formattedBody;
    }
    formattedBody = body[i] + formattedBody;
  }
  
  return `${formattedBody}-${dv}`;
}

/**
 * Limpia un RUT removiendo puntos y guiones
 * @param rut RUT formateado
 * @returns RUT sin formato
 */
export function cleanRUT(rut: string): string {
  return rut.replace(/[.\-]/g, '').trim();
}
