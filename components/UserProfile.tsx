
import React, { useState } from 'react';
import { AppUser } from '../types';
import { updateUserPassword } from '../firebase';

interface UserProfileProps {
  appUser: AppUser;
}

const UserProfile: React.FC<UserProfileProps> = ({ appUser }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    try {
      await updateUserPassword(currentPassword, newPassword);
      setSuccess("Mot de passe mis à jour avec succès !");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error("Erreur mise à jour mot de passe:", err);
      if (err.code === 'auth/wrong-password') {
        setError("L'ancien mot de passe est incorrect.");
      } else {
        setError("Une erreur est survenue lors de la mise à jour du mot de passe.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-[#101828] p-8 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-2xl font-black">
              {appUser.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight uppercase">{appUser.displayName}</h2>
              <p className="text-blue-400 text-xs font-bold tracking-widest uppercase">{appUser.role}</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Email</label>
              <p className="text-sm font-bold text-slate-900">{appUser.email}</p>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Membre depuis</label>
              <p className="text-sm font-bold text-slate-900">{new Date(appUser.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-8">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center space-x-3">
              <i className="fas fa-key text-[#2185D0]"></i>
              <span>Changer le mot de passe</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center space-x-3">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center space-x-3">
                  <i className="fas fa-check-circle"></i>
                  <span>{success}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Mot de passe actuel</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Confirmer le mot de passe</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-[#2185D0] hover:bg-[#1a6fb0] text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-[0.2em] transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-3 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin"></i>
                    <span>Mise à jour...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    <span>Enregistrer le nouveau mot de passe</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
