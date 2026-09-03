import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Shield, CheckCircle, Sparkles, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AuthPage: React.FC = () => {
  const { login, setActiveView, addNotification } = useApp();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Veuillez renseigner tous les champs obligatoires.');
      return;
    }

    if (tab === 'register' && !name) {
      setError('Veuillez saisir votre nom complet.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      // If logging in with admin email, give admin access
      const role = email.toLowerCase().includes('admin') ? 'admin' : 'user';
      login(email, role);
      setIsLoading(false);
      addNotification(
        'success',
        tab === 'login' ? 'Connexion réussie !' : 'Compte créé avec succès !',
        `Bienvenue sur FlexPDF, ${name || email}.`
      );
      setActiveView(role === 'admin' ? 'admin' : 'dashboard');
    }, 400);
  };

  return (
    <div className="max-w-md mx-auto py-6 sm:py-10 animate-in fade-in duration-200 space-y-6">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700">
          <Sparkles className="w-3.5 h-3.5" /> Espace Sécurisé FlexPDF
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {tab === 'login' ? 'Connexion à votre compte' : 'Créer votre compte gratuit'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          {tab === 'login'
            ? 'Accédez à votre historique, vos factures et vos outils illimités.'
            : 'Rejoignez plus de 45 000 professionnels et traitez vos documents sans limite.'}
        </p>
      </div>

      {/* Auth Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Tab switcher */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100/80 border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError('');
            }}
            className={`py-2.5 rounded-xl transition-all ${
              tab === 'login' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Se Connecter
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError('');
            }}
            className={`py-2.5 rounded-xl transition-all ${
              tab === 'register' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            S'Inscrire
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Nom Complet</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Claire Dupont"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Adresse Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Mot de Passe</label>
              {tab === 'login' && (
                <button
                  type="button"
                  onClick={() => setActiveView('forgot-password')}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block animate-spin">⏳</span>
            ) : (
              <>
                <span>{tab === 'login' ? 'Se Connecter' : 'Créer mon Compte Gratuit'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Social login buttons */}
        <div className="space-y-3 pt-2">
          <div className="relative flex items-center justify-center py-1">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink-0 px-3 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Ou continuer avec
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                login('user@google.com', 'user');
                setActiveView('dashboard');
              }}
              className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.8-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => {
                login('developer@github.com', 'user');
                setActiveView('dashboard');
              }}
              className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current text-slate-900" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </button>
          </div>
          <div className="pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                🧪 Profils de Test Rapide :
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    login('admin@flexpdf.com', 'admin');
                    setActiveView('admin');
                  }}
                  className="py-1.5 px-2.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold text-[11px] text-left transition-colors cursor-pointer"
                >
                  🛡️ Admin (admin@flexpdf.com)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    login('pro@flexpdf.com', 'pro');
                    setActiveView('dashboard');
                  }}
                  className="py-1.5 px-2.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] text-left transition-colors cursor-pointer"
                >
                  👑 Utilisateur Pro
                </button>
                <button
                  type="button"
                  onClick={() => {
                    login('entreprise@flexpdf.com', 'enterprise');
                    setActiveView('dashboard');
                  }}
                  className="py-1.5 px-2.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-[11px] text-left transition-colors cursor-pointer"
                >
                  🏢 Utilisateur Entreprise
                </button>
                <button
                  type="button"
                  onClick={() => {
                    login('gratuit@flexpdf.com', 'user');
                    setActiveView('dashboard');
                  }}
                  className="py-1.5 px-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[11px] text-left transition-colors cursor-pointer"
                >
                  🌱 Utilisateur Gratuit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
