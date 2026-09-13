
import React, { useState, useMemo } from 'react';
import { MaintenanceRecord, AppUser } from '../types';
import { calculateMaintenanceStatus, formatNumber } from '../utils';

interface Props {
  records: MaintenanceRecord[];
  onDelete: (id: string) => void;
  onEdit: (record: MaintenanceRecord) => void;
  appUser: AppUser | null;
  onUpdateCurrentIndex?: (recordId: string, newIndex: number) => Promise<void> | void;
  onUpdateConsumables?: (recordId: string, data: { fuelFilterQuantity: number; oilFilterQuantity: number; separatorQuantity: number; oilQuantity: number }) => Promise<void> | void;
}

const MaintenanceList: React.FC<Props> = ({ records, onDelete, onEdit, appUser, onUpdateCurrentIndex, onUpdateConsumables }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingIndexMachine, setEditingIndexMachine] = useState<MaintenanceRecord | null>(null);
  const [tempIndexValue, setTempIndexValue] = useState<string>('');
  const [isSavingIndex, setIsSavingIndex] = useState(false);
  const [indexSuccessMessage, setIndexSuccessMessage] = useState<string>('');
  const [indexErrorMessage, setIndexErrorMessage] = useState<string>('');

  // Consommables edit states
  const [editingConsumablesMachine, setEditingConsumablesMachine] = useState<MaintenanceRecord | null>(null);
  const [tempFuelFilterQty, setTempFuelFilterQty] = useState<string>('1');
  const [tempOilFilterQty, setTempOilFilterQty] = useState<string>('1');
  const [tempSeparatorQty, setTempSeparatorQty] = useState<string>('1');
  const [tempOilQty, setTempOilQty] = useState<string>('0');
  const [isSavingConsumables, setIsSavingConsumables] = useState(false);
  const [consumablesSuccessMessage, setConsumablesSuccessMessage] = useState<string>('');
  const [consumablesErrorMessage, setConsumablesErrorMessage] = useState<string>('');

  const openEditConsumablesModal = (record: MaintenanceRecord) => {
    setEditingConsumablesMachine(record);
    setTempFuelFilterQty((record.fuelFilterQuantity !== undefined ? record.fuelFilterQuantity : 1).toString());
    setTempOilFilterQty((record.oilFilterQuantity !== undefined ? record.oilFilterQuantity : 1).toString());
    setTempSeparatorQty((record.separatorQuantity !== undefined ? record.separatorQuantity : 1).toString());
    setTempOilQty((record.oilQuantity || 0).toString());
    setConsumablesSuccessMessage('');
    setConsumablesErrorMessage('');
  };

  const handleSaveConsumablesOnly = async () => {
    if (!editingConsumablesMachine || !onUpdateConsumables) return;
    const fuelQty = Math.max(1, parseInt(tempFuelFilterQty) || 1);
    const oilQty = Math.max(1, parseInt(tempOilFilterQty) || 1);
    const sepQty = Math.max(1, parseInt(tempSeparatorQty) || 1);
    const oilLiters = Math.max(0, parseFloat(tempOilQty) || 0);

    setIsSavingConsumables(true);
    setConsumablesErrorMessage('');
    try {
      await onUpdateConsumables(editingConsumablesMachine.id, {
        fuelFilterQuantity: fuelQty,
        oilFilterQuantity: oilQty,
        separatorQuantity: sepQty,
        oilQuantity: oilLiters
      });
      setConsumablesSuccessMessage("Quantités de consommables enregistrées avec succès.");
      setTimeout(() => {
        setEditingConsumablesMachine(null);
        setConsumablesSuccessMessage('');
      }, 1200);
    } catch (err: any) {
      console.error("Erreur lors de la mise à jour des consommables:", err);
      setConsumablesErrorMessage(err?.message || "Erreur lors de la mise à jour des consommables.");
    } finally {
      setIsSavingConsumables(false);
    }
  };

  const openEditIndexModal = (record: MaintenanceRecord) => {
    setEditingIndexMachine(record);
    setTempIndexValue((record.currentIndex ?? 0).toString());
    setIndexSuccessMessage('');
    setIndexErrorMessage('');
  };

  const handleSaveIndexOnly = async () => {
    if (!editingIndexMachine || !onUpdateCurrentIndex) return;
    const parsed = Number(tempIndexValue);
    if (isNaN(parsed) || parsed < 0) {
      setIndexErrorMessage("Veuillez saisir un nombre valide positif pour l'index horaire.");
      return;
    }
    setIsSavingIndex(true);
    setIndexErrorMessage('');
    try {
      await onUpdateCurrentIndex(editingIndexMachine.id, parsed);
      setIndexSuccessMessage(`Index mis à jour avec succès (${formatNumber(parsed)} h).`);
      setTimeout(() => {
        setEditingIndexMachine(null);
        setIndexSuccessMessage('');
      }, 1200);
    } catch (err: any) {
      console.error("Erreur lors de la mise à jour de l'index:", err);
      setIndexErrorMessage(err?.message || "Erreur lors de la mise à jour de l'index.");
    } finally {
      setIsSavingIndex(false);
    }
  };

  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const lowerSearch = searchTerm.toLowerCase();
    return records.filter(r => 
      (r.customerName || '').toLowerCase().includes(lowerSearch) || 
      (r.model || '').toLowerCase().includes(lowerSearch) ||
      (r.id || '').toLowerCase().includes(lowerSearch)
    );
  }, [records, searchTerm]);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="max-w-md w-full ml-auto relative group px-2 md:px-0">
        <div className="absolute inset-y-0 left-0 pl-6 md:pl-4 flex items-center pointer-events-none">
          <i className="fas fa-search text-slate-400 group-focus-within:text-[#2185D0] transition-colors text-xs"></i>
        </div>
        <input 
          type="text" 
          placeholder="Filtrer planning..." 
          className="w-full bg-white border border-slate-200 rounded-xl md:rounded-2xl py-3 pl-12 md:pl-10 pr-4 text-slate-900 shadow-sm focus:outline-none focus:ring-4 focus:ring-[#2185D0]/10 focus:border-[#2185D0] transition-all font-medium text-xs"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl md:rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in duration-500">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[9px] md:text-[10px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
                <th className="px-5 md:px-8 py-4 md:py-6">Unité / Client</th>
                <th className="px-5 md:px-8 py-4 md:py-6">Consommables</th>
                <th className="px-5 md:px-8 py-4 md:py-6">Index Actuel</th>
                <th className="px-5 md:px-8 py-4 md:py-6">Projection</th>
                <th className="px-5 md:px-8 py-4 md:py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length > 0 ? filteredRecords.map((record) => {
                const status = calculateMaintenanceStatus(record);
                
                return (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-5 md:px-8 py-4 md:py-6">
                      <div className="flex items-center space-x-3 md:space-x-4">
                        <div className={`w-1 h-10 md:w-1.5 md:h-12 rounded-full flex-shrink-0 ${
                          status.priority === 'high' ? 'bg-red-500 shadow-sm' : 
                          status.priority === 'medium' ? 'bg-amber-500' : 
                          'bg-[#2185D0]'
                        }`}></div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 text-xs md:text-sm uppercase italic truncate">{record.customerName}</p>
                          <div className="flex items-center space-x-2">
                            <p className="text-[9px] md:text-[10px] text-slate-400 font-mono font-bold tracking-tight truncate">{record.model}</p>
                            {record.clientPhone && (
                              <a 
                                href={`https://wa.me/${record.clientPhone.replace(/[^\d+]/g, '').replace('+', '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors"
                                title="Envoyer notification WhatsApp"
                              >
                                <i className="fab fa-whatsapp mr-1 text-[10px]"></i>
                                <span>{record.clientPhone}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 md:px-8 py-4 md:py-6">
                      <div className="text-[9px] md:text-[10px] font-mono font-bold text-slate-500 space-y-0.5">
                        <p><span className="text-[#2185D0]">O:</span> {record.oilFilterRef || 'Std'} <span className="text-slate-400 font-normal">({record.oilFilterQuantity !== undefined ? record.oilFilterQuantity : 1})</span></p>
                        <p><span className="text-[#2185D0]">F:</span> {record.fuelFilterRef || 'Std'} <span className="text-slate-400 font-normal">({record.fuelFilterQuantity !== undefined ? record.fuelFilterQuantity : 1})</span></p>
                        {record.separatorRef && <p><span className="text-emerald-600">S:</span> {record.separatorRef} <span className="text-slate-400 font-normal">({record.separatorQuantity !== undefined ? record.separatorQuantity : 1})</span></p>}
                        {record.oilQuantity ? <p><span className="text-amber-600">H:</span> {record.oilQuantity} L</p> : null}
                      </div>
                    </td>
                    <td className="px-5 md:px-8 py-4 md:py-6">
                      <div className="flex items-center space-x-2">
                        <span className="mono text-[10px] md:text-xs font-black text-slate-700">
                          {formatNumber(record.currentIndex)} H
                        </span>
                        {appUser?.role === 'client' && (
                          <button
                            type="button"
                            onClick={() => openEditIndexModal(record)}
                            className="text-[#2185D0] hover:text-[#1a6fb0] p-1 rounded-md hover:bg-[#2185D0]/10 transition-colors"
                            title="Mettre à jour l'index"
                          >
                            <i className="fas fa-pencil-alt text-[10px]"></i>
                          </button>
                        )}
                      </div>
                      <div className="w-16 md:w-24 bg-slate-100 rounded-full h-1 md:h-1.5 mt-1.5 md:mt-2 overflow-hidden border border-slate-200">
                        <div className="h-full bg-[#2185D0]" style={{ width: `${status.progressPercent}%` }}></div>
                      </div>
                    </td>
                    <td className="px-5 md:px-8 py-4 md:py-6">
                      <p className={`font-black text-xs md:text-sm mono ${status.priority === 'high' ? 'text-red-600' : 'text-slate-900'}`}>
                        {status.projectedDate}
                      </p>
                      <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        -{formatNumber(status.hoursRemaining)}h
                      </p>
                    </td>
                    <td className="px-5 md:px-8 py-4 md:py-6 text-right">
                      {(appUser?.role === 'admin' || appUser?.role === 'technician') && (
                        <div className="flex items-center justify-end space-x-2 md:space-x-3 opacity-60 md:opacity-30 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditConsumablesModal(record)} title="Modifier quantités consommables" className="p-2 md:p-3 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg md:rounded-xl transition-all border border-slate-100 shadow-sm">
                            <i className="fas fa-sliders-h text-xs md:text-sm"></i>
                          </button>
                          <button onClick={() => onEdit(record)} title="Modifier le groupe" className="p-2 md:p-3 bg-slate-50 text-slate-400 hover:text-[#2185D0] hover:bg-white rounded-lg md:rounded-xl transition-all border border-slate-100 shadow-sm">
                            <i className="fas fa-edit text-xs md:text-sm"></i>
                          </button>
                          <button onClick={() => onDelete(record.id)} title="Supprimer le groupe" className="p-2 md:p-3 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg md:rounded-xl transition-all border border-slate-100 shadow-sm">
                            <i className="fas fa-trash-alt text-xs md:text-sm"></i>
                          </button>
                        </div>
                      )}
                      {appUser?.role === 'client' && (
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => openEditIndexModal(record)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#2185D0] text-white hover:bg-[#1a6fb0] rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-xs active:scale-95"
                            title="Mettre à jour l'index actuel uniquement"
                          >
                            <i className="fas fa-tachometer-alt text-[10px]"></i>
                            <span>Relever Index</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="px-6 py-24 md:py-40 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mb-4 md:mb-6">
                        <i className="fas fa-box-open text-2xl md:text-3xl text-slate-200"></i>
                      </div>
                      <p className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Aucun résultat</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dédié Relevé Index Actuel */}
      {editingIndexMachine && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 my-auto animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 md:p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 bg-[#2185D0] rounded-2xl flex items-center justify-center text-white shadow-md shadow-[#2185D0]/30">
                  <i className="fas fa-tachometer-alt text-lg"></i>
                </div>
                <div>
                  <h3 className="font-black text-base md:text-lg uppercase tracking-tight">Relevé d'Index Actuel</h3>
                  <p className="text-slate-400 text-xs font-medium">
                    Mise à jour de l'horamètre uniquement
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEditingIndexMachine(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </div>

            {/* Corps */}
            <div className="p-5 md:p-6 space-y-5">
              {/* Info machine */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-900 uppercase italic">
                    {editingIndexMachine.customerName}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 font-mono">
                    {editingIndexMachine.model}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-slate-800 font-mono">
                    {formatNumber(editingIndexMachine.currentIndex)} h
                  </span>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Index Précédent</p>
                </div>
              </div>

              {/* Champ saisie */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Nouvel Index Actuel (Heures)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={tempIndexValue}
                    onChange={(e) => setTempIndexValue(e.target.value)}
                    placeholder="Ex: 1540"
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-[#2185D0] focus:bg-white rounded-2xl px-4 py-3.5 text-slate-900 font-mono text-xl font-black focus:outline-none transition-all pr-16"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm pointer-events-none">
                    heures
                  </span>
                </div>
                {Number(tempIndexValue) < (editingIndexMachine.currentIndex || 0) && (
                  <p className="text-[11px] text-amber-600 font-bold flex items-center pt-1">
                    <i className="fas fa-exclamation-triangle mr-1.5"></i>
                    Attention : la valeur saisie ({tempIndexValue} h) est inférieure à l'index actuel enregistré ({editingIndexMachine.currentIndex} h).
                  </p>
                )}
              </div>

              {/* Sécurité */}
              <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 flex items-start space-x-2.5">
                <i className="fas fa-shield-alt text-[#2185D0] mt-0.5 text-sm shrink-0"></i>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  <strong>Sécurité des données :</strong> Seul l'index actuel de l'équipement sera actualisé. Toutes les autres données techniques restent strictement inchangées.
                </p>
              </div>

              {/* Messages d'état */}
              {indexErrorMessage && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 flex items-center space-x-2">
                  <i className="fas fa-exclamation-circle text-red-500"></i>
                  <span>{indexErrorMessage}</span>
                </div>
              )}

              {indexSuccessMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center space-x-2">
                  <i className="fas fa-check-circle text-emerald-600"></i>
                  <span>{indexSuccessMessage}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingIndexMachine(null)}
                  disabled={isSavingIndex}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveIndexOnly}
                  disabled={isSavingIndex}
                  className="flex-1 py-3.5 bg-[#2185D0] hover:bg-[#1a6fb0] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-[#2185D0]/20 transition-all flex items-center justify-center space-x-2 active:scale-95"
                >
                  {isSavingIndex ? (
                    <>
                      <i className="fas fa-spinner fa-spin text-xs"></i>
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check text-xs"></i>
                      <span>Valider l'Index</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dédié : Modification Exclusive des Quantités de Consommables */}
      {editingConsumablesMachine && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 my-auto animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 md:p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 bg-[#2185D0] rounded-2xl flex items-center justify-center text-white shadow-md shadow-[#2185D0]/30">
                  <i className="fas fa-sliders-h text-lg"></i>
                </div>
                <div>
                  <h3 className="font-black text-base md:text-lg uppercase tracking-tight">Consommables & Tarification</h3>
                  <p className="text-slate-400 text-xs font-medium">
                    Mise à jour des quantités uniquement
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEditingConsumablesMachine(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </div>

            {/* Corps */}
            <div className="p-5 md:p-6 space-y-5">
              {/* Info machine */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-900 uppercase italic">
                    {editingConsumablesMachine.customerName}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 font-mono">
                    {editingConsumablesMachine.model} {editingConsumablesMachine.site ? `• ${editingConsumablesMachine.site}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-[#2185D0] bg-[#2185D0]/10 px-2 py-0.5 rounded-full border border-[#2185D0]/20 uppercase">
                    Consommables
                  </span>
                </div>
              </div>

              {/* 4 champs de quantités */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Filtre à Gasoil */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                      Filtre à Gasoil
                    </label>
                    <span className="text-[9px] font-mono font-bold text-slate-400 truncate max-w-[110px]" title={editingConsumablesMachine.fuelFilterRef}>
                      {editingConsumablesMachine.fuelFilterRef || 'Std'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={tempFuelFilterQty}
                      onChange={(e) => setTempFuelFilterQty(e.target.value)}
                      className="w-full bg-white border-2 border-slate-200 focus:border-[#2185D0] rounded-xl px-3 py-2 text-slate-900 font-mono text-sm font-black focus:outline-none transition-all pr-14"
                      placeholder="1"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                      unité(s)
                    </span>
                  </div>
                </div>

                {/* 2. Filtre à Huile */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                      Filtre à Huile
                    </label>
                    <span className="text-[9px] font-mono font-bold text-slate-400 truncate max-w-[110px]" title={editingConsumablesMachine.oilFilterRef}>
                      {editingConsumablesMachine.oilFilterRef || 'Std'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={tempOilFilterQty}
                      onChange={(e) => setTempOilFilterQty(e.target.value)}
                      className="w-full bg-white border-2 border-slate-200 focus:border-[#2185D0] rounded-xl px-3 py-2 text-slate-900 font-mono text-sm font-black focus:outline-none transition-all pr-14"
                      placeholder="1"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                      unité(s)
                    </span>
                  </div>
                </div>

                {/* 3. Filtre Décompteur (Séparateur) */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                      Filtre Décompteur
                    </label>
                    <span className="text-[9px] font-mono font-bold text-slate-400 truncate max-w-[110px]" title={editingConsumablesMachine.separatorRef}>
                      {editingConsumablesMachine.separatorRef || 'Std'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={tempSeparatorQty}
                      onChange={(e) => setTempSeparatorQty(e.target.value)}
                      className="w-full bg-white border-2 border-slate-200 focus:border-[#2185D0] rounded-xl px-3 py-2 text-slate-900 font-mono text-sm font-black focus:outline-none transition-all pr-14"
                      placeholder="1"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                      unité(s)
                    </span>
                  </div>
                </div>

                {/* 4. Quantité d'Huile */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                      Quantité d'Huile
                    </label>
                    <span className="text-[9px] font-mono font-bold text-slate-400 truncate max-w-[110px]" title={editingConsumablesMachine.oilRef}>
                      {editingConsumablesMachine.oilRef || 'Moteur'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={tempOilQty}
                      onChange={(e) => setTempOilQty(e.target.value)}
                      className="w-full bg-white border-2 border-slate-200 focus:border-[#2185D0] rounded-xl px-3 py-2 text-slate-900 font-mono text-sm font-black focus:outline-none transition-all pr-14"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                      Litres
                    </span>
                  </div>
                </div>
              </div>

              {/* Garantie d'intégrité des données */}
              <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 flex items-start space-x-2.5">
                <i className="fas fa-shield-alt text-[#2185D0] mt-0.5 text-sm shrink-0"></i>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  <strong>Sécurité des données :</strong> Seules les quantités de ces 4 consommables seront mises à jour. Les références, tarifs, index horaires et historiques d'intervention restent strictement inchangés.
                </p>
              </div>

              {/* Messages d'état */}
              {consumablesErrorMessage && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 flex items-center space-x-2">
                  <i className="fas fa-exclamation-circle text-red-500"></i>
                  <span>{consumablesErrorMessage}</span>
                </div>
              )}

              {consumablesSuccessMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center space-x-2">
                  <i className="fas fa-check-circle text-emerald-600"></i>
                  <span>{consumablesSuccessMessage}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingConsumablesMachine(null)}
                  disabled={isSavingConsumables}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveConsumablesOnly}
                  disabled={isSavingConsumables}
                  className="flex-1 py-3.5 bg-[#2185D0] hover:bg-[#1a6fb0] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-[#2185D0]/20 transition-all flex items-center justify-center space-x-2 active:scale-95"
                >
                  {isSavingConsumables ? (
                    <>
                      <i className="fas fa-spinner fa-spin text-xs"></i>
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check text-xs"></i>
                      <span>Enregistrer les Quantités</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceList;
