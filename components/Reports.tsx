
import React, { useState, useMemo } from 'react';
import { MaintenanceRecord, ArchivedDocument, Intervention } from '../types';
import { formatNumber } from '../utils';

interface ReportsProps {
  records: MaintenanceRecord[];
  archivedDocs: ArchivedDocument[];
  onDeleteDoc?: (id: string) => void;
  onDeleteIntervention: (recordId: string, interventionId: string) => void;
}

const Reports: React.FC<ReportsProps> = ({ records, archivedDocs, onDeleteDoc, onDeleteIntervention }) => {
  const [showInterventions, setShowInterventions] = useState(false);

  const totalMachines = records.length;
  const totalRevenue = archivedDocs.filter(d => d.type === 'invoice').reduce((acc, d) => acc + d.totalAmount, 0);
  const totalInterventions = records.reduce((acc, r) => acc + (r.interventions || []).length, 0);

  const allInterventions = useMemo(() => {
    const list: (Intervention & { customerName: string; model: string; recordId: string })[] = [];
    records.forEach(r => {
      (r.interventions || []).forEach(i => {
        list.push({ ...i, customerName: r.customerName, model: r.model, recordId: r.id });
      });
    });
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records]);

  const stats = [
    { label: 'Parc Total', value: `${totalMachines} Machines`, icon: 'fa-box-open', color: 'bg-blue-50 text-blue-600' },
    { label: 'Chiffre d\'Affaires', value: `${formatNumber(totalRevenue)} FCFA`, icon: 'fa-money-bill-wave', color: 'bg-green-50 text-green-600' },
    { 
      label: 'Interventions', 
      value: `${totalInterventions} Réalisées`, 
      icon: 'fa-tools', 
      color: 'bg-purple-50 text-purple-600',
      clickable: true,
      onClick: () => setShowInterventions(true)
    },
  ];

  if (showInterventions) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <button 
              onClick={() => setShowInterventions(false)}
              className="text-[#2185D0] text-xs font-black uppercase tracking-widest flex items-center mb-2 hover:underline"
            >
              <i className="fas fa-arrow-left mr-2"></i> Retour aux Rapports
            </button>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Historique Global des Interventions</h2>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Machine / Client</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Index</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Détails</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {allInterventions.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-6 py-4 text-xs font-bold text-slate-500">
                    {new Date(item.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-black text-slate-900 uppercase italic">{item.customerName}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{item.model}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black uppercase px-2 py-1 bg-purple-50 text-purple-600 rounded-lg">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-slate-700 mono">
                    {formatNumber(item.index)} H
                  </td>
                  <td className="px-6 py-4 text-[10px] text-slate-500 font-medium max-w-xs truncate">
                    {item.details || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onDeleteIntervention(item.recordId, item.id)}
                      className="w-10 h-10 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all flex items-center justify-center ml-auto shadow-sm"
                      title="Supprimer l'intervention"
                    >
                      <i className="fas fa-trash-alt text-sm"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {allInterventions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                    Aucune intervention enregistrée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Rapports & Statistiques</h2>
        <p className="text-slate-500 text-sm">Aperçu de l'activité Brel Energie</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div 
            key={i} 
            onClick={stat.onClick}
            className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-5 transition-all ${stat.clickable ? 'cursor-pointer hover:shadow-md hover:border-[#2185D0]/30 group' : ''}`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-transform ${stat.clickable ? 'group-hover:scale-110' : ''} ${stat.color}`}>
              <i className={`fas ${stat.icon}`}></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-lg font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">Dernières Factures</h3>
          <div className="space-y-4">
            {archivedDocs.filter(d => d.type === 'invoice').slice(0, 5).map(doc => (
              <div key={doc.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0 group">
                <div>
                  <p className="text-xs font-bold text-slate-900">{doc.customerName}</p>
                  <p className="text-[10px] text-slate-400">{new Date(doc.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <p className="text-xs font-black text-[#2185D0]">{formatNumber(doc.totalAmount)} FCFA</p>
                  {onDeleteDoc && (
                    <button 
                      onClick={() => onDeleteDoc(doc.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1"
                      title="Supprimer"
                    >
                      <i className="fas fa-trash-alt text-[10px]"></i>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">Machines Critiques</h3>
          <div className="space-y-4">
            {records
              .filter(r => (r.nextChangeIndex - r.currentIndex) <= 50)
              .slice(0, 5)
              .map(record => (
                <div key={record.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{record.customerName} - {record.model}</p>
                    <p className="text-[10px] text-red-500 font-black uppercase">Vidange dans {record.nextChangeIndex - record.currentIndex}h</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
