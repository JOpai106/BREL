import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Share, CheckCircle2, MoreVertical } from 'lucide-react';

export const PWAInstallButton: React.FC<{ className?: string; compact?: boolean }> = ({ className = '', compact = false }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState<'ios' | 'android' | 'other' | null>(null);

  // If already running as installed app, don't show
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok && isIOS) {
        setShowGuide('ios');
      } else if (!ok && isAndroid) {
        setShowGuide('android');
      }
      return;
    }

    if (isIOS) {
      setShowGuide('ios');
    } else if (isAndroid) {
      setShowGuide('android');
    } else {
      setShowGuide('other');
    }
  };

  return (
    <>
      {compact ? (
        <button
          onClick={handleInstallClick}
          title="Installer l'application Brel Énergie sur votre appareil"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2185D0] hover:bg-[#1a6fb0] active:scale-95 text-white text-xs font-bold shadow-xs transition-all ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Installer l'app</span>
        </button>
      ) : (
        <button
          onClick={handleInstallClick}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2185D0] hover:bg-[#1a6fb0] active:scale-95 text-white text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all ${className}`}
        >
          {isIOS ? (
            <Smartphone className="w-4 h-4" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>{isIOS ? "Installer sur iPhone / iPad" : isAndroid ? "Installer sur Android" : "Installer l'application"}</span>
        </button>
      )}

      {/* Modern Installation Modal Guide for iOS & Android */}
      {showGuide && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <img src="/pwa-192.png" alt="Brel Énergie" className="w-8 h-8 rounded-lg shadow-xs" />
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wide">
                    {showGuide === 'ios' ? 'Installation iPhone & iPad' : showGuide === 'android' ? 'Installation Android' : 'Installation Application'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold">BREL ÉNERGIE PWA</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content depending on OS */}
            {showGuide === 'ios' && (
              <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Installez l'application en quelques secondes sur Safari (iOS 15, 16, 17, 18) :
                </p>

                <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-[#2185D0] rounded-lg shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-black text-slate-900 dark:text-white">Étape 1 :</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Dans <strong>Safari</strong>, appuyez sur le bouton <strong>Partager</strong> <span className="inline-block px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">⎘</span> (en bas sur iPhone, en haut sur iPad).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-[#2185D0] rounded-lg shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-black text-slate-900 dark:text-white">Étape 2 :</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Faites défiler le menu et sélectionnez <strong>Sur l'écran d'accueil</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-black text-slate-900 dark:text-white">Étape 3 :</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Appuyez sur <strong>Ajouter</strong> en haut à droite. L'icône apparaîtra sur votre écran d'accueil comme une application native !
                    </p>
                  </div>
                </div>
              </div>
            )}

            {showGuide === 'android' && (
              <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Installez l'application sur votre smartphone Android (Android 12, 13, 14, 15) :
                </p>

                <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-[#2185D0] rounded-lg shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-black text-slate-900 dark:text-white">Étape 1 :</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Dans votre navigateur (Chrome ou Samsung Internet), appuyez sur le menu <span className="inline-block px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">⋮</span> en haut à droite.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-[#2185D0] rounded-lg shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-black text-slate-900 dark:text-white">Étape 2 :</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Sélectionnez <strong>Installer l'application</strong> (ou <em>Ajouter à l'écran d'accueil</em>).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-black text-slate-900 dark:text-white">Étape 3 :</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Confirmez en appuyant sur <strong>Installer</strong>. L'application s'ouvrira en plein écran sans barre d'adresse !
                    </p>
                  </div>
                </div>
              </div>
            )}

            {showGuide === 'other' && (
              <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Pour installer l'application sur votre appareil :
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <li><strong>Sur Chrome / Edge (ordinateur) :</strong> Cliquez sur l'icône d'installation dans la barre d'adresse à droite.</li>
                  <li><strong>Sur mobile (Android) :</strong> Menu ⋮ &gt; Installer l'application.</li>
                  <li><strong>Sur iPhone / iPad :</strong> Safari &gt; Partager &gt; Sur l'écran d'accueil.</li>
                </ul>
              </div>
            )}

            <button
              onClick={() => setShowGuide(null)}
              className="mt-5 w-full py-2.5 rounded-xl bg-[#2185D0] text-white font-black text-xs uppercase tracking-wider hover:bg-[#1a6fb0] transition-colors shadow-sm"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}
    </>
  );
};

