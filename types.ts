
export interface Intervention {
  id: string;
  date: string;
  index: number;
  type: 'Batterie' | 'AVR' | 'Courroie' | 'Relais' | 'Démarreur' | 'Pompe a Gasoil' | 'Filtre a Air' | 'Vidange Complete' | 'Vidange Partiale';
  details: string;
  photoUrl?: string;
  signatureUrl?: string;
  technicianUid?: string; // Track who did the intervention
}

export interface MaintenanceRecord {
  id: string;
  customerName: string;
  clientEmail?: string; // Link to a client user
  site?: string;
  lat?: number;
  lng?: number;
  model: string;
  capacity: string;
  oilFilterRef: string;
  fuelFilterRef: string;
  airFilterRef: string;
  oilRef: string;
  lastChangeIndex: number;
  lastChangeDate?: string;
  nextChangeIndex: number;
  lastBeltChangeIndex: number;
  nextBeltChangeIndex: number;
  beltRef?: string;
  currentIndex: number;
  dailyHours: number;
  lastUpdateDate: string;
  interventions: Intervention[];
  // Pricing details for documents
  oilQuantity: number;
  oilPrice: number;
  oilFilterPrice: number;
  fuelFilterPrice: number;
  airFilterPrice: number;
  separatorRef?: string;
  separatorPrice?: number;
  laborPrice: number;
  airFilterPrice2?: number; // For dual filters if needed
  beltPrice?: number;
  dynamicItems?: {
    headers: string[];
    rows: any[][];
  };
}

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  category: 'Filtre' | 'Huile' | 'Pièce' | 'Consommable';
}

export interface ArchivedDocument {
  id: string;
  docNumber: string;
  type: 'quote' | 'invoice';
  date: string;
  customerName: string;
  clientEmail?: string; // Link to a client user
  model: string;
  totalAmount: number;
  recordSnapshot: MaintenanceRecord;
}

export type TabType = 'dashboard' | 'add' | 'list' | 'ai-insights' | 'documents' | 'stock' | 'reports' | 'users' | 'profile' | 'planning' | 'map';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'technician' | 'client';
  createdAt: string;
  lastActive?: string;
}

export interface MaintenanceStatus {
  hoursRemaining: number;
  daysRemaining: number;
  projectedDate: string;
  priority: 'low' | 'medium' | 'high';
  progressPercent: number;
  beltHoursRemaining: number;
  beltProjectedDate: string;
  beltProgressPercent: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'intervention' | 'maintenance_approaching' | 'alert';
  date: string;
  isRead: boolean;
  recordId?: string;
}
