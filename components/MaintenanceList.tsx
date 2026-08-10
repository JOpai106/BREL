
import React, { useState, useMemo } from 'react';
import { MaintenanceRecord, AppUser } from '../types';
import { calculateMaintenanceStatus, formatNumber } from '../utils';

interface Props {
  records: MaintenanceRecord[];
  onDelete: (id: string) => void;
  onEdit: (record: MaintenanceRecord) => void;
  appUser: AppUser | null;
}

const MaintenanceList: React.FC<Props> = ({ records, onDelete, onEdit, appUser }) => {
  const [searchTerm, setSearchTerm] = useState('');

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
                          <p className="text-[9px] md:text-[10px] text-slate-400 font-mono font-bold tracking-tight truncate">{record.model}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 md:px-8 py-4 md:py-6">
                      <div className="text-[9px] md:text-[10px] font-mono font-bold text-slate-500 space-y-0.5">
                        <p><span className="text-[#2185D0]">O:</span> {record.oilFilterRef || 'Std'}</p>
                        <p><span className="text-[#2185D0]">F:</span> {record.fuelFilterRef || 'Std'}</p>
                        {record.separatorRef && <p><span className="text-[#2185D0]">S:</span> {record.separatorRef}</p>}
                      </div>
                    </td>
                    <td className="px-5 md:px-8 py-4 md:py-6">
                      <div className="mono text-[10px] md:text-xs font-black text-slate-700">
                        {formatNumber(record.currentIndex)} H
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
                          <button onClick={() => onEdit(record)} className="p-2 md:p-3 bg-slate-50 text-slate-400 hover:text-[#2185D0] hover:bg-white rounded-lg md:rounded-xl transition-all border border-slate-100 shadow-sm">
                            <i className="fas fa-edit text-xs md:text-sm"></i>
                          </button>
                          <button onClick={() => onDelete(record.id)} className="p-2 md:p-3 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg md:rounded-xl transition-all border border-slate-100 shadow-sm">
                            <i className="fas fa-trash-alt text-xs md:text-sm"></i>
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
    </div>
  );
};

export default MaintenanceList;
