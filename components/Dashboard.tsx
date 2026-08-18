
import React, { useMemo, useState } from 'react';
import { MaintenanceRecord, Intervention, AppUser } from '../types';
import { calculateMaintenanceStatus, formatNumber } from '../utils';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface Props {
  records: MaintenanceRecord[];
  onAddIntervention: (recordId: string, intervention: Omit<Intervention, 'id'>) => void;
  onPrint: (type: 'quote' | 'invoice' | 'history' | 'sticker', record: MaintenanceRecord) => void;
  onEdit: (record: MaintenanceRecord) => void;
  onDelete: (id: string) => void;
  onExport?: () => void;
  onBlankQuote?: () => void;
  appUser: AppUser | null;
}

const Dashboard: React.FC<Props> = ({ records, onPrint, onEdit, onDelete, onAddIntervention, onExport, onBlankQuote, appUser }) => {
  const [activeLogMachine, setActiveLogMachine] = useState<MaintenanceRecord | null>(null);
  const [notifyMachine, setNotifyMachine] = useState<MaintenanceRecord | null>(null);
  const [notifyMessage, setNotifyMessage] = useState<string>('');
  const [phoneOverride, setPhoneOverride] = useState<string>('');
  const [copiedText, setCopiedText] = useState(false);
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [savedPhoneSuccess, setSavedPhoneSuccess] = useState(false);

  // Photo attachment states
  const [previewImageModal, setPreviewImageModal] = useState<{ url: string; title: string; date?: string; type?: string } | null>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'overdue' | 'urgent' | 'operational'>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [newLog, setNewLog] = useState<Omit<Intervention, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    index: 0,
    type: 'Vidange Complete',
    details: '',
    photoUrl: '',
    signatureUrl: ''
  });

  const compressPhotoFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 1000;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_DIM) {
              height *= MAX_DIM / width;
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width *= MAX_DIM / height;
              height = MAX_DIM;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handlePhotoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressingPhoto(true);
    try {
      const compressedDataUrl = await compressPhotoFile(file);
      setNewLog(prev => ({ ...prev, photoUrl: compressedDataUrl }));
    } catch (err) {
      console.error("Erreur lors du traitement de la photo:", err);
      alert("Impossible de charger la photo sélectionnée.");
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  const locations = ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Oyo', 'Ollombo', 'Owando'];

  const cleanPhone = (phone?: string) => {
    if (!phone) return '';
    return phone.replace(/[^\d+]/g, '');
  };

  const handleSavePhone = async () => {
    if (!notifyMachine || !phoneOverride) return;
    const trimmed = phoneOverride.trim();
    setIsSavingPhone(true);
    try {
      await updateDoc(doc(db, 'records', notifyMachine.id), {
        clientPhone: trimmed
      });
      // Update local object reference
      notifyMachine.clientPhone = trimmed;
      setSavedPhoneSuccess(true);
      setTimeout(() => setSavedPhoneSuccess(false), 3500);
    } catch (err) {
      console.error("Erreur enregistrement téléphone:", err);
    } finally {
      setIsSavingPhone(false);
    }
  };

  const openNotificationModal = (record: MaintenanceRecord) => {
    setNotifyMachine(record);
    setPhoneOverride(record.clientPhone || '');
    setSavedPhoneSuccess(false);
    const status = calculateMaintenanceStatus(record);
    const isOverdue = record.currentIndex >= record.nextChangeIndex;
    const isUrgent = !isOverdue && status.hoursRemaining <= 50;

    let defaultMsg = '';
    if (isOverdue) {
      defaultMsg = `[BREL ÉNERGIE] 🚨 ALERTE MAINTENANCE\nBonjour ${record.customerName},\nLa vidange de votre groupe électrogène ${record.model} (${record.site || 'Site'}) a dépassé son échéance de ${Math.abs(Math.round(status.hoursRemaining))}h (Index: ${record.currentIndex}h / Seuil: ${record.nextChangeIndex}h).\nMerci de contacter Brel Énergie pour planifier l'intervention.`;
    } else if (isUrgent) {
      defaultMsg = `[BREL ÉNERGIE] ⚠️ RAPPEL MAINTENANCE\nBonjour ${record.customerName},\nLa maintenance de votre groupe électrogène ${record.model} (${record.site || 'Site'}) est imminente (Reste: ${Math.round(status.hoursRemaining)}h, Index actuel: ${record.currentIndex}h, Estimation: ${status.projectedDate}).\nBrel Énergie à votre service.`;
    } else {
      defaultMsg = `[BREL ÉNERGIE] ✅ SUIVI TECHNIQUE\nBonjour ${record.customerName},\nVotre groupe électrogène ${record.model} (${record.site || 'Site'}) est en parfait état (Index: ${record.currentIndex}h, Prochaine vidange estimée le ${status.projectedDate}).\nMerci pour votre confiance en Brel Énergie !`;
    }
    setNotifyMessage(defaultMsg);
    setCopiedText(false);
  };

  const handleSendWhatsApp = () => {
    const phoneToUse = phoneOverride || notifyMachine?.clientPhone;
    const digits = cleanPhone(phoneToUse);
    if (!digits) {
      alert("Veuillez saisir un numéro de téléphone.");
      return;
    }
    if (notifyMachine && phoneOverride && phoneOverride !== notifyMachine.clientPhone) {
      handleSavePhone();
    }
    const encoded = encodeURIComponent(notifyMessage);
    window.open(`https://wa.me/${digits.replace('+', '')}?text=${encoded}`, '_blank');
  };

  const handleSendSMS = () => {
    const phoneToUse = phoneOverride || notifyMachine?.clientPhone;
    const digits = cleanPhone(phoneToUse);
    if (!digits) {
      alert("Veuillez saisir un numéro de téléphone.");
      return;
    }
    if (notifyMachine && phoneOverride && phoneOverride !== notifyMachine.clientPhone) {
      handleSavePhone();
    }
    const encoded = encodeURIComponent(notifyMessage);
    window.open(`sms:${digits}?body=${encoded}`, '_self');
  };

  const handleCallPhone = () => {
    const phoneToUse = phoneOverride || notifyMachine?.clientPhone;
    const digits = cleanPhone(phoneToUse);
    if (!digits) {
      alert("Veuillez saisir un numéro de téléphone.");
      return;
    }
    window.open(`tel:${digits}`, '_self');
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(notifyMessage);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  const filteredRecords = useMemo(() => {
    let result = records;

    // Status Filter
    if (filterStatus !== 'all') {
      result = result.filter(r => {
        const status = calculateMaintenanceStatus(r);
        if (filterStatus === 'overdue') return r.currentIndex >= r.nextChangeIndex;
        if (filterStatus === 'urgent') return r.currentIndex < r.nextChangeIndex && status.hoursRemaining <= 50;
        if (filterStatus === 'operational') return r.currentIndex < r.nextChangeIndex && status.hoursRemaining > 50;
        return true;
      });
    }

    // Location Filter
    if (filterLocation !== 'all') {
      result = result.filter(r => r.site?.toLowerCase() === filterLocation.toLowerCase());
    }

    // Search Filter
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(r => 
        (r.customerName || '').toLowerCase().includes(lowerSearch) || 
        (r.model || '').toLowerCase().includes(lowerSearch) ||
        (r.id || '').toLowerCase().includes(lowerSearch) ||
        (r.site && r.site.toLowerCase().includes(lowerSearch))
      );
    }

    return result;
  }, [records, searchTerm, filterStatus, filterLocation]);

  const stats = useMemo(() => {
    let overdue = 0;
    let urgent = 0;
    let operational = 0;

    records.forEach(record => {
      const status = calculateMaintenanceStatus(record);
      if (record.currentIndex >= record.nextChangeIndex) overdue++;
      else if (status.hoursRemaining <= 50) urgent++;
      else operational++;
    });

    return { total: records.length, overdue, urgent, operational };
  }, [records]);

  const handleSaveLog = () => {
    if (activeLogMachine) {
      if (newLog.index <= 0) {
        alert("Veuillez saisir un index valide.");
        return;
      }
      onAddIntervention(activeLogMachine.id, newLog);
      setActiveLogMachine(null);
      setNewLog({
        date: new Date().toISOString().split('T')[0],
        index: 0,
        type: 'Vidange Complete',
        details: '',
        photoUrl: '',
        signatureUrl: ''
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Controls Section */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-5">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          
          {/* Search Field */}
          <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <i className="fas fa-search text-slate-400 group-focus-within:text-[#2185D0] transition-colors text-sm"></i>
            </div>
            <input 
              type="text" 
              placeholder="Rechercher par client, modèle, site ou ID..." 
              className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3.5 pl-12 pr-10 text-slate-900 placeholder:text-slate-400 shadow-inner focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2185D0]/20 focus:border-[#2185D0] transition-all font-medium text-xs sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
              >
                <i className="fas fa-times-circle"></i>
              </button>
            )}
          </div>
          
          {/* Action Filters and Buttons */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 sm:flex-none">
              <select 
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 border border-slate-200/80 text-slate-700 font-bold px-4 py-3.5 rounded-2xl text-[11px] tracking-wider hover:bg-slate-100 transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-[#2185D0]/20 appearance-none pr-9 cursor-pointer"
              >
                <option value="all">📍 TOUTES LOCALITÉS</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>📍 {loc.toUpperCase()}</option>
                ))}
              </select>
              <i className="fas fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs"></i>
            </div>

            {onExport && appUser?.role !== 'client' && (
              <button 
                onClick={onExport}
                className="bg-slate-50 border border-slate-200/80 text-slate-700 px-5 py-3.5 rounded-2xl text-[11px] font-bold tracking-wider flex items-center space-x-2 hover:bg-slate-100 transition-all shadow-sm hover:border-slate-300 whitespace-nowrap active:scale-95"
              >
                <i className="fas fa-file-export text-[#2185D0]"></i>
                <span>EXPORTER CSV</span>
              </button>
            )}

            {onBlankQuote && appUser?.role !== 'client' && (
              <button 
                onClick={onBlankQuote}
                className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl text-[11px] font-bold tracking-wider flex items-center space-x-2 hover:bg-slate-800 transition-all shadow-md hover:shadow-lg whitespace-nowrap active:scale-95"
              >
                <i className="fas fa-file-invoice-dollar text-amber-400"></i>
                <span>DEVIS VIERGE</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 hidden sm:inline">FILTRER:</span>
            
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black tracking-wider transition-all flex items-center space-x-1.5 ${
                filterStatus === 'all' 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>TOUS ({stats.total})</span>
            </button>

            <button
              onClick={() => setFilterStatus('overdue')}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black tracking-wider transition-all flex items-center space-x-1.5 ${
                filterStatus === 'overdue' 
                  ? 'bg-red-500 text-white shadow-sm shadow-red-200' 
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}
            >
              <i className="fas fa-exclamation-circle text-[9px]"></i>
              <span>RETARD ({stats.overdue})</span>
            </button>

            <button
              onClick={() => setFilterStatus('urgent')}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black tracking-wider transition-all flex items-center space-x-1.5 ${
                filterStatus === 'urgent' 
                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-200' 
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <i className="fas fa-clock text-[9px]"></i>
              <span>URGENT ({stats.urgent})</span>
            </button>

            <button
              onClick={() => setFilterStatus('operational')}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black tracking-wider transition-all flex items-center space-x-1.5 ${
                filterStatus === 'operational' 
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200' 
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <i className="fas fa-check-circle text-[9px]"></i>
              <span>OPÉRATIONNEL ({stats.operational})</span>
            </button>
          </div>

          {(filterStatus !== 'all' || filterLocation !== 'all' || searchTerm) && (
            <button 
              onClick={() => { setFilterStatus('all'); setFilterLocation('all'); setSearchTerm(''); }}
              className="text-[10px] font-black text-[#2185D0] uppercase tracking-widest hover:underline flex items-center ml-auto"
            >
              <i className="fas fa-sync-alt mr-1.5 text-[9px]"></i> Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Machines */}
        <div 
          onClick={() => setFilterStatus('all')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
            filterStatus === 'all' 
              ? 'bg-[#2185D0] border-[#2185D0] text-white shadow-md shadow-[#2185D0]/20 ring-2 ring-[#2185D0] ring-offset-1' 
              : 'bg-white border-slate-200/80 hover:border-[#2185D0]/50 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
              filterStatus === 'all' ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#2185D0]'
            }`}>
              PARC TOTAL
            </span>
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs sm:text-sm ${
              filterStatus === 'all' ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-[#2185D0]'
            }`}>
              <i className="fas fa-layer-group"></i>
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-2xl font-black tracking-tight">{stats.total}</p>
              <p className={`text-[10px] font-bold mt-0.5 ${filterStatus === 'all' ? 'text-white/80' : 'text-slate-400'}`}>
                Groupes électrogènes
              </p>
            </div>
            <i className={`fas fa-server text-2xl opacity-10 ${filterStatus === 'all' ? 'text-white' : 'text-slate-900'}`}></i>
          </div>
        </div>

        {/* Interventions en Retard */}
        <div 
          onClick={() => setFilterStatus('overdue')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
            filterStatus === 'overdue' 
              ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-500/20 ring-2 ring-red-500 ring-offset-1' 
              : 'bg-white border-slate-200/80 hover:border-red-500/50 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
              filterStatus === 'overdue' ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600'
            }`}>
              DÉPASSÉ
            </span>
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs sm:text-sm ${
              filterStatus === 'overdue' ? 'bg-white/10 text-white' : 'bg-red-50 text-red-500 group-hover:bg-red-100'
            }`}>
              <i className="fas fa-exclamation-triangle"></i>
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-2xl font-black tracking-tight">{stats.overdue}</p>
              <p className={`text-[10px] font-bold mt-0.5 ${filterStatus === 'overdue' ? 'text-white/80' : 'text-red-500/80'}`}>
                Vidange urgente requise
              </p>
            </div>
            <i className={`fas fa-oil-can text-2xl opacity-10 ${filterStatus === 'overdue' ? 'text-white' : 'text-red-900'}`}></i>
          </div>
        </div>

        {/* Maintenance Imminente */}
        <div 
          onClick={() => setFilterStatus('urgent')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
            filterStatus === 'urgent' 
              ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20 ring-2 ring-amber-500 ring-offset-1' 
              : 'bg-white border-slate-200/80 hover:border-amber-500/50 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
              filterStatus === 'urgent' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700'
            }`}>
              IMMINENT (≤50h)
            </span>
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs sm:text-sm ${
              filterStatus === 'urgent' ? 'bg-white/10 text-white' : 'bg-amber-50 text-amber-500 group-hover:bg-amber-100'
            }`}>
              <i className="fas fa-clock"></i>
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-2xl font-black tracking-tight">{stats.urgent}</p>
              <p className={`text-[10px] font-bold mt-0.5 ${filterStatus === 'urgent' ? 'text-white/80' : 'text-amber-600'}`}>
                Maintenance imminente
              </p>
            </div>
            <i className={`fas fa-tools text-2xl opacity-10 ${filterStatus === 'urgent' ? 'text-white' : 'text-amber-900'}`}></i>
          </div>
        </div>

        {/* Etat Operationnel */}
        <div 
          onClick={() => setFilterStatus('operational')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
            filterStatus === 'operational' 
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500 ring-offset-1' 
              : 'bg-white border-slate-200/80 hover:border-emerald-500/50 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
              filterStatus === 'operational' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
            }`}>
              OPÉRATIONNEL
            </span>
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs sm:text-sm ${
              filterStatus === 'operational' ? 'bg-white/10 text-white' : 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100'
            }`}>
              <i className="fas fa-check-double"></i>
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-2xl font-black tracking-tight">{stats.operational}</p>
              <p className={`text-[10px] font-bold mt-0.5 ${filterStatus === 'operational' ? 'text-white/80' : 'text-emerald-600'}`}>
                En parfait état
              </p>
            </div>
            <i className={`fas fa-shield-alt text-2xl opacity-10 ${filterStatus === 'operational' ? 'text-white' : 'text-emerald-900'}`}></i>
          </div>
        </div>

      </div>

      {/* Machine Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredRecords.length > 0 ? filteredRecords.map((record) => {
          if (!record || !record.id) return null;
          const status = calculateMaintenanceStatus(record);
          const currentIndex = record.currentIndex ?? 0;
          const nextChangeIndex = record.nextChangeIndex ?? 0;
          const isOverdue = currentIndex >= nextChangeIndex;
          const isUrgent = !isOverdue && status.hoursRemaining <= 50;

          return (
            <div 
              key={record.id} 
              className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-200/80 flex flex-col group transition-all duration-300 relative"
            >
              {/* Top Accent Status Indicator Bar */}
              <div className={`h-2 w-full ${
                isOverdue ? 'bg-red-500' : isUrgent ? 'bg-amber-500' : 'bg-emerald-500'
              }`}></div>
              
              <div className="p-6 sm:p-8 flex flex-col flex-1">
                
                {/* Header row: ID, Badge Status, Admin Actions */}
                <div className="flex items-center justify-between gap-2 mb-6">
                  <div className="flex items-center space-x-2">
                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-200/60">
                      ID: {(record.id || '').slice(0, 6).toUpperCase()}
                    </span>

                    {/* Status Badge */}
                    {isOverdue ? (
                      <span className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 animate-pulse">
                        <i className="fas fa-exclamation-triangle text-[9px]"></i>
                        <span>RETARD VIDANGE</span>
                      </span>
                    ) : isUrgent ? (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
                        <i className="fas fa-clock text-[9px]"></i>
                        <span>URGENT ({status.hoursRemaining}h)</span>
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
                        <i className="fas fa-check-circle text-[9px]"></i>
                        <span>OPÉRATIONNEL</span>
                      </span>
                    )}
                  </div>

                  {/* Quick Actions (Edit, Delete, History) */}
                  <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-2xl border border-slate-200/60">
                    {(appUser?.role === 'admin' || appUser?.role === 'technician') && (
                      <>
                        <button 
                          onClick={() => onEdit(record)} 
                          title="Modifier le groupe" 
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                        >
                          <i className="fas fa-pen text-xs"></i>
                        </button>
                        <button 
                          onClick={() => onDelete(record.id)} 
                          title="Supprimer la fiche" 
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => onPrint('history', record)} 
                      title="Voir Historique" 
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-all"
                    >
                      <i className="fas fa-history text-xs"></i>
                    </button>
                  </div>
                </div>

                {/* Customer Title and Details */}
                <div className="mb-6">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 group-hover:text-[#2185D0] transition-colors line-clamp-1">
                      {record.customerName || 'CLIENT INCONNU'}
                    </h3>
                  </div>

                  <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-2">
                    <div className="text-[#2185D0] text-xs font-bold flex items-center bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-100">
                      <i className="fas fa-bolt mr-1.5 text-[10px]"></i> 
                      <span>{record.model || 'MODÈLE INCONNU'}</span>
                    </div>

                    {record.capacity && (
                      <div className="text-slate-600 text-xs font-bold flex items-center bg-slate-100 px-2.5 py-1 rounded-lg">
                        <i className="fas fa-tachometer-alt mr-1.5 text-[10px] text-slate-400"></i>
                        <span>{record.capacity}</span>
                      </div>
                    )}

                    {record.site && (
                      <div className="text-slate-500 text-xs font-bold flex items-center">
                        <i className="fas fa-map-marker-alt mr-1.5 text-red-500 text-[10px]"></i>
                        <span>{record.site}</span>
                      </div>
                    )}

                    {record.clientPhone ? (
                      <button 
                        onClick={() => openNotificationModal(record)}
                        className="text-emerald-700 text-xs font-extrabold flex items-center bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 hover:bg-emerald-100 transition-colors shadow-xs"
                        title="Envoyer une notification directe"
                      >
                        <i className="fab fa-whatsapp mr-1.5 text-[#25D366] text-xs"></i>
                        <span>{record.clientPhone}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => openNotificationModal(record)}
                        className="text-slate-400 text-xs font-medium flex items-center bg-slate-50 px-2.5 py-1 rounded-lg border border-dashed border-slate-200 hover:border-slate-300 transition-colors"
                        title="Ajouter ou envoyer une notification"
                      >
                        <i className="fas fa-plus-circle mr-1 text-[10px]"></i>
                        <span>+ Tel client</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Main Maintenance Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  
                  {/* Current Index */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">INDEX ACTUEL</p>
                      <i className="fas fa-tachometer-alt text-slate-300 text-xs"></i>
                    </div>
                    <p className="text-2xl font-black text-slate-900">
                      {formatNumber(currentIndex)} <span className="text-xs text-slate-400 font-semibold">h</span>
                    </p>
                  </div>

                  {/* Remaining Hours */}
                  <div className={`p-4 rounded-2xl border ${
                    isOverdue 
                      ? 'bg-red-50/70 border-red-200' 
                      : isUrgent 
                      ? 'bg-amber-50/70 border-amber-200' 
                      : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-[9px] font-black uppercase tracking-widest ${
                        isOverdue ? 'text-red-600' : isUrgent ? 'text-amber-700' : 'text-slate-400'
                      }`}>
                        {isOverdue ? 'DÉPASSEMENT' : 'RESTE VIDANGE'}
                      </p>
                      <i className={`fas fa-hourglass-half text-xs ${
                        isOverdue ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-slate-300'
                      }`}></i>
                    </div>
                    <p className={`text-2xl font-black ${
                      isOverdue ? 'text-red-600' : isUrgent ? 'text-amber-700' : 'text-slate-900'
                    }`}>
                      {isOverdue 
                        ? `+${formatNumber(currentIndex - nextChangeIndex)}` 
                        : formatNumber(Math.max(0, nextChangeIndex - currentIndex))
                      } <span className="text-xs text-slate-400 font-semibold">h</span>
                    </p>
                  </div>

                  {/* Last Oil Change */}
                  <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">DERNIÈRE VIDANGE</p>
                    <p className="text-xs font-black text-slate-700">
                      {(() => {
                        if (record.lastChangeDate) {
                          try {
                            const d = new Date(record.lastChangeDate);
                            if (!isNaN(d.getTime())) return d.toLocaleDateString('fr-FR');
                          } catch {}
                        }
                        const lastVidange = (record.interventions || []).find(i => i && (i.type === 'Vidange Complete' || i.type === 'Vidange Partiale'));
                        if (lastVidange && lastVidange.date) {
                          try {
                            const d = new Date(lastVidange.date);
                            if (!isNaN(d.getTime())) return d.toLocaleDateString('fr-FR');
                          } catch {}
                        }
                        return 'Non renseignée';
                      })()}
                    </p>
                  </div>

                  {/* Next Oil Change Projected */}
                  <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
                    <p className="text-[8px] font-black text-emerald-700 uppercase tracking-widest mb-0.5">PROCHAINE ESTIMÉE</p>
                    <p className="text-xs font-black text-emerald-800">{status.projectedDate || 'N/A'}</p>
                  </div>

                </div>

                {/* Progress Bar for Vidange Cycle */}
                <div className="mb-6 space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                    <span className="text-slate-400">CYCLE DE VIDANGE</span>
                    <span className={isOverdue ? 'text-red-600 font-black' : isUrgent ? 'text-amber-600' : 'text-[#2185D0]'}>
                      {Math.round(status.progressPercent || 0)}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        isOverdue ? 'bg-red-500' : isUrgent ? 'bg-amber-500' : 'bg-[#2185D0]'
                      }`} 
                      style={{ width: `${Math.min(100, Math.max(0, status.progressPercent || 0))}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action Buttons Grid (Structured 5-button Layout) */}
                <div className="mt-auto pt-4 border-t border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">ACTIONS ET DOCUMENTS</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {appUser?.role !== 'client' && (
                      <button 
                        onClick={() => setActiveLogMachine(record)} 
                        className="py-3 px-3 bg-[#2185D0] text-white rounded-xl font-extrabold text-[10px] tracking-wider uppercase hover:bg-[#1a6fb0] transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-[#2185D0]/15 active:scale-95 col-span-2 sm:col-span-1"
                      >
                        <i className="fas fa-plus-circle text-xs"></i>
                        <span>INTERVENTION</span>
                      </button>
                    )}
                    
                    <button 
                      onClick={() => openNotificationModal(record)} 
                      className="py-3 px-3 bg-emerald-600 text-white rounded-xl font-extrabold text-[10px] tracking-wider uppercase hover:bg-emerald-700 transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/15 active:scale-95 col-span-2 sm:col-span-1"
                      title="Notification SMS / WhatsApp directe au client"
                    >
                      <i className="fab fa-whatsapp text-xs"></i>
                      <span>NOTIFIER CLIENT</span>
                    </button>

                    <button 
                      onClick={() => onPrint('invoice', record)} 
                      className="py-3 px-3 bg-slate-900 text-white rounded-xl font-extrabold text-[10px] tracking-wider uppercase hover:bg-slate-800 transition-all flex items-center justify-center space-x-1.5 shadow-md active:scale-95"
                    >
                      <i className="fas fa-file-invoice text-xs"></i>
                      <span>FACTURE</span>
                    </button>

                    <button 
                      onClick={() => onPrint('quote', record)} 
                      className="py-3 px-3 bg-slate-900 text-white rounded-xl font-extrabold text-[10px] tracking-wider uppercase hover:bg-slate-800 transition-all flex items-center justify-center space-x-1.5 shadow-md active:scale-95"
                    >
                      <i className="fas fa-file-invoice-dollar text-xs text-amber-400"></i>
                      <span>DEVIS</span>
                    </button>

                    <button 
                      onClick={() => onPrint('history', record)} 
                      className="py-3 px-3 bg-slate-100 text-slate-700 hover:text-slate-900 rounded-xl font-extrabold text-[10px] tracking-wider uppercase hover:bg-slate-200 transition-all flex items-center justify-center space-x-1.5 active:scale-95"
                    >
                      <i className="fas fa-history text-xs text-slate-500"></i>
                      <span>HISTORIQUE</span>
                    </button>

                    <button 
                      onClick={() => onPrint('sticker', record)} 
                      className="py-3 px-3 bg-amber-500 text-white rounded-xl font-extrabold text-[10px] tracking-wider uppercase hover:bg-amber-600 transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/15 active:scale-95"
                    >
                      <i className="fas fa-sticky-note text-xs"></i>
                      <span>AUTO-COLLANT</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Technical Specifications Box (Fiche Technique) */}
              <div className="bg-[#0F172A] p-6 text-white relative border-t border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-wrench text-[#2185D0] text-sm"></i>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">FICHE TECHNIQUE MOTEUR</p>
                  </div>
                  <span className="text-[9px] font-black text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
                    PIÈCES DE RECHANGE
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800/80">
                    <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">FILTRE AIR</p>
                    <p className="text-[11px] font-black text-[#2185D0] uppercase font-mono tracking-tight truncate">
                      {record.airFilterRef || 'N/A'}
                    </p>
                  </div>

                  <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800/80">
                    <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">FILTRE HUILE</p>
                    <p className="text-[11px] font-black text-[#2185D0] uppercase font-mono tracking-tight truncate">
                      {record.oilFilterRef || 'N/A'}
                    </p>
                  </div>

                  <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800/80">
                    <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">FILTRE GASOIL</p>
                    <p className="text-[11px] font-black text-[#2185D0] uppercase font-mono tracking-tight truncate">
                      {record.fuelFilterRef || 'N/A'}
                    </p>
                  </div>

                  <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800/80">
                    <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">COURROIE</p>
                    <p className="text-[11px] font-black text-amber-400 uppercase font-mono tracking-tight truncate">
                      {record.beltRef || 'N/A'}
                    </p>
                  </div>

                  <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800/80">
                    <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">SÉPARATEUR</p>
                    <p className="text-[11px] font-black text-emerald-400 uppercase font-mono tracking-tight truncate">
                      {record.separatorRef || 'N/A'}
                    </p>
                  </div>

                  <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800/80">
                    <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">CAPACITÉ HUILE</p>
                    <p className="text-[11px] font-black text-emerald-400 uppercase font-mono tracking-tight truncate">
                      {record.oilQuantity ? `${record.oilQuantity} L` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          );
        }) : (
          <div className="col-span-full py-16 px-6 text-center bg-white rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400 text-2xl">
              <i className="fas fa-search"></i>
            </div>
            <h4 className="text-base font-black text-slate-800 uppercase tracking-wide mb-1">Aucun groupe électrogène trouvé</h4>
            <p className="text-slate-500 text-xs max-w-md mx-auto mb-6">
              Aucune machine ne correspond aux critères de recherche ou de filtre sélectionnés.
            </p>
            <button 
              onClick={() => { setFilterStatus('all'); setFilterLocation('all'); setSearchTerm(''); }}
              className="px-6 py-3 bg-[#2185D0] text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-[#1a6fb0] transition-all shadow-md"
            >
              Réinitialiser tous les filtres
            </button>
          </div>
        )}
      </div>

      {/* Modal Intervention */}
      {activeLogMachine && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-100">
            
            {/* Modal Header */}
            <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[9px] font-black text-[#2185D0] uppercase tracking-widest">NOUVELLE INTERVENTION</span>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 mt-0.5">
                  {activeLogMachine.customerName}
                </h3>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  {activeLogMachine.model} — ID: {(activeLogMachine.id || '').slice(0, 6)}
                </p>
              </div>
              <button 
                onClick={() => setActiveLogMachine(null)} 
                className="w-10 h-10 rounded-2xl hover:bg-slate-200/80 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all border border-slate-200/60"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            {/* Modal Scrollable Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              
              {/* Add New Intervention Form */}
              <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#2185D0] flex items-center">
                  <i className="fas fa-plus-circle mr-1.5"></i> ENREGISTRER UNE OPÉRATION
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-500 mb-1.5">Date d'effet</label>
                    <input 
                      type="date" 
                      value={newLog.date} 
                      onChange={e => setNewLog({...newLog, date: e.target.value})} 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:ring-2 focus:ring-[#2185D0]/20 focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-500 mb-1.5">Index Compteur (Heures)</label>
                    <input 
                      type="number" 
                      placeholder={activeLogMachine.currentIndex.toString()} 
                      value={newLog.index || ''} 
                      onChange={e => setNewLog({...newLog, index: parseInt(e.target.value) || 0})} 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-black font-mono focus:ring-2 focus:ring-[#2185D0]/20 focus:outline-none" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-500 mb-1.5">Type d'Opération</label>
                  <select 
                    value={newLog.type} 
                    onChange={e => setNewLog({...newLog, type: e.target.value as any})} 
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-black uppercase tracking-tight focus:ring-2 focus:ring-[#2185D0]/20 focus:outline-none"
                  >
                    <option value="Vidange Complete">Vidange Complète</option>
                    <option value="Vidange Partiale">Vidange Partielle</option>
                    <option value="Filtre a Air">Filtre à Air</option>
                    <option value="Batterie">Batterie</option>
                    <option value="AVR">AVR</option>
                    <option value="Courroie">Courroie</option>
                    <option value="Relais">Relais</option>
                    <option value="Démarreur">Démarreur</option>
                    <option value="Pompe a Gasoil">Pompe à Gasoil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-500 mb-1.5">Observations & Travaux</label>
                  <textarea 
                    value={newLog.details} 
                    onChange={e => setNewLog({...newLog, details: e.target.value})} 
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium min-h-[70px] focus:ring-2 focus:ring-[#2185D0]/20 focus:outline-none" 
                    placeholder="Détails des pièces remplacées ou observations..."
                  ></textarea>
                </div>

                {/* Photo & Signature Attachments */}
                <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center">
                      <i className="fas fa-camera text-[#2185D0] mr-2 text-xs"></i>
                      Photo de l'Intervention
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-[9px] font-bold text-slate-500 hover:text-[#2185D0] underline"
                    >
                      {showUrlInput ? "Utiliser caméra / fichier" : "Saisir un lien URL"}
                    </button>
                  </div>

                  {!showUrlInput ? (
                    <div>
                      {newLog.photoUrl ? (
                        <div className="relative group rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-white p-2 flex items-center space-x-3">
                          <img 
                            src={newLog.photoUrl} 
                            alt="Aperçu photo intervention" 
                            className="w-16 h-16 object-cover rounded-xl shadow-xs border border-slate-100 shrink-0" 
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-900 truncate">Photo jointe prête</p>
                            <p className="text-[10px] text-emerald-600 font-bold flex items-center mt-0.5">
                              <i className="fas fa-check-circle mr-1"></i> Image attachée à l'intervention
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNewLog({ ...newLog, photoUrl: '' })}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                            title="Supprimer la photo"
                          >
                            <i className="fas fa-trash-alt text-xs"></i>
                          </button>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-slate-300 hover:border-[#2185D0] bg-white rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-blue-50/30 group">
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handlePhotoFileSelect}
                            className="hidden"
                          />
                          {isCompressingPhoto ? (
                            <div className="flex items-center space-x-2 text-[#2185D0] text-xs font-bold py-1">
                              <i className="fas fa-spinner fa-spin text-base"></i>
                              <span>Optimisation de la photo en cours...</span>
                            </div>
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-full bg-blue-50 text-[#2185D0] group-hover:scale-110 flex items-center justify-center mb-1.5 transition-transform">
                                <i className="fas fa-camera text-base"></i>
                              </div>
                              <span className="text-xs font-black text-slate-800">Prendre une photo ou Choisir un fichier</span>
                              <span className="text-[10px] text-slate-400 font-medium mt-0.5">Prenez directement en photo les pièces ou le compteur</span>
                            </>
                          )}
                        </label>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input 
                        type="text" 
                        value={newLog.photoUrl} 
                        onChange={e => setNewLog({...newLog, photoUrl: e.target.value})} 
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:ring-2 focus:ring-[#2185D0]/20 focus:outline-none" 
                        placeholder="Ex: https://domaine.com/photo.jpg" 
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-500 mb-1">Signature Client (URL optionnelle)</label>
                    <input 
                      type="text" 
                      value={newLog.signatureUrl} 
                      onChange={e => setNewLog({...newLog, signatureUrl: e.target.value})} 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-[11px] font-medium focus:ring-2 focus:ring-[#2185D0]/20 focus:outline-none" 
                      placeholder="Lien URL signature..." 
                    />
                  </div>
                </div>

                <button 
                  onClick={handleSaveLog} 
                  className="w-full py-3.5 bg-[#2185D0] text-white rounded-xl font-black text-xs tracking-widest uppercase shadow-md hover:bg-[#1a6fb0] transition-all active:scale-98 flex items-center justify-center space-x-2"
                >
                  <i className="fas fa-check-circle text-sm"></i>
                  <span>ARCHIVER L'OPÉRATION</span>
                </button>
              </div>

              {/* History List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">HISTORIQUE DES INTERVENTIONS</p>
                   <span className="text-[9px] font-black bg-slate-100 px-2.5 py-0.5 rounded-full text-slate-600">
                     {(activeLogMachine.interventions || []).length} ARCHIVES
                   </span>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {(activeLogMachine.interventions || []).length > 0 ? (
                    (activeLogMachine.interventions || []).map((log) => (
                      <div key={log.id} className="p-3 border border-slate-100 rounded-2xl flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-800 text-xs font-black font-mono shrink-0 shadow-xs">
                            {log.index}h
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-slate-900 uppercase truncate">{log.type}</p>
                            <div className="flex items-center space-x-2 mt-0.5">
                              <p className="text-[10px] text-slate-500 font-bold">
                                {new Date(log.date).toLocaleDateString('fr-FR')}
                              </p>
                              {log.details && (
                                <span className="text-[10px] text-slate-400 truncate max-w-[140px]" title={log.details}>
                                  — {log.details}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Photo Thumbnail or Checkmark */}
                        <div className="flex items-center space-x-2 shrink-0">
                          {log.photoUrl ? (
                            <button
                              type="button"
                              onClick={() => setPreviewImageModal({
                                url: log.photoUrl!,
                                title: `${activeLogMachine.customerName} - ${activeLogMachine.model}`,
                                date: log.date,
                                type: log.type
                              })}
                              className="relative group rounded-xl overflow-hidden border-2 border-[#2185D0]/30 hover:border-[#2185D0] shadow-xs transition-all flex items-center space-x-1.5 bg-blue-50 px-2 py-1"
                              title="Cliquer pour agrandir la photo"
                            >
                              <img src={log.photoUrl} alt="Photo" className="w-7 h-7 object-cover rounded-lg" />
                              <span className="text-[10px] font-black text-[#2185D0]">Photo</span>
                              <i className="fas fa-search-plus text-[10px] text-[#2185D0]"></i>
                            </button>
                          ) : (
                            <i className="fas fa-check-circle text-emerald-500 text-sm" title="Opération validée"></i>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center py-4">Aucune intervention enregistrée</p>
                  )}
                </div>
              </div>

            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setActiveLogMachine(null)} 
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs tracking-wider uppercase hover:bg-slate-800 transition-all"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Direct Client Notification Modal */}
      {notifyMachine && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 my-auto animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 md:p-6 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white flex justify-between items-center relative">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                  <i className="fab fa-whatsapp text-white text-xl"></i>
                </div>
                <div>
                  <h3 className="font-black text-base md:text-lg uppercase tracking-tight">Notification Directe Client</h3>
                  <p className="text-emerald-100 text-[10px] md:text-xs font-medium">SMS, WhatsApp & Appel Téléphonique</p>
                </div>
              </div>
              <button 
                onClick={() => setNotifyMachine(null)}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-all"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 md:p-6 space-y-5">
              
              {/* Machine Summary Badge */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-900 uppercase italic">{notifyMachine.customerName}</p>
                  <p className="text-[10px] font-bold text-slate-500 font-mono">{notifyMachine.model} ({notifyMachine.site || 'Site Principal'})</p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs font-black text-slate-800">{notifyMachine.currentIndex}h</span>
                  <p className="text-[9px] text-slate-400 font-bold">Index Actuel</p>
                </div>
              </div>

              {/* Phone Input */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 flex justify-between items-center">
                  <span>
                    <i className="fas fa-phone-alt text-emerald-600 mr-1.5"></i>
                    Numéro Téléphone Client
                  </span>
                  {phoneOverride && (
                    <button
                      type="button"
                      onClick={handleSavePhone}
                      disabled={isSavingPhone}
                      className="text-[10px] font-black text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors flex items-center space-x-1"
                    >
                      <i className={`fas ${isSavingPhone ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
                      <span>{isSavingPhone ? 'Enregistrement...' : 'Enregistrer sur la fiche'}</span>
                    </button>
                  )}
                </label>
                <div className="relative">
                  <input 
                    type="tel" 
                    value={phoneOverride}
                    onChange={(e) => setPhoneOverride(e.target.value)}
                    placeholder="ex: +242 06 600 1122"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-mono text-xs md:text-sm font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
                {savedPhoneSuccess && (
                  <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center animate-in fade-in">
                    <i className="fas fa-check-circle mr-1"></i>
                    Numéro enregistré avec succès sur la fiche de {notifyMachine.customerName} !
                  </p>
                )}
                {!phoneOverride && !savedPhoneSuccess && (
                  <p className="text-[10px] text-amber-600 font-semibold mt-1">
                    <i className="fas fa-exclamation-circle mr-1"></i>
                    Saisissez un numéro ci-dessus. Il sera automatiquement sauvegardé lors de l'envoi.
                  </p>
                )}
              </div>

              {/* Sender Name Identification Badge */}
              <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-100 flex items-center space-x-3 text-xs">
                <div className="w-8 h-8 rounded-xl bg-[#2185D0] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <i className="fas fa-building text-xs"></i>
                </div>
                <div>
                  <p className="font-black text-slate-900 text-xs flex items-center">
                    <span>Expéditeur : Brel Énergie</span>
                    <span className="ml-2 text-[9px] bg-blue-600 text-white font-mono px-1.5 py-0.2 rounded-full uppercase">Officiel</span>
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight">
                    En-tête officiel <strong className="text-[#2185D0]">[BREL ÉNERGIE]</strong> inclus dans tous les messages client.
                  </p>
                </div>
              </div>

              {/* Template Selectors */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Modèles de Message
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const st = calculateMaintenanceStatus(notifyMachine);
                      setNotifyMessage(`[BREL ÉNERGIE] ⚠️ RAPPEL MAINTENANCE\nBonjour ${notifyMachine.customerName},\nLa maintenance de votre groupe ${notifyMachine.model} est proche (Reste: ${Math.round(st.hoursRemaining)}h, Index: ${notifyMachine.currentIndex}h).\nBrel Énergie à votre service.`);
                    }}
                    className="p-2 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors text-center leading-tight"
                  >
                    Rappel Vidange
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const st = calculateMaintenanceStatus(notifyMachine);
                      setNotifyMessage(`[BREL ÉNERGIE] 🚨 ALERTE RETARD\nBonjour ${notifyMachine.customerName},\nLa vidange de votre groupe ${notifyMachine.model} est dépassée de ${Math.abs(Math.round(st.hoursRemaining))}h. Intervention urgente requise !\nBrel Énergie.`);
                    }}
                    className="p-2 text-[10px] font-bold bg-red-50 text-red-800 border border-red-200 rounded-xl hover:bg-red-100 transition-colors text-center leading-tight"
                  >
                    Alerte Retard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifyMessage(`[BREL ÉNERGIE] ✅ SUIVI TECHNIQUE\nBonjour ${notifyMachine.customerName},\nVotre groupe ${notifyMachine.model} est en parfait état (Index: ${notifyMachine.currentIndex}h).\nMerci pour votre confiance en Brel Énergie.`);
                    }}
                    className="p-2 text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors text-center leading-tight"
                  >
                    Rapport R.A.S
                  </button>
                </div>
              </div>

              {/* Message Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Message Personnalisé
                  </label>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {notifyMessage.length} caract.
                  </span>
                </div>
                <textarea 
                  rows={4}
                  value={notifyMessage}
                  onChange={(e) => setNotifyMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 leading-relaxed"
                />
              </div>

              {/* Main Notification Actions */}
              <div className="space-y-2 pt-2">
                
                {/* WhatsApp Button */}
                <button 
                  onClick={handleSendWhatsApp}
                  className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-[#25D366]/20 transition-all active:scale-98"
                >
                  <i className="fab fa-whatsapp text-base"></i>
                  <span>Envoyer via WhatsApp</span>
                </button>

                {/* SMS & Call Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={handleSendSMS}
                    className="py-3 px-3 bg-[#2185D0] hover:bg-[#1a6fb0] text-white rounded-xl font-extrabold text-[11px] uppercase tracking-wider flex items-center justify-center space-x-2 transition-all active:scale-98"
                  >
                    <i className="fas fa-comment-alt text-xs"></i>
                    <span>Envoyer SMS</span>
                  </button>

                  <button 
                    onClick={handleCallPhone}
                    className="py-3 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-extrabold text-[11px] uppercase tracking-wider flex items-center justify-center space-x-2 transition-all active:scale-98"
                  >
                    <i className="fas fa-phone-alt text-xs text-emerald-400"></i>
                    <span>Appeler Client</span>
                  </button>
                </div>

                {/* Copy Text Button */}
                <button 
                  onClick={handleCopyMessage}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <i className={`fas ${copiedText ? 'fa-check text-emerald-600' : 'fa-copy text-slate-500'}`}></i>
                  <span>{copiedText ? 'Message Copié dans le Presse-Papier !' : 'Copier le texte'}</span>
                </button>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* Full Size Photo Preview Modal */}
      {previewImageModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-[#2185D0] flex items-center justify-center text-white">
                  <i className="fas fa-camera text-sm"></i>
                </div>
                <div>
                  <h4 className="font-black text-xs md:text-sm uppercase tracking-tight">{previewImageModal.title}</h4>
                  <p className="text-[10px] text-slate-300 font-medium">
                    {previewImageModal.type} — {previewImageModal.date ? new Date(previewImageModal.date).toLocaleDateString('fr-FR') : 'Date non spécifiée'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewImageModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </div>
            
            <div className="p-4 bg-slate-950 flex items-center justify-center min-h-[300px] max-h-[70vh]">
              <img 
                src={previewImageModal.url} 
                alt="Photo intervention agrandie" 
                className="max-h-[65vh] max-w-full object-contain rounded-2xl shadow-lg border border-slate-800"
              />
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Photo d'intervention certifiée Brel Énergie
              </span>
              <div className="flex space-x-2">
                <a
                  href={previewImageModal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-blue-50 text-[#2185D0] hover:bg-blue-100 rounded-xl font-black text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-colors"
                >
                  <i className="fas fa-external-link-alt text-xs"></i>
                  <span>Ouvrir l'image</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImageModal(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;

