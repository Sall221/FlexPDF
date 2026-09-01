import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Gift,
  Building2,
  QrCode,
  Smartphone,
  Calendar,
  Layers,
  FileCheck,
  Check,
  RotateCcw,
  Zap,
  HelpCircle,
  Clock,
  Send,
  PhoneCall,
  Globe2,
  Radio,
  Server,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { SubscriptionPlanId, MobileMoneyOperator } from '../../types';
import { saspayService, SasPayGatewayConfig } from '../../services/saspayService';

interface SasPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlanId: SubscriptionPlanId;
}

type PaymentTab = 'mobile_money' | 'card' | 'bank_transfer';

const COUNTRIES = [
  { code: 'SN', name: 'Sénégal', dial: '+221', flag: '🇸🇳', operators: ['wave', 'orange', 'free'] },
  { code: 'CI', name: "Côte d'Ivoire", dial: '+225', flag: '🇨🇮', operators: ['wave', 'orange', 'mtn', 'moov'] },
  { code: 'CM', name: 'Cameroun', dial: '+237', flag: '🇨🇲', operators: ['orange', 'mtn'] },
  { code: 'ML', name: 'Mali', dial: '+223', flag: '🇲🇱', operators: ['orange', 'moov'] },
  { code: 'BJ', name: 'Bénin', dial: '+229', flag: '🇧🇯', operators: ['mtn', 'moov'] },
  { code: 'CD', name: 'RDC Congo', dial: '+243', flag: '🇨🇩', operators: ['airtel', 'orange', 'mpesa'] },
  { code: 'GN', name: 'Guinée', dial: '+224', flag: '🇬🇳', operators: ['orange', 'mtn'] },
  { code: 'TG', name: 'Togo', dial: '+228', flag: '🇹🇬', operators: ['moov', 'tmoney'] },
  { code: 'BF', name: 'Burkina Faso', dial: '+226', flag: '🇧🇫', operators: ['orange', 'moov'] },
  { code: 'FR', name: 'France & International', dial: '+33', flag: '🇫🇷', operators: ['card'] },
];

const OPERATOR_DETAILS: Record<string, { name: string; color: string; bg: string; logoText: string; ussdHint: string }> = {
  wave: {
    name: 'Wave Money',
    color: 'text-sky-600',
    bg: 'bg-sky-50 border-sky-200 hover:border-sky-400',
    logoText: '🌊 Wave',
    ussdHint: 'Validation directe par notification Push ou QR Code dans votre app Wave',
  },
  orange: {
    name: 'Orange Money',
    color: 'text-orange-600',
    bg: 'bg-orange-50 border-orange-200 hover:border-orange-400',
    logoText: '🍊 Orange Money',
    ussdHint: 'Composez #144# ou saisissez votre code OTP reçu par SMS',
  },
  mtn: {
    name: 'MTN Mobile Money',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200 hover:border-amber-400',
    logoText: '🟡 MTN MoMo',
    ussdHint: 'Validez le message USSD entrant sur votre téléphone avec votre code PIN secret',
  },
  moov: {
    name: 'Moov Money',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
    logoText: '🟢 Moov Money',
    ussdHint: 'Composez le code USSD Moov ou confirmez via l\'application',
  },
  airtel: {
    name: 'Airtel Money',
    color: 'text-rose-600',
    bg: 'bg-rose-50 border-rose-200 hover:border-rose-400',
    logoText: '🔴 Airtel Money',
    ussdHint: 'Confirmez le débit sur votre compte Airtel Money',
  },
  mpesa: {
    name: 'M-Pesa',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-300 hover:border-emerald-500',
    logoText: '💚 M-Pesa',
    ussdHint: 'Enter your M-Pesa PIN on phone prompt',
  },
};

