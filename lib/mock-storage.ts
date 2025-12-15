// Mock Storage para desarrollo local usando localStorage
// Simula Firebase Firestore para pruebas locales

interface StorageData {
  clients: any[];
  quotes: any[];
  costings: any[]; // Nuevos costeos
  catalogs: {
    materials: any[];
    equipment: any[];
    labor: any[];
    risks: any[];
    settings: any;
  };
}

const STORAGE_KEY = 'cotizador-pro-data';

function getStorage(): StorageData {
  if (typeof window === 'undefined') {
    return {
      clients: [],
      quotes: [],
      costings: [],
      catalogs: {
        materials: [],
        equipment: [],
        labor: [],
        risks: [],
        settings: null,
      },
    };
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    // Asegurar que costings existe (migración para datos antiguos)
    if (!parsed.costings) {
      parsed.costings = [];
      saveStorage(parsed);
    }
    return parsed;
  }

  // Datos iniciales
  const initial: StorageData = {
    clients: [],
    quotes: [],
    costings: [],
    catalogs: {
      materials: [
        { id: '1', name: 'Acero estructural A37-24ES', unidad: 'kg', defaultMermaPct: 5, category: 'Acero' },
        { id: '2', name: 'Plancha de acero 3mm', unidad: 'm²', defaultMermaPct: 5, category: 'Acero' },
        { id: '3', name: 'Pernos M12', unidad: 'un', defaultMermaPct: 2, category: 'Fijaciones' },
        { id: '4', name: 'Electrodos 6013', unidad: 'kg', defaultMermaPct: 10, category: 'Consumibles' },
      ],
      equipment: [
        { id: '1', name: 'Soldadora MIG', unit: 'día', category: 'Soldadura' },
        { id: '2', name: 'Camioneta', unit: 'día', category: 'Transporte' },
      ],
      labor: [
        { id: '1', cargo: 'Soldador', defaultCostHH: 15000, category: 'Oficio' },
        { id: '2', cargo: 'Ayudante', defaultCostHH: 10000, category: 'Oficio' },
        { id: '3', cargo: 'Maestro', defaultCostHH: 18000, category: 'Maestranza' },
      ],
      risks: [
        { id: '1', name: 'Trabajo en altura', percentage: 3, description: 'Riesgo adicional por trabajo en altura' },
        { id: '2', name: 'Turno noche', percentage: 5, description: 'Recargo por trabajo en horario nocturno' },
      ],
      settings: {
        ggDefault: 12,
        utilityDefault: 55,
        utilityMin: 20,
        ratePerKm: 450,
        hoursPerDay: 9,
        efficiency: 0.85,
        equipmentPercentageMO: 4,
      },
    },
  };

  saveStorage(initial);
  return initial;
}

function saveStorage(data: StorageData): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

