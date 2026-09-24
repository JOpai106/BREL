import React, { useState } from 'react';

interface ClientManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export const ClientManualModal: React.FC<ClientManualModalProps> = ({ isOpen, onClose, userEmail }) => {
  const [activeTab, setActiveTab] = useState<'connexion' | 'index' | 'alertes' | 'historique' | 'pwa'>('connexion');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-[#101828] text-white p-6 md:p-8 relative shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 bg-[#2185D0] rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-[#2185D0]/30">
                <i className="fas fa-book-open"></i>
              </div>
              <div>
                <span className="text-[10px] font-black text-[#2185D0] uppercase tracking-[0.25em]">BREL ENERGIE — ESPACE CLIENT</span>
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight italic">Manuel d'Utilisation Client</h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              title="Fermer le manuel"
            >
              <i className="fas fa-times text-base"></i>
            </button>
          </div>

          <p className="text-slate-400 text-xs mt-3 max-w-xl leading-relaxed">
            Guide pas-à-pas pour vous connecter facilement, relever et rectifier l'index horaire de votre groupe électrogène, et suivre vos opérations de maintenance en toute sécurité.
          </p>

          {/* Navigation Tabs inside manual */}
          <div className="flex items-center space-x-1 mt-6 overflow-x-auto pb-1 no-scrollbar border-b border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('connexion')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center space-x-2 ${
                activeTab === 'connexion'
                  ? 'bg-[#2185D0] text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <i className="fas fa-key text-[11px]"></i>
              <span>1. Connexion & Accès</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('index')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center space-x-2 ${
                activeTab === 'index'
                  ? 'bg-[#2185D0] text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <i className="fas fa-tachometer-alt text-[11px]"></i>
              <span>2. Ressaisie de l'Index</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('alertes')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center space-x-2 ${
                activeTab === 'alertes'
                  ? 'bg-[#2185D0] text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <i className="fas fa-bell text-[11px]"></i>
              <span>3. Suivi & Alertes</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('historique')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center space-x-2 ${
                activeTab === 'historique'
                  ? 'bg-[#2185D0] text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <i className="fas fa-history text-[11px]"></i>
              <span>4. Historique</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pwa')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center space-x-2 ${
                activeTab === 'pwa'
                  ? 'bg-[#2185D0] text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <i className="fas fa-mobile-alt text-[11px]"></i>
              <span>5. App Mobile</span>
            </button>
          </div>
        </div>

        {/* Modal Body / Tab Content */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6 text-slate-800">

          {/* TAB 1: CONNEXION & ACCÈS */}
          {activeTab === 'connexion' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 flex items-start space-x-3">
                <i className="fas fa-info-circle text-[#2185D0] text-lg mt-0.5 shrink-0"></i>
                <div className="text-xs text-slate-700 leading-relaxed">
                  <p className="font-bold text-slate-900 mb-1">Votre accès est pré-autorisé par BREL Energie</p>
                  Dès que votre administrateur a enregistré votre adresse email (ex: <span className="font-mono font-bold text-[#2185D0]">{userEmail || 'votre-email@domaine.com'}</span>), vous pouvez vous connecter immédiatement en suivant l'une des méthodes ci-dessous.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Méthode 1 */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-md transition-all space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-xs">
                      A
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">Email et Mot de Passe</h3>
                  </div>
                  <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Saisissez votre <strong>adresse email</strong> client.</li>
                    <li>Saisissez un mot de passe (au moins <strong>6 caractères</strong>).</li>
                    <li>Cliquez sur le bouton bleu <strong>« Se connecter »</strong>.</li>
                    <li><span className="text-[#2185D0] font-bold">Nouveau !</span> Lors de votre toute première venue, le système active automatiquement votre accès sans blocage.</li>
                  </ol>
                </div>

                {/* Méthode 2 */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-md transition-all space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black text-xs">
                      B
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">En 1 Clic avec Google</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Si votre adresse email est hébergée chez Google (adresse <span className="font-mono font-bold">@gmail.com</span> ou Google Workspace) :
                  </p>
                  <div className="pt-1">
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center space-x-2 text-xs font-bold text-slate-700">
                      <i className="fab fa-google text-red-500"></i>
                      <span>Cliquez sur « Continuer avec Google »</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">Aucun mot de passe à retenir, votre session s'ouvre instantanément.</p>
                </div>
              </div>

              {/* Dépannage mot de passe oublié */}
              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-2">
                <div className="flex items-center space-x-2 text-amber-800 font-bold text-xs">
                  <i className="fas fa-question-circle text-amber-600"></i>
                  <span className="uppercase tracking-wider">Mot de passe oublié ou message d'erreur ?</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Si vous avez oublié votre mot de passe, saisissez simplement votre adresse email dans le champ puis cliquez sur <strong>« Mot de passe oublié ? »</strong>. Vous recevrez instantanément un lien officiel par email pour choisir un nouveau mot de passe.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: RESSAISIE DE L'INDEX */}
          {activeTab === 'index' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-start space-x-3">
                <i className="fas fa-check-circle text-emerald-600 text-lg mt-0.5 shrink-0"></i>
                <div className="text-xs text-slate-700 leading-relaxed">
                  <p className="font-bold text-emerald-900 mb-1">Droit accordé au profil Client : Ressaisie & Correction d'Index</p>
                  En tant que Client propriétaire ou gestionnaire de site, vous avez la possibilité de saisir et de <strong>ressaisir l'index horaire</strong> à tout moment en cas d'erreur de saisie, en toute autonomie et <strong>sans jamais altérer vos autres données</strong> (historiques, pièces, prix ou caractéristiques du générateur restent strictement protégés).
                </div>
              </div>

              {/* Étapes pas à pas */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Marche à suivre pas-à-pas :</h4>

                <div className="flex items-start space-x-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="w-7 h-7 rounded-xl bg-[#2185D0] text-white flex items-center justify-center font-black text-xs shrink-0">1</span>
                  <div className="text-xs text-slate-700">
                    <strong className="text-slate-900">Relevez le compteur de votre machine :</strong> Notez le chiffre affiché sur l'horamètre du tableau de commande de votre groupe électrogène (ex: <span className="font-mono font-bold">1 850 h</span>).
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="w-7 h-7 rounded-xl bg-[#2185D0] text-white flex items-center justify-center font-black text-xs shrink-0">2</span>
                  <div className="text-xs text-slate-700">
                    <strong className="text-slate-900">Cliquez sur « Modifier l'index » ou « Index » :</strong> Sur la fiche de votre équipement dans le tableau de bord, cliquez sur le bouton dédié.
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="w-7 h-7 rounded-xl bg-[#2185D0] text-white flex items-center justify-center font-black text-xs shrink-0">3</span>
                  <div className="text-xs text-slate-700">
                    <strong className="text-slate-900">En cas d'erreur de frappe (rectification) :</strong> Si vous avez par exemple saisi un zéro de trop (ex: 18 500 au lieu de 1 850), rouvrez simplement la fenêtre, entrez le chiffre exact et validez. Le système autorise la correction d'erreur et recalcule instantanément le compteur d'heures restantes avant vidange.
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="w-7 h-7 rounded-xl bg-[#2185D0] text-white flex items-center justify-center font-black text-xs shrink-0">4</span>
                  <div className="text-xs text-slate-700">
                    <strong className="text-slate-900">Validation sécurisée :</strong> Cliquez sur <strong>« Valider l'Index »</strong>. La jauge s'actualise en temps réel sur tous vos appareils.
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-100 text-xs text-slate-600 flex items-center space-x-2">
                <i className="fas fa-shield-alt text-[#2185D0]"></i>
                <span>Garantie BREL : Seul le compteur horaire est mis à jour. Aucune fiche technique ni intervention n'est modifiée.</span>
              </div>
            </div>
          )}

          {/* TAB 3: SUIVI & ALERTES */}
          {activeTab === 'alertes' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <p className="text-xs text-slate-600 leading-relaxed">
                Le tableau de bord calcule en permanence l'intervalle entre votre dernier entretien et la prochaine vidange périodique (toutes les 250 heures) ou changement de courroie (toutes les 1 000 heures).
              </p>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-sm font-black shrink-0">
                    <i className="fas fa-check"></i>
                  </div>
                  <div>
                    <h5 className="text-xs font-black uppercase text-emerald-900">Jauge Verte : Machine Opérationnelle</h5>
                    <p className="text-[11px] text-slate-600 mt-0.5">Il reste plus de 50 heures avant la prochaine maintenance préventive. Fonctionnement optimal.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center text-sm font-black shrink-0">
                    <i className="fas fa-exclamation-triangle"></i>
                  </div>
                  <div>
                    <h5 className="text-xs font-black uppercase text-amber-900">Jauge Orange : Maintenance Imminente (≤ 50 heures)</h5>
                    <p className="text-[11px] text-slate-600 mt-0.5">Le groupe approche de son échéance d'entretien. Vous pouvez anticiper l'intervention des équipes BREL Energie.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-red-200 bg-red-50/50 flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center text-sm font-black shrink-0">
                    <i className="fas fa-ban"></i>
                  </div>
                  <div>
                    <h5 className="text-xs font-black uppercase text-red-900">Jauge Rouge : Échéance Dépassée</h5>
                    <p className="text-[11px] text-slate-600 mt-0.5">L'intervalle d'heures est dépassé. La vidange ou le remplacement des filtres doit être planifié en priorité pour préserver le moteur.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HISTORIQUE */}
          {activeTab === 'historique' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed space-y-2">
                <div className="flex items-center space-x-2 text-slate-900 font-bold">
                  <i className="fas fa-folder-open text-[#2185D0]"></i>
                  <span className="uppercase">Consultation et Certification de l'Historique</span>
                </div>
                <p>
                  Vous pouvez consulter à tout moment l'ensemble des interventions réalisées sur votre générateur (vidanges, filtres, courroies, réparations).
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pt-1">
                  <li>Date précise de l'intervention et index horaire au moment des travaux.</li>
                  <li>Photos techniques certifiées prises par les techniciens sur site.</li>
                  <li>Observations et détails techniques de l'opération.</li>
                </ul>
              </div>

              <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-2xl flex items-start space-x-3 text-xs text-purple-900">
                <i className="fas fa-lock text-purple-600 text-sm mt-0.5 shrink-0"></i>
                <p className="leading-relaxed">
                  <strong>Règle de sécurité et traçabilité :</strong> La suppression ou l'archivage définitif d'un historique d'intervention est <strong>strictement réservé au profil Administrateur</strong>. En tant que Client, votre carnet d'entretien numérique est certifié, inaltérable et garanti conforme.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: APPLICATION MOBILE (PWA) */}
          {activeTab === 'pwa' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2 text-[#2185D0] font-black text-xs uppercase tracking-widest">
                  <i className="fas fa-mobile-alt text-base"></i>
                  <span>Installer BREL Energie sur votre Smartphone</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  L'application BREL Energie peut être installée comme une véritable application mobile sur votre téléphone Android ou iPhone, sans passer par le Play Store ou l'App Store :
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase">
                    <i className="fab fa-android text-emerald-600"></i>
                    <span>Sur Android (Chrome)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Ouvrez le lien dans Google Chrome, appuyez sur le bouton <strong>« Installer »</strong> en haut ou sur les 3 points du navigateur puis <strong>« Ajouter à l'écran d'accueil »</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase">
                    <i className="fab fa-apple text-slate-800"></i>
                    <span>Sur iPhone (Safari)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Ouvrez le lien dans Safari, touchez l'icône de partage (carré avec une flèche vers le haut) puis sélectionnez <strong>« Sur l'écran d'accueil »</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 md:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-medium hidden sm:flex items-center space-x-1.5">
            <i className="fas fa-phone-alt text-[#2185D0] text-xs"></i>
            <span>Support BREL Energie : +242 053379797</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center space-x-1.5"
            >
              <i className="fas fa-print text-xs"></i>
              <span>Imprimer</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-[#2185D0] hover:bg-[#1a6fb0] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#2185D0]/20"
            >
              Compris / Fermer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
