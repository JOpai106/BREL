
import React, { useState, useEffect } from 'react';
import { MaintenanceRecord } from '../types';
import { FILTER_MAPPINGS, ALL_REFS } from '../src/data/filterData';

interface Props {
  onSave: (record: Omit<MaintenanceRecord, 'id' | 'lastUpdateDate' | 'interventions'>) => void;
  initialData?: MaintenanceRecord;
}

interface RefInputProps {
  value: string;
  field: 'oilFilterRef' | 'fuelFilterRef' | 'airFilterRef' | 'oilRef' | 'beltRef' | 'separatorRef';
  label: string;
  formData: any;
  setFormData: (data: any) => void;
  getModelMapping: () => any;
  ALL_REFS: string[];
  inputClass: string;
}

const RefInput: React.FC<RefInputProps> = ({ value, field, label, formData, setFormData, getModelMapping, ALL_REFS, inputClass }) => {
  const mapping = getModelMapping();
  let specificRefs: string[] = [];
  
  if (mapping) {
    const mapField = field === 'oilFilterRef' ? 'oil' : 
                     field === 'fuelFilterRef' ? 'fuel' : 
                     field === 'airFilterRef' ? 'air' : 
                     field === 'beltRef' ? 'belt' : 
                     field === 'separatorRef' ? 'separator' : null;
    
    if (mapField) {
      const val = mapping[mapField];
      if (Array.isArray(val)) specificRefs = val;
      else if (val) specificRefs = [val];
    }
  }

  return (
    <div className="relative">
      <input 
        list={`${field}-list`}
        value={value} 
        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })} 
        className={inputClass}
        placeholder={`Réf. ${label}`}
      />
      <datalist id={`${field}-list`}>
        {specificRefs.length > 0 ? specificRefs.map(ref => (
          <option key={ref} value={ref} />
        )) : ALL_REFS.map(ref => (
          <option key={ref} value={ref} />
        ))}
      </datalist>
    </div>
  );
};

