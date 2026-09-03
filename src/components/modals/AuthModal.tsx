import React, { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight, ShieldCheck, Crown, Sparkles, CheckCircle2, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, setIsForgotPasswordModalOpen, login, addNotification } = useApp();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    if (tab === 'register') {
      login(email.trim(), 'user');
      addNotification('success', 'Compte Créé avec Succès !', `Bienvenue ${name || email} sur FlexPDF.`);
    } else {
      // Check if email matches admin
      if (email.toLowerCase().includes('admin') || email.toLowerCase().includes('fadalsall')) {
        login(email.trim(), 'admin');
      } else if (email.toLowerCase().includes('pro') || email.toLowerCase().includes('chen')) {
        login(email.trim(), 'pro');
      } else {
        login(email.trim(), 'user');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-6 animate-in zoom-in-95 duration-150 my-6">
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute right-5 top-5 p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>FlexPDF Cloud Auth</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            {tab === 'login' ? 'Espace Connexion' : 'Créer un Compte Pro'}
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {tab === 'login'
              ? 'Connectez-vous pour retrouver vos fichiers convertis, votre quota et vos factures.'
              : 'Rejoignez des milliers de professionnels et gérez vos documents en toute sécurité.'}
          </p>
        </div>

        {/* Free Plan Notice */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-[11px] text-indigo-900 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <span>
            <strong>Accès Instantané :</strong> Vous pouvez convertir des documents sans inscription (3 tâches offertes/jour) ou vous connecter pour gérer vos forfaits et factures SasPay.
          </span>
        </div>

        {/* Form Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setTab('login')}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              tab === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Se Connecter
          </button>
          <button
            onClick={() => setTab('register')}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              tab === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Créer un Compte
          </button>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Nom complet</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Jean Dupont"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Adresse E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="nom@entreprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Mot de Passe</label>
              {tab === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    setIsForgotPasswordModalOpen(true);
                  }}
                  className="text-[11px] text-indigo-600 hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
          >
            <span>{tab === 'login' ? 'Se Connecter à FlexPDF' : 'Créer Mon Compte Gratuit'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Social Authentication */}
        <div className="space-y-3">
          <div className="relative flex items-center justify-center py-1">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink-0 px-3 text-[10px] text-slate-400 uppercase tracking-wider font-bold text-center">
              Ou continuer avec
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                login('google.user@gmail.com', 'user');
                addNotification('success', 'Connexion Google Réussie', 'Bienvenue via Google Identity.');
              }}
              className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => {
                login('github.coder@dev.io', 'pro');
                addNotification('success', 'Connexion GitHub Réussie', 'Bienvenue via GitHub OAuth (Compte Pro).');
              }}
              className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <svg className="w-4 h-4 fill-slate-900" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-center text-slate-400">
          En continuant, vous acceptez les Conditions d'Utilisation et la Politique de Confidentialité de FlexPDF.
        </p>
      </div>
    </div>
  );
};
