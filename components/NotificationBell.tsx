
import React, { useState, useRef, useEffect } from 'react';
import { AppNotification } from '../types';

interface NotificationBellProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ notifications, onMarkAsRead }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:text-[#2185D0] hover:bg-blue-50 transition-all"
      >
        <i className="fas fa-bell text-lg"></i>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[8px] font-black uppercase tracking-widest text-[#2185D0] bg-blue-100 px-2 py-0.5 rounded-full">
                {unreadCount} NOUVELLES
              </span>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                  <i className="fas fa-bell-slash text-xl"></i>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative group ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                    onClick={() => !notif.isRead && onMarkAsRead(notif.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        notif.type === 'intervention' ? 'bg-green-100 text-green-600' : 
                        notif.type === 'maintenance_approaching' ? 'bg-amber-100 text-amber-600' : 
                        'bg-blue-100 text-blue-600'
                      }`}>
                        <i className={`fas ${
                          notif.type === 'intervention' ? 'fa-tools' : 
                          notif.type === 'maintenance_approaching' ? 'fa-clock' : 
                          'fa-info-circle'
                        } text-xs`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight mb-0.5">{notif.title}</p>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed line-clamp-3">{notif.message}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                          {new Date(notif.date).toLocaleString()}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 bg-[#2185D0] rounded-full shrink-0 mt-1"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-[8px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
