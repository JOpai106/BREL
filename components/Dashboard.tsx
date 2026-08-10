
import React, { useMemo, useState } from 'react';
import { MaintenanceRecord, Intervention, AppUser } from '../types';
import { calculateMaintenanceStatus, formatNumber } from '../utils';

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

  const locations = ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Oyo', 'Ollombo', 'Owando'];

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
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Search Bar Section */}
      <div className="flex flex-col md:flex-row gap-4 items-center max-w-5xl mx-auto">
        <div className="flex-1 relative group w-full">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <i className="fas fa-search text-slate-400 group-focus-within:text-[#2185D0] transition-colors"></i>
          </div>
          <input 
            type="text" 
            placeholder="Rechercher par client, modèle, site ou identifiant..." 
            className="w-full bg-white border border-slate-200 rounded-3xl py-5 pl-14 pr-6 text-slate-900 shadow-sm focus:outline-none focus:ring-4 focus:ring-[#2185D0]/10 focus:border-[#2185D0] transition-all font-medium text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-3 w-full md:w-auto flex-wrap">
          <select 
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="bg-white border border-slate-200 text-slate-600 px-6 py-5 rounded-3xl text-[10px] font-black tracking-widest hover:bg-slate-50 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2185D0]/20"
          >
            <option value="all">TOUTES LOCALITÉS</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc.toUpperCase()}</option>
            ))}
          </select>

          {onExport && appUser?.role !== 'client' && (
            <button 
              onClick={onExport}
              className="bg-white border border-slate-200 text-slate-600 px-8 py-5 rounded-3xl text-[10px] font-black tracking-widest flex items-center space-x-3 hover:bg-slate-50 transition-all shadow-sm whitespace-nowrap"
            >
              <i className="fas fa-file-export"></i>
              <span>EXPORTER CSV</span>
            </button>
          )}

          {onBlankQuote && appUser?.role !== 'client' && (
            <button 
              onClick={onBlankQuote}
              className="bg-slate-900 text-white px-8 py-5 rounded-3xl text-[10px] font-black tracking-widest flex items-center space-x-3 hover:bg-slate-800 transition-all shadow-lg whitespace-nowrap"
            >
              <i className="fas fa-file-invoice-dollar"></i>
              <span>DEVIS VIERGE</span>
            </button>
          )}
        </div>
      </div>

      {(filterStatus !== 'all' || filterLocation !== 'all' || searchTerm) && (
        <div className="flex justify-center">
          <button 
            onClick={() => { setFilterStatus('all'); setFilterLocation('all'); setSearchTerm(''); }}
            className="text-[10px] font-black text-[#2185D0] uppercase tracking-widest hover:underline flex items-center"
          >
            <i className="fas fa-times-circle mr-2"></i> Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => setFilterStatus('all')}
          className={`p-6 rounded-2xl border flex items-center justify-between shadow-sm cursor-pointer transition-all ${filterStatus === 'all' ? 'bg-[#2185D0] border-[#2185D0] text-white shadow-lg shadow-[#2185D0]/20' : 'bg-white border-slate-100 hover:border-[#2185D0]/30'}`}
        >
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${filterStatus === 'all' ? 'text-white/70' : 'text-[#2185D0]'}`}>MACHINES EN LIGNE</p>
            <p className="text-3xl font-black">{stats.total} <span className={`text-xs ml-1 ${filterStatus === 'all' ? 'text-white/50' : 'text-slate-300'}`}>UNITÉS</span></p>
          </div>
          <div className={`text-3xl ${filterStatus === 'all' ? 'text-white/20' : 'text-slate-100'}`}><i className="fas fa-th-large"></i></div>
        </div>

        <div 
          onClick={() => setFilterStatus('overdue')}
          className={`p-6 rounded-2xl border flex items-center justify-between shadow-sm cursor-pointer transition-all ${filterStatus === 'overdue' ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white border-slate-100 hover:border-red-500/30'}`}
        >
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${filterStatus === 'overdue' ? 'text-white/70' : 'text-red-500'}`}>INTERVENTIONS EN RETARD</p>
            <p className="text-3xl font-black">{stats.overdue} <span className={`text-xs ml-1 ${filterStatus === 'overdue' ? 'text-white/50' : 'text-slate-300'}`}>UNITÉS</span></p>
          </div>
          <div className={`text-3xl ${filterStatus === 'overdue' ? 'text-white/20' : 'text-slate-100'}`}><i className="fas fa-exclamation-triangle"></i></div>
        </div>

        <div 
          onClick={() => setFilterStatus('urgent')}
          className={`p-6 rounded-2xl border flex items-center justify-between shadow-sm cursor-pointer transition-all ${filterStatus === 'urgent' ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white border-slate-100 hover:border-amber-500/30'}`}
        >
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${filterStatus === 'urgent' ? 'text-white/70' : 'text-amber-500'}`}>MAINTENANCE IMMINENTE</p>
            <p className="text-3xl font-black">{stats.urgent} <span className={`text-xs ml-1 ${filterStatus === 'urgent' ? 'text-white/50' : 'text-slate-300'}`}>UNITÉS</span></p>
          </div>
          <div className={`text-3xl ${filterStatus === 'urgent' ? 'text-white/20' : 'text-slate-100'}`}><i className="fas fa-clock"></i></div>
        </div>

        <div 
          onClick={() => setFilterStatus('operational')}
          className={`p-6 rounded-2xl border flex items-center justify-between shadow-sm cursor-pointer transition-all ${filterStatus === 'operational' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white border-slate-100 hover:border-emerald-500/30'}`}
        >
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${filterStatus === 'operational' ? 'text-white/70' : 'text-emerald-500'}`}>ÉTAT OPÉRATIONNEL</p>
            <p className="text-3xl font-black">{stats.operational} <span className={`text-xs ml-1 ${filterStatus === 'operational' ? 'text-white/50' : 'text-slate-300'}`}>UNITÉS</span></p>
          </div>
          <div className={`text-3xl ${filterStatus === 'operational' ? 'text-white/20' : 'text-slate-100'}`}><i className="fas fa-shield-alt"></i></div>
        </div>
      </div>

      {/* Machine Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredRecords.length > 0 ? filteredRecords.map((record) => {
          if (!record || !record.id) return null;
          const status = calculateMaintenanceStatus(record);
          const currentIndex = record.currentIndex ?? 0;
          const nextChangeIndex = record.nextChangeIndex ?? 0;
          const isOverdue = currentIndex >= nextChangeIndex;

          return (
            <div key={record.id} className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100 flex flex-col group transition-all">
              <div className={`h-1.5 w-full ${isOverdue ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
              
              <div className="p-8 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-slate-50 px-3 py-1 rounded text-[10px] font-black text-slate-400">ID: {(record.id || '').slice(0, 5).toUpperCase()}</div>
                  <div className="flex items-center space-x-1">
                    {(appUser?.role === 'admin' || appUser?.role === 'technician') && (
                      <>
                        <button onClick={() => onEdit(record)} title="Modifier" className="text-slate-300 hover:text-amber-500 transition-colors p-2"><i className="fas fa-edit text-lg"></i></button>
                        <button onClick={() => onDelete(record.id)} title="Supprimer" className="text-slate-300 hover:text-red-500 transition-colors p-2"><i className="fas fa-trash-alt text-lg"></i></button>
                      </>
                    )}
                    <button onClick={() => onPrint('history', record)} title="Voir Historique" className="text-slate-300 hover:text-slate-600 transition-colors p-2"><i className="fas fa-history text-lg"></i></button>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-3xl font-black uppercase tracking-tight italic text-slate-900">{record.customerName || 'CLIENT INCONNU'}</h3>
                    {status.priority === 'high' && (
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <p className="text-[#2185D0] text-xs font-bold flex items-center"><i className="fas fa-tag mr-2"></i> {record.model || 'MODÈLE NON SPÉCIFIÉ'}</p>
                    {record.site && (
                      <p className="text-slate-400 text-xs font-bold flex items-center"><i className="fas fa-map-marker-alt mr-2"></i> {record.site}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="bg-[#F8FAFC] p-5 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">INDEX ACTUEL</p>
                    <p className="text-2xl font-black">{formatNumber(currentIndex)} <span className="text-xs text-slate-400 ml-1">h</span></p>
                  </div>
                  <div className="bg-[#F8FAFC] p-5 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">RESTE VIDANGE</p>
                    <p className={`text-2xl font-black ${isOverdue ? 'text-red-500' : 'text-slate-900'}`}>
                      {formatNumber(Math.max(0, nextChangeIndex - currentIndex))} <span className="text-xs text-slate-400 ml-1">h</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">DERNIÈRE VIDANGE</p>
                    <p className="text-xs font-black text-slate-600">
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
                        return 'N/A';
                      })()}
                    </p>
                  </div>
                  <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50">
                    <p className="text-[8px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">PROCHAINE VIDANGE</p>
                    <p className="text-xs font-black text-emerald-700">{status.projectedDate || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-6 flex-1">
                  <div>
                    <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      <span>PROCHAINE VIDANGE - {status.projectedDate || 'N/A'}</span>
                      <span className={isOverdue ? 'text-red-500' : 'text-[#2185D0]'}>{Math.round(status.progressPercent || 0)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ${isOverdue ? 'bg-red-500' : 'bg-[#2185D0]'}`} style={{ width: `${Math.min(100, Math.max(0, status.progressPercent || 0))}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3">
                  {appUser?.role !== 'client' && (
                    <button onClick={() => setActiveLogMachine(record)} className="py-4 bg-[#2185D0] text-white rounded-2xl font-black text-[9px] tracking-[0.1em] uppercase hover:bg-[#1a6fb0] transition-all flex items-center justify-center space-x-2 shadow-lg shadow-[#2185D0]/10">
                      <i className="fas fa-plus-circle"></i>
                      <span>INTERVENTION</span>
                    </button>
                  )}
                  <button onClick={() => onPrint('invoice', record)} className="py-4 bg-emerald-500 text-white rounded-2xl font-black text-[9px] tracking-[0.1em] uppercase hover:bg-emerald-600 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/10">
                    <i className="fas fa-file-invoice"></i>
                    <span>FACTURE</span>
                  </button>
                  <button onClick={() => onPrint('quote', record)} className="py-4 bg-slate-900 text-white rounded-2xl font-black text-[9px] tracking-[0.1em] uppercase hover:bg-slate-800 transition-all flex items-center justify-center space-x-2 shadow-lg">
                    <i className="fas fa-file-invoice-dollar"></i>
                    <span>DEVIS</span>
                  </button>
                  <button onClick={() => onPrint('history', record)} className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[9px] tracking-[0.1em] uppercase hover:bg-slate-200 transition-all flex items-center justify-center space-x-2">
                    <i className="fas fa-history"></i>
                    <span>HISTORIQUE</span>
                  </button>
                  <button onClick={() => onPrint('sticker', record)} className="py-4 bg-amber-500 text-white rounded-2xl font-black text-[9px] tracking-[0.1em] uppercase hover:bg-amber-600 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/10">
                    <i className="fas fa-sticky-note"></i>
                    <span>AUTO-COLLANT</span>
                  </button>
                </div>
              </div>

              <div className="bg-[#101828] p-8 text-white relative">
                <div className="absolute top-4 right-8 opacity-10 text-4xl rotate-12"><i className="fas fa-wrench"></i></div>
                <div className="flex items-center space-x-3 mb-6">
                  <i className="fas fa-info-circle text-[#2185D0]"></i>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">FICHE TECHNIQUE</p>
                </div>
                <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                  <div><p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">FILTRE AIR</p><p className="text-[11px] font-black text-[#2185D0] uppercase mono">{record.airFilterRef || 'N/A'}</p></div>
                  <div><p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">FILTRE HUILE</p><p className="text-[11px] font-black text-[#2185D0] uppercase mono">{record.oilFilterRef || 'N/A'}</p></div>
                  <div><p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">FILTRE GASOIL</p><p className="text-[11px] font-black text-[#2185D0] uppercase mono">{record.fuelFilterRef || 'N/A'}</p></div>
                  <div><p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">COURROIE</p><p className="text-[11px] font-black text-amber-500 uppercase mono">{record.beltRef || 'N/A'}</p></div>
                  <div><p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">DÉCOMPTEUR</p><p className="text-[11px] font-black text-emerald-400 uppercase mono">{record.separatorRef || 'N/A'}</p></div>
                  <div><p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">CAPACITÉ HUILE</p><p className="text-[11px] font-black text-emerald-400 uppercase mono">{record.oilQuantity || 'N/A'} L</p></div>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full py-20 text-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest italic">Aucune machine ne correspond à votre recherche</p>
          </div>
        )}
      </div>

      {/* Modal Intervention */}
      {activeLogMachine && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight italic">Journal d'Intervention</h3>
                <p className="text-[10px] font-black text-[#2185D0] uppercase tracking-widest mt-1">{activeLogMachine.customerName}</p>
              </div>
              <button onClick={() => setActiveLogMachine(null)} className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-slate-400 transition-all border border-transparent hover:border-slate-100">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-8">
              <div className="p-6 bg-[#2185D0]/5 rounded-2xl border border-[#2185D0]/10 space-y-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2185D0]">Enregistrer une Opération</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-2">Date d'effet</label>
                    <input type="date" value={newLog.date} onChange={e => setNewLog({...newLog, date: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-2">Index Compteur</label>
                    <input type="number" placeholder={activeLogMachine.currentIndex.toString()} value={newLog.index} onChange={e => setNewLog({...newLog, index: parseInt(e.target.value) || 0})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black mono" />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-2">Type d'Opération</label>
                  <select value={newLog.type} onChange={e => setNewLog({...newLog, type: e.target.value as any})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-tight">
                    <option value="Batterie">Batterie</option>
                    <option value="AVR">AVR</option>
                    <option value="Courroie">Courroie</option>
                    <option value="Relais">Relais</option>
                    <option value="Démarreur">Démarreur</option>
                    <option value="Pompe a Gasoil">Pompe a Gasoil</option>
                    <option value="Filtre a Air">Filtre a Air</option>
                    <option value="Vidange Complete">Vidange Complete</option>
                    <option value="Vidange Partiale">Vidange Partiale</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-2">Observations</label>
                  <textarea value={newLog.details} onChange={e => setNewLog({...newLog, details: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium min-h-[80px]" placeholder="Détails de l'intervention..."></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-2">Photo (URL)</label>
                    <input type="text" value={newLog.photoUrl} onChange={e => setNewLog({...newLog, photoUrl: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-medium" placeholder="Lien photo..." />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-2">Signature Client (URL)</label>
                    <input type="text" value={newLog.signatureUrl} onChange={e => setNewLog({...newLog, signatureUrl: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-medium" placeholder="Lien signature..." />
                  </div>
                </div>
                <button onClick={handleSaveLog} className="w-full py-4 bg-[#2185D0] text-white rounded-xl font-black text-[10px] tracking-widest uppercase shadow-lg shadow-[#2185D0]/20 hover:bg-[#1a6fb0] transition-all">
                  Archiver l'Opération
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Historique Archives</p>
                   <span className="text-[8px] font-black bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">{(activeLogMachine.interventions || []).length} OP</span>
                </div>
                <div className="space-y-3 pb-6">
                  {(activeLogMachine.interventions || []).map((log) => (
                    <div key={log.id} className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between bg-white group shadow-sm">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 text-xs font-black mono italic">{log.index}h</div>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase italic">{log.type}</p>
                          <div className="flex items-center space-x-2">
                            <p className="text-[9px] text-slate-400 font-bold tracking-tight italic">{new Date(log.date).toLocaleDateString('fr-FR')}</p>
                            {log.photoUrl && <i className="fas fa-camera text-[8px] text-[#2185D0]" title="Photo disponible"></i>}
                            {log.signatureUrl && <i className="fas fa-signature text-[8px] text-emerald-500" title="Signé"></i>}
                          </div>
                        </div>
                      </div>
                      <div className="text-emerald-400"><i className="fas fa-check-circle"></i></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button onClick={() => setActiveLogMachine(null)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] tracking-widest uppercase">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
