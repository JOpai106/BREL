
import React from 'react';
import { TabType, AppUser, AppNotification } from '../types';
import { User } from 'firebase/auth';
import NotificationBell from './NotificationBell';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  user?: User | null;
  appUser?: AppUser | null;
  onLogout?: () => void;
  notifications?: AppNotification[];
  onMarkAsRead?: (id: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user, appUser, onLogout, notifications = [], onMarkAsRead = () => {} }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = React.useState(false);
  
  // Theme and Brightness state persisted in localStorage
  const [themeMode, setThemeMode] = React.useState<'normal' | 'soft' | 'contrast' | 'dark'>(() => {
    return (localStorage.getItem('brel_theme_mode') as any) || 'normal';
  });
  const [brightness, setBrightness] = React.useState<number>(() => {
    const saved = localStorage.getItem('brel_brightness');
    return saved ? Number(saved) : 100;
  });

  const handleSetThemeMode = (mode: 'normal' | 'soft' | 'contrast' | 'dark') => {
    setThemeMode(mode);
    localStorage.setItem('brel_theme_mode', mode);
    if (mode === 'dark') {
      setBrightness(85);
      localStorage.setItem('brel_brightness', '85');
    } else if (mode === 'soft') {
      setBrightness(92);
      localStorage.setItem('brel_brightness', '92');
    } else if (mode === 'contrast') {
      setBrightness(105);
      localStorage.setItem('brel_brightness', '105');
    } else {
      setBrightness(100);
      localStorage.setItem('brel_brightness', '100');
    }
  };

  const handleBrightnessChange = (val: number) => {
    setBrightness(val);
    localStorage.setItem('brel_brightness', val.toString());
  };

  const isAdmin = appUser?.role === 'admin';
  const isTechnician = appUser?.role === 'technician';
  const isClient = appUser?.role === 'client';

  const navItems = [
    { id: 'dashboard', label: 'DASHBOARD / PARC', icon: 'fa-charging-station' },
    { id: 'list', label: 'LISTE', icon: 'fa-list' },
    { id: 'planning', label: 'PLANNING', icon: 'fa-calendar-alt' },
    { id: 'map', label: 'CARTE', icon: 'fa-map-marked-alt' },
  ];

  if (isAdmin || isTechnician) {
    navItems.push({ id: 'stock', label: 'GESTION STOCK', icon: 'fa-boxes' });
    navItems.push({ id: 'ai-insights', label: 'CONSEILS IA', icon: 'fa-brain' });
  }

  navItems.push({ id: 'documents', label: 'ARCHIVES DOCS', icon: 'fa-folder-open' });
  navItems.push({ id: 'profile', label: 'MON COMPTE', icon: 'fa-user-circle' });

  if (isAdmin) {
    navItems.push({ id: 'users', label: 'UTILISATEURS', icon: 'fa-users-cog' });
    navItems.push({ id: 'reports', label: 'RAPPORTS', icon: 'fa-file-chart-line' });
  }

  const handleTabChange = (id: TabType) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div 
      className={`min-h-screen font-['Inter'] transition-colors duration-300 ${
        themeMode === 'dark' 
          ? 'bg-[#0B1120] text-slate-100' 
          : themeMode === 'soft' 
          ? 'bg-[#F1F5F9] text-slate-900' 
          : themeMode === 'contrast' 
          ? 'bg-slate-100 text-slate-950 font-medium' 
          : 'bg-[#F8FAFC] text-[#101828]'
      }`}
      style={{
        filter: brightness !== 100 ? `brightness(${brightness}%)` : undefined
      }}
    >
      {/* Top Header Navigation */}
      <header className="bg-white border-b border-slate-100 px-4 md:px-8 py-3 sticky top-0 z-50 print:hidden shadow-sm">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center space-x-3 md:space-x-5">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-lg`}></i>
            </button>
            <button 
              onClick={() => handleTabChange('dashboard')} 
              className="flex items-center space-x-3 text-left focus:outline-none group cursor-pointer"
              title="Retour au Dashboard"
            >
              <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full text-[#2185D0] group-hover:scale-105 transition-transform">
                  <path fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" d="M35 75 A35 35 0 1 1 65 75" />
                  <path fill="currentColor" d="M30 65 L40 65 L40 85 L30 85 Z M25 70 L30 70 M40 70 L45 70" stroke="currentColor" strokeWidth="2" />
                  <path fill="currentColor" d="M55 25 L35 55 H45 L40 75 L65 45 H55 Z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-black tracking-tight leading-none uppercase text-slate-900">
                  BREL <span className="text-[#2185D0]">ENERGIE</span>
                </h1>
                <p className="text-[7px] md:text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Notre expertise, votre solution</p>
              </div>
            </button>
          </div>

          {/* Navigation Links (Desktop/Tablet) */}
          <nav className="hidden md:flex items-center gap-3 xl:gap-5 overflow-x-auto py-1 max-w-[50vw] xl:max-w-[60vw]">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id as TabType)}
                className={`text-[10px] font-black tracking-widest transition-all relative py-2 whitespace-nowrap shrink-0 ${
                  activeTab === item.id 
                    ? 'text-[#2185D0] after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[3px] after:bg-[#2185D0] after:rounded-full' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Contact & Action Section */}
          <div className="flex items-center space-x-3 md:space-x-6">
            {/* Brightness & Visual Theme Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center transition-all ${
                  isThemeMenuOpen 
                    ? 'bg-[#2185D0] text-white shadow-md' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-[#2185D0]'
                }`}
                title="Ajuster la luminosité et le rendu visuel"
              >
                <i className={`fas ${brightness > 105 ? 'fa-sun text-amber-500' : brightness < 90 ? 'fa-moon text-indigo-400' : 'fa-adjust'} text-xs md:text-sm`}></i>
              </button>

              {isThemeMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsThemeMenuOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <i className="fas fa-sun text-[#2185D0] text-xs"></i>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Luminosité & Rendu</h4>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{brightness}%</span>
                    </div>

                    {/* Brightness Slider */}
                    <div className="my-3 space-y-1.5">
                      <div className="flex justify-between text-[9px] font-extrabold uppercase text-slate-400">
                        <span>Doux (75%)</span>
                        <span>Intense (120%)</span>
                      </div>
                      <input
                        type="range"
                        min="75"
                        max="120"
                        step="5"
                        value={brightness}
                        onChange={(e) => handleBrightnessChange(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#2185D0]"
                      />
                    </div>

                    {/* Preset Modes */}
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Modes d'affichage :</p>
                      
                      <button
                        onClick={() => handleSetThemeMode('normal')}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-bold transition-all ${
                          themeMode === 'normal' 
                            ? 'bg-blue-50 text-[#2185D0] border border-blue-200' 
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center space-x-2">
                          <i className="fas fa-desktop text-xs"></i>
                          <span>Standard (100%)</span>
                        </span>
                        {themeMode === 'normal' && <i className="fas fa-check text-xs"></i>}
                      </button>

                      <button
                        onClick={() => handleSetThemeMode('soft')}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-bold transition-all ${
                          themeMode === 'soft' 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center space-x-2">
                          <i className="fas fa-glasses text-xs"></i>
                          <span>Anti-Fatigue / Repos</span>
                        </span>
                        {themeMode === 'soft' && <i className="fas fa-check text-xs"></i>}
                      </button>

                      <button
                        onClick={() => handleSetThemeMode('contrast')}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-bold transition-all ${
                          themeMode === 'contrast' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center space-x-2">
                          <i className="fas fa-sun text-xs"></i>
                          <span>Plein Soleil / Contrasté</span>
                        </span>
                        {themeMode === 'contrast' && <i className="fas fa-check text-xs"></i>}
                      </button>

                      <button
                        onClick={() => handleSetThemeMode('dark')}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-bold transition-all ${
                          themeMode === 'dark' 
                            ? 'bg-slate-900 text-white border border-slate-700' 
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center space-x-2">
                          <i className="fas fa-moon text-xs"></i>
                          <span>Mode Nuit / Sombre</span>
                        </span>
                        {themeMode === 'dark' && <i className="fas fa-check text-xs"></i>}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {user && (
              <div className="flex items-center space-x-3 md:space-x-4 border-r border-slate-100 pr-4 md:pr-8">
                <NotificationBell notifications={notifications} onMarkAsRead={onMarkAsRead} />
                
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{user.displayName}</p>
                  <div className="flex items-center justify-end space-x-2">
                    {appUser && (
                      <span className="text-[7px] font-black uppercase tracking-widest text-[#2185D0] bg-blue-50 px-1.5 py-0.5 rounded">
                        {appUser.role}
                      </span>
                    )}
                    <button 
                      onClick={onLogout}
                      className="text-[8px] font-bold text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors"
                    >
                      Déconnexion
                    </button>
                  </div>
                </div>
                {user.photoURL ? (
                  <button onClick={() => handleTabChange('profile')}>
                    <img src={user.photoURL} alt="" className="w-8 h-8 md:w-10 md:h-10 rounded-xl border-2 border-slate-100 shadow-sm hover:border-[#2185D0] transition-all" referrerPolicy="no-referrer" />
                  </button>
                ) : (
                  <button onClick={() => handleTabChange('profile')} className="w-8 h-8 md:w-10 md:h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#2185D0] hover:bg-blue-50 transition-all">
                    <i className="fas fa-user"></i>
                  </button>
                )}
              </div>
            )}
            
            {isAdmin && (
              <button 
                onClick={() => handleTabChange('add')}
                className="bg-[#101828] hover:bg-[#2185D0] text-white px-4 md:px-6 py-2.5 rounded-lg text-[9px] md:text-[10px] font-black tracking-widest flex items-center space-x-2 md:space-x-3 transition-all active:scale-95 shadow-md"
              >
                <i className="fas fa-plus"></i>
                <span className="hidden xs:inline">NOUVEL ÉQUIPEMENT</span>
                <span className="xs:hidden">AJOUTER</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <nav className="p-4 grid grid-cols-2 gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id as TabType)}
                  className={`flex items-center space-x-3 p-4 rounded-2xl transition-all ${
                    activeTab === item.id 
                      ? 'bg-blue-50 text-[#2185D0]' 
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    activeTab === item.id ? 'bg-[#2185D0] text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <i className={`fas ${item.icon} text-xs`}></i>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                </button>
              ))}
              {user && (
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-3 p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all col-span-2 mt-2 border-t border-slate-50"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <i className="fas fa-sign-out-alt text-xs"></i>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest">DÉCONNEXION</span>
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1440px] mx-auto p-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