// Clientes
export const mockClients = {
  getAll: (): any[] => {
    return getStorage().clients;
  },
  
  getById: (id: string): any | null => {
    return getStorage().clients.find(c => c.id === id) || null;
  },
  
  getByRUT: (rut: string): any | null => {
    return getStorage().clients.find(c => c.rut === rut) || null;
  },
  
  create: (data: any): string => {
    const storage = getStorage();
    const id = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newClient = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.clients.push(newClient);
    saveStorage(storage);
    return id;
  },
  
  update: (id: string, data: Partial<any>): void => {
    const storage = getStorage();
    const index = storage.clients.findIndex(c => c.id === id);
    if (index >= 0) {
      storage.clients[index] = {
        ...storage.clients[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      saveStorage(storage);
    }
  },
  
  delete: (id: string): void => {
    const storage = getStorage();
    storage.clients = storage.clients.filter(c => c.id !== id);
    saveStorage(storage);
  },
};

// Costeos
export const mockCostings = {
  getAll: (): any[] => {
    return getStorage().costings;
  },
  
  getById: (id: string): any | null => {
    return getStorage().costings.find(c => c.id === id) || null;
  },
  
  create: (data: any): string => {
    const storage = getStorage();
    const id = `costing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generar número correlativo
    const existingCostings = storage.costings || [];
    const maxNumber = existingCostings.length > 0 
      ? Math.max(...existingCostings.map((c: any) => c.costingNumber || 0))
      : 0;
    const costingNumber = maxNumber + 1;
    
    const newCosting = {
      id,
      costingNumber,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.costings.push(newCosting);
    saveStorage(storage);
    return id;
  },
  
  update: (id: string, data: any): void => {
    const storage = getStorage();
    const index = storage.costings.findIndex(c => c.id === id);
    if (index !== -1) {
      storage.costings[index] = {
        ...storage.costings[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      saveStorage(storage);
    }
  },
  
  delete: (id: string): void => {
    const storage = getStorage();
    storage.costings = storage.costings.filter(c => c.id !== id);
    saveStorage(storage);
  },
};

// Cotizaciones
export const mockQuotes = {
  getAll: (): any[] => {
    return getStorage().quotes;
  },
  
  getById: (id: string): any | null => {
    const quote = getStorage().quotes.find(q => q.id === id);
    if (!quote) return null;
    
    // Convertir fechas
    return {
      ...quote,
      createdAt: quote.createdAt ? new Date(quote.createdAt) : undefined,
      updatedAt: quote.updatedAt ? new Date(quote.updatedAt) : undefined,
    };
  },
  
  create: (data: any): string => {
    const storage = getStorage();
    const id = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newQuote = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.quotes.push(newQuote);
    saveStorage(storage);
    return id;
  },
  
  update: (id: string, data: Partial<any>): void => {
    const storage = getStorage();
    const index = storage.quotes.findIndex(q => q.id === id);
    if (index >= 0) {
      storage.quotes[index] = {
        ...storage.quotes[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      saveStorage(storage);
    }
  },
  
  delete: (id: string): void => {
    const storage = getStorage();
    storage.quotes = storage.quotes.filter(q => q.id !== id);
    saveStorage(storage);
  },
};

// Catálogos
export const mockCatalogs = {
  getMaterials: (): any[] => {
    return getStorage().catalogs.materials;
  },
  
  getEquipment: (): any[] => {
    return getStorage().catalogs.equipment;
  },
  
  getLabor: (): any[] => {
    return getStorage().catalogs.labor;
  },
  
  getRisks: (): any[] => {
    return getStorage().catalogs.risks;
  },
  
  getSettings: (): any => {
    return getStorage().catalogs.settings;
  },
  
  saveMaterials: (items: any[]): void => {
    const storage = getStorage();
    storage.catalogs.materials = items;
    saveStorage(storage);
  },
  
  saveEquipment: (items: any[]): void => {
    const storage = getStorage();
    storage.catalogs.equipment = items;
    saveStorage(storage);
  },
  
  saveLabor: (items: any[]): void => {
    const storage = getStorage();
    storage.catalogs.labor = items;
    saveStorage(storage);
  },
  
  saveRisks: (items: any[]): void => {
    const storage = getStorage();
    storage.catalogs.risks = items;
    saveStorage(storage);
  },
  
  saveSettings: (settings: any): void => {
    const storage = getStorage();
    storage.catalogs.settings = settings;
    saveStorage(storage);
  },
};

// Auth Mock
export const mockAuth = {
  currentUser: null as any,
  
  signIn: async (email: string, password: string): Promise<void> => {
    // Para desarrollo, aceptar cualquier credencial
    mockAuth.currentUser = {
      uid: 'mock_user_1',
      email,
      displayName: 'Usuario Demo',
    };
    
    // Guardar en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_user', JSON.stringify(mockAuth.currentUser));
    }
  },
  
  signOut: async (): Promise<void> => {
    mockAuth.currentUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mock_user');
    }
  },
  
  getCurrentUser: (): any => {
    if (mockAuth.currentUser) return mockAuth.currentUser;
    
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mock_user');
      if (stored) {
        mockAuth.currentUser = JSON.parse(stored);
        return mockAuth.currentUser;
      }
    }
    
    return null;
  },
};

