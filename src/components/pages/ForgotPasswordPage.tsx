import React, { useState } from 'react';
import { Mail, ArrowLeft, Send, CheckCircle2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ForgotPasswordPage: React.FC = () => {
  const { setActiveView, addNotification } = useApp();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Veuillez entrer une adresse email valide.');
      return;
    }
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      addNotification(
        'success',
        'Lien de Réinitialisation Envoyé',
        `Un courriel sécurisé contenant le lien de réinitialisation a été expédié à ${email}.`
      );
    }, 800);
  };

  return (
    <div className="max-w-md mx-auto py-6 sm:py-12 animate-in fade-in duration-200 space-y-6">
      {/* Back button */}
      <button
        onClick={() => setActiveView('auth')}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 text-slate-500" />
        <span>Retour à la connexion</span>
      </button>

      {/* Main card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mx-auto flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Mot de passe oublié ?
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Saisissez l'adresse email associée à votre compte FlexPDF pour recevoir un lien de réinitialisation.
          </p>
        </div>

        {isSubmitted ? (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-950">Courriel Envoyé avec Succès !</h3>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Consultez votre boîte de réception à l'adresse <strong>{email}</strong> et cliquez sur le lien pour configurer votre nouveau mot de passe.
            </p>
            <button
              onClick={() => {
                setIsSubmitted(false);
                setEmail('');
                setActiveView('auth');
              }}
              className="mt-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Retour à la page de connexion
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Adresse Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="vous@domaine.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                <span className="inline-block animate-spin">⏳ Envoi en cours...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Envoyer le lien de réinitialisation</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 pt-2 text-slate-500 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Chiffrement et protection des données conformes RGPD</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
