
import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday,
  parse
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { MaintenanceRecord } from '../types';
import { calculateMaintenanceStatus } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PlanningProps {
  records: MaintenanceRecord[];
}

const Planning: React.FC<PlanningProps> = ({ records }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  // Map records to dates
  const eventsByDate: { [key: string]: { record: MaintenanceRecord; type: 'vidange' | 'courroie' }[] } = {};

  records.forEach(record => {
    const status = calculateMaintenanceStatus(record);
    
    // Vidange event
    if (status.projectedDate && status.projectedDate !== 'N/A') {
      try {
        const vidangeDate = parse(status.projectedDate, 'dd/MM/yyyy', new Date());
        if (vidangeDate && !isNaN(vidangeDate.getTime())) {
          const vidangeKey = format(vidangeDate, 'yyyy-MM-dd');
          if (!eventsByDate[vidangeKey]) eventsByDate[vidangeKey] = [];
          eventsByDate[vidangeKey].push({ record, type: 'vidange' });
        }
      } catch (e) {
        console.warn("Failed to parse vidange date for", record.customerName, status.projectedDate, e);
      }
    }

    // Courroie event
    if (status.beltProjectedDate && status.beltProjectedDate !== 'N/A') {
      try {
        const beltDate = parse(status.beltProjectedDate, 'dd/MM/yyyy', new Date());
        if (beltDate && !isNaN(beltDate.getTime())) {
          const beltKey = format(beltDate, 'yyyy-MM-dd');
          if (!eventsByDate[beltKey]) eventsByDate[beltKey] = [];
          eventsByDate[beltKey].push({ record, type: 'courroie' });
        }
      } catch (e) {
        console.warn("Failed to parse belt date for", record.customerName, status.beltProjectedDate, e);
      }
    }
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Planning Maintenance</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Calendrier prévisionnel des interventions techniques</p>
        </div>
        
        <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-[#2185D0]"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="px-6 text-sm font-black uppercase tracking-widest text-slate-900 min-w-[180px] text-center">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </div>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-[#2185D0]"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden">
        {/* Days of week */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDate[dateKey] || [];
            const isCurrentMonth = isSameMonth(day, monthStart);
            
            return (
              <div 
                key={idx} 
                className={`min-h-[140px] p-3 border-r border-b border-slate-100 transition-colors relative ${
                  !isCurrentMonth ? 'bg-slate-50/30' : 'hover:bg-slate-50/50'
                } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-black ${
                    isToday(day) 
                      ? 'bg-[#2185D0] text-white w-7 h-7 flex items-center justify-center rounded-full shadow-lg shadow-blue-200' 
                      : isCurrentMonth ? 'text-slate-900' : 'text-slate-300'
                  }`}>
                    {format(day, 'd')}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {dayEvents.map((event, eIdx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={`${event.record.id}-${event.type}-${eIdx}`}
                      className={`p-1.5 rounded-lg border text-[9px] font-bold leading-tight flex items-start space-x-1.5 ${
                        event.type === 'vidange' 
                          ? 'bg-blue-50 border-blue-100 text-[#2185D0]' 
                          : 'bg-amber-50 border-amber-100 text-amber-600'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {event.type === 'vidange' ? <Clock size={10} /> : <AlertCircle size={10} />}
                      </div>
                      <div className="truncate">
                        <span className="block uppercase tracking-tighter opacity-70">{event.record.customerName}</span>
                        <span className="block font-black">{event.type === 'vidange' ? 'Vidange' : 'Courroie'}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Clock size={10} className="text-[#2185D0]" />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vidange Huile</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center">
            <AlertCircle size={10} className="text-amber-600" />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Changement Courroie</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 rounded-full bg-[#2185D0] shadow-lg shadow-blue-200"></div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aujourd'hui</span>
        </div>
      </div>
    </div>
  );
};

export default Planning;
