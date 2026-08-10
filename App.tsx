
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import MaintenanceForm from './components/MaintenanceForm';
import MaintenanceList from './components/MaintenanceList';
import Dashboard from './components/Dashboard';
import StockManager from './components/StockManager';
import Reports from './components/Reports';
import UserManager from './components/UserManager';
import UserProfile from './components/UserProfile';
import ErrorBoundary from './components/ErrorBoundary';
import Planning from './components/Planning';
import Map from './components/Map';
import * as XLSX from 'xlsx';
import { MaintenanceRecord, TabType, Intervention, ArchivedDocument, StockItem, AppUser, AppNotification } from './types';
import { getMaintenanceAdvice } from './services/geminiService';
import { formatNumber, exportToCSV, calculateMaintenanceStatus } from './utils';
import { 
  auth, db, loginWithGoogle, logout, handleFirestoreError, OperationType, loginWithEmail, registerWithEmail 
} from './firebase';
import { 
  onSnapshot, collection, doc, setDoc, updateDoc, deleteDoc, query, where, writeBatch, getDocs, getDoc, limit 
} from 'firebase/firestore';
import { onAuthStateChanged, User, updateProfile } from 'firebase/auth';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authSyncError, setAuthSyncError] = useState<string | null>(null);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [archivedDocs, setArchivedDocs] = useState<ArchivedDocument[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [docSearch, setDocSearch] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [deleteConfirmData, setDeleteConfirmData] = useState<{ 
    type: 'archive' | 'intervention' | 'machine'; 
    count: number; 
    ids: string[]; 
    recordId?: string 
  } | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError("La fenêtre de connexion a été fermée avant la fin de l'authentification.");
      } else if (err.code === 'auth/cancelled-by-user') {
        setAuthError("Connexion annulée.");
      } else {
        setAuthError(err.message || "Une erreur est survenue lors de la connexion avec Google.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (isRegistering) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };
  
  const filteredDocs = useMemo(() => {
    const s = docSearch.toLowerCase().trim();
    if (!s) return archivedDocs;
    return archivedDocs.filter(d => 
      d.customerName.toLowerCase().includes(s) || 
      d.model.toLowerCase().includes(s) || 
      d.docNumber.toLowerCase().includes(s)
    );
  }, [archivedDocs, docSearch]);

  const [previewDoc, setPreviewDoc] = useState<{ type: 'quote' | 'invoice' | 'history' | 'blank_quote'; record: MaintenanceRecord } | null>(null);
  const [blankRecord, setBlankRecord] = useState<MaintenanceRecord | null>(null);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ description: '', quantity: 1, price: 0 });
  const [rowToDelete, setRowToDelete] = useState<number | null>(null);

  const handleAddMaterial = () => {
    const currentRecord = isBlankPreview ? previewDoc?.record : blankRecord;
    if (!currentRecord || !newMaterial.description) return;

    const qty = Number(newMaterial.quantity);
    const price = Number(newMaterial.price);
    const newRow = [
      (currentRecord.dynamicItems?.rows.length || 0) + 1,
      newMaterial.description,
      qty,
      price,
      qty * price
    ];

    const updated = {
      ...currentRecord,
      dynamicItems: {
        headers: currentRecord.dynamicItems?.headers || [],
        rows: [...(currentRecord.dynamicItems?.rows || []), newRow]
      }
    };

    if (isBlankPreview) {
      setBlankRecord(updated);
      setPreviewDoc({ type: 'blank_quote', record: updated });
    } else {
      setBlankRecord(updated);
    }
    
    setShowAddMaterialModal(false);
    setNewMaterial({ description: '', quantity: 1, price: 0 });
  };

  const isBlankPreview = previewDoc?.type === 'blank_quote';

  const handleUpdateCell = (rowIndex: number, cellIndex: number, value: any) => {
    const currentRecord = isBlankPreview ? previewDoc?.record : blankRecord;
    if (!currentRecord || !currentRecord.dynamicItems) return;

    const updatedRows = [...currentRecord.dynamicItems.rows];
    const updatedRow = [...updatedRows[rowIndex]];
    updatedRow[cellIndex] = value;

    // Recalculate total if quantity or price changed
    if (cellIndex === 2 || cellIndex === 3) {
      const qty = Number(updatedRow[2]) || 0;
      const price = Number(updatedRow[3]) || 0;
      updatedRow[4] = qty * price;
    }

    updatedRows[rowIndex] = updatedRow;

    const updated = {
      ...currentRecord,
      dynamicItems: {
        ...currentRecord.dynamicItems,
        rows: updatedRows
      }
    };

    if (isBlankPreview) {
      setBlankRecord(updated);
      setPreviewDoc({ type: 'blank_quote', record: updated });
    } else {
      setBlankRecord(updated);
    }
  };

  const confirmDeleteRow = () => {
    if (rowToDelete === null) return;
    const currentRecord = isBlankPreview ? previewDoc?.record : blankRecord;
    if (!currentRecord || !currentRecord.dynamicItems) return;

    const updatedRows = currentRecord.dynamicItems.rows.filter((_, idx) => idx !== rowToDelete);
    const updated = {
      ...currentRecord,
      dynamicItems: {
        ...currentRecord.dynamicItems,
        rows: updatedRows.map((r, i) => [i + 1, ...r.slice(1)])
      }
    };

    if (isBlankPreview) {
      setBlankRecord(updated);
      setPreviewDoc({ type: 'blank_quote', record: updated });
    } else {
      setBlankRecord(updated);
    }
    setRowToDelete(null);
  };
  const printRef = useRef<HTMLDivElement>(null);
  const stickerRef = useRef<HTMLDivElement>(null);

  const handleDemoLogin = () => {
    const demoUser: AppUser = {
      uid: 'demo_admin_uid',
      email: 'juniorobindi@gmail.com',
      displayName: 'Junior Obindi (Admin)',
      photoURL: '',
      role: 'admin',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };
    setUser(demoUser as any);
    setAppUser(demoUser);
    setIsAuthReady(true);
    if (records.length === 0) {
      setRecords([
        {
          id: 'demo-rec-1',
          customerName: 'SOCOIBTP Congo',
          clientEmail: 'juniorobindi@gmail.com',
          model: 'Groupe Électrogène Perkins 250KVA',
          capacity: '250 KVA',
          site: 'Brazzaville',
          oilFilterRef: 'LF16015',
          fuelFilterRef: 'FF5488',
          airFilterRef: 'AF25127',
          oilRef: '15W40 CI-4',
          lastChangeIndex: 1200,
          lastChangeDate: '2026-01-15T00:00:00.000Z',
          nextChangeIndex: 2500,
          lastBeltChangeIndex: 0,
          nextBeltChangeIndex: 2000,
          currentIndex: 2350,
          dailyHours: 12,
          oilQuantity: 40,
          oilPrice: 3500,
          oilFilterPrice: 15000,
          fuelFilterPrice: 12000,
          airFilterPrice: 25000,
          laborPrice: 50000,
          interventions: [
            { id: 'int-1', date: '2026-01-15', index: 1200, type: 'Vidange Complete', details: 'Vidange huile moteur 15W40, remplacement filtres à huile et gasoil.', photoUrl: '', signatureUrl: '' }
          ],
          lastUpdateDate: new Date().toISOString()
        },
        {
          id: 'demo-rec-2',
          customerName: 'Hôtel Ledger Plaza',
          clientEmail: 'client@ledger.cg',
          model: 'Cummins QSK50 1000KVA',
          capacity: '1000 KVA',
          site: 'Pointe-Noire',
          oilFilterRef: 'LF9009',
          fuelFilterRef: 'FS19765',
          airFilterRef: 'AF26158',
          oilRef: '15W40 Premium',
          lastChangeIndex: 5000,
          lastChangeDate: '2025-11-10T00:00:00.000Z',
          nextChangeIndex: 5500,
          lastBeltChangeIndex: 0,
          nextBeltChangeIndex: 3000,
          currentIndex: 5480,
          dailyHours: 18,
          oilQuantity: 120,
          oilPrice: 4000,
          oilFilterPrice: 35000,
          fuelFilterPrice: 28000,
          airFilterPrice: 65000,
          laborPrice: 150000,
          interventions: [
            { id: 'int-2', date: '2025-11-10', index: 5000, type: 'Vidange Complete', details: 'Maintenance préventive majeure 5000h.', photoUrl: '', signatureUrl: '' }
          ],
          lastUpdateDate: new Date().toISOString()
        },
        {
          id: 'demo-rec-3',
          customerName: 'TotalEnergies EP Congo',
          clientEmail: 'contact@totalenergies.cg',
          model: 'Volvo Penta TWD1643GE',
          capacity: '500 KVA',
          site: 'Dolisie',
          oilFilterRef: 'VOY-21707133',
          fuelFilterRef: 'VOY-21380488',
          airFilterRef: 'VOY-3840003',
          oilRef: 'VDS-4.5',
          lastChangeIndex: 3000,
          lastChangeDate: '2026-02-01T00:00:00.000Z',
          nextChangeIndex: 4300,
          lastBeltChangeIndex: 1000,
          nextBeltChangeIndex: 4000,
          currentIndex: 3100,
          dailyHours: 10,
          oilQuantity: 60,
          oilPrice: 3800,
          oilFilterPrice: 20000,
          fuelFilterPrice: 18000,
          airFilterPrice: 40000,
          laborPrice: 80000,
          interventions: [
            { id: 'int-3', date: '2026-02-01', index: 3000, type: 'Vidange Partiale', details: 'Contrôle filtres et mise à niveau.', photoUrl: '', signatureUrl: '' }
          ],
          lastUpdateDate: new Date().toISOString()
        }
      ]);
    }
  };

  // Auth Listener
  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!active) return;
      setAuthSyncError(null);
      setUser(u);
      if (u) {
        // Optimistically set appUser immediately so dashboard renders instantly without delay
        const initialRole = u.email === 'juniorobindi@gmail.com' ? 'admin' : 'client';
        const optimisticUser: AppUser = {
          uid: u.uid,
          email: u.email || '',
          displayName: u.displayName || u.email?.split('@')[0] || 'Utilisateur',
          photoURL: u.photoURL || '',
          role: initialRole,
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        };
        setAppUser(optimisticUser);
        setIsAuthReady(true);

        // Background sync with Firestore
        try {
          const userRef = doc(db, 'users', u.uid);
          const userSnap = await getDoc(userRef).catch(() => null);
          
          if (userSnap && userSnap.exists()) {
            const userData = userSnap.data() as AppUser;
            if (u.email === 'juniorobindi@gmail.com' && userData.role !== 'admin') {
              userData.role = 'admin';
              await updateDoc(userRef, { role: 'admin' }).catch(() => {});
            }
            setAppUser(userData);
          } else {
            const q = query(collection(db, 'users'), where('email', '==', u.email), limit(1));
            const preAuthSnap = await getDocs(q).catch(() => ({ empty: true } as any));
            
            if (preAuthSnap && !preAuthSnap.empty) {
              const preAuthDoc = preAuthSnap.docs[0];
              const preAuthData = preAuthDoc.data() as AppUser;
              optimisticUser.role = preAuthData.role;
              setAppUser({ ...optimisticUser });
              await setDoc(userRef, optimisticUser).catch(() => {});
              if (preAuthDoc.id !== u.uid) {
                await deleteDoc(doc(db, 'users', preAuthDoc.id)).catch(() => {});
              }
            } else {
              await setDoc(userRef, optimisticUser).catch(() => {});
            }
          }
        } catch (e: any) {
          console.warn("Background user sync warning:", e);
        }
      } else {
        setAppUser(null);
        setIsAuthReady(true);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Heartbeat to track online status
  useEffect(() => {
    if (!user) return;
    
    const updateStatus = async () => {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          lastActive: new Date().toISOString()
        });
      } catch (err) {
        console.error("Heartbeat failed", err);
      }
    };

    updateStatus(); // Initial update
    const interval = setInterval(updateStatus, 120000); // Every 2 minutes
    
    return () => clearInterval(interval);
  }, [user]);

  // Firestore Listeners
  useEffect(() => {
    if (!user || !appUser) {
      setRecords([]);
      setArchivedDocs([]);
      setStock([]);
      return;
    }

    let recordsQuery = query(collection(db, 'records'));
    let archivesQuery = query(collection(db, 'archives'));

    if (appUser.role === 'client') {
      recordsQuery = query(collection(db, 'records'), where('clientEmail', '==', user.email));
      archivesQuery = query(collection(db, 'archives'), where('clientEmail', '==', user.email));
    }

    const unsubRecords = onSnapshot(recordsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as MaintenanceRecord);
      setRecords(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'records'));

    const unsubArchives = onSnapshot(archivesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as ArchivedDocument);
      setArchivedDocs(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'archives'));

    let unsubStock = () => {};
    if (appUser.role === 'admin' || appUser.role === 'technician') {
      unsubStock = onSnapshot(collection(db, 'stock'), (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data() as StockItem);
        setStock(data);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'stock'));
    } else {
      setStock([]);
    }

    const unsubNotifications = onSnapshot(query(collection(db, 'notifications'), where('userId', '==', user.uid)), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as AppNotification);
      setNotifications(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'notifications'));

    return () => {
      unsubRecords();
      unsubArchives();
      unsubStock();
      unsubNotifications();
    };
  }, [user, appUser]);

  // Escape key handler to close document preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewDoc) {
        setPreviewDoc(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewDoc]);

  // Periodic check for maintenance alerts (Admin/Technician only)
  useEffect(() => {
    if (!user || !appUser || appUser.role === 'client') return;
    if (records.length === 0) return;

    const checkAll = async () => {
      for (const record of records) {
        await checkMaintenanceApproaching(record);
      }
    };

    checkAll();
    const interval = setInterval(checkAll, 3600000); // Every hour
    return () => clearInterval(interval);
  }, [user, appUser, records]);

  // Migration Logic
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const migrate = async () => {
      const hasMigrated = localStorage.getItem('brel_firebase_migrated');
      if (hasMigrated) return;

      const localRecords = JSON.parse(localStorage.getItem('brel_energie_v3_records') || '[]');
      const localArchives = JSON.parse(localStorage.getItem('brel_energie_v4_archives') || '[]');
      const localStock = JSON.parse(localStorage.getItem('brel_energie_stock') || '[]');

      if (localRecords.length === 0 && localArchives.length === 0 && localStock.length === 0) {
        localStorage.setItem('brel_firebase_migrated', 'true');
        return;
      }

      const batch = writeBatch(db);
      
      localRecords.forEach((r: any) => {
        batch.set(doc(db, 'records', r.id), { ...r, createdBy: user.uid });
      });
      localArchives.forEach((a: any) => {
        batch.set(doc(db, 'archives', a.id), { ...a, createdBy: user.uid });
      });
      localStock.forEach((s: any) => {
        batch.set(doc(db, 'stock', s.id), { ...s, createdBy: user.uid });
      });

      try {
        await batch.commit();
        localStorage.setItem('brel_firebase_migrated', 'true');
        console.log("Migration vers Firebase réussie !");
      } catch (err) {
        console.error("Erreur lors de la migration", err);
      }
    };

    migrate();
  }, [user, isAuthReady]);

  const sendNotification = async (userId: string, title: string, message: string, type: AppNotification['type'], recordId?: string) => {
    const id = crypto.randomUUID();
    const newNotification: AppNotification = {
      id,
      userId,
      title,
      message,
      type,
      date: new Date().toISOString(),
      isRead: false,
      recordId
    };
    try {
      await setDoc(doc(db, 'notifications', id), newNotification);
    } catch (err) {
      console.error("Failed to send notification", err);
    }
  };

  const getUserIdByEmail = async (email: string) => {
    const cleanEmail = email.toLowerCase().trim();
    const q = query(collection(db, 'users'), where('email', '==', cleanEmail), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].id;
    }
    // Fallback: check for pending_ ID format if query fails for some reason
    const pendingId = `pending_${cleanEmail.replace(/\./g, '_')}`;
    const pendingSnap = await getDoc(doc(db, 'users', pendingId));
    if (pendingSnap.exists()) {
      return pendingId;
    }
    return null;
  };

  const checkMaintenanceApproaching = async (record: MaintenanceRecord) => {
    if (!record.clientEmail) return;

    const status = calculateMaintenanceStatus(record);
    const clientId = await getUserIdByEmail(record.clientEmail);
    if (!clientId) return;

    // 1. Check Engine Maintenance
    if (status.hoursRemaining <= 50) {
      const isOverdue = status.hoursRemaining <= 0;
      const type = isOverdue ? 'alert' : 'maintenance_approaching';
      const title = isOverdue ? "Maintenance Requise" : "Maintenance Proche";
      const message = isOverdue 
        ? `ALERTE : La maintenance de votre machine ${record.model} (${record.customerName}) est dépassée de ${Math.abs(Math.round(status.hoursRemaining))} heures. Veuillez planifier une intervention immédiatement.`
        : `La maintenance pour votre machine ${record.model} (${record.customerName}) est prévue dans environ ${Math.round(status.hoursRemaining)} heures (vers le ${new Date(status.projectedDate).toLocaleDateString()}).`;

      // Check for recent notification of same type
      const q = query(
        collection(db, 'notifications'), 
        where('userId', '==', clientId), 
        where('recordId', '==', record.id),
        where('type', '==', type),
        limit(1)
      );
      const snap = await getDocs(q);
      
      let shouldSend = true;
      if (!snap.empty) {
        const lastNotif = snap.docs[0].data() as AppNotification;
        const lastDate = new Date(lastNotif.date);
        const now = new Date();
        const diffDays = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays < 3) shouldSend = false; // Send every 3 days if still overdue/approaching
      }

      if (shouldSend) {
        await sendNotification(clientId, title, message, type, record.id);
      }
    }

    // 2. Check Belt Maintenance
    if (status.beltHoursRemaining <= 100) {
      const isBeltOverdue = status.beltHoursRemaining <= 0;
      const type = isBeltOverdue ? 'alert' : 'maintenance_approaching';
      const title = isBeltOverdue ? "Changement Courroie Requis" : "Changement Courroie Proche";
      const message = isBeltOverdue
        ? `ALERTE : Le changement de courroie pour ${record.model} (${record.customerName}) est dépassé. Risque de rupture.`
        : `Le changement de courroie pour ${record.model} (${record.customerName}) est à prévoir dans environ ${Math.round(status.beltHoursRemaining)} heures.`;

      const q = query(
        collection(db, 'notifications'), 
        where('userId', '==', clientId), 
        where('recordId', '==', record.id),
        where('title', '==', title),
        limit(1)
      );
      const snap = await getDocs(q);
      
      let shouldSend = true;
      if (!snap.empty) {
        const lastNotif = snap.docs[0].data() as AppNotification;
        const lastDate = new Date(lastNotif.date);
        const now = new Date();
        const diffDays = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays < 7) shouldSend = false;
      }

      if (shouldSend) {
        await sendNotification(clientId, title, message, type, record.id);
      }
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'notifications');
    }
  };

  const handleExportData = () => {
    const data = records.map(r => {
      const lastVidange = r.interventions.find(i => i.type === 'Vidange Complete' || i.type === 'Vidange Partiale');
      return {
        Clients: r.customerName,
        Model: r.model,
        Capacités: r.capacity,
        'index dernière vidange': r.lastChangeIndex,
        'date dernière vidange': r.lastChangeDate ? new Date(r.lastChangeDate).toLocaleDateString() : (lastVidange ? new Date(lastVidange.date).toLocaleDateString() : 'N/A'),
        'index actuel': r.currentIndex,
        'index prochaine vidange': r.nextChangeIndex,
        'mise a jour': new Date(r.lastUpdateDate).toLocaleDateString()
      };
    });
    exportToCSV(data, `parc_machines_brel_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const deleteIntervention = (recordId: string, interventionId: string) => {
    setDeleteConfirmData({ 
      type: 'intervention', 
      count: 1, 
      ids: [interventionId], 
      recordId 
    });
  };

  const handleSave = async (recordData: Omit<MaintenanceRecord, 'id' | 'lastUpdateDate' | 'interventions'>) => {
    if (!user) return;

    try {
      if (editingRecord) {
        const updatedRecord = { 
          ...editingRecord, 
          ...recordData, 
          lastUpdateDate: new Date().toISOString() 
        };
        await setDoc(doc(db, 'records', editingRecord.id), updatedRecord);
        setEditingRecord(null);
        // Check if maintenance is approaching after update
        await checkMaintenanceApproaching(updatedRecord);
      } else {
        const id = crypto.randomUUID();
        const newRecord: MaintenanceRecord = {
          ...recordData,
          id,
          lastUpdateDate: new Date().toISOString(),
          interventions: [],
          createdBy: user.uid
        } as any;
        await setDoc(doc(db, 'records', id), newRecord);
      }
      setActiveTab('dashboard');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'records');
    }
  };

  const handleEdit = (record: MaintenanceRecord) => {
    setEditingRecord(record);
    setActiveTab('add');
  };

  const deleteArchivedDoc = (id: string) => {
    setDeleteConfirmData({ type: 'archive', count: 1, ids: [id] });
  };

  const toggleDocSelection = (id: string) => {
    setSelectedDocIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    if (selectedDocIds.size === filteredDocs.length && filteredDocs.length > 0) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(filteredDocs.map(d => d.id)));
    }
  };

  const deleteSelectedArchives = () => {
    const idsToDelete = Array.from(selectedDocIds);
    if (idsToDelete.length === 0) return;
    setDeleteConfirmData({ type: 'archive', count: idsToDelete.length, ids: idsToDelete });
  };

  const confirmDeletion = async () => {
    if (!deleteConfirmData || !user) return;
    const { type, ids, recordId } = deleteConfirmData;

    try {
      if (type === 'archive') {
        const batch = writeBatch(db);
        ids.forEach(id => batch.delete(doc(db, 'archives', id)));
        await batch.commit();
        setSelectedDocIds(prev => {
          const next = new Set(prev);
          ids.forEach(id => next.delete(id));
          return next;
        });
        if (docSearch.trim()) setDocSearch('');
      } else if (type === 'intervention' && recordId) {
        const record = records.find(r => r.id === recordId);
        if (record) {
          const updatedInterventions = record.interventions.filter(i => !ids.includes(i.id));
          await updateDoc(doc(db, 'records', recordId), { interventions: updatedInterventions });
        }
      } else if (type === 'machine') {
        const batch = writeBatch(db);
        ids.forEach(id => batch.delete(doc(db, 'records', id)));
        await batch.commit();
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, type === 'archive' ? 'archives' : 'records');
    }

    setDeleteConfirmData(null);
  };

  const clearFilteredArchives = () => {
    const count = filteredDocs.length;
    if (count === 0) return;
    const filteredIds = filteredDocs.map(d => d.id);
    setDeleteConfirmData({ type: 'archive', count, ids: filteredIds });
  };

  const archiveDocument = async (type: 'quote' | 'invoice', record: MaintenanceRecord) => {
    if (!user) return;

    const oilTotal = record.oilQuantity * record.oilPrice;
    const oilFilterPrice = record.oilFilterPrice > 0 ? record.oilFilterPrice : 0;
    const fuelFilterPrice = record.fuelFilterPrice > 0 ? record.fuelFilterPrice : 0;
    const airFilterPrice = record.airFilterPrice > 0 ? record.airFilterPrice : 0;
    const separatorPrice = record.separatorPrice && record.separatorPrice > 0 ? record.separatorPrice : 0;
    const laborPrice = record.laborPrice || 0;
    
    const totalHT = oilFilterPrice + fuelFilterPrice + airFilterPrice + separatorPrice + oilTotal + laborPrice;
    
    const id = crypto.randomUUID();
    const newDoc: ArchivedDocument = {
      id,
      docNumber: `${type.toUpperCase()}-${record.id.slice(0, 4)}-${Date.now().toString().slice(-4)}`,
      type,
      date: new Date().toISOString(),
      customerName: record.customerName,
      clientEmail: record.clientEmail,
      model: record.model,
      totalAmount: totalHT,
      recordSnapshot: JSON.parse(JSON.stringify(record)),
      createdBy: user.uid
    } as any;

    try {
      await setDoc(doc(db, 'archives', id), newDoc);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'archives');
    }
  };

  const handleShowPreview = (type: 'quote' | 'invoice' | 'history' | 'sticker' | 'print', record: MaintenanceRecord, skipArchive: boolean = false) => {
    if (type === 'sticker') {
      setPreviewDoc({ type: 'history', record });
      setTimeout(() => triggerStickerPrint(record.customerName), 100);
      return;
    }
    if (type === 'print') {
      setPreviewDoc({ type: record.interventions.length > 0 ? 'invoice' : 'quote', record });
      return;
    }
    if (!skipArchive && (type === 'quote' || type === 'invoice')) {
      archiveDocument(type, record);
    }
    setPreviewDoc({ type: type as any, record });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBlankQuote = () => {
    const dummyRecord: MaintenanceRecord = {
      id: `DEVIS-${Date.now().toString().slice(-6)}`,
      customerName: 'Client non spécifié',
      model: 'Projet non enregistré',
      capacity: '0 KVA',
      currentIndex: 0,
      lastChangeIndex: 0,
      nextChangeIndex: 250,
      lastChangeDate: new Date().toISOString(),
      dailyHours: 0,
      oilFilterRef: '',
      oilFilterPrice: 0,
      fuelFilterRef: '',
      fuelFilterPrice: 0,
      airFilterRef: '',
      airFilterPrice: 0,
      separatorRef: '',
      separatorPrice: 0,
      oilRef: '',
      oilQuantity: 0,
      oilPrice: 0,
      laborPrice: 0,
      interventions: [],
      site: '',
      clientEmail: '',
      lastBeltChangeIndex: 0,
      nextBeltChangeIndex: 1000,
      lastUpdateDate: new Date().toISOString(),
      dynamicItems: {
        headers: ['N°', 'Descriptions', 'Quantités', 'Prix Unitaires (FCFA)', 'Prix Total (FCFA)'],
        rows: [
          [1, 'Modules Photovoltaïques', 0, 0, 0],
          [2, 'Batteries de Stockage', 0, 0, 0],
          [3, 'Onduleur & Conversion', 0, 0, 0]
        ]
      }
    };
    setBlankRecord(dummyRecord);
    setPreviewDoc({ type: 'blank_quote', record: dummyRecord });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      if (data.length > 1) {
        // Column A: Nom du Client
        // Column B onwards: Dynamic columns
        const headers = data[0].slice(1); // Row 1, Column B onwards
        const customerName = data[1][0] || blankRecord?.customerName;
        const rows = data.slice(1).map(row => row.slice(1)); // Row 2 onwards, Column B onwards

        const updatedRecord: MaintenanceRecord = {
          ...blankRecord!,
          customerName: customerName,
          dynamicItems: {
            headers: headers,
            rows: rows
          }
        };
        setBlankRecord(updatedRecord);
        setPreviewDoc({ type: 'blank_quote', record: updatedRecord });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDirectPrint = (doc: ArchivedDocument) => {
    setPreviewDoc({ type: doc.type, record: doc.recordSnapshot });
    setTimeout(() => {
      triggerPrint(doc.type, doc.customerName);
    }, 500);
  };

  const handleAddIntervention = async (recordId: string, intervention: Omit<Intervention, 'id'>) => {
    if (!user) return;

    const record = records.find(r => r.id === recordId);
    if (!record) return;

    const fullIntervention: Intervention = { ...intervention, id: crypto.randomUUID() };
    const isVidange = intervention.type === 'Vidange Complete' || intervention.type === 'Vidange Partiale';
    const isCourroie = intervention.type === 'Courroie';
    
    try {
      const batch = writeBatch(db);

      // Stock Deduction Logic
      if (isVidange) {
        stock.forEach(item => {
          let newQty = item.quantity;
          if (item.category === 'Huile') newQty = Math.max(0, item.quantity - record.oilQuantity);
          if (item.name.toLowerCase().includes('filtre huile')) newQty = Math.max(0, item.quantity - 1);
          if (item.name.toLowerCase().includes('filtre gasoil')) newQty = Math.max(0, item.quantity - 1);
          
          if (newQty !== item.quantity) {
            batch.update(doc(db, 'stock', item.id), { quantity: newQty });
          }
        });
      }
      if (intervention.type === 'Filtre a Air') {
        const airFilter = stock.find(item => item.name.toLowerCase().includes('filtre air'));
        if (airFilter) {
          batch.update(doc(db, 'stock', airFilter.id), { quantity: Math.max(0, airFilter.quantity - 1) });
        }
      }

      const updatedRecord = {
        ...record,
        interventions: [fullIntervention, ...record.interventions],
        lastChangeIndex: isVidange ? intervention.index : record.lastChangeIndex,
        lastChangeDate: isVidange ? intervention.date : record.lastChangeDate,
        nextChangeIndex: isVidange ? intervention.index + 250 : record.nextChangeIndex,
        lastBeltChangeIndex: isCourroie ? intervention.index : record.lastBeltChangeIndex,
        nextBeltChangeIndex: isCourroie ? intervention.index + 1000 : record.nextBeltChangeIndex,
        currentIndex: Math.max(record.currentIndex, intervention.index),
        lastUpdateDate: new Date().toISOString()
      };

      batch.update(doc(db, 'records', recordId), updatedRecord);
      await batch.commit();

      // Send notification to client
      if (record.clientEmail) {
        const clientId = await getUserIdByEmail(record.clientEmail);
        if (clientId) {
          await sendNotification(
            clientId,
            "Nouvelle Intervention",
            `Une intervention de type "${intervention.type}" a été effectuée sur votre machine ${record.model} (${record.customerName}).`,
            'intervention',
            recordId
          );
          // Also check if maintenance is now approaching (though usually it resets after vidange)
          await checkMaintenanceApproaching(updatedRecord);
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'records');
    }
  };

  const triggerPrint = (docType: string, customer: string) => {
    if (!printRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les fenêtres surgissantes (popups) pour permettre l'impression.");
      return;
    }

    const content = printRef.current.innerHTML;
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(s => s.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docType.toUpperCase()} - ${customer}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
          ${styles}
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
            body { 
              margin: 0; 
              padding: 0; 
              background: white !important;
              font-family: 'Inter', sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-wrapper {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              padding: 15mm;
              background: white;
              position: relative;
              display: flex;
              flex-direction: column;
              box-sizing: border-box;
            }
            @media print {
              body { padding: 0; margin: 0; }
              .print-wrapper {
                width: 210mm;
                height: 297mm;
                margin: 0;
                padding: 15mm;
                box-shadow: none !important;
                border: none !important;
              }
              @page { 
                size: A4;
                margin: 0; 
              }
            }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            ${content}
          </div>
          <script>
            window.onload = () => {
              // Give Tailwind a moment to process the injected HTML
              setTimeout(() => {
                window.print();
                // window.close();
              }, 800);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const triggerStickerPrint = (customer: string) => {
    if (!stickerRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les fenêtres surgissantes (popups) pour permettre l'impression.");
      return;
    }

    const content = stickerRef.current.innerHTML;
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(s => s.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AUTO-COLLANTS - ${customer}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          ${styles}
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
            body { 
              margin: 0; 
              padding: 0; 
              background: white !important;
              font-family: 'Inter', sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .sticker-page {
              width: 210mm;
              height: 297mm;
              margin: 0 auto;
              padding: 10mm;
              display: grid;
              grid-template-columns: 1fr 1fr;
              grid-template-rows: 1fr 1fr;
              gap: 10mm;
              box-sizing: border-box;
            }
            @media print {
              body { padding: 0; margin: 0; }
              .sticker-page {
                width: 210mm;
                height: 297mm;
                margin: 0;
                padding: 10mm;
              }
              @page { 
                size: A4;
                margin: 0; 
              }
            }
          </style>
        </head>
        <body>
          <div class="sticker-page">
            ${content}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 800);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (previewDoc) {
    const { record, type } = previewDoc;
    const isBlank = type === 'blank_quote';
    const isHistory = type === 'history';
    
    let totalHT = 0;
    let oilTotal = 0;
    if (isBlank && record.dynamicItems) {
      record.dynamicItems.rows.forEach(row => {
        const lastVal = row[row.length - 1];
        if (typeof lastVal === 'number') {
          totalHT += lastVal;
        } else if (typeof lastVal === 'string') {
          const num = parseFloat(lastVal.replace(/[^0-9.]/g, ''));
          if (!isNaN(num)) totalHT += num;
        }
      });
    } else {
      oilTotal = record.oilQuantity * record.oilPrice;
      const oilFilterPrice = record.oilFilterPrice > 0 ? record.oilFilterPrice : 0;
      const fuelFilterPrice = record.fuelFilterPrice > 0 ? record.fuelFilterPrice : 0;
      const airFilterPrice = record.airFilterPrice > 0 ? record.airFilterPrice : 0;
      const separatorPrice = record.separatorPrice && record.separatorPrice > 0 ? record.separatorPrice : 0;
      const laborPrice = record.laborPrice || 0;
      totalHT = oilFilterPrice + fuelFilterPrice + airFilterPrice + separatorPrice + oilTotal + laborPrice;
    }

    const docTitle = isHistory ? 'Historique' : type === 'invoice' ? 'Facture' : 'Devis';
    
    return (
      <div className="min-h-screen bg-slate-900 md:p-10 flex flex-col items-center print:bg-white print:p-0 print:block">
        <div className="w-full max-w-4xl flex items-center justify-between mb-8 bg-white/5 p-4 rounded-2xl border border-white/10 print:hidden overflow-x-auto gap-4 relative z-50">
          <button 
            onClick={() => setPreviewDoc(null)}
            className="flex items-center space-x-3 px-6 py-3 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all shrink-0"
          >
            <i className="fas fa-arrow-left"></i>
            <span>RETOUR</span>
          </button>
          
          <div className="text-white text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap">
            {isBlank ? 'Devis Vierge' : docTitle} Technique
          </div>

          <div className="flex space-x-3">
            {isBlank && (
              <div className="flex space-x-2">
                <button 
                  onClick={() => setShowAddMaterialModal(true)}
                  className="flex items-center space-x-3 px-6 py-3 bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shrink-0"
                >
                  <i className="fas fa-plus"></i>
                  <span>AJOUTER MATÉRIEL</span>
                </button>
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    onChange={handleExcelImport}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <button className="flex items-center space-x-3 px-6 py-3 bg-amber-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shrink-0">
                    <i className="fas fa-file-excel"></i>
                    <span>IMPORTER EXCEL</span>
                  </button>
                </div>
              </div>
            )}
            {!isHistory && (
              <button 
                onClick={() => triggerPrint(isBlank ? 'quote' : type, record.customerName)}
                className="flex items-center space-x-3 px-6 py-3 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shrink-0"
              >
                <i className="fas fa-file-pdf"></i>
                <span>TÉLÉCHARGER PDF</span>
              </button>
            )}
            <button 
              onClick={() => triggerPrint(isBlank ? 'quote' : type, record.customerName)}
              className="flex items-center space-x-3 px-6 py-3 bg-[#2185D0] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#1a6fb0] transition-all shadow-lg shrink-0"
            >
              <i className="fas fa-print"></i>
              <span>IMPRIMER</span>
            </button>
            <button 
              onClick={() => triggerStickerPrint(record.customerName)}
              className="flex items-center space-x-3 px-6 py-3 bg-amber-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shrink-0"
            >
              <i className="fas fa-sticky-note"></i>
              <span>AUTO-COLLANT</span>
            </button>
          </div>
        </div>

        <div ref={printRef} className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-2xl overflow-hidden font-sans text-slate-900 border border-slate-200 rounded-sm p-8 md:p-12 relative print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full print:min-h-0 print:overflow-visible flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white border-2 border-[#2185D0] rounded-full flex items-center justify-center text-[#2185D0]">
                <svg viewBox="0 0 100 100" className="w-8 h-8" fill="currentColor">
                  <path d="M50 10 L15 65 H40 L30 90 L85 35 H60 L70 10 Z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight leading-none text-[#2185D0]">BREL <span className="text-[#2185D0]">ENERGIE</span></h1>
                <p className="text-[9px] font-bold text-[#2185D0] mt-1 uppercase tracking-widest italic">NOTRE EXPERTISE, VOTRE SOLUTION</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end text-[#2185D0] font-black text-sm">
                <i className="fas fa-phone-alt mr-2 text-xs"></i>
                <span>+242 053379797</span>
              </div>
              <p className="text-slate-500 font-bold text-[9px] mt-0.5">juniorobindi@gmail.com</p>
              <p className="text-slate-400 font-black uppercase text-[8px] tracking-widest mt-0.5">ÉDITÉ LE: {new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          <div className="w-full h-1 bg-[#2185D0] mb-8"></div>

          {/* Title Section */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-black uppercase underline underline-offset-4 text-[#101828]">
              {type === 'history' ? "HISTORIQUE D'INTERVENTIONS" : type === 'invoice' ? 'FACTURE' : 'DEVIS'} N° {record.id.slice(0, 8).toUpperCase()}
            </h2>
            <p className="mt-2 text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">DOSSIER MACHINE: {record.id.slice(0, 12).toUpperCase()}</p>
          </div>

          {/* Info Box */}
          {isBlank ? (
            <div className="mb-4 border-2 border-[#2185D0] rounded-[1.5rem] p-6 relative">
              <div className="grid grid-cols-1 gap-2 mt-2">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-black text-[#101828] w-24 uppercase">PROJET:</span>
                  <input 
                    type="text" 
                    value={record.model} 
                    onChange={(e) => {
                      const updated = { ...record, model: e.target.value };
                      setBlankRecord(updated);
                      setPreviewDoc({ type: 'blank_quote', record: updated });
                    }}
                    className="flex-1 bg-transparent border-none p-0 text-sm font-medium text-slate-600 focus:ring-0 print:border-none"
                    placeholder="Projet non enregistré"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-black text-[#101828] w-24 uppercase">CLIENT:</span>
                  <input 
                    type="text" 
                    value={record.customerName} 
                    onChange={(e) => {
                      const updated = { ...record, customerName: e.target.value };
                      setBlankRecord(updated);
                      setPreviewDoc({ type: 'blank_quote', record: updated });
                    }}
                    className="flex-1 bg-transparent border-none p-0 text-sm font-medium text-slate-600 focus:ring-0 print:border-none"
                    placeholder="Client non spécifié"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-0 mb-8 border border-slate-200 rounded-[2rem] overflow-hidden">
              <div className="p-8 border-r border-slate-200">
                <div className="mb-4">
                  <p className="text-[9px] font-black text-[#2185D0] uppercase tracking-widest mb-1">CLIENT PROPRIÉTAIRE</p>
                  <p className="text-xl font-black text-slate-900 capitalize">{record.customerName.toLowerCase()}</p>
                </div>
                
                <div className="w-full h-px bg-slate-100 mb-4"></div>
                <div className="flex space-x-16">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">PUISSANCE</p>
                    <p className="text-sm font-black text-slate-900">{record.capacity}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">HEURES ACTUELLES</p>
                    <p className="text-sm font-black text-slate-900">{record.currentIndex} H</p>
                  </div>
                </div>
              </div>
              <div className="p-8 flex flex-col justify-start items-end text-right">
                <p className="text-[9px] font-black text-[#2185D0] uppercase tracking-widest mb-1">MODÈLE / SÉRIE</p>
                <p className="text-2xl font-black uppercase text-slate-900">{record.model}</p>
              </div>
            </div>
          )}

          {/* Table */}
          {isBlank && record.dynamicItems ? (
            <div className="mb-4">
              <p className="text-sm font-black text-slate-900 mb-1">Doit pour ce qui suit:</p>
              <div className="rounded-xl overflow-hidden border border-[#2185D0]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#2185D0] text-white text-[10px] font-black uppercase tracking-widest">
                      {record.dynamicItems.headers.map((header, i) => (
                        <th key={i} className={`py-1.5 px-4 border-r border-white/20 last:border-r-0 ${i === 0 ? 'w-12 text-center' : i === 1 ? 'w-1/3' : 'text-center'}`}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {record.dynamicItems.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="text-[11px] font-bold text-slate-900 hover:bg-slate-50 transition-colors group">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className={`py-1.5 px-4 border-r border-slate-200 last:border-r-0 ${cellIndex === 0 ? 'text-center font-black text-slate-400' : cellIndex === 1 ? 'font-black' : 'text-center'}`}>
                            {cellIndex === 0 ? (
                              cell
                            ) : cellIndex === 4 ? (
                              formatNumber(cell)
                            ) : (
                              <input 
                                type={cellIndex >= 2 ? "number" : "text"}
                                value={cell}
                                onChange={(e) => handleUpdateCell(rowIndex, cellIndex, cellIndex >= 2 ? Number(e.target.value) : e.target.value)}
                                className={`w-full bg-transparent border-none p-0 font-bold focus:ring-0 print:border-none ${cellIndex === 1 ? 'text-left' : 'text-center'}`}
                              />
                            )}
                            {isBlank && cellIndex === 1 && (
                              <button 
                                onClick={() => setRowToDelete(rowIndex)}
                                className="ml-2 opacity-0 group-hover:opacity-100 text-red-500 print:hidden"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#2185D0] text-white">
                      <td colSpan={record.dynamicItems.headers.length - 1} className="py-1.5 px-4 text-sm font-black uppercase tracking-widest pl-8">
                        TOTAL GÉNÉRAL
                      </td>
                      <td className="py-1.5 px-4 text-right text-sm font-black pr-8">
                        {formatNumber(totalHT)} FCFA
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : !isHistory ? (
            <div className="mb-8">
              <div className="rounded-xl overflow-hidden border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#101828] text-white text-[9px] font-black uppercase tracking-widest">
                      <th className="p-3 pl-4">DÉSIGNATION</th>
                      <th className="p-3 text-center">RÉF</th>
                      <th className="p-3 text-center">QTÉ / LITRES</th>
                      <th className="p-3 text-center">UNIT.</th>
                      <th className="p-3 pr-4 text-right">TOTAL HT (FCFA)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(record.oilFilterPrice > 0 || isBlank) && (
                      <tr className="text-[11px] font-bold text-slate-900">
                        <td className="p-4 pl-4 uppercase font-black">Filtre à Huile</td>
                        <td className="p-4 text-center text-slate-500">{record.oilFilterRef || '-'}</td>
                        <td className="p-4 text-center">1</td>
                        <td className="p-4 text-center">{formatNumber(record.oilFilterPrice)}</td>
                        <td className="p-4 pr-4 text-right font-black">{formatNumber(record.oilFilterPrice)}</td>
                      </tr>
                    )}
                    {(record.fuelFilterPrice > 0 || isBlank) && (
                      <tr className="text-[11px] font-bold text-slate-900">
                        <td className="p-4 pl-4 uppercase font-black">Filtre à Gasoil</td>
                        <td className="p-4 text-center text-slate-500">{record.fuelFilterRef || '-'}</td>
                        <td className="p-4 text-center">1</td>
                        <td className="p-4 text-center">{formatNumber(record.fuelFilterPrice)}</td>
                        <td className="p-4 pr-4 text-right font-black">{formatNumber(record.fuelFilterPrice)}</td>
                      </tr>
                    )}
                    {(record.airFilterPrice > 0 || isBlank) && (
                      <tr className="text-[11px] font-bold text-slate-900">
                        <td className="p-4 pl-4 uppercase font-black">Filtre à Air</td>
                        <td className="p-4 text-center text-slate-500">{record.airFilterRef || '-'}</td>
                        <td className="p-4 text-center">1</td>
                        <td className="p-4 text-center">{formatNumber(record.airFilterPrice)}</td>
                        <td className="p-4 pr-4 text-right font-black">{formatNumber(record.airFilterPrice)}</td>
                      </tr>
                    )}
                    {(record.separatorPrice > 0 || isBlank) && (
                      <tr className="text-[11px] font-bold text-slate-900">
                        <td className="p-4 pl-4 uppercase font-black">Décompteur</td>
                        <td className="p-4 text-center text-slate-500">{record.separatorRef || '-'}</td>
                        <td className="p-4 text-center">1</td>
                        <td className="p-4 text-center">{formatNumber(record.separatorPrice)}</td>
                        <td className="p-4 pr-4 text-right font-black">{formatNumber(record.separatorPrice)}</td>
                      </tr>
                    )}
                    {(record.oilPrice > 0 || isBlank) && (
                      <tr className="text-[11px] font-bold text-slate-900">
                        <td className="p-4 pl-4 uppercase font-black">Huile Moteur Haute Performance</td>
                        <td className="p-4 text-center text-slate-500">{record.oilRef || '-'}</td>
                        <td className="p-4 text-center">{record.oilQuantity}</td>
                        <td className="p-4 text-center">{formatNumber(record.oilPrice)}</td>
                        <td className="p-4 pr-4 text-right font-black">{formatNumber(oilTotal)}</td>
                      </tr>
                    )}
                    <tr className="text-[11px] font-bold text-slate-900 bg-slate-50/80">
                      <td className="p-4 pl-4 uppercase font-black">MAIN D'OEUVRE</td>
                      <td className="p-4 text-center text-slate-500">Service</td>
                      <td className="p-4 text-center">1</td>
                      <td className="p-4 text-center font-black">{formatNumber(record.laborPrice)}</td>
                      <td className="p-4 pr-4 text-right font-black">{formatNumber(record.laborPrice)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Totals */}
              <div className="mt-8 flex flex-col items-end">
                <div className="w-full max-w-[320px] border-t-2 border-slate-900 pt-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MONTANT TOTAL HT</span>
                    <span className="font-black text-sm text-slate-900">{formatNumber(totalHT)} FCFA</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base font-black text-slate-900 italic">NET À PAYER</span>
                    <span className="font-black text-base text-slate-900">{formatNumber(totalHT)} FCFA</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <h3 className="text-[10px] font-black text-[#2185D0] uppercase tracking-[0.2em] mb-4 border-b-2 border-[#2185D0] inline-block">Tableau de Bord des Interventions</h3>
              <div className="space-y-3">
                {record.interventions.map((int, i) => (
                  <div key={int.id} className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between bg-white shadow-sm">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-[#101828] rounded-xl flex items-center justify-center text-white text-[10px] font-black mono italic">{int.index}h</div>
                      <div>
                        <p className="text-xs font-black text-[#101828] uppercase italic">{int.type}</p>
                        <p className="text-[9px] text-slate-400 font-bold tracking-tight mt-0.5">{new Date(int.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-emerald-500 uppercase italic">Opération Validée</p>
                       <p className="text-[8px] text-slate-300 font-medium max-w-[150px] truncate">{int.details || 'Aucune observation'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto pt-8 px-2">
            <div className="flex justify-between items-end">
              <div className="space-y-1 pb-4">
                <p className="text-[8px] font-medium text-slate-400 italic">• Document généré par BREL Maintenance Core v5.0.</p>
                <p className="text-[8px] font-medium text-slate-400 italic">• Traçabilité complète des interventions certifiée.</p>
              </div>

              <div className="text-center pr-4">
                <p className="text-[9px] font-black uppercase text-[#2185D0] mb-2 tracking-widest italic">DIRECTION TECHNIQUE BREL</p>
                <div className="relative flex items-center justify-center h-24 transition-transform">
                   <svg viewBox="0 0 200 120" className="w-full h-full text-[#2185D0]/60">
                      <ellipse cx="100" cy="60" rx="95" ry="55" fill="none" stroke="currentColor" strokeWidth="2" />
                      <ellipse cx="100" cy="60" rx="90" ry="50" fill="none" stroke="currentColor" strokeWidth="0.5" />
                      <text x="100" y="32" textAnchor="middle" className="text-[8px] font-black uppercase tracking-[0.2em]" fill="currentColor">BREL ENERGIE</text>
                      <g transform="translate(15, 52)">
                        <svg viewBox="0 0 100 100" width="14" height="14" className="text-current">
                          <path fill="currentColor" d="M50 10 L15 65 H40 L30 90 L85 35 H60 L70 10 Z" />
                        </svg>
                      </g>
                      <text x="100" y="68" textAnchor="middle" className="text-[16px] font-black uppercase tracking-widest italic" fill="currentColor">DIRECTION</text>
                      <g transform="translate(170, 52)">
                        <svg viewBox="0 0 100 100" width="14" height="14" className="text-current">
                          <path fill="currentColor" d="M50 10 L15 65 H40 L30 90 L85 35 H60 L70 10 Z" />
                        </svg>
                      </g>
                      <text x="100" y="98" textAnchor="middle" className="text-[8px] font-black" fill="currentColor">+242 053379797</text>
                   </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden Sticker Sheet Template */}
        <div className="hidden">
          <div ref={stickerRef}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border-2 border-slate-200 p-6 flex flex-col bg-white h-full relative">
                {/* Header with Logo - Identical to Invoice */}
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white border-2 border-[#2185D0] rounded-full flex items-center justify-center text-[#2185D0]">
                      <svg viewBox="0 0 100 100" className="w-6 h-6" fill="currentColor">
                        <path d="M50 10 L15 65 H40 L30 90 L85 35 H60 L70 10 Z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-lg font-black uppercase tracking-tight leading-none">
                        <span className="text-slate-900">BREL</span> <span className="text-[#2185D0]">ENERGIE</span>
                      </h1>
                      <p className="text-[7px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest italic">NOTRE EXPERTISE, VOTRE SOLUTION</p>
                    </div>
                  </div>
                </div>

                {/* Section 1: Last Visit */}
                <div className="mb-6">
                  <h3 className="text-sm font-black text-slate-900 uppercase border-b-2 border-slate-900 pb-1 mb-3">
                    DERNIERE VIDANGE / LAST VISIT
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-end">
                      <span className="text-[10px] font-black text-slate-900 uppercase whitespace-nowrap mr-2">DATE</span>
                      <div className="flex-1 border-b border-dotted border-slate-400 h-4"></div>
                    </div>
                    <div className="flex items-end">
                      <span className="text-[10px] font-black text-slate-900 uppercase whitespace-nowrap mr-2">HEURES</span>
                      <div className="flex-1 border-b border-dotted border-slate-400 h-4"></div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-[10px] font-black text-slate-900 uppercase whitespace-nowrap mr-2 mt-1">TRAVAUX</span>
                      <div className="flex-1 border-b border-dotted border-slate-400 min-h-[20px]"></div>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                      {['Filtre à huile', 'Filtre à gasoil', 'Filtre à air', 'Courroie', 'Huile', 'AVR', 'Liquide de refroidissement', 'Sécurité'].map(item => (
                        <div key={item} className="flex items-center space-x-1">
                          <div className="w-2.5 h-2.5 border border-slate-400"></div>
                          <span className="text-[7px] font-bold text-slate-600 uppercase">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 2: Next Visit */}
                <div className="mt-auto">
                  <h3 className="text-sm font-black text-slate-900 uppercase border-b-2 border-slate-900 pb-1 mb-3">
                    PROCHAINE VIDANGE / NEXT VISIT
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-end">
                      <span className="text-[10px] font-black text-slate-900 uppercase whitespace-nowrap mr-2">DATE ESTIMEE</span>
                      <div className="flex-1 border-b border-dotted border-slate-400 h-4 flex items-center px-2">
                        <span className="text-[11px] font-black text-[#2185D0] italic">{calculateMaintenanceStatus(record).projectedDate}</span>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <span className="text-[10px] font-black text-slate-900 uppercase whitespace-nowrap mr-2">HEURES</span>
                      <div className="flex-1 border-b border-dotted border-slate-400 h-4 flex items-center px-2">
                        <span className="text-[11px] font-black text-slate-900">{record.nextChangeIndex} H</span>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <span className="text-[10px] font-black text-slate-900 uppercase whitespace-nowrap mr-2">NOM</span>
                      <div className="flex-1 border-b border-dotted border-slate-400 h-4"></div>
                    </div>
                  </div>
                </div>

                {/* Footer Contact */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic">Expertise Brel Energie</p>
                  <p className="text-[10px] font-black text-[#2185D0]">+242 05 337 97 97</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Material Modal */}
        {showAddMaterialModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Ajouter Matériel</h3>
                <button onClick={() => setShowAddMaterialModal(false)} className="text-slate-400 hover:text-slate-600">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                  <input 
                    type="text"
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#2185D0] transition-all"
                    placeholder="ex: Modules Photovoltaïques"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quantité</label>
                    <input 
                      type="number"
                      value={newMaterial.quantity}
                      onChange={(e) => setNewMaterial({...newMaterial, quantity: parseInt(e.target.value) || 0})}
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#2185D0] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Prix Unitaire (FCFA)</label>
                    <input 
                      type="number"
                      value={newMaterial.price}
                      onChange={(e) => setNewMaterial({...newMaterial, price: parseInt(e.target.value) || 0})}
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#2185D0] transition-all"
                    />
                  </div>
                </div>
                
                <button 
                  onClick={handleAddMaterial}
                  className="w-full py-5 bg-[#2185D0] text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-[#1a6fb0] transition-all shadow-xl shadow-blue-100 mt-4"
                >
                  Ajouter au devis
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Row Confirmation Modal */}
        {rowToDelete !== null && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-slate-100 p-8 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center text-3xl mb-6 mx-auto">
                <i className="fas fa-trash-alt"></i>
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Supprimer la ligne ?</h3>
              <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                Êtes-vous sûr de vouloir supprimer ce matériel du devis ? Cette action est irréversible.
              </p>
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={confirmDeleteRow}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                >
                  Oui, Supprimer
                </button>
                <button 
                  onClick={() => setRowToDelete(null)}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!isAuthReady || (user && !appUser)) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="w-16 h-16 border-4 border-white/20 border-t-[#2185D0] rounded-full animate-spin mb-6"></div>
        <h1 className="text-xl font-black uppercase tracking-wider mb-2">BREL ENERGIE</h1>
        <p className="text-slate-400 font-medium mb-6">Chargement du profil sécurisé...</p>

        <div className="mb-6 w-full max-w-xs">
          <button 
            onClick={handleDemoLogin}
            className="w-full py-4 bg-[#2185D0] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#1a6fb0] transition-all shadow-xl shadow-blue-900/50 flex items-center justify-center space-x-2"
          >
            <i className="fas fa-bolt"></i>
            <span>Accès Direct Dashboard (Mode Démo)</span>
          </button>
        </div>
        
        {authSyncError && (
          <div className="bg-red-950/40 border border-red-900/50 p-4 rounded-2xl max-w-sm text-center mb-6">
            <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Détails de l'erreur</p>
            <p className="text-[10px] text-slate-300 font-medium break-words leading-relaxed">{authSyncError}</p>
          </div>
        )}

        {user && (
          <div className="mt-4 text-center space-y-4 max-w-xs">
            <p className="text-xs text-slate-500 leading-relaxed">
              Si le chargement est bloqué, vous pouvez forcer l'accès en mode autonome ou essayer de vous reconnecter.
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => {
                  const fallbackUser: AppUser = {
                    uid: user.uid,
                    email: user.email || '',
                    displayName: user.displayName || user.email?.split('@')[0] || 'Utilisateur',
                    photoURL: user.photoURL || '',
                    role: user.email === 'juniorobindi@gmail.com' ? 'admin' : 'client',
                    createdAt: new Date().toISOString(),
                    lastActive: new Date().toISOString()
                  };
                  setAppUser(fallbackUser);
                  setIsAuthReady(true);
                }}
                className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-xs font-black uppercase tracking-wider rounded-xl transition-all border border-slate-700/60 shadow-lg shadow-black/20"
              >
                Forcer l'accès
              </button>
              <button 
                onClick={() => logout()}
                className="px-4 py-2 bg-red-950/40 hover:bg-red-950/60 text-red-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all border border-red-900/40"
              >
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {!user ? (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full text-center border border-slate-100">
            <div className="w-20 h-20 bg-[#2185D0] rounded-3xl flex items-center justify-center text-white text-3xl mb-8 mx-auto shadow-xl shadow-[#2185D0]/20">
              <i className="fas fa-bolt"></i>
            </div>
            <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tight mb-2">BREL <span className="text-[#2185D0]">ENERGIE</span></h1>
            <p className="text-slate-500 font-medium mb-6">Accédez à votre base de données de maintenance sécurisée.</p>
            
            <div className="mb-6">
              <button 
                onClick={handleDemoLogin}
                className="w-full py-4 bg-[#2185D0] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#1a6fb0] transition-all shadow-xl shadow-blue-200 flex items-center justify-center space-x-2"
              >
                <i className="fas fa-bolt"></i>
                <span>Accès Direct Dashboard (Mode Démo)</span>
              </button>
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1 h-px bg-slate-100"></div>
              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Ou connexion classique</span>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>

            <form onSubmit={handleAuth} className="space-y-4 mb-8">
              <div className="text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">Adresse Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-[#2185D0]/20 transition-all"
                />
              </div>
              <div className="text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">Mot de passe</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-[#2185D0]/20 transition-all"
                />
                {!isRegistering && (
                  <button 
                    type="button"
                    onClick={() => setAuthError("En cas d'oubli, veuillez contacter l'administrateur pour réinitialiser votre mot de passe.")}
                    className="text-[8px] font-black text-slate-400 uppercase tracking-widest hover:text-[#2185D0] transition-colors mt-2 ml-4"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              
              {authError && (
                <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest bg-red-50 p-3 rounded-xl border border-red-100">
                  {authError}
                </p>
              )}
              
              <button 
                type="submit"
                disabled={authLoading}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50"
              >
                {authLoading ? 'Chargement...' : (isRegistering ? 'Créer mon compte' : 'Se connecter')}
              </button>
            </form>

            <div className="flex flex-col space-y-4">
              <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#2185D0] transition-colors"
              >
                {isRegistering ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\'enregistrer'}
              </button>

              <div className="flex items-center space-x-4">
                <div className="flex-1 h-px bg-slate-100"></div>
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Ou continuer avec</span>
                <div className="flex-1 h-px bg-slate-100"></div>
              </div>

              <button 
                onClick={handleGoogleLogin}
                disabled={authLoading}
                className="w-full py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
              >
                <i className="fab fa-google text-lg"></i>
                <span>Google</span>
              </button>

              <button 
                onClick={() => {
                  const demoUser: AppUser = {
                    uid: 'demo_admin_uid',
                    email: 'juniorobindi@gmail.com',
                    displayName: 'Junior Obindi (Admin)',
                    photoURL: '',
                    role: 'admin',
                    createdAt: new Date().toISOString(),
                    lastActive: new Date().toISOString()
                  };
                  setUser(demoUser as any);
                  setAppUser(demoUser);
                  setIsAuthReady(true);
                  if (records.length === 0) {
                    setRecords([
                      {
                        id: 'demo-rec-1',
                        customerName: 'SOCOIBTP Congo',
                        clientEmail: 'juniorobindi@gmail.com',
                        model: 'Groupe Électrogène Perkins 250KVA',
                        capacity: '250 KVA',
                        site: 'Brazzaville',
                        oilFilterRef: 'LF16015',
                        fuelFilterRef: 'FF5488',
                        airFilterRef: 'AF25127',
                        oilRef: '15W40 CI-4',
                        lastChangeIndex: 1200,
                        lastChangeDate: '2026-01-15T00:00:00.000Z',
                        nextChangeIndex: 2500,
                        lastBeltChangeIndex: 0,
                        nextBeltChangeIndex: 2000,
                        currentIndex: 2350,
                        dailyHours: 12,
                        oilQuantity: 40,
                        oilPrice: 3500,
                        oilFilterPrice: 15000,
                        fuelFilterPrice: 12000,
                        airFilterPrice: 25000,
                        laborPrice: 50000,
                        interventions: [
                          { id: 'int-1', date: '2026-01-15', index: 1200, type: 'Vidange Complete', details: 'Vidange huile moteur 15W40, remplacement filtres à huile et gasoil.', photoUrl: '', signatureUrl: '' }
                        ],
                        lastUpdateDate: new Date().toISOString()
                      },
                      {
                        id: 'demo-rec-2',
                        customerName: 'Hôtel Ledger Plaza',
                        clientEmail: 'client@ledger.cg',
                        model: 'Cummins QSK50 1000KVA',
                        capacity: '1000 KVA',
                        site: 'Pointe-Noire',
                        oilFilterRef: 'LF9009',
                        fuelFilterRef: 'FS19765',
                        airFilterRef: 'AF26158',
                        oilRef: '15W40 Premium',
                        lastChangeIndex: 5000,
                        lastChangeDate: '2025-11-10T00:00:00.000Z',
                        nextChangeIndex: 5500,
                        lastBeltChangeIndex: 0,
                        nextBeltChangeIndex: 3000,
                        currentIndex: 5480,
                        dailyHours: 18,
                        oilQuantity: 120,
                        oilPrice: 4000,
                        oilFilterPrice: 35000,
                        fuelFilterPrice: 28000,
                        airFilterPrice: 65000,
                        laborPrice: 150000,
                        interventions: [
                          { id: 'int-2', date: '2025-11-10', index: 5000, type: 'Vidange Complete', details: 'Maintenance préventive majeure 5000h.', photoUrl: '', signatureUrl: '' }
                        ],
                        lastUpdateDate: new Date().toISOString()
                      },
                      {
                        id: 'demo-rec-3',
                        customerName: 'TotalEnergies EP Congo',
                        clientEmail: 'contact@totalenergies.cg',
                        model: 'Volvo Penta TWD1643GE',
                        capacity: '500 KVA',
                        site: 'Dolisie',
                        oilFilterRef: 'VOY-21707133',
                        fuelFilterRef: 'VOY-21380488',
                        airFilterRef: 'VOY-3840003',
                        oilRef: 'VDS-4.5',
                        lastChangeIndex: 3000,
                        lastChangeDate: '2026-02-01T00:00:00.000Z',
                        nextChangeIndex: 4300,
                        lastBeltChangeIndex: 1000,
                        nextBeltChangeIndex: 4000,
                        currentIndex: 3100,
                        dailyHours: 10,
                        oilQuantity: 60,
                        oilPrice: 3800,
                        oilFilterPrice: 20000,
                        fuelFilterPrice: 18000,
                        airFilterPrice: 40000,
                        laborPrice: 80000,
                        interventions: [
                          { id: 'int-3', date: '2026-02-01', index: 3000, type: 'Vidange Partiale', details: 'Contrôle filtres et mise à niveau.', photoUrl: '', signatureUrl: '' }
                        ],
                        lastUpdateDate: new Date().toISOString()
                      }
                    ]);
                  }
                }}
                className="w-full py-4 bg-[#2185D0] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#1a6fb0] transition-all shadow-xl shadow-blue-200 flex items-center justify-center space-x-2"
              >
                <i className="fas fa-bolt"></i>
                <span>Accès Direct Dashboard (Mode Démo)</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <Layout 
          activeTab={activeTab} 
          setActiveTab={(tab) => { 
            setActiveTab(tab); 
            setEditingRecord(null); 
            setPreviewDoc(null);
          }}
          user={user}
          appUser={appUser}
          onLogout={logout}
          notifications={notifications}
          onMarkAsRead={markNotificationAsRead}
        >
          {activeTab === 'dashboard' && (
            <Dashboard 
              records={records} 
              onAddIntervention={handleAddIntervention} 
              onPrint={handleShowPreview} 
              onEdit={handleEdit} 
              appUser={appUser}
              onDelete={async (id) => {
                setDeleteConfirmData({ type: 'machine', count: 1, ids: [id] });
              }}
              onExport={handleExportData}
              onBlankQuote={handleBlankQuote}
            />
          )}
          {activeTab === 'add' && appUser?.role === 'admin' && (
            <MaintenanceForm 
              onSave={handleSave} 
              initialData={editingRecord || undefined} 
            />
          )}
          {activeTab === 'list' && (
            <MaintenanceList 
              records={records} 
              onDelete={async (id) => {
                setDeleteConfirmData({ type: 'machine', count: 1, ids: [id] });
              }}
              onEdit={handleEdit} 
              appUser={appUser}
            />
          )}
          {activeTab === 'planning' && (
            <Planning records={records} />
          )}
          {activeTab === 'map' && (
            <Map 
              records={records} 
              onSelectRecord={(record) => {
                setActiveTab('dashboard');
                // Optional: scroll to the machine or open its details
              }} 
            />
          )}
          {activeTab === 'stock' && (appUser?.role === 'admin' || appUser?.role === 'technician') && (
            <StockManager 
              stock={stock} 
              setStock={async (newStock) => {
                // Handle stock updates via Firestore
                // This is a simplified version, ideally StockManager would call specific update functions
              }} 
            />
          )}
          {activeTab === 'reports' && appUser?.role === 'admin' && (
            <Reports 
              records={records} 
              archivedDocs={archivedDocs} 
              onDeleteDoc={deleteArchivedDoc} 
              onDeleteIntervention={deleteIntervention}
            />
          )}
          {activeTab === 'users' && appUser?.role === 'admin' && (
            <UserManager currentUserEmail={user?.email || ''} />
          )}
          {activeTab === 'profile' && appUser && (
            <UserProfile appUser={appUser} />
          )}
          {activeTab === 'ai-insights' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-[#101828] p-10 rounded-3xl text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-10 opacity-10 text-9xl">
                  <i className="fas fa-brain"></i>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-[#2185D0] rounded-xl flex items-center justify-center">
                      <i className="fas fa-sparkles text-xl"></i>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight italic uppercase">CONSEILS <span className="text-[#2185D0]">PRÉDICTIFS IA</span></h2>
                  </div>
                  <p className="text-slate-400 text-sm font-medium max-w-xl">
                    Analyse avancée de votre parc machines basée sur le régime de fonctionnement quotidien et les cycles de maintenance critiques.
                  </p>
                </div>
              </div>

              <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl min-h-[400px]">
                {loadingAI ? (
                  <div className="h-64 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-[#2185D0] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Consultation de l'expert en cours...</p>
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none">
                    <div className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                      {aiInsight || "Aucune analyse disponible. Ajoutez des machines pour commencer."}
                    </div>
                  </div>
                )}
                {!loadingAI && records.length > 0 && (
                  <button 
                    onClick={async () => {
                      setLoadingAI(true);
                      const advice = await getMaintenanceAdvice(records);
                      setAiInsight(advice);
                      setLoadingAI(false);
                    }}
                    className="mt-10 px-8 py-3 bg-[#2185D0]/10 text-[#2185D0] rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-[#2185D0] hover:text-white transition-all border border-[#2185D0]/20"
                  >
                    Actualiser l'Analyse
                  </button>
                )}
              </div>
            </div>
          )}
          {activeTab === 'documents' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tight">ARCHIVES <span className="text-[#2185D0]">DOCUMENTS</span></h2>
                  <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">Traçabilité complète des pièces et services</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {filteredDocs.length > 0 && (
                    <button 
                      onClick={selectAllFiltered}
                      className="whitespace-nowrap px-4 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all flex items-center space-x-2"
                    >
                      <i className={`fas ${selectedDocIds.size === filteredDocs.length ? 'fa-check-square' : 'fa-square'}`}></i>
                      <span>{selectedDocIds.size === filteredDocs.length ? 'Désélectionner' : 'Tout sélectionner'}</span>
                    </button>
                  )}
                  
                  <div className="relative group flex-1 md:w-80">
                    <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2185D0] transition-colors"></i>
                    <input 
                      type="text" 
                      placeholder="Rechercher..." 
                      className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium shadow-sm focus:ring-4 focus:ring-[#2185D0]/5 focus:border-[#2185D0] transition-all"
                      value={docSearch}
                      onChange={e => setDocSearch(e.target.value)}
                    />
                  </div>

                  {appUser?.role === 'admin' && (
                    selectedDocIds.size > 0 ? (
                      <button 
                        onClick={deleteSelectedArchives}
                        className="whitespace-nowrap px-6 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all flex items-center space-x-2 shadow-lg shadow-red-200 animate-in zoom-in duration-200"
                      >
                        <i className="fas fa-trash-alt"></i>
                        <span>Supprimer ({selectedDocIds.size})</span>
                      </button>
                    ) : (
                      archivedDocs.length > 0 && (
                        <button 
                          onClick={clearFilteredArchives}
                          className={`whitespace-nowrap px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center space-x-2 ${
                            docSearch.trim() ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                        >
                          <i className="fas fa-trash-alt"></i>
                          <span>{docSearch.trim() ? 'Vider résultats' : 'Vider archives'}</span>
                        </button>
                      )
                    )
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocs.length > 0 ? filteredDocs.map(doc => (
                  <div 
                    key={doc.id} 
                    onClick={() => toggleDocSelection(doc.id)}
                    className={`bg-white p-6 rounded-2xl border transition-all group relative cursor-pointer ${
                      selectedDocIds.has(doc.id) ? 'border-[#2185D0] ring-4 ring-[#2185D0]/5 shadow-lg scale-[1.02]' : 'border-slate-100 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="absolute top-4 right-4 z-10">
                      <div 
                        className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                          selectedDocIds.has(doc.id) 
                            ? 'bg-[#2185D0] border-[#2185D0] text-white shadow-lg shadow-[#2185D0]/20' 
                            : 'bg-white border-slate-200 text-transparent group-hover:border-[#2185D0]/30'
                        }`}
                      >
                        <i className="fas fa-check text-xs"></i>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-4 pr-10">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        doc.type === 'invoice' ? 'bg-emerald-50 text-emerald-600' : 'bg-[#2185D0]/5 text-[#2185D0]'
                      }`}>
                        {doc.type === 'invoice' ? 'Facture' : 'Devis'}
                      </span>
                      <span className="text-[9px] font-bold text-slate-300 italic">{new Date(doc.date).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 uppercase mb-1 truncate">{doc.customerName}</h3>
                    <p className="text-[10px] font-bold text-slate-400 mb-6">{doc.docNumber}</p>
                    <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                      <p className="text-sm font-black text-slate-900">{formatNumber(doc.totalAmount)} FCFA</p>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleShowPreview(doc.type, doc.recordSnapshot, true)}
                          className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#2185D0] hover:bg-white border border-transparent hover:border-slate-100 transition-all"
                          title="Voir le document"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button 
                          onClick={() => handleDirectPrint(doc)}
                          className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-white border border-transparent hover:border-slate-100 transition-all"
                          title="Imprimer directement"
                        >
                          <i className="fas fa-print"></i>
                        </button>
                        {appUser?.role === 'admin' && (
                          <button 
                            onClick={() => deleteArchivedDoc(doc.id)}
                            className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-white border border-transparent hover:border-red-100 transition-all shadow-sm"
                            title="Supprimer de l'archive"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                    <i className="fas fa-search text-5xl mb-4"></i>
                    <p className="text-[10px] font-black uppercase tracking-widest">Aucun document trouvé</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Custom Delete Confirmation Modal */}
          {deleteConfirmData && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-2xl mb-6 mx-auto">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <h3 className="text-xl font-black text-slate-900 text-center uppercase tracking-tight mb-2">Confirmer la suppression</h3>
                <p className="text-slate-500 text-center text-sm font-medium mb-8">
                  Êtes-vous sûr de vouloir supprimer <span className="text-red-600 font-black">{deleteConfirmData.count}</span> {
                    deleteConfirmData.type === 'archive' ? 'document(s)' : 
                    deleteConfirmData.type === 'intervention' ? 'intervention(s)' : 
                    'unité(s)/client(s)'
                  } ? Cette action est définitive.
                </p>
                <div className="flex flex-col space-y-3">
                  <button 
                    onClick={confirmDeletion}
                    className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                  >
                    Oui, Supprimer définitivement
                  </button>
                  <button 
                    onClick={() => setDeleteConfirmData(null)}
                    className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}
        </Layout>
      )}
    </ErrorBoundary>
  );
};

export default App;