const MaintenanceForm: React.FC<Props> = ({ onSave, initialData }) => {
  const [formData, setFormData] = useState({
    customerName: initialData?.customerName || '',
    clientEmail: initialData?.clientEmail || '',
    clientPhone: initialData?.clientPhone || '',
    site: initialData?.site || '',
    model: initialData?.model || '',
    capacity: initialData?.capacity || '',
    oilFilterRef: initialData?.oilFilterRef || '',
    fuelFilterRef: initialData?.fuelFilterRef || '',
    airFilterRef: initialData?.airFilterRef || '',
    separatorRef: initialData?.separatorRef || '',
    oilRef: initialData?.oilRef || '',
    lastChangeIndex: initialData?.lastChangeIndex || 0,
    lastChangeDate: initialData?.lastChangeDate || new Date().toISOString().split('T')[0],
    nextChangeIndex: initialData?.nextChangeIndex || 250,
    lastBeltChangeIndex: initialData?.lastBeltChangeIndex || 0,
    nextBeltChangeIndex: initialData?.nextBeltChangeIndex || 1000,
    beltRef: initialData?.beltRef || '',
    currentIndex: initialData?.currentIndex || 0,
    dailyHours: initialData?.dailyHours || 8,
    oilQuantity: initialData?.oilQuantity || 0,
    oilPrice: initialData?.oilPrice || 0,
    oilFilterPrice: initialData?.oilFilterPrice || 0,
    fuelFilterPrice: initialData?.fuelFilterPrice || 0,
    airFilterPrice: initialData?.airFilterPrice || 0,
    separatorPrice: initialData?.separatorPrice || 0,
    laborPrice: initialData?.laborPrice || 0,
    lat: initialData?.lat || undefined,
    lng: initialData?.lng || undefined,
  });

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData(prev => ({
          ...prev,
          lat: parseFloat(position.coords.latitude.toFixed(6)),
          lng: parseFloat(position.coords.longitude.toFixed(6))
        }));
      }, (error) => {
        console.error("Error getting location:", error);
        alert("Impossible de récupérer la position. Veuillez l'entrer manuellement.");
      });
    } else {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
    }
  };

  // Automatic filter selection based on model
  useEffect(() => {
    if (!formData.model || initialData) return;
    
    const upperModel = formData.model.toUpperCase();
    // Try exact match or partial match
    const modelKey = Object.keys(FILTER_MAPPINGS).find(k => 
      upperModel.includes(k) || k.includes(upperModel)
    );

    if (modelKey) {
      const mapping = FILTER_MAPPINGS[modelKey];
      const getFirst = (val: string | string[] | undefined) => Array.isArray(val) ? val[0] : val;
      
      setFormData(prev => ({
        ...prev,
        oilFilterRef: getFirst(mapping.oil) || mapping.oilAlt || prev.oilFilterRef,
        fuelFilterRef: getFirst(mapping.fuel) || mapping.fuelAlt || prev.fuelFilterRef,
        airFilterRef: getFirst(mapping.air) || mapping.airAlt || prev.airFilterRef,
        separatorRef: getFirst(mapping.separator) || prev.separatorRef,
        oilFilterPrice: mapping.oilPrice || prev.oilFilterPrice,
        fuelFilterPrice: mapping.fuelPrice || prev.fuelFilterPrice,
        airFilterPrice: mapping.airPrice || prev.airFilterPrice,
        separatorPrice: mapping.separatorPrice || prev.separatorPrice,
        beltRef: getFirst(mapping.belt) || prev.beltRef,
      }));
    }
  }, [formData.model, initialData]);

  // Automatic daily hours calculation
  useEffect(() => {
    if (formData.lastChangeDate && formData.currentIndex > formData.lastChangeIndex) {
      const start = new Date(formData.lastChangeDate);
      const end = new Date(); // Use current date as reference for "current index"
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      
      const hoursUsed = formData.currentIndex - formData.lastChangeIndex;
      const calculatedRegime = parseFloat((hoursUsed / diffDays).toFixed(1));
      
      if (calculatedRegime > 0 && calculatedRegime !== formData.dailyHours) {
        setFormData(prev => ({ ...prev, dailyHours: calculatedRegime }));
      }
    }
  }, [formData.lastChangeDate, formData.currentIndex, formData.lastChangeIndex]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFormData = { ...formData };
    if (cleanFormData.lat === undefined) delete cleanFormData.lat;
    if (cleanFormData.lng === undefined) delete cleanFormData.lng;

    const finalData = {
      ...cleanFormData,
      clientEmail: formData.clientEmail?.toLowerCase().trim() || '',
      clientPhone: formData.clientPhone?.trim() || ''
    };
    onSave(finalData);
    if (!initialData) {
      setFormData({
        customerName: '',
        clientEmail: '',
        clientPhone: '',
        site: '',
        model: '',
        capacity: '',
        oilFilterRef: '',
        fuelFilterRef: '',
        airFilterRef: '',
        separatorRef: '',
        oilRef: '',
        lastChangeIndex: 0,
        lastChangeDate: new Date().toISOString().split('T')[0],
        nextChangeIndex: 250,
        lastBeltChangeIndex: 0,
        nextBeltChangeIndex: 1000,
        beltRef: '',
        currentIndex: 0,
        dailyHours: 8,
        oilQuantity: 0,
        oilPrice: 0,
        oilFilterPrice: 0,
        fuelFilterPrice: 0,
        airFilterPrice: 0,
        separatorPrice: 0,
        laborPrice: 0,
        lat: undefined,
        lng: undefined,
      });
    }
  };

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 md:py-3 text-slate-900 focus:outline-none focus:border-[#2185D0] focus:ring-4 focus:ring-[#2185D0]/5 transition-all mono text-xs md:text-sm placeholder:text-slate-400 disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed";
  const labelClass = "block text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 md:mb-2";

  const getModelMapping = () => {
    if (!formData.model) return null;
    const upperModel = formData.model.toUpperCase();
    const modelKey = Object.keys(FILTER_MAPPINGS).find(k => 
      upperModel.includes(k) || k.includes(upperModel)
    );
    return modelKey ? FILTER_MAPPINGS[modelKey] : null;
  };

  return (
    <div className="max-w-4xl mx-auto px-0 md:px-4">
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-5 md:p-12 rounded-2xl md:rounded-3xl shadow-xl shadow-slate-200/50 space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center space-x-4 md:space-x-5 mb-2 md:mb-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-[#2185D0]/5 border border-[#2185D0]/10 rounded-xl md:rounded-2xl flex items-center justify-center">
            <i className="fas fa-tools text-[#2185D0] text-lg md:text-xl"></i>
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight italic">Initialisation <span className="text-[#2185D0]">Technique</span></h3>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium">Paramètres et tarifs de l'unité</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-8">
          <div>
            <label className={labelClass}>Client</label>
            <input type="text" required value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} className={inputClass} placeholder="Nom Entreprise" />
          </div>
          <div>
            <label className={labelClass}>Téléphone Client (Notification)</label>
            <input type="tel" value={formData.clientPhone} onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })} className={inputClass} placeholder="ex: +242 06 600 1122" />
          </div>
          <div>
            <label className={labelClass}>Email Client (Accès)</label>
            <input type="email" value={formData.clientEmail} onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })} className={inputClass} placeholder="email@client.com" />
          </div>
          <div>
            <label className={labelClass}>Site / Localisation</label>
            <input type="text" value={formData.site} onChange={(e) => setFormData({ ...formData, site: e.target.value })} className={inputClass} placeholder="ex: Pointe-Noire" />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <label className={labelClass}>Coordonnées GPS (Optionnel)</label>
            <div className="flex space-x-2">
              <input 
                type="number" 
                step="0.000001" 
                value={formData.lat !== undefined ? formData.lat : ''} 
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, lat: val === '' ? undefined : parseFloat(val) });
                }} 
                className={`${inputClass} flex-1`} 
                placeholder="Lat" 
              />
              <input 
                type="number" 
                step="0.000001" 
                value={formData.lng !== undefined ? formData.lng : ''} 
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, lng: val === '' ? undefined : parseFloat(val) });
                }} 
                className={`${inputClass} flex-1`} 
                placeholder="Lng" 
              />
              <button 
                type="button"
                onClick={getCurrentLocation}
                className="p-3 bg-blue-50 text-[#2185D0] rounded-xl border border-blue-100 hover:bg-blue-100 transition-all"
                title="Ma position actuelle"
              >
                <i className="fas fa-location-arrow"></i>
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Modèle / Marque</label>
            <input type="text" required value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} className={inputClass} placeholder="ex: Perkins 1104C" />
          </div>
          <div>
            <label className={labelClass}>Puissance Unité</label>
            <input type="text" required value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} className={inputClass} placeholder="ex: 150 kVA" />
          </div>
        </div>

        <div className="p-4 md:p-8 bg-slate-50/50 rounded-xl md:rounded-2xl border border-slate-100">
          <h4 className="text-[9px] md:text-[10px] font-black text-[#2185D0] uppercase tracking-[0.2em] mb-4 md:mb-6">Consommables & Tarification (FCFA)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Filtre Huile</label>
                <RefInput value={formData.oilFilterRef} field="oilFilterRef" label="Huile" formData={formData} setFormData={setFormData} getModelMapping={getModelMapping} ALL_REFS={ALL_REFS} inputClass={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Prix Unit. Filtre Huile</label>
                <input type="number" value={formData.oilFilterPrice} onChange={(e) => setFormData({ ...formData, oilFilterPrice: parseInt(e.target.value) || 0 })} className={inputClass} />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Filtre Gasoil</label>
                <RefInput value={formData.fuelFilterRef} field="fuelFilterRef" label="Gasoil" formData={formData} setFormData={setFormData} getModelMapping={getModelMapping} ALL_REFS={ALL_REFS} inputClass={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Prix Unit. Filtre Gasoil</label>
                <input type="number" value={formData.fuelFilterPrice} onChange={(e) => setFormData({ ...formData, fuelFilterPrice: parseInt(e.target.value) || 0 })} className={inputClass} />
              </div>
            </div>
            <div className="space-y-4 sm:col-span-2 lg:col-span-1">
              <div>
                <label className={labelClass}>Filtre Air</label>
                <RefInput value={formData.airFilterRef} field="airFilterRef" label="Air" formData={formData} setFormData={setFormData} getModelMapping={getModelMapping} ALL_REFS={ALL_REFS} inputClass={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Prix Unit. Filtre Air</label>
                <input type="number" value={formData.airFilterPrice} onChange={(e) => setFormData({ ...formData, airFilterPrice: parseInt(e.target.value) || 0 })} className={inputClass} />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Décompteur</label>
                <RefInput value={formData.separatorRef} field="separatorRef" label="Décompteur" formData={formData} setFormData={setFormData} getModelMapping={getModelMapping} ALL_REFS={ALL_REFS} inputClass={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Prix Unit. Décompteur</label>
                <input type="number" value={formData.separatorPrice} onChange={(e) => setFormData({ ...formData, separatorPrice: parseInt(e.target.value) || 0 })} className={inputClass} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8 mt-6 md:mt-8 pt-6 md:pt-8 border-t border-slate-200">
            <div>
              <label className={labelClass}>Huile (Litres)</label>
              <input type="number" step="0.5" value={formData.oilQuantity} onChange={(e) => setFormData({ ...formData, oilQuantity: parseFloat(e.target.value) || 0 })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Prix Huile (L)</label>
              <input type="number" value={formData.oilPrice} onChange={(e) => setFormData({ ...formData, oilPrice: parseInt(e.target.value) || 0 })} className={inputClass} />
            </div>
            <div className="space-y-4 sm:col-span-2 lg:col-span-1">
              <div>
                <label className={labelClass}>Réf. Huile</label>
                <RefInput value={formData.oilRef} field="oilRef" label="Huile" formData={formData} setFormData={setFormData} getModelMapping={getModelMapping} ALL_REFS={ALL_REFS} inputClass={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Prix Main d'œuvre</label>
                <input type="number" value={formData.laborPrice} onChange={(e) => setFormData({ ...formData, laborPrice: parseInt(e.target.value) || 0 })} className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#2185D0]/5 p-4 md:p-8 rounded-xl md:rounded-2xl border border-[#2185D0]/10">
          <h4 className="text-[9px] md:text-[10px] font-black text-[#2185D0] uppercase tracking-[0.2em] mb-4 md:mb-6">Régime & Cycles</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
            <div className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className={labelClass}>Dern. Vid. (H)</label>
                  <input type="number" required value={formData.lastChangeIndex} onChange={(e) => setFormData({ ...formData, lastChangeIndex: parseInt(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Date Dern. Vid.</label>
                  <input type="date" required value={formData.lastChangeDate} onChange={(e) => setFormData({ ...formData, lastChangeDate: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className={labelClass}>Proc. Vid. (H)</label>
                  <input type="number" required value={formData.nextChangeIndex} onChange={(e) => setFormData({ ...formData, nextChangeIndex: parseInt(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Index Actuel (H)</label>
                  <input type="number" required value={formData.currentIndex} onChange={(e) => setFormData({ ...formData, currentIndex: parseInt(e.target.value) || 0 })} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className={labelClass}>Dern. Cour. (H)</label>
                  <input type="number" required value={formData.lastBeltChangeIndex} onChange={(e) => setFormData({ ...formData, lastBeltChangeIndex: parseInt(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Proc. Cour. (H)</label>
                  <input type="number" required value={formData.nextBeltChangeIndex} onChange={(e) => setFormData({ ...formData, nextBeltChangeIndex: parseInt(e.target.value) || 0 })} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Réf. Courroie</label>
                <RefInput value={formData.beltRef} field="beltRef" label="Courroie" formData={formData} setFormData={setFormData} getModelMapping={getModelMapping} ALL_REFS={ALL_REFS} inputClass={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="bg-[#2185D0]/10 p-4 rounded-xl border border-[#2185D0]/20">
                <label className={`${labelClass} text-[#2185D0]`}>Régime Calculé (H/J)</label>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-[#2185D0] mono">{formData.dailyHours}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase italic">Basé sur l'intervalle</span>
                </div>
                <input type="range" min="0" max="24" step="0.1" value={formData.dailyHours} onChange={(e) => setFormData({ ...formData, dailyHours: parseFloat(e.target.value) || 0 })} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-4" />
              </div>
              <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                <label className={`${labelClass} text-emerald-600`}>Prochaine Date Estimée</label>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-emerald-600 uppercase italic">
                    {(() => {
                      const hoursRemaining = formData.nextChangeIndex - formData.currentIndex;
                      const daysRemaining = formData.dailyHours > 0 ? Math.max(0, hoursRemaining / formData.dailyHours) : 0;
                      const projectedDate = new Date();
                      projectedDate.setDate(projectedDate.getDate() + Math.ceil(daysRemaining));
                      return projectedDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    })()}
                  </span>
                  <i className="fas fa-calendar-alt text-emerald-400"></i>
                </div>
                <p className="text-[8px] font-bold text-slate-400 uppercase mt-2 italic">Projection basée sur le régime actuel</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 md:pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2 order-2 sm:order-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest">Connecté Brel Cloud</p>
          </div>
          <button type="submit" className="w-full sm:w-auto bg-[#2185D0] hover:bg-[#1a6fb0] text-white px-8 md:px-12 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest transition-all shadow-lg shadow-[#2185D0]/20 active:scale-95 order-1 sm:order-2">
            {initialData ? 'Mettre à jour' : 'Enregistrer Unité'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MaintenanceForm;
