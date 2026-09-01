import React, { useState } from 'react';
import { KeyRound, Mail, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ForgotPasswordModal: React.FC = () => {
  const { isForgotPasswordModalOpen, setIsForgotPasswordModalOpen, setIsAuthModalOpen, addNotification } = useApp();
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isForgotPasswordModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsSent(true);
      addNotification(
        'success',
        'Email de Réinitialisation Envoyé !',
        `Un lien sécurisé de renouvellement a été envoyé à ${email}.`
      );
    }, 700);
  };

  const handleClose = () => {
    setIsForgotPasswordModalOpen(false);
    setIsSent(false);
    setEmail('');
  };

  const handleBackToLogin = () => {
    handleClose();
    setIsAuthModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Mot de passe oublié ?</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Indiquez l'adresse email associée à votre compte FlexPDF pour recevoir un lien de réinitialisation.
          </p>
        </div>

        {isSent ? (
          <div className="space-y-4 text-center py-2">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <p className="font-bold">Instructions transmises par email</p>
              <p className="text-slate-600">
                Consultez votre boîte de réception à <strong>{email}</strong> et cliquez sur le lien pour choisir un nouveau mot de passe.
              </p>
            </div>

            <button
              onClick={handleBackToLogin}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-colors"
            >
              Retourner à la page de connexion
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Adresse Email du Compte</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@societe.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <span>Recevoir le lien de réinitialisation</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Retour à la connexion
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
