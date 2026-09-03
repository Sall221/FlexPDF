import React, { useEffect } from 'react';
import {
  ShieldCheck,
  ExternalLink,
  ArrowRight,
  AlertCircle,
  X,
  Loader2,
  Lock,
  Zap,
} from 'lucide-react';
import { SubscriptionPlanId } from '../../types';

interface SasPayRedirectModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: SubscriptionPlanId;
  isLoading: boolean;
  paymentUrl: string | null;
  error: string | null;
  onRetry: () => void;
}

export const SasPayRedirectModal: React.FC<SasPayRedirectModalProps> = ({
  isOpen,
  onClose,
  planId,
  isLoading,
  paymentUrl,
  error,
  onRetry,
}) => {
  // If paymentUrl is set and there's no error, automatically redirect after a brief reassuring moment (800ms)
  useEffect(() => {
    if (isOpen && paymentUrl && !isLoading && !error) {
      const timer = setTimeout(() => {
        try {
          window.location.href = paymentUrl;
        } catch (e) {
          console.warn('Auto redirect failed', e);
        }
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [isOpen, paymentUrl, isLoading, error]);

  if (!isOpen) return null;

  const planTitle = planId === 'enterprise'
    ? 'Forfait FlexPDF Entreprise'
    : planId === 'pro_annual'
    ? 'FlexPDF Pro Annuel'
    : 'FlexPDF Pro Mensuel';

  const planPrice = planId === 'enterprise'
    ? '$39 / mois (25 500 XOF)'
    : planId === 'pro_annual'
    ? '$79 / an (51 800 XOF)'
    : '$9 / mois (5 900 XOF)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-center relative animate-in zoom-in-95 duration-200 p-6 sm:p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand & Security Header */}
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 mx-auto flex items-center justify-center shadow-inner">
            {isLoading ? (
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            ) : error ? (
              <AlertCircle className="w-8 h-8 text-rose-600" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-emerald-600 animate-pulse" />
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>Passerelle Officielle SasPay</span>
          </div>

          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            {error ? 'Erreur d\'initialisation' : 'Redirection vers SasPay...'}
          </h3>

          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {error
              ? 'Impossible de démarrer la session de paiement. Veuillez réessayer.'
              : 'Vous êtes redirigé vers le portail de paiement sécurisé de SasPay pour finaliser votre abonnement.'}
          </p>
        </div>

        {/* Plan Summary Badge */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-left">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Abonnement</span>
            <p className="text-xs font-bold text-slate-900">{planTitle}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tarif</span>
            <p className="text-xs font-bold text-indigo-600">{planPrice}</p>
          </div>
        </div>

        {/* Dynamic Action State */}
        {error ? (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left">
              {error}
            </div>
            <button
              onClick={onRetry}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              Réessayer la connexion
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentUrl ? (
              <a
                href={paymentUrl}
                target="_self"
                className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer group"
              >
                <span>Continuer vers le Paiement SasPay</span>
                <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </a>
            ) : (
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Génération du lien de paiement en cours...</span>
              </div>
            )}

            <p className="text-[11px] text-slate-400">
              Compatible Wave, Orange Money, MTN MoMo, Free Money, Visa et Mastercard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
