import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Share } from 'lucide-react';

export const PWAInstallButton: React.FC<{ className?: string; compact?: boolean }> = ({ className = '', compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as installed app, don't show
  if (isInstalled) {
    return null;
  }

  // Android / Chrome / Edge / Desktop installation flow
  if (isInstallable) {
    if (compact) {
      return (
        <button
          onClick={install}
          title="Installer l'application Brel Énergie"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Installer l'app</span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all ${className}`}
      >
        <Download className="w-4 h-4" />
        <span>Installer l'application</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-blue-600" />
          <span>Installer sur iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <img src="/icon.svg" alt="App Logo" className="w-8 h-8 rounded-lg shadow-sm" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Installer Brel Énergie</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  Pour ajouter l'application à votre écran d'accueil iPhone ou iPad :
                </p>
                <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-lg">
                    <Share className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Étape 1 :</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Appuyez sur l'icône <strong>Partager</strong> en bas de votre navigateur Safari.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-lg">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Étape 2 :</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Faites défiler vers le bas et sélectionnez <strong>Sur l'écran d'accueil</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm"
              >
                J'ai compris
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Generic fallback if ambient install is available or prompt can be requested
  return (
    <button
      onClick={() => alert("Pour installer l'application sur votre téléphone :\n\n- Sur Chrome/Android : Appuyez sur le menu (⋮) puis 'Installer l'application'.\n- Sur Safari/iOS : Appuyez sur 'Partager' (⎘) puis 'Sur l'écran d'accueil'.")}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 text-xs font-semibold transition-colors ${className}`}
    >
      <Download className="w-3.5 h-3.5" />
      <span>Installer l'app</span>
    </button>
  );
};
