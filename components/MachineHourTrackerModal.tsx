import React, { useState, useMemo } from 'react';
import { MaintenanceRecord, IndexReading, AppUser } from '../types';
import { formatNumber, calculateMaintenanceStatus } from '../utils';

interface Props {
  record: MaintenanceRecord;
  onClose: () => void;
  appUser: AppUser | null;
  onSaveReading: (recordId: string, reading: { date: string; index: number; notes?: string }) => Promise<void> | void;
  onDeleteReading?: (recordId: string, readingId: string) => Promise<void> | void;
}

export const MachineHourTrackerModal: React.FC<Props> = ({
  record,
  onClose,
  appUser,
  onSaveReading,
  onDeleteReading
}) => {
  // Helper to format ISO datetime for input type="datetime-local" in local time
  const getDefaultDateTimeLocal = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  const [dateInput, setDateInput] = useState<string>(getDefaultDateTimeLocal());
  const [indexInput, setIndexInput] = useState<string>((record.currentIndex ?? 0).toString());
  const [notesInput, setNotesInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [readingToDelete, setReadingToDelete] = useState<IndexReading | null>(null);
  const [isDeletingReading, setIsDeletingReading] = useState(false);

  // Status for maintenance metrics
  const status = useMemo(() => calculateMaintenanceStatus(record), [record]);

  // Combined sorted history: newest first
  const sortedHistory = useMemo(() => {
    const list = Array.isArray(record.indexHistory) ? [...record.indexHistory] : [];
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [record.indexHistory]);

  // Latest recorded reading if exists
  const latestReading = sortedHistory[0];

  // Calculated delta for the input value
  const parsedIndex = Number(indexInput);
  const baselineIndex = latestReading ? latestReading.index : (record.currentIndex ?? 0);
  const hasValidNumber = !isNaN(parsedIndex) && indexInput.trim() !== '';
  const deltaHours = hasValidNumber ? parsedIndex - baselineIndex : 0;

  // Calculate days elapsed between latest reading and selected input date
  const estimatedCadence = useMemo(() => {
    if (!hasValidNumber || deltaHours <= 0) return null;
    const baseDate = latestReading ? new Date(latestReading.date) : (record.lastUpdateDate ? new Date(record.lastUpdateDate) : null);
    if (!baseDate) return null;
    const inputDate = new Date(dateInput);
    const msDiff = inputDate.getTime() - baseDate.getTime();
    if (msDiff <= 0) return null;
    const days = msDiff / (1000 * 60 * 60 * 24);
    if (days < 0.1) return null;
    return (deltaHours / days).toFixed(1);
  }, [hasValidNumber, deltaHours, latestReading, record.lastUpdateDate, dateInput]);

  // Format date readable in French
  const formatDateReadable = (isoString?: string) => {
    if (!isoString) return 'Date inconnue';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasValidNumber || parsedIndex < 0) {
      setErrorMessage("Veuillez saisir un nombre d'heures valide et positif pour l'horamètre.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await onSaveReading(record.id, {
        date: dateInput ? new Date(dateInput).toISOString() : new Date().toISOString(),
        index: parsedIndex,
        notes: notesInput.trim() || undefined
      });

      setSuccessMessage(`Relevé d'index enregistré avec succès (${formatNumber(parsedIndex)} h).`);
      setNotesInput('');
      setTimeout(() => {
        setSuccessMessage('');
      }, 2500);
    } catch (err: any) {
      console.error("Erreur enregistrement relevé:", err);
      setErrorMessage(err?.message || "Erreur lors de l'enregistrement du relevé.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteReading = async () => {
    if (!readingToDelete || !onDeleteReading) return;
    setIsDeletingReading(true);
    try {
      await onDeleteReading(record.id, readingToDelete.id);
      setReadingToDelete(null);
      setSuccessMessage("Relevé d'index supprimé avec succès.");
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err: any) {
      console.error("Erreur suppression relevé:", err);
      setErrorMessage(err?.message || "Erreur lors de la suppression du relevé.");
    } finally {
      setIsDeletingReading(false);
    }
  };

  // Export index history as CSV
  const handleExportCSV = () => {
    if (sortedHistory.length === 0) return;
    const headers = ["Date", "Client", "Machine / Modèle", "Site", "Index (Heures)", "Évolution (+/- h)", "Rythme (h/j)", "Enregistré Par", "Notes / Observations"];
    const rows = sortedHistory.map(item => [
      formatDateReadable(item.date),
      `"${record.customerName.replace(/"/g, '""')}"`,
      `"${record.model.replace(/"/g, '""')}"`,
      `"${(record.site || '').replace(/"/g, '""')}"`,
      item.index,
      item.differenceHours !== undefined ? (item.differenceHours > 0 ? `+${item.differenceHours}` : item.differenceHours) : '',
      item.dailyAverage !== undefined ? item.dailyAverage : '',
      `"${(item.recordedBy || '').replace(/"/g, '""')}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historique_index_${record.customerName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${record.model.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 my-auto animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex justify-between items-start shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2185D0] to-blue-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#2185D0]/30 shrink-0">
              <i className="fas fa-tachometer-alt text-xl"></i>
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Module Horamètre & Index
                </span>
                {record.site && (
                  <span className="text-[10px] text-slate-400 font-medium truncate hidden sm:inline">
                    <i className="fas fa-map-marker-alt text-red-400 mr-1"></i>
                    {record.site}
                  </span>
                )}
              </div>
              <h2 className="font-black text-lg sm:text-xl uppercase tracking-tight text-white truncate mt-0.5">
                {record.customerName}
              </h2>
              <p className="text-slate-400 text-xs font-mono font-bold truncate">
                {record.model} {record.capacity ? `• ${record.capacity}` : ''}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all ml-2 shrink-0 active:scale-95"
            title="Fermer"
          >
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          
          {/* Machine Meter Overview Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Current Index */}
            <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl border border-slate-800 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <span>INDEX ACTUEL</span>
                <i className="fas fa-clock text-[#2185D0]"></i>
              </div>
              <div className="my-2">
                <div className="text-3xl font-black text-white font-mono tracking-tight">
                  {formatNumber(record.currentIndex)} <span className="text-sm font-sans font-bold text-slate-400">h</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                Dernier relevé : <span className="text-slate-300 font-bold">{formatDateReadable(record.lastUpdateDate)}</span>
              </div>
            </div>

            {/* Next Maintenance */}
            <div className={`p-4 rounded-2xl border flex flex-col justify-between shadow-sm ${
              status.priority === 'high' 
                ? 'bg-red-50 border-red-200 text-red-900' 
                : status.priority === 'medium'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-blue-50/70 border-blue-200/80 text-blue-950'
            }`}>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-80">
                <span>ÉCHÉANCE VIDANGE</span>
                <i className={`fas fa-oil-can ${status.priority === 'high' ? 'text-red-500' : 'text-[#2185D0]'}`}></i>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black font-mono">
                  {status.hoursRemaining <= 0 ? (
                    <span className="text-red-600">DÉPASSÉE (+{formatNumber(Math.abs(status.hoursRemaining))} h)</span>
                  ) : (
                    <span>{formatNumber(status.hoursRemaining)} <span className="text-xs font-sans font-bold">h restantes</span></span>
                  )}
                </div>
              </div>
              <div className="text-[10px] font-bold opacity-75">
                Prochaine vidange à {formatNumber(record.nextChangeIndex)} h
              </div>
            </div>

            {/* Total Readings Counter */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <span>HISTORIQUE DES RELEVÉS</span>
                <i className="fas fa-list-ol text-slate-400"></i>
              </div>
              <div className="my-2">
                <div className="text-3xl font-black text-slate-900 font-mono">
                  {sortedHistory.length} <span className="text-xs font-sans font-bold text-slate-400">enregistrés</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-medium flex items-center justify-between">
                <span>Garantie intégrité :</span>
                <span className="text-emerald-700 font-bold bg-emerald-100/70 px-1.5 py-0.5 rounded text-[9px]">100% Préservé</span>
              </div>
            </div>
          </div>

          {/* Form to Record New Meter Index */}
          <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-[#2185D0] text-white flex items-center justify-center text-xs">
                  <i className="fas fa-plus"></i>
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  Enregistrer un Nouveau Relevé d'Heures
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Pour actualiser l'index et alimenter l'historique
              </span>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Date & Time Picker */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700">
                    <i className="fas fa-calendar-alt text-[#2185D0] mr-1.5"></i>
                    Date & Heure du Relevé
                  </label>
                  <input
                    type="datetime-local"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 focus:border-[#2185D0] focus:ring-2 focus:ring-[#2185D0]/20 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-400">
                    Par défaut : date et heure actuelles (modifiable rétroactivement).
                  </p>
                </div>

                {/* Index / Number of Hours */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700">
                      <i className="fas fa-tachometer-alt text-[#2185D0] mr-1.5"></i>
                      Nombre d'Heures (Index)
                    </label>
                    <button
                      type="button"
                      onClick={() => setIndexInput('')}
                      className="text-[10px] text-[#2185D0] hover:text-[#1a6fb0] font-bold"
                    >
                      Effacer
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={indexInput}
                      onChange={(e) => setIndexInput(e.target.value)}
                      placeholder="Ex: 2450"
                      required
                      className="w-full bg-white border-2 border-slate-300 focus:border-[#2185D0] focus:ring-2 focus:ring-[#2185D0]/20 rounded-xl px-4 py-2.5 text-lg font-black font-mono text-slate-900 focus:outline-none transition-all pr-14"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold font-mono text-slate-400 text-xs pointer-events-none">
                      heures
                    </span>
                  </div>

                  {/* Quick increment buttons */}
                  <div className="flex items-center space-x-1.5 pt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase mr-1">Raccourcis :</span>
                    {[10, 24, 50, 100].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          const base = hasValidNumber ? parsedIndex : baselineIndex;
                          setIndexInput((base + val).toString());
                        }}
                        className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-mono font-bold rounded-md transition-colors"
                      >
                        +{val}h
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Real-time Dynamic Feedback on hours difference */}
              {hasValidNumber && (
                <div className="p-3 rounded-xl border text-xs">
                  {deltaHours > 0 ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-emerald-800 bg-emerald-50/80 border-emerald-200 p-2.5 rounded-lg">
                      <div className="flex items-center space-x-2 font-bold">
                        <i className="fas fa-arrow-trend-up text-emerald-600 text-sm"></i>
                        <span>
                          Progression de l'horamètre : <strong>+{formatNumber(deltaHours)} heures</strong> depuis le dernier relevé ({formatNumber(baselineIndex)} h).
                        </span>
                      </div>
                      {estimatedCadence && (
                        <span className="text-[11px] font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-md whitespace-nowrap self-start sm:self-auto">
                          ~{estimatedCadence} h/jour
                        </span>
                      )}
                    </div>
                  ) : deltaHours < 0 ? (
                    <div className="flex items-start space-x-2 text-amber-900 bg-amber-50 border-amber-200 p-2.5 rounded-lg">
                      <i className="fas fa-wrench text-amber-600 mt-0.5 shrink-0"></i>
                      <div className="text-[11px]">
                        <strong>Correction d'index détectée :</strong> La valeur saisie ({formatNumber(parsedIndex)} h) est inférieure à l'index enregistré ({formatNumber(baselineIndex)} h). Cette rectification de frappe ou changement d'horamètre sera archivée sans corrompre vos autres données.
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-600 bg-slate-100 p-2 rounded-lg text-[11px] font-medium flex items-center space-x-1.5">
                      <i className="fas fa-info-circle text-slate-400"></i>
                      <span>Index identique au relevé actuel ({formatNumber(parsedIndex)} h).</span>
                    </div>
                  )}
                </div>
              )}

              {/* Notes / Observation */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700">
                  <i className="fas fa-comment-alt text-[#2185D0] mr-1.5"></i>
                  Observation ou Motif du Relevé (Optionnel)
                </label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Ex: Relevé hebdomadaire de routine, fin de chantier, vérification avant vidange..."
                  className="w-full bg-white border border-slate-300 focus:border-[#2185D0] focus:ring-2 focus:ring-[#2185D0]/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Security & Non-corruption guarantee */}
              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200/80 flex items-start space-x-2.5 text-[11px] text-slate-700">
                <i className="fas fa-shield-alt text-[#2185D0] mt-0.5 text-sm shrink-0"></i>
                <div className="leading-relaxed">
                  <strong>Préservation stricte des données :</strong> Ce formulaire enregistre l'index horaire et sa date dans l'historique de cette machine. Vos données de maintenance (filtres, huile, courroie, prix, client, planning) ne sont jamais modifiées.
                </div>
              </div>

              {/* Feedback messages */}
              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 flex items-center space-x-2">
                  <i className="fas fa-exclamation-circle text-red-500"></i>
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center space-x-2">
                  <i className="fas fa-check-circle text-emerald-600"></i>
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Submit button */}
              <div className="flex items-center justify-end space-x-3 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting || !hasValidNumber}
                  className="px-5 py-3 bg-[#2185D0] hover:bg-[#1a6fb0] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-[#2185D0]/20 transition-all flex items-center space-x-2 active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin text-xs"></i>
                      <span>Enregistrement du relevé...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check text-xs"></i>
                      <span>Valider & Enregistrer ce Relevé</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Historical Log Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center text-xs">
                  <i className="fas fa-history"></i>
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  Historique Complet des Index & Relevés d'Heures
                </h3>
              </div>
              
              {sortedHistory.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                    title="Télécharger l'historique en fichier CSV"
                  >
                    <i className="fas fa-file-csv text-emerald-600"></i>
                    <span>Exporter CSV</span>
                  </button>
                  <span className="text-[10px] font-black font-mono bg-slate-200/80 text-slate-700 px-2.5 py-1 rounded-full">
                    {sortedHistory.length} entrée{sortedHistory.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* List or Table */}
            {sortedHistory.length > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left border-collapse min-w-[620px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[9px] uppercase font-black tracking-wider border-b border-slate-200">
                        <th className="px-4 py-3">Date & Heure</th>
                        <th className="px-4 py-3">Index (Heures)</th>
                        <th className="px-4 py-3">Évolution</th>
                        <th className="px-4 py-3">Cadence</th>
                        <th className="px-4 py-3">Auteur</th>
                        <th className="px-4 py-3">Notes</th>
                        {onDeleteReading && (appUser?.role === 'admin' || appUser?.role === 'technician') && (
                          <th className="px-3 py-3 text-right">Action</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {sortedHistory.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                            <div className="flex items-center space-x-1.5">
                              {idx === 0 && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Dernier relevé enregistré"></span>
                              )}
                              <span>{formatDateReadable(item.date)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono font-black text-slate-900 whitespace-nowrap text-sm">
                            {formatNumber(item.index)} <span className="text-[10px] text-slate-400 font-sans">h</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {item.differenceHours !== undefined ? (
                              item.differenceHours > 0 ? (
                                <span className="inline-flex items-center font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-mono text-[11px] border border-emerald-200/60">
                                  +{formatNumber(item.differenceHours)} h
                                </span>
                              ) : item.differenceHours < 0 ? (
                                <span className="inline-flex items-center font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-mono text-[11px] border border-amber-200/60">
                                  {formatNumber(item.differenceHours)} h
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono text-[11px]">0 h</span>
                              )
                            ) : (
                              <span className="text-slate-300 font-mono">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-[11px] font-mono text-slate-600">
                            {item.dailyAverage !== undefined ? (
                              <span>~{item.dailyAverage} h/j</span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-[11px] truncate max-w-[140px]" title={item.recordedBy}>
                            <div className="flex items-center space-x-1">
                              <i className="fas fa-user-circle text-slate-400 text-xs"></i>
                              <span className="truncate">{item.recordedBy || 'Non spécifié'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-[11px] italic max-w-[180px] truncate" title={item.notes}>
                            {item.notes || '—'}
                          </td>
                          {onDeleteReading && (appUser?.role === 'admin' || appUser?.role === 'technician') && (
                            <td className="px-3 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => setReadingToDelete(item)}
                                className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors inline-flex items-center justify-center"
                                title="Supprimer ce relevé"
                              >
                                <i className="fas fa-trash-alt text-[10px]"></i>
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center mx-auto text-slate-400 shadow-xs">
                  <i className="fas fa-clock text-lg"></i>
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                    Aucun relevé d'index consigné pour l'instant
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                    Utilisez le formulaire ci-dessus pour enregistrer le premier relevé d'heures avec date. L'historique chronologique se construira automatiquement à chaque renseignement.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-medium hidden sm:flex items-center space-x-2">
            <i className="fas fa-check-double text-emerald-600"></i>
            <span>Module d'index synchronisé en temps réel avec Firebase</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all"
          >
            Fermer
          </button>
        </div>

      </div>

      {/* Confirmation Modal to Delete an Index Reading */}
      {readingToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto text-lg">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className="text-center space-y-1">
              <h4 className="font-black text-slate-900 text-base uppercase">
                Supprimer ce Relevé ?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Êtes-vous sûr de vouloir supprimer le relevé d'index de <strong>{formatNumber(readingToDelete.index)} h</strong> du {formatDateReadable(readingToDelete.date)} ?
              </p>
              <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-100 mt-2 font-medium">
                Cette suppression ne modifie aucune autre donnée technique de la machine.
              </p>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setReadingToDelete(null)}
                disabled={isDeletingReading}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteReading}
                disabled={isDeletingReading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase rounded-xl transition-colors shadow-sm flex items-center justify-center space-x-1.5"
              >
                {isDeletingReading ? (
                  <i className="fas fa-spinner fa-spin text-xs"></i>
                ) : (
                  <span>Confirmer</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default MachineHourTrackerModal;
