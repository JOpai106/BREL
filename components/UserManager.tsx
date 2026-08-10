import React, { useState, useEffect } from 'react';
import { AppUser } from '../types';
import { db, handleFirestoreError, OperationType, resetUserPassword } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, setDoc } from 'firebase/firestore';

interface UserManagerProps {
  currentUserEmail: string;
}

const UserManager: React.FC<UserManagerProps> = ({ currentUserEmail }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<AppUser['role']>('technician');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteConfirmUid, setDeleteConfirmUid] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      })) as AppUser[];
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    
    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', `pending_${newEmail.replace(/\./g, '_')}`);
      
      const newUser: any = {
        email: newEmail.toLowerCase().trim(),
        role: newRole,
        displayName: 'En attente de connexion',
        photoURL: '',
        createdAt: new Date().toISOString(),
        uid: '',
        initialPassword: newPassword // Store initial password for reference
      };

      await setDoc(userRef, newUser);
      setNewEmail('');
      setShowAddForm(false);
      setNotification({ message: `L'utilisateur ${newEmail} a été pré-autorisé.`, type: 'success' });
    } catch (error) {
      setNotification({ message: "Erreur lors de l'invitation.", type: 'error' });
      handleFirestoreError(error, OperationType.WRITE, 'users');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (uid: string, newRole: AppUser['role']) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      setNotification({ message: "Rôle mis à jour avec succès.", type: 'success' });
    } catch (error) {
      setNotification({ message: "Erreur lors de la mise à jour du rôle.", type: 'error' });
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  const handleDeleteUser = async (uid: string, email: string) => {
    if (email === currentUserEmail) {
      setNotification({ message: "Vous ne pouvez pas supprimer votre propre compte.", type: 'error' });
      return;
    }
    
    setIsDeleting(uid);
    try {
      await deleteDoc(doc(db, 'users', uid));
      setNotification({ message: `L'accès pour ${email} a été supprimé.`, type: 'success' });
      setDeleteConfirmUid(null);
    } catch (error) {
      console.error("Delete error:", error);
      setNotification({ message: "Erreur de suppression. Droits insuffisants ou problème réseau.", type: 'error' });
      handleFirestoreError(error, OperationType.DELETE, 'users');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleResetPassword = async (email: string, uid: string) => {
    setIsResetting(uid);
    try {
      await resetUserPassword(email);
      setNotification({ message: `Un email de réinitialisation a été envoyé à ${email}.`, type: 'success' });
    } catch (error) {
      setNotification({ message: "Erreur lors de l'envoi de l'email de réinitialisation.", type: 'error' });
    } finally {
      setIsResetting(null);
    }
  };

  const isOnline = (lastActive?: string) => {
    if (!lastActive) return false;
    const lastActiveDate = new Date(lastActive);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastActiveDate.getTime()) / 60000;
    return diffMinutes < 5; // Consider online if active in last 5 minutes
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2185D0]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {notification && (
        <div className={`fixed top-24 right-8 z-[100] p-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-8 duration-300 ${
          notification.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
        }`}>
          <div className="flex items-center space-x-3">
            <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
            <p className="text-[10px] font-black uppercase tracking-widest">{notification.message}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tight">Gestion des Utilisateurs</h2>
          <p className="text-slate-500 font-medium">Gérez les accès et pré-autorisez votre équipe technique.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 500);
            }}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-[#2185D0] hover:border-[#2185D0] transition-all shadow-sm"
            title="Rafraîchir la liste"
          >
            <i className="fas fa-sync-alt"></i>
          </button>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-[#2185D0] text-white px-6 py-3 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-[#1a6fb0] transition-all flex items-center justify-center space-x-3 shadow-lg shadow-blue-200"
          >
            <i className={`fas ${showAddForm ? 'fa-times' : 'fa-user-plus'}`}></i>
            <span>{showAddForm ? 'ANNULER' : 'AJOUTER UN COLLABORATEUR'}</span>
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-[#2185D0]/20 shadow-xl animate-in zoom-in-95 duration-300">
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email de l'utilisateur</label>
              <input 
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="exemple@gmail.com"
                className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#2185D0] transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Mot de passe initial</label>
              <input 
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mot de passe suggéré"
                className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#2185D0] transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Rôle à attribuer</label>
              <select 
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#2185D0] transition-all uppercase tracking-widest"
              >
                <option value="client">Client (Lecture seule)</option>
                <option value="technician">Technicien (Maintenance & Stock)</option>
                <option value="admin">Administrateur (Accès total)</option>
              </select>
            </div>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'CRÉATION...' : 'VALIDER L\'INVITATION'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Utilisateur</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Statut</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Rôle Actuel</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user) => (
                <tr key={user.uid} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <img 
                          src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`} 
                          alt="" 
                          className="w-10 h-10 rounded-xl object-cover shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                        {isOnline(user.lastActive) && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{user.displayName}</p>
                        <p className="text-[10px] font-medium text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {isOnline(user.lastActive) ? (
                      <span className="text-[9px] font-black text-green-600 uppercase tracking-widest flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        <span>Connecté</span>
                      </span>
                    ) : (
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {user.lastActive ? `Dernière activité: ${new Date(user.lastActive).toLocaleDateString()}` : 'Hors ligne'}
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                      user.role === 'technician' ? 'bg-blue-100 text-blue-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2">
                      <select 
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.uid, e.target.value as any)}
                        disabled={user.email === currentUserEmail}
                        className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 border-none rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#2185D0] transition-all disabled:opacity-50"
                      >
                        <option value="client">Client</option>
                        <option value="technician">Technicien</option>
                        <option value="admin">Admin</option>
                      </select>
                      
                      <button 
                        onClick={() => handleResetPassword(user.email, user.uid)}
                        disabled={isResetting === user.uid || !user.uid || user.uid.startsWith('pending_')}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 text-[#2185D0] hover:bg-[#2185D0] hover:text-white transition-all disabled:opacity-30 shadow-sm border border-blue-100"
                        title="Réinitialiser le mot de passe (envoie un email)"
                      >
                        <i className={`fas ${isResetting === user.uid ? 'fa-circle-notch fa-spin' : 'fa-key'} text-xs`}></i>
                      </button>

                      {deleteConfirmUid === user.uid ? (
                        <div className="flex items-center space-x-1 animate-in slide-in-from-right-2 duration-200">
                          <button 
                            onClick={() => handleDeleteUser(user.uid, user.email)}
                            disabled={isDeleting === user.uid}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-sm disabled:opacity-50"
                          >
                            {isDeleting === user.uid ? '...' : 'CONFIRMER'}
                          </button>
                          <button 
                            onClick={() => setDeleteConfirmUid(null)}
                            disabled={isDeleting === user.uid}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all disabled:opacity-50"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setDeleteConfirmUid(user.uid)}
                          disabled={user.email === currentUserEmail}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 shadow-sm border border-red-100"
                          title="Supprimer définitivement l'accès"
                        >
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 flex items-start space-x-4">
        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
          <i className="fas fa-info-circle"></i>
        </div>
        <div>
          <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight mb-1">Comment ajouter un utilisateur ?</h4>
          <p className="text-xs text-amber-800 font-medium leading-relaxed">
            1. Saisissez l'adresse email de l'utilisateur, un mot de passe initial et choisissez son rôle.<br />
            2. Communiquez ces identifiants à l'utilisateur.<br />
            3. L'utilisateur doit s'enregistrer sur la page de connexion avec <strong>cet email et ce mot de passe</strong>.<br />
            4. Une fois enregistré, son compte sera lié au rôle défini et il pourra changer son mot de passe dans son profil.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserManager;
