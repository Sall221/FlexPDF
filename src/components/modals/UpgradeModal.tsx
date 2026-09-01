import React, { useState } from 'react';
import { X, Check, Crown, Zap, Shield, Sparkles, ArrowRight, CreditCard, Gift } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SubscriptionPlanId } from '../../types';

export const UpgradeModal: React.FC = () => {
  const { isUpgradeModalOpen, setIsUpgradeModalOpen, upgradeSubscription, addNotification } = useApp();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  if (!isUpgradeModalOpen) return null;

  const basePrice = billingCycle === 'annual' ? 79 : 9;
  const finalPrice = discountPercent > 0 ? (basePrice * (1 - discountPercent / 100)).toFixed(2) : basePrice;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setIsApplyingPromo(true);
    setTimeout(() => {
      setIsApplyingPromo(false);
      if (promoCode.trim().toUpperCase() === 'LAUNCH50' || promoCode.trim().toUpperCase() === 'PRO50') {
        setDiscountPercent(50);
        addNotification('success', 'Promo Code Applied! 🎁', '50% lifetime discount applied to your order.');
      } else {
        addNotification('error', 'Invalid Code', 'Try code "LAUNCH50" for 50% off.');
      }
    }, 400);
  };

  const handleCheckout = (planId: SubscriptionPlanId) => {
    upgradeSubscription(planId);
  };

  const proFeatures = [
    'Unlimited conversions & batch tasks per day',
    'Up to 500 MB per file (vs 10 MB on Free)',
    'Process up to 50 files simultaneously in one click',
    'Optical Character Recognition (OCR) & Text extraction',
    'Highest hardware queue priority with zero latency',
    'No file expiration (Cloud sync & 30-day backups)',
    'Full access to all PDF and Image conversion tools',
    'Commercial usage license & priority customer support',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-6 my-8 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={() => setIsUpgradeModalOpen(false)}
          className="absolute right-5 top-5 p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-2xs">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            <span>FlexPDF Pro Subscription</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Unlock Unlimited High-Speed Processing
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Remove the 3 tasks/day free limit, unlock 500MB batch file sizes, and experience lightning-fast conversions.
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 max-w-xs mx-auto">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Monthly ($9/mo)
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
              billingCycle === 'annual'
                ? 'bg-gradient-to-r from-indigo-600 to-rose-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Annual ($79/yr)</span>
            <span className="absolute -top-2.5 -right-2 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-extrabold shadow-xs">
              -27%
            </span>
          </button>
        </div>

        {/* Price Box */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-slate-50 to-rose-50/60 border border-indigo-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900">${finalPrice}</span>
              <span className="text-xs text-slate-500 font-semibold">
                / {billingCycle === 'annual' ? 'year' : 'month'}
              </span>
              {discountPercent > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  50% OFF Applied
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {billingCycle === 'annual' ? 'Billed annually ($6.58/mo equivalent)' : 'Billed monthly. Cancel anytime.'}
            </p>
          </div>

          <button
            onClick={() => handleCheckout(billingCycle === 'annual' ? 'pro_annual' : 'pro_monthly')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <CreditCard className="w-4 h-4" />
            <span>Instant Upgrade Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Features Checklist */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Everything in Pro Plan:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {proFeatures.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                <div className="p-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Promo Code Input */}
        <form onSubmit={handleApplyPromo} className="pt-2 border-t border-slate-100 flex gap-2">
          <div className="relative flex-1">
            <Gift className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Promo code (e.g. LAUNCH50)..."
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white uppercase transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={!promoCode.trim() || isApplyingPromo}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer"
          >
            {isApplyingPromo ? 'Applying...' : 'Apply Code'}
          </button>
        </form>

        <div className="flex items-center justify-center gap-6 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-600" /> 14-Day Money-Back Guarantee</span>
          <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" /> Instant Activation</span>
        </div>
      </div>
    </div>
  );
};
