// Configuración de Firebase
// NOTA: En modo desarrollo local SIN Firebase configurado, este archivo exporta objetos vacíos
// Los mocks se usan a través de los archivos mock-*.ts (mock-clients, mock-quotes, etc.)
// Cuando Firebase esté configurado, descomentar y usar la configuración real abajo

// Verificar si estamos en modo mock (sin credenciales válidas)
const hasValidConfig = 
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your_api_key_here' &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== 'your_project_id';

// Por ahora, siempre exportar objetos vacíos (usamos mocks)
// Cuando Firebase esté configurado, reemplazar con la implementación real abajo
export const auth = {} as any;
export const db = {} as any;
export const storage = {} as any;
export default {} as any;

/*
// DESCOMENTAR Y USAR CUANDO FIREBASE ESTÉ CONFIGURADO:

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

export default app;
*/
