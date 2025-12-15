// Firebase costings service
// Usa mock en desarrollo local si Firebase no está configurado
import { Costing } from '@/types';

// Intentar importar Firebase
let costingsService: any;

try {
  // Verificar si Firebase está configurado
  const hasValidConfig =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your_api_key_here' &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== 'your_project_id';

  if (hasValidConfig && typeof window !== 'undefined') {
    // Usar Firebase real (implementar cuando esté configurado)
    // costingsService = require('./firebase-costings');
    // Por ahora, usar mock
    costingsService = require('./mock-costings');
  } else {
    // Usar mock en desarrollo local
    costingsService = require('./mock-costings');
  }
} catch (error) {
  // Si hay error, usar mock
  costingsService = require('./mock-costings');
}

export const {
  createCosting,
  getCostingById,
  getAllCostings,
  updateCosting,
  deleteCosting,
} = costingsService;