export const SasPayModal: React.FC<SasPayModalProps> = ({
  isOpen,
  onClose,
  selectedPlanId,
}) => {
  const { user, upgradeSubscription, addNotification, login, siteSettings } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<PaymentTab>('mobile_money');
  
  // Mobile Money State
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [selectedOperator, setSelectedOperator] = useState<MobileMoneyOperator>('wave');
  const [phoneNumber, setPhoneNumber] = useState('77 123 45 67');
  const [otpCode, setOtpCode] = useState('');
  const [requiresOtp, setRequiresOtp] = useState(false);

  // Card State
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardName, setCardName] = useState(user?.name || 'Alex Dupont');
  const [postalCode, setPostalCode] = useState('75008');

  // Common State
  const [emailInput, setEmailInput] = useState(user?.email || 'client@flexpdf.com');
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [lastTxId, setLastTxId] = useState('');

  // Gateway Config state
  const [gatewayConfig, setGatewayConfig] = useState<SasPayGatewayConfig | null>(null);

  useEffect(() => {
    if (isOpen) {
      saspayService.getConfig().then((cfg) => {
        setGatewayConfig(cfg);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isAnnual = selectedPlanId === 'pro_annual';
  const isEnterprise = selectedPlanId === 'enterprise';

  const basePrice = isEnterprise ? 99 : isAnnual ? siteSettings.annualPrice || 79 : siteSettings.monthlyPrice || 9;
  const finalPrice = discountPercent > 0 ? Number((basePrice * (1 - discountPercent / 100)).toFixed(2)) : basePrice;
  const subtotal = Number((finalPrice / 1.2).toFixed(2));
  const taxVat = Number((finalPrice - subtotal).toFixed(2));

  // Estimate in XOF / FCFA for convenience
  const priceXOF = Math.round(finalPrice * (gatewayConfig?.exchangeRates?.USD_XOF || 655.957));

  const planTitle = isEnterprise
    ? 'FlexPDF Enterprise & Team'
    : isAnnual
    ? 'FlexPDF Pro (Abonnement Annuel - 365 jours)'
    : 'FlexPDF Pro (Abonnement Mensuel - 30 jours)';

  // Format card number with spaces
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').substring(0, 16);
    const parts = raw.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(' ') : raw);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.substring(0, 2)}/${raw.substring(2, 4)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  const detectBrand = () => {
    const raw = cardNumber.replace(/\s/g, '');
    if (raw.startsWith('4')) return 'Visa';
    if (raw.startsWith('5')) return 'Mastercard';
    if (raw.startsWith('3')) return 'Amex';
    return 'Carte Bancaire';
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = promoCode.trim().toUpperCase();
    if (clean === 'LAUNCH50' || clean === 'PRO50') {
      setDiscountPercent(50);
      addNotification('success', 'Code Promo Appliqué (-50%) ! 🎁', '50% de réduction appliqués immédiatement via SasPay.');
    } else if (clean === 'WELCOME20') {
      setDiscountPercent(20);
      addNotification('success', 'Code Promo Appliqué (-20%) ! 🎁', '20% de réduction appliqués sur votre panier.');
    } else if (clean === 'ANNUAL30') {
      setDiscountPercent(30);
      addNotification('success', 'Code Promo Spécial (-30%) ! 🎁', '30% de réduction appliqués sur votre abonnement.');
    } else {
      addNotification('error', 'Code Invalide', 'Codes valides : LAUNCH50 (-50%), WELCOME20 (-20%) ou PRO50');
    }
  };

  const handleFillTestMobileMoney = (op: MobileMoneyOperator, phone: string) => {
    setSelectedOperator(op);
    setPhoneNumber(phone);
    addNotification('info', `SasPay Test : ${op.toUpperCase()}`, `Numéro de test ${phone} configuré.`);
  };

  const handleFillTestCard = (type: 'valid' | 'declined') => {
    if (type === 'valid') {
      setCardNumber('4242 4242 4242 4242');
      setCardExpiry('12/29');
      setCardCvc('321');
      setCardName(user?.name || 'Alex Dupont');
      addNotification('info', 'Carte SasPay Valide Remplie', 'Visa 4242 - Prête pour validation instantanée.');
    } else {
      setCardNumber('4000 0000 0000 0002');
      setCardExpiry('10/26');
      setCardCvc('100');
      addNotification('warning', 'Carte Test Rejetée', 'Cette carte simulera un refus bancaire SasPay.');
    }
  };

  const handleExecutePayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (paymentMethod === 'card' && cardNumber.includes('0002')) {
      addNotification('error', 'Paiement Rejeté par SasPay', 'Votre carte a été refusée par la passerelle de paiement.');
      return;
    }

    if (paymentMethod === 'mobile_money' && phoneNumber.trim().length < 6) {
      addNotification('error', 'Numéro Mobile Money Invalide', 'Veuillez saisir un numéro de téléphone valide.');
      return;
    }

    setIsProcessing(true);

    try {
      const brand = detectBrand();
      const cleanCard = cardNumber.replace(/\s/g, '');
      const cardLast4 = cleanCard.length >= 4 ? cleanCard.substring(cleanCard.length - 4) : '4242';

      // Execute real full payment flow through SasPay API service
      const paymentResponse = await saspayService.executeFullPaymentFlow(
        {
          planId: selectedPlanId,
          amount: finalPrice,
          currency: 'USD',
          paymentMethod: paymentMethod === 'mobile_money' ? 'mobile_money' : 'card',
          customer: {
            name: cardName || user?.name || 'Client FlexPDF',
            email: emailInput || user?.email || 'client@flexpdf.com',
            phone: paymentMethod === 'mobile_money' ? `${selectedCountry.dial} ${phoneNumber}` : undefined,
          },
          mobileMoney:
            paymentMethod === 'mobile_money'
              ? {
                  operator: selectedOperator,
                  countryCode: selectedCountry.code,
                  phoneNumber: `${selectedCountry.dial} ${phoneNumber}`,
                }
              : undefined,
          card:
            paymentMethod === 'card'
              ? {
                  cardNumber: cleanCard,
                  cardExpiry,
                  cardCvc,
                  cardName,
                }
              : undefined,
          discountPercent,
          promoCode,
        },
        (step) => setProcessingStep(step)
      );

      const txId = paymentResponse.transactionId || `SASP_${Date.now().toString(36).toUpperCase()}`;
      setLastTxId(txId);

      if (!user) {
        login(emailInput || 'client@flexpdf.com', 'pro');
      }

      upgradeSubscription(selectedPlanId, {
        paymentMethod: paymentMethod === 'mobile_money' ? 'mobile_money' : 'card',
        cardLast4,
        cardBrand: brand,
        mobileMoneyPhone: `${selectedCountry.dial} ${phoneNumber}`,
        mobileMoneyOperator: selectedOperator,
        customerName: cardName || user?.name || 'Client FlexPDF',
        customerEmail: emailInput,
        discountPercent,
      });

      setIsProcessing(false);
      setCheckoutSuccess(true);

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#4F46E5', '#10B981', '#F59E0B', '#06B6D4'],
      });

      addNotification('success', 'Paiement SasPay Validé avec Succès ! 🎉', `Votre abonnement ${planTitle} est actif.`);
    } catch (err: any) {
      setIsProcessing(false);
      addNotification('error', 'Échec du Paiement SasPay', err?.message || 'Impossible de finaliser la transaction.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl p-5 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-5 my-6 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!checkoutSuccess ? (
          <>
            {/* Header with SasPay Branding */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs tracking-wider flex items-center gap-1.5 shadow-2xs">
                  <Lock className="w-3 h-3" />
                  <span>AGRÉGATEUR DE PAIEMENT SASPAY</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ⚡ Mobile Money & Carte
                </span>
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                  <Server className="w-3 h-3 text-emerald-600" />
                  API {gatewayConfig?.environment === 'live' ? 'Live' : 'Sandbox V1'}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Finaliser votre abonnement {planTitle}
              </h2>
              <p className="text-xs text-slate-500">
                Paiement ultra-rapide et sécurisé par carte bancaire ou Mobile Money (Wave, Orange, MTN, Moov).
              </p>
            </div>

            {/* Plan Price Summary Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                  Forfait Sélectionné
                </span>
                <p className="font-bold text-sm text-white">
                  {isEnterprise ? 'FlexPDF Enterprise' : isAnnual ? 'FlexPDF Pro (365 Jours)' : 'FlexPDF Pro (30 Jours)'}
                </p>
                <p className="text-xs text-slate-300">
                  {isAnnual ? 'Facturé annuellement (Économisez 20%)' : 'Facturé mensuellement • Sans engagement'}
                </p>
              </div>

              <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-2xl font-black text-white">${finalPrice}</span>
                  <span className="text-xs text-slate-300">/ {isAnnual ? 'an' : 'mois'}</span>
                </div>
                <span className="text-[11px] font-semibold text-amber-300 block">
                  ~ {priceXOF.toLocaleString()} FCFA
                </span>
                {discountPercent > 0 && (
                  <span className="text-[10px] font-bold text-emerald-400 block line-through opacity-70">
                    ${basePrice} ({discountPercent}% de remise)
                  </span>
                )}
              </div>
            </div>

            {/* Promo Code Input */}
            <form onSubmit={handleApplyPromo} className="flex gap-2">
              <div className="relative flex-1">
                <Gift className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Code promo (ex: LAUNCH50, WELCOME20)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 uppercase"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Appliquer
              </button>
            </form>

            {/* Payment Method Switcher Tabs */}
            <div className="space-y-3">
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mobile_money')}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'mobile_money'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Mobile Money (SasPay)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Carte Bancaire</span>
                </button>
              </div>

              {/* TAB 1: Mobile Money with SasPay */}
              {paymentMethod === 'mobile_money' && (
                <div className="space-y-4 pt-1">
                  {/* Country Selector */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                      <Globe2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Pays & Région</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                      {COUNTRIES.slice(0, 5).map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => setSelectedCountry(c)}
                          className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            selectedCountry.code === c.code
                              ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-2xs'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                          }`}
                        >
                          <span className="text-sm">{c.flag}</span>
                          <span className="truncate">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Operator Selector */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Opérateur Mobile Money Disponible
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['wave', 'orange', 'mtn', 'moov'] as MobileMoneyOperator[]).map((opKey) => {
                        const op = OPERATOR_DETAILS[opKey];
                        const isSelected = selectedOperator === opKey;
                        return (
                          <button
                            key={opKey}
                            type="button"
                            onClick={() => setSelectedOperator(opKey)}
                            className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                              isSelected
                                ? `${op.bg} ring-2 ring-indigo-600 ring-offset-1 text-slate-900`
                                : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                            }`}
                          >
                            <span className="text-xs">{op.logoText}</span>
                            <span className="text-[10px] text-slate-500 font-normal">Push & OTP</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Phone Number Input */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Numéro de Téléphone {selectedOperator.toUpperCase()}
                    </label>
                    <div className="flex rounded-xl bg-white border border-slate-200 overflow-hidden shadow-2xs focus-within:border-indigo-500">
                      <span className="px-3 py-2 bg-slate-50 text-slate-600 text-xs font-mono font-bold border-r border-slate-200 flex items-center">
                        {selectedCountry.dial}
                      </span>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="77 000 00 00"
                        className="flex-1 px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <PhoneCall className="w-3 h-3 text-indigo-500 inline" />
                      {OPERATOR_DETAILS[selectedOperator]?.ussdHint}
                    </p>
                  </div>

                  {/* Test Shortcuts */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                    <span className="font-bold text-slate-600 block">Raccourcis Démo SasPay :</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleFillTestMobileMoney('wave', '77 123 45 67')}
                        className="px-2 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 text-[10px] font-bold cursor-pointer"
                      >
                        Wave (Sénégal/CI)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFillTestMobileMoney('orange', '78 987 65 43')}
                        className="px-2 py-0.5 rounded bg-orange-100 hover:bg-orange-200 text-orange-800 text-[10px] font-bold cursor-pointer"
                      >
                        Orange Money
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFillTestMobileMoney('mtn', '97 555 44 33')}
                        className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold cursor-pointer"
                      >
                        MTN MoMo
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Card Payment */}
              {paymentMethod === 'card' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Numéro de Carte Bancaire
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4242 4242 4242 4242"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                      />
                      <span className="absolute right-3 top-2 text-xs font-bold text-indigo-600">
                        {detectBrand()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Date d'expiration
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        placeholder="MM/AA"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        CVC / CVV
                      </label>
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.substring(0, 4))}
                        placeholder="123"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Nom complet sur la carte
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Alex Dupont"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                    />
                  </div>

                  {/* Test Cards */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleFillTestCard('valid')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 cursor-pointer"
                    >
                      ✓ Carte Valide (4242)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFillTestCard('declined')}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200 cursor-pointer"
                    >
                      ✕ Carte Refusée (0002)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Email field if guest */}
            {!user && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Adresse e-mail pour recevoir vos factures
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="votre-email@exemple.com"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                />
              </div>
            )}

            {/* Processing State Banner */}
            {isProcessing && (
              <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center gap-3 animate-pulse">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold text-indigo-900">{processingStep}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleExecutePayment()}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>
                {isProcessing
                  ? 'Traitement SasPay en cours...'
                  : `Payer $${finalPrice} via SasPay (${paymentMethod === 'mobile_money' ? selectedOperator.toUpperCase() : 'CARTE'})`}
              </span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            {/* Security Guarantee Badges */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-3">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Chiffrement SasPay TLS 256-bit
              </span>
              <span>Conforme PCI-DSS Niveau 1</span>
              <span>Annulation en 1 clic</span>
            </div>
          </>
        ) : (
          /* SUCCESS STATE */
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">Paiement SasPay Réussi ! 🎉</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Votre abonnement <span className="font-bold text-slate-900">{planTitle}</span> est immédiatement activé.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">ID de Transaction SasPay :</span>
                <span className="font-bold text-indigo-700">{lastTxId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Montant Débité :</span>
                <span className="font-bold text-slate-900">${finalPrice} USD (~{priceXOF.toLocaleString()} FCFA)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Méthode de Paiement :</span>
                <span className="font-bold text-emerald-700">
                  {paymentMethod === 'mobile_money' ? `SasPay Mobile Money (${selectedOperator.toUpperCase()})` : 'SasPay Carte Bancaire'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Plafond Quotidien :</span>
                <span className="font-bold text-emerald-600">Illimité (∞)</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Commencer à convertir sans limite
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
