import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, X, Sparkles } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export const MobileInstallBanner: React.FC = () => {
  const { isInstalled, isIOS, isAndroid } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    // Only check after mount
    if (isInstalled) return;

    const dismissedUntil = localStorage.getItem('brel_install_dismissed_until');
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      setIsDismissed(true);
      return;
    }

    // Show for mobile devices (iOS & Android)
    if (isIOS || isAndroid) {
      setIsDismissed(false);
    }
  }, [isInstalled, isIOS, isAndroid]);

  const handleDismiss = () => {
    setIsDismissed(true);
    // Dismiss for 7 days
    const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('brel_install_dismissed_until', nextWeek.toString());
  };

  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <aside 
      aria-label="Proposition d'installation de l'application"
      className="md:hidden fixed top-16 left-3 right-3 z-40 bg-gradient-to-r from-slate-900 to-[#102a45] text-white p-3.5 rounded-2xl shadow-xl border border-blue-400/30 animate-in slide-in-from-top-3 duration-300"
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2185D0] flex items-center justify-center shrink-0 shadow-md">
            {isIOS ? (
              <Smartphone className="w-5 h-5 text-white" />
            ) : (
              <Download className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-300">
                Application Mobile
              </span>
              <span className="flex items-center text-[9px] bg-blue-500/30 text-blue-200 px-1.5 py-0.2 rounded-full font-bold">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" /> Rapide
              </span>
            </div>
            <p className="text-xs font-bold text-white mt-0.5">
              Installez Brel Énergie sur votre {isIOS ? 'iPhone / iPad' : 'smartphone Android'}
            </p>
            <p className="text-[10px] text-slate-300 mt-0.5 leading-snug">
              Accès instantané, mode plein écran et suivi hors-ligne.
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
          title="Masquer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-end gap-2 pt-2 border-t border-slate-700/60">
        <button
          onClick={handleDismiss}
          className="text-[10px] font-bold text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          Plus tard
        </button>
        <PWAInstallButton compact className="shadow-none py-1 px-3 text-[11px]" />
      </div>
    </aside>
  );
};
