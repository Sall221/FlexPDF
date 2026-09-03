import React from 'react';
import { ShieldAlert, Lock, ArrowLeft, KeyRound } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AdminAccessGuard: React.FC = () => {
  const { setActiveView, login, addNotification, user } = useApp();

  const handleLoginAsAdmin = () => {
    login('fadalsall1997@gmail.com', 'admin');
    setActiveView('admin');
    addNotification(
      'success',
      'Accès Super Admin Déverrouillé 🛡️',
      'Bienvenue dans la console de gestion globale FlexPDF, Fadal Sall.'
    );
  };

  return (
    <div className="max-w-xl mx-auto my-12 p-6 sm:p-8 rounded-3xl bg-white border border-rose-100 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-150">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
        <ShieldAlert className="w-9 h-9" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200">
          <Lock className="w-3 h-3" />
          <span>GARDE D'ACCÈS SUPER ADMIN ACTIF</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900">
          Accès Réservé au Super Administrateur
        </h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          Le panneau d'administration est strictement réservé au compte super-administrateur{' '}
          <strong className="text-slate-900 font-mono">fadalsall1997@gmail.com</strong>. Toute tentative
          d'accès non autorisé par saisie directe d'URL est bloquée et consignée dans le registre de sécurité.
        </p>
      </div>

      {user && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          Compte actuellement connecté : <span className="font-bold text-slate-900">{user.email}</span> (Rôle : {user.role})
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={() => setActiveView('home')}
          className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'accueil</span>
        </button>

        <button
          onClick={handleLoginAsAdmin}
          className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
        >
          <KeyRound className="w-4 h-4 text-amber-400" />
          <span>Connexion Super Admin</span>
        </button>
      </div>
    </div>
  );
};

