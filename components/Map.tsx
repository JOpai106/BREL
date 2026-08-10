
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MaintenanceRecord } from '../types';
import { calculateMaintenanceStatus } from '../utils';
import { motion } from 'motion/react';
import { MapPin, Info, Phone, Wrench } from 'lucide-react';

// Fix for default marker icon in Leaflet
const markerIcon = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const markerShadow = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  records: MaintenanceRecord[];
  onSelectRecord: (record: MaintenanceRecord) => void;
}

const Map: React.FC<MapProps> = ({ records, onSelectRecord }) => {
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'vidange' | 'courroie' | 'today'>('all');

  // Default center (Brazzaville, Congo)
  const defaultCenter: [number, number] = [-4.2634, 15.2832];

  const todayStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Filter records with coordinates and ensure they are numbers
  const processedRecords = records.filter(r => {
    const lat = typeof r.lat === 'string' ? parseFloat(r.lat) : r.lat;
    const lng = typeof r.lng === 'string' ? parseFloat(r.lng) : r.lng;
    return lat !== null && lat !== undefined && !isNaN(lat as number) && 
           lng !== null && lng !== undefined && !isNaN(lng as number);
  }).map(r => ({
    ...r,
    lat: typeof r.lat === 'string' ? parseFloat(r.lat) : r.lat,
    lng: typeof r.lng === 'string' ? parseFloat(r.lng) : r.lng
  }));

  const filteredRecords = processedRecords.filter(record => {
    if (activeFilter === 'all') return true;
    const status = calculateMaintenanceStatus(record as any);
    
    if (activeFilter === 'vidange') {
      return status.priority === 'high' || status.priority === 'medium';
    }
    if (activeFilter === 'courroie') {
      return status.beltProgressPercent >= 85; // Approaching belt change
    }
    if (activeFilter === 'today') {
      return status.projectedDate === todayStr || status.beltProjectedDate === todayStr;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Carte du Parc</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Localisation géographique des équipements</p>
        </div>
        
        {/* Legend / Filter Bar based on capture */}
        <div className="flex flex-wrap items-center gap-4 bg-white border border-slate-200 rounded-2xl p-2 md:p-4 shadow-sm">
          <button 
            onClick={() => setActiveFilter(activeFilter === 'vidange' ? 'all' : 'vidange')}
            className={`flex items-center space-x-3 px-4 py-2 rounded-xl transition-all ${activeFilter === 'vidange' ? 'bg-blue-50 border-blue-200 shadow-sm' : 'hover:bg-slate-50 border-transparent'} border`}
          >
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#2185D0] border border-blue-100">
              <i className="far fa-clock text-sm"></i>
            </div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Vidange Huile</span>
          </button>

          <button 
            onClick={() => setActiveFilter(activeFilter === 'courroie' ? 'all' : 'courroie')}
            className={`flex items-center space-x-3 px-4 py-2 rounded-xl transition-all ${activeFilter === 'courroie' ? 'bg-amber-50 border-amber-200 shadow-sm' : 'hover:bg-slate-50 border-transparent'} border`}
          >
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100">
              <i className="fas fa-exclamation-circle text-sm"></i>
            </div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Changement Courroie</span>
          </button>

          <button 
            onClick={() => setActiveFilter(activeFilter === 'today' ? 'all' : 'today')}
            className={`flex items-center space-x-3 px-4 py-2 rounded-xl transition-all ${activeFilter === 'today' ? 'bg-blue-50 border-blue-200 shadow-sm' : 'hover:bg-slate-50 border-transparent'} border`}
          >
            <div className="w-6 h-6 rounded-full bg-[#2185D0] shadow-lg shadow-blue-200"></div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Aujourd'hui</span>
          </button>
          
          {activeFilter !== 'all' && (
            <button 
              onClick={() => setActiveFilter('all')}
              className="text-[9px] font-black text-[#2185D0] uppercase tracking-widest px-4 hover:underline"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden h-[600px] relative z-0">
        <MapContainer 
          center={defaultCenter} 
          zoom={12} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {filteredRecords.map((record) => {
            const status = calculateMaintenanceStatus(record as any);
            const color = status.priority === 'high' ? '#ef4444' : status.priority === 'medium' ? '#f59e0b' : '#10b981';
            
            // Custom icon based on status
            const customIcon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"></div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });

            return (
              <Marker 
                key={record.id} 
                position={[record.lat as number, record.lng as number]} 
                icon={customIcon}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black text-[#2185D0] uppercase tracking-widest">{record.capacity}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                        status.priority === 'high' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'
                      }`}>
                        {status.priority === 'high' ? 'Urgent' : 'OK'}
                      </span>
                    </div>
                    
                    <h3 className="text-sm font-black text-slate-900 uppercase mb-1">{record.customerName}</h3>
                    <p className="text-[10px] text-slate-500 font-bold mb-3">{record.model}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-[10px] text-slate-600">
                        <Wrench size={12} className="mr-2 opacity-50" />
                        <span>Prochaine Vidange: <span className="font-black">{status.projectedDate}</span></span>
                      </div>
                      <div className="flex items-center text-[10px] text-slate-600">
                        <MapPin size={12} className="mr-2 opacity-50" />
                        <span>Site: <span className="font-black">{record.site || 'N/A'}</span></span>
                      </div>
                    </div>

                    <button 
                      onClick={() => onSelectRecord(record)}
                      className="w-full py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#2185D0] transition-all"
                    >
                      Voir Fiche Technique
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {processedRecords.length === 0 ? (
          <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px] flex items-center justify-center z-10">
            <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-slate-100 max-w-md text-center">
              <div className="w-16 h-16 bg-blue-50 text-[#2185D0] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MapPin size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase mb-2">Aucune coordonnée</h3>
              <p className="text-slate-500 text-sm font-medium">
                Veuillez ajouter des coordonnées GPS (Latitude/Longitude) aux fiches machines pour les voir sur la carte.
              </p>
            </div>
          </div>
        ) : filteredRecords.length === 0 && (
          <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px] flex items-center justify-center z-10">
            <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-slate-100 max-w-md text-center">
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Info size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase mb-2">Aucun résultat</h3>
              <p className="text-slate-500 text-sm font-medium">
                Aucune machine ne correspond au filtre "{activeFilter === 'vidange' ? 'Vidange Huile' : activeFilter === 'courroie' ? 'Changement Courroie' : "Aujourd'hui"}".
              </p>
              <button 
                onClick={() => setActiveFilter('all')}
                className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                Voir tout le parc
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Map;
