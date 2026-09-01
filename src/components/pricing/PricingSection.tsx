import React, { useState } from 'react';
import { Check, Crown, Zap, Shield, Sparkles, HelpCircle, ChevronDown, ChevronUp, CreditCard, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const PricingSection: React.FC = () => {
  const { user, isUnlimited, openStripeCheckout, siteSettings } = useApp();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const monthlyPrice = siteSettings.monthlyPrice || 9;
  const annualPrice = siteSettings.annualPrice || 79;
  const freeLimit = siteSettings.defaultFreeLimit || 3;
  const annualMonthlyEquivalent = (annualPrice / 12).toFixed(2);
  const discountSavings = Math.round(((monthlyPrice * 12 - annualPrice) / (monthlyPrice * 12)) * 100);

  const faqs = [
    {
      q: `Comment fonctionne la limite gratuite de ${freeLimit} tâches par jour ?`,
      a: `Chaque visiteur et utilisateur du plan gratuit peut exécuter jusqu'à ${freeLimit} conversions complètes par 24h sans débourser un centime et sans même avoir besoin de créer un compte. Le compteur se réinitialise chaque jour automatiquement à minuit.`,
    },
    {
      q: 'Que débloque l\'abonnement FlexPDF Pro ?',
      a: 'L\'accès Pro débloque les conversions illimitées (plus aucune limite quotidienne), une taille maximale de fichier de 500 Mo (contre 10 Mo en gratuit), le traitement par lot jusqu\'à 50 fichiers simultanés, la conversion OCR haute fidélité (PDF vers Word) et une vitesse d\'exécution prioritaire.',
    },
    {
      q: 'Comment s\'effectue le paiement sécurisé SasPay ?',
      a: 'Les paiements sont traités directement par la passerelle sécurisée SasPay avec prise en charge des Cartes Bancaires (Visa, Mastercard) et de tous les opérateurs Mobile Money (Wave, Orange Money, MTN MoMo, Moov Money, Airtel Money). Chiffrement TLS 256-bit et sécurité maximale.',
    },
    {
      q: 'Puis-je annuler mon abonnement à tout moment ?',
      a: 'Oui, vous pouvez annuler le renouvellement automatique à tout moment en 1 clic dans votre tableau de bord. Vos accès Pro restent actifs jusqu\'à la fin de la période facturée sans aucuns frais supplémentaires.',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-16 py-8 animate-in fade-in duration-200">
      {/* Pricing Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shadow-2xs">
          <Crown className="w-3.5 h-3.5 text-amber-600" />
          <span>Tarification Simple & Sans Surprise</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Commencez gratuitement, passez à <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 bg-clip-text text-transparent">la puissance illimitée</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 font-normal">
          Le forfait gratuit est utilisable instantanément sans inscription (3 tâches/jour). Choisissez le plan Pro pour des conversions illimitées.
        </p>

        {/* Toggle Billing Interval */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>
            Facturation Mensuelle
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className="w-14 h-8 rounded-full bg-slate-200 p-1 relative border border-slate-300 transition-colors cursor-pointer shadow-inner"
          >
            <div
              className={`w-6 h-6 rounded-full bg-indigo-600 shadow-sm transition-transform ${
                billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-bold ${billingCycle === 'annual' ? 'text-slate-900' : 'text-slate-500'}`}>
              Facturation Annuelle
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black">
              Économisez {discountSavings}%
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tier 1: Free Starter */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Forfait Gratuit</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Sans inscription</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Idéal pour les besoins ponctuels.</p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-900">0 €</span>
              <span className="text-xs text-slate-500 font-semibold">/ pour toujours</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-600 pt-4 border-t border-slate-100">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong className="text-slate-900">{freeLimit} Tâches Gratuites / Jour</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Fichiers jusqu'à <strong>10 Mo</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Accès aux 12 Outils PDF & Image</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Traitement standard par lot (3 fichiers max)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Aucune carte bancaire requise</span>
              </li>
            </ul>
          </div>

          <button
            disabled={!user || user.role === 'user'}
            className={`w-full py-3 rounded-xl text-xs font-bold border transition-all ${
              !user || user.role === 'user'
                ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-default'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs cursor-pointer'
            }`}
          >
            {!user || user.role === 'user' ? 'Actif par Défaut' : 'Forfait de Base'}
          </button>
        </div>

        {/* Tier 2: Pro Unlimited (Featured) */}
        <div className="relative p-8 rounded-3xl bg-white border-2 border-indigo-600 shadow-xl shadow-indigo-500/10 flex flex-col justify-between space-y-6">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-rose-600 text-white text-[11px] font-extrabold shadow-sm flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Recommandé par les pros
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>FlexPDF Pro</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">Puissance et vitesse illimitées pour créateurs & entreprises.</p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-900">
                ${billingCycle === 'annual' ? annualPrice : monthlyPrice}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                / {billingCycle === 'annual' ? `an ($${annualMonthlyEquivalent}/mois)` : 'mois'}
              </span>
            </div>

            <ul className="space-y-3 text-xs text-slate-600 pt-4 border-t border-slate-100">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span><strong className="text-slate-900">Conversions Illimitées (∞)</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Fichiers jusqu'à <strong className="text-slate-900">500 Mo</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Traitement par lot jusqu'à <strong>50 fichiers simultanés</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Moteur OCR & PDF vers Word éditable</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Serveur haute priorité & sans file d'attente</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Facturation SasPay & reçus PDF automatiques</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => openStripeCheckout(billingCycle === 'annual' ? 'pro_annual' : 'pro_monthly')}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>{user?.role === 'pro' ? 'Forfait Pro Déjà Actif' : 'Payer avec SasPay & Débloquer'}</span>
          </button>
        </div>

        {/* Tier 3: Enterprise / Team */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Entreprise & API</h3>
              <p className="text-xs text-slate-500 mt-1">Pour équipes, intégrateurs et forts volumes.</p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-900">$99</span>
              <span className="text-xs text-slate-500 font-semibold">/ an</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-600 pt-4 border-t border-slate-100">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Tout ce qui est inclus dans Pro Illimité</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Clé API REST Développeur (100k requêtes/mois)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Console Super Admin multi-collaborateurs</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Filigrane et branding personnalisé</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Support prioritaire par email 24/7</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => openStripeCheckout('enterprise')}
            className="w-full py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-indigo-700 font-bold text-xs border border-indigo-200 shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Prendre le Forfait Entreprise</span>
          </button>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto space-y-6 pt-8">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            Questions Fréquentes (FAQ)
          </h2>
          <p className="text-xs text-slate-500">Tout ce que vous devez savoir sur le fonctionnement des quotas et des abonnements.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-slate-200 overflow-hidden transition-colors shadow-2xs"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800 hover:text-indigo-600 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
