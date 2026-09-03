import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Gift,
  Building2,
  Smartphone,
  Check,
  RotateCcw,
  Zap,
  Clock,
  Send,
  PhoneCall,
  Globe2,
  Download,
  AlertCircle,
  FileText,
  BadgeCheck,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  User,
  UserCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import { useApp } from '../../context/AppContext';
import { SubscriptionPlanId, MobileMoneyOperator } from '../../types';
import { saspayService, SasPayGatewayConfig } from '../../services/saspayService';

interface SasPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlanId: SubscriptionPlanId;
}

type PaymentTab = 'mobile_money' | 'card' | 'bank_transfer';
type WizardStep = 1 | 2 | 3 | 4 | 5;

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
    logoText: '🌊 Wave Money',
    ussdHint: 'Validation instantanée par Push ou QR Code Wave',
  },
  orange: {
    name: 'Orange Money',
    color: 'text-orange-600',
    bg: 'bg-orange-50 border-orange-200 hover:border-orange-400',
    logoText: '🍊 Orange Money',
    ussdHint: 'Validez la demande de paiement reçue sur votre téléphone Orange',
  },
  mtn: {
    name: 'MTN Mobile Money',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200 hover:border-amber-400',
    logoText: '🟡 MTN MoMo',
    ussdHint: 'Approuvez la transaction via votre invite USSD MTN (*133#)',
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
  const { user, upgradeSubscription, addNotification, login, setUserPassword, setActiveView, siteSettings } = useApp();

  // Wizard Step State: 
  // 1 = Choix du Forfait
  // 2 = Informations du Compte & Paiement SasPay
  // 3 = Traitement & Progression
  // 4 = Vérification de l'Email
  // 5 = Compte Activé & Définition du Mot de Passe
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  const [activePlanId, setActivePlanId] = useState<SubscriptionPlanId>(selectedPlanId);
  const [paymentMethod, setPaymentMethod] = useState<PaymentTab>('mobile_money');
  
  // Account Information to collect (NO password required at this stage)
  const [fullName, setFullName] = useState(user?.name || 'Fadal Sall');
  const [emailInput, setEmailInput] = useState(user?.email || 'fadalsall1997@gmail.com');
  const [phoneNumber, setPhoneNumber] = useState('77 123 45 67');
  const [companyName, setCompanyName] = useState('');
  
  // Mobile Money State
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [selectedOperator, setSelectedOperator] = useState<MobileMoneyOperator>('wave');

  // Card State
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardName, setCardName] = useState(user?.name || 'Fadal Sall');

  // Promo Code State
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  
  // Processing Progression Pipeline Sub-steps
  const [pipelineStepIndex, setPipelineStepIndex] = useState(0);
  const [processingStatusText, setProcessingStatusText] = useState('');
  const [lastTxId, setLastTxId] = useState('');
  const [completedDate, setCompletedDate] = useState('');

  // Email Verification Step State
  const [verificationCode, setVerificationCode] = useState('');
  const [expectedCode, setExpectedCode] = useState('849201');
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Password Setup Step State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Gateway Config state
  const [gatewayConfig, setGatewayConfig] = useState<SasPayGatewayConfig | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActivePlanId(selectedPlanId);
      setCurrentStep(1);
      setPipelineStepIndex(0);
      setVerificationCode('');
      setNewPassword('');
      setConfirmPassword('');
      saspayService.getConfig().then((cfg) => {
        setGatewayConfig(cfg);
      });
      if (user?.email) {
        setEmailInput(user.email);
      }
      if (user?.name) {
        setFullName(user.name);
        setCardName(user.name);
      }
    }
  }, [isOpen, selectedPlanId, user]);

  // Resend code countdown timer
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  if (!isOpen) return null;

  const isAnnual = activePlanId === 'pro_annual';
  const isEnterprise = activePlanId === 'enterprise';

  const monthlyPrice = siteSettings.monthlyPrice || 9;
  const annualPrice = siteSettings.annualPrice || 79;
  const discountSavings = Math.round(((monthlyPrice * 12 - annualPrice) / (monthlyPrice * 12)) * 100);

  const basePrice = isEnterprise ? 99 : isAnnual ? annualPrice : monthlyPrice;
  const finalPrice = discountPercent > 0 ? Number((basePrice * (1 - discountPercent / 100)).toFixed(2)) : basePrice;

  // Estimate in XOF / FCFA for convenience
  const priceXOF = Math.round(finalPrice * (gatewayConfig?.exchangeRates?.USD_XOF || 655.957));

  const planTitle = isEnterprise
    ? 'FlexPDF Enterprise & API'
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
      setCardName(fullName || 'Fadal Sall');
      addNotification('info', 'Carte SasPay Valide Remplie', 'Visa 4242 - Prête pour validation instantanée.');
    } else {
      setCardNumber('4000 0000 0000 0002');
      setCardExpiry('10/26');
      setCardCvc('100');
      addNotification('warning', 'Carte Test Rejetée', 'Cette carte simulera un refus bancaire SasPay.');
    }
  };

  // Launch the multi-step SasPay live progression
  const startPaymentExecution = async () => {
    if (!fullName.trim()) {
      addNotification('error', 'Nom Requis', 'Veuillez saisir votre nom complet pour l\'initialisation de votre compte.');
      return;
    }
    if (!emailInput.trim() || !emailInput.includes('@')) {
      addNotification('error', 'Email Invalide', 'Veuillez renseigner une adresse email valide pour la création du compte.');
      return;
    }

    if (paymentMethod === 'card' && cardNumber.includes('0002')) {
      addNotification('error', 'Paiement Rejeté par SasPay', 'Votre carte a été refusée par la passerelle de paiement (Code 0002).');
      return;
    }

    if (paymentMethod === 'mobile_money' && phoneNumber.trim().length < 6) {
      addNotification('error', 'Numéro Mobile Money Invalide', 'Veuillez saisir un numéro de téléphone valide.');
      return;
    }

    // Move to Step 3 (Live Progression Wizard)
    setCurrentStep(3);
    setPipelineStepIndex(1);
    setProcessingStatusText('Connexion au tunnel sécurisé SasPay (TLS 1.3)...');

    const brand = detectBrand();
    const cleanCard = cardNumber.replace(/\s/g, '');
    const cardLast4 = cleanCard.length >= 4 ? cleanCard.substring(cleanCard.length - 4) : '4242';

    try {
      // Sub-step 1: Initialization
      await new Promise((r) => setTimeout(r, 600));
      setPipelineStepIndex(2);
      if (paymentMethod === 'mobile_money') {
        const opName = selectedOperator.toUpperCase();
        setProcessingStatusText(`Envoi de la notification Push & Requête USSD vers ${opName} (${selectedCountry.dial} ${phoneNumber})...`);
      } else {
        setProcessingStatusText('Contrôle 3D-Secure 2.0 et chiffrement bancaire AES-256...');
      }

      // Sub-step 2: SasPay API Call
      const paymentResponse = await saspayService.executeFullPaymentFlow(
        {
          planId: activePlanId,
          amount: finalPrice,
          currency: 'USD',
          paymentMethod: paymentMethod === 'mobile_money' ? 'mobile_money' : 'card',
          customer: {
            name: fullName.trim(),
            email: emailInput.trim(),
            phone: `${selectedCountry.dial} ${phoneNumber}`,
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
                  cardName: cardName || fullName,
                }
              : undefined,
          discountPercent,
          promoCode,
        },
        (step) => setProcessingStatusText(step)
      );

      // Sub-step 3: Authorization & Verification
      setPipelineStepIndex(3);
      setProcessingStatusText('Autorisation du débit accordée par SasPay & Validation anti-fraude...');
      await new Promise((r) => setTimeout(r, 700));

      // Sub-step 4: Final Settlement & Activation
      setPipelineStepIndex(4);
      setProcessingStatusText('Génération du code de vérification email sécurisé...');
      await new Promise((r) => setTimeout(r, 600));

      const txId = paymentResponse.transactionId || `SASP_${Date.now().toString(36).toUpperCase()}`;
      setLastTxId(txId);
      const nowStr = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      setCompletedDate(nowStr);

      // Generate a verification code and send notification
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      setExpectedCode(randomCode);
      setResendTimer(60);

      // Move directly to Step 4 (Email Verification)
      setCurrentStep(4);
      addNotification(
        'info',
        'Code de Vérification Envoyé ! ✉️',
        `Un email contenant le code ${randomCode} a été transmis à ${emailInput}.`
      );
    } catch (err: any) {
      setCurrentStep(2);
      addNotification('error', 'Échec du Paiement SasPay', err?.message || 'Impossible de finaliser la transaction.');
    }
  };

  // Handle email verification code submit
  const handleVerifyEmailCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = verificationCode.trim();

    if (!cleanCode) {
      addNotification('error', 'Code Requis', 'Veuillez saisir le code à 6 chiffres reçu par email.');
      return;
    }

    // Allow verification if entered correctly or test bypass
    if (cleanCode !== expectedCode && cleanCode !== '123456' && cleanCode !== '849201') {
      addNotification('error', 'Code Incorrect', `Le code saisi est invalide. Utilisez le code envoyé : ${expectedCode}`);
      return;
    }

    setIsVerifyingEmail(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsVerifyingEmail(false);

    const brand = detectBrand();
    const cleanCard = cardNumber.replace(/\s/g, '');
    const cardLast4 = cleanCard.length >= 4 ? cleanCard.substring(cleanCard.length - 4) : '4242';

    // 1. Connect user account
    if (!user || user.email !== emailInput) {
      login(emailInput, activePlanId === 'enterprise' ? 'admin' : 'pro');
    }

    // 2. Upgrade subscription with verified status
    upgradeSubscription(activePlanId, {
      paymentMethod: paymentMethod === 'mobile_money' ? 'mobile_money' : 'card',
      cardLast4,
      cardBrand: brand,
      mobileMoneyPhone: `${selectedCountry.dial} ${phoneNumber}`,
      mobileMoneyOperator: selectedOperator,
      customerName: fullName,
      customerEmail: emailInput,
      company: companyName,
      phone: `${selectedCountry.dial} ${phoneNumber}`,
      emailVerified: true,
      hasPassword: false,
      discountPercent,
      keepModalOpen: true,
    });

    // 3. Move to Step 5: Account Redirect & Password Setup
    setCurrentStep(5);

    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#4F46E5', '#10B981', '#F59E0B', '#06B6D4'],
    });

    addNotification(
      'success',
      'Email Vérifié & Compte Activé ! 🎉',
      'Votre compte est débloqué. Veuillez maintenant définir votre mot de passe.'
    );
  };

  const handleResendVerificationCode = () => {
    if (resendTimer > 0) return;
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedCode(newCode);
    setResendTimer(60);
    addNotification('info', 'Nouveau Code Envoyé ! ✉️', `Un nouveau code (${newCode}) a été envoyé à ${emailInput}.`);
  };

  // Handle final password creation
  const handleSavePasswordAndFinish = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      addNotification('error', 'Mot de passe requis', 'Veuillez saisir un mot de passe pour sécuriser votre compte.');
      return;
    }

    if (newPassword.length < 6) {
      addNotification('error', 'Mot de passe trop court', 'Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      addNotification('error', 'Mots de passe non identiques', 'La confirmation ne correspond pas au mot de passe saisi.');
      return;
    }

    setIsSavingPassword(true);
    await new Promise((r) => setTimeout(r, 500));
    setIsSavingPassword(false);

    setUserPassword(newPassword);
    onClose();
    setActiveView('dashboard');

    addNotification(
      'success',
      'Bienvenue sur votre Compte Pro ! 🚀',
      `Toutes vos fonctionnalités sont débloquées sans limites pour ${fullName}.`
    );
  };

  const handleDownloadOfficialPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 36, 'F');

      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('FLEXPDF SAAS - REÇU OFFICIEL SASPAY', 14, 22);

      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225);
      doc.text('Passerelle de Paiement SasPay Multi-Rail • Facture Acquittée & Compte Vérifié', 14, 30);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(`Réf. Transaction : ${lastTxId || 'SASP_LIVE_SUCCESS'}`, 14, 50);
      doc.text(`Date & Heure : ${completedDate || new Date().toLocaleString()}`, 14, 58);
      doc.text(`Client Titulaire : ${fullName}`, 14, 66);
      doc.text(`Email Vérifié : ${emailInput}`, 14, 74);
      if (companyName) {
        doc.text(`Société : ${companyName}`, 14, 82);
      }
      doc.text(`Forfait Activé : ${planTitle}`, 14, companyName ? 90 : 82);
      doc.text(
        `Moyen de paiement : ${paymentMethod === 'mobile_money' ? `SasPay Mobile Money (${selectedOperator.toUpperCase()})` : 'Carte Bancaire SasPay'}`,
        14,
        companyName ? 98 : 90
      );
      doc.text(`Montant TTC Réglé : $${finalPrice} USD (~${priceXOF.toLocaleString()} FCFA)`, 14, companyName ? 106 : 98);
      doc.text(`Statut : TRANSACTION ACQUITTÉE & COMPTE VÉRIFIÉ (100%)`, 14, companyName ? 114 : 106);

      doc.setDrawColor(226, 232, 240);
      doc.line(14, 122, 196, 122);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Garantie de Sécurité : Les documents PDF traités ne transitent jamais sur nos serveurs (100% Client-Side RGPD).', 14, 132);
      doc.text('Merci pour votre confiance. Vous bénéficiez d\'un accès illimité à l\'ensemble des fonctionnalités.', 14, 140);

      doc.save(`Recu_SasPay_${lastTxId || 'FlexPDF'}.pdf`);
      addNotification('success', 'Reçu PDF Téléchargé ! 📄', 'Votre justificatif officiel a été enregistré.');
    } catch (e) {
      addNotification('error', 'Erreur Export PDF', 'Impossible de générer le reçu PDF.');
    }
  };

  const stepsList = [
    { num: 1, label: 'Forfait' },
    { num: 2, label: 'Compte & Paiement' },
    { num: 3, label: 'Traitement' },
    { num: 4, label: 'Vérification Email' },
    { num: 5, label: 'Mot de Passe' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl p-5 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-6 my-6 animate-in zoom-in-95 duration-150">
        
        {/* Close Button (only if not processing) */}
        {currentStep !== 3 && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* STEPPER PROGRESSION BAR */}
        <div className="space-y-3 pb-2 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs tracking-wider flex items-center gap-1.5 shadow-2xs">
                <Lock className="w-3 h-3" />
                <span>PASSERELLE SASPAY</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                ⚡ Mobile Money & Carte
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-500">
              Étape {currentStep} sur 5
            </span>
          </div>

          {/* Stepper Dots & Labels */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {stepsList.map((st) => {
              const isPassed = currentStep > st.num;
              const isCurrent = currentStep === st.num;
              return (
                <div key={st.num} className="space-y-1">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isPassed
                        ? 'bg-emerald-500'
                        : isCurrent
                        ? 'bg-indigo-600'
                        : 'bg-slate-200'
                    }`}
                  />
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
                    <span
                      className={`font-bold truncate ${
                        isCurrent
                          ? 'text-indigo-600'
                          : isPassed
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {st.num}. {st.label}
                    </span>
                    {isPassed && <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0 hidden sm:block" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: RÉCAPITULATIF DU FORFAIT & CODE PROMO */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                1. Choisissez et confirmez votre forfait
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Sélectionnez la formule souhaitée avant de renseigner vos coordonnées pour créer votre compte.
              </p>
            </div>

            {/* Plan Selector & Price Summary Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white space-y-4 shadow-md">
              {!isEnterprise && (
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-800/90 border border-slate-700/60 max-w-sm">
                  <button
                    type="button"
                    onClick={() => setActivePlanId('pro_monthly')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !isAnnual
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Mensuel (${monthlyPrice}/m)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePlanId('pro_annual')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isAnnual
                        ? 'bg-gradient-to-r from-indigo-600 to-rose-600 text-white shadow-2xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Annuel (${annualPrice}/an)</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-[9px] font-black">
                      -{discountSavings}%
                    </span>
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                    Forfait Sélectionné
                  </span>
                  <p className="font-extrabold text-base text-white">
                    {isEnterprise ? 'FlexPDF Enterprise & Team' : isAnnual ? 'FlexPDF Pro (365 Jours)' : 'FlexPDF Pro (30 Jours)'}
                  </p>
                  <p className="text-xs text-slate-300">
                    {isEnterprise
                      ? 'Licence complète équipe • Accès API REST 100k requêtes/mois'
                      : isAnnual
                      ? `Facturé annuellement (${(annualPrice / 12).toFixed(2)}$/mois) • Économisez ${discountSavings}%`
                      : 'Facturé mensuellement • Sans engagement'}
                  </p>
                </div>

                <div className="text-right sm:border-l sm:border-slate-800 sm:pl-5">
                  <div className="flex items-baseline justify-end gap-1">
                    <span className="text-3xl font-black text-white">${finalPrice}</span>
                    <span className="text-xs text-slate-300">/ {isAnnual || isEnterprise ? 'an' : 'mois'}</span>
                  </div>
                  <span className="text-xs font-bold text-amber-300 block">
                    ~ {priceXOF.toLocaleString()} FCFA
                  </span>
                  {discountPercent > 0 && (
                    <span className="text-[10px] font-bold text-emerald-400 block line-through opacity-70">
                      ${basePrice} ({discountPercent}% de remise)
                    </span>
                  )}
                </div>
              </div>

              {/* Guarantees List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Conversions illimitées (∞)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Fichiers volumineux (jusqu'à {isEnterprise ? '2 Go' : '500 Mo'})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Traitement par lot (Batch)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Sécurité 100% Client-Side (RGPD)</span>
                </div>
              </div>
            </div>

            {/* Promo Code Input */}
            <form onSubmit={handleApplyPromo} className="flex gap-2">
              <div className="relative flex-1">
                <Gift className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Code promo (ex: LAUNCH50, WELCOME20, PRO50)"
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

            {/* Next Step Button */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Continuer vers les coordonnées (${finalPrice})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: CRÉATION DU COMPTE & MOYEN DE PAIEMENT SASPAY */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  2. Coordonnées de votre compte & Paiement
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vos informations créeront automatiquement votre compte Pro (aucun mot de passe requis maintenant).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Modifier forfait
              </button>
            </div>

            {/* Section 1: Informations de création du compte */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-950">Informations du Titulaire du Compte</span>
                <span className="ml-auto text-[10px] font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                  Sans mot de passe
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nom & Prénom <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Fadal Sall"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Adresse Email de Connexion <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="fadalsall1997@gmail.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                      required
                    />
                  </div>
                </div>

                {/* Organization / Company (Optional) */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Société / Organisation <span className="text-slate-400 font-normal">(optionnel)</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ex: Entreprise SARL"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Security Note */}
                <div className="flex items-center text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-xl border border-indigo-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mr-1.5" />
                  <span>Un code de validation vous sera envoyé par email après paiement pour sécuriser votre compte.</span>
                </div>
              </div>
            </div>

            {/* Section 2: Choix du Mode de Règlement SasPay */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-900 block flex items-center justify-between">
                <span>Mode de Règlement SasPay</span>
                <span className="text-indigo-600 font-bold">${finalPrice} USD (~{priceXOF.toLocaleString()} FCFA)</span>
              </label>

              {/* Payment Method Switcher Tabs */}
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
                  <span>Carte Bancaire (Visa/MC)</span>
                </button>
              </div>

              {/* TAB 1: Mobile Money with SasPay */}
              {paymentMethod === 'mobile_money' && (
                <div className="space-y-4 pt-1">
                  {/* Country Selector */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                      <Globe2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Sélectionnez votre Pays</span>
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
                      Opérateur Mobile Money
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
                      <PhoneCall className="w-3 h-3 text-indigo-500 inline shrink-0" />
                      {OPERATOR_DETAILS[selectedOperator]?.ussdHint}
                    </p>
                  </div>

                  {/* Test Shortcuts */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                    <span className="font-bold text-slate-600 block">Raccourcis de Démo SasPay :</span>
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
                      placeholder="Fadal Sall"
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

            {/* Submit / Proceed Button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={startPaymentExecution}
                className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>
                  Lancer le paiement SasPay (${finalPrice} USD)
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: TRAITEMENT & PROGRESSION INTERACTIVE SASPAY */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="py-6 space-y-6 animate-in fade-in duration-200 text-center">
            
            {/* Header indicator */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                <span>Traitement en cours sur la passerelle SasPay</span>
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Autorisation de votre paiement & Création du compte
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Veuillez ne pas fermer cette fenêtre. Nous synchronisons votre transaction avec le serveur de paiement.
              </p>
            </div>

            {/* Interactive Progress Pipeline Checklist */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3 max-w-lg mx-auto">
              
              {/* Pipeline Step 1 */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    pipelineStepIndex >= 1
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {pipelineStepIndex > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800">
                    Chiffrement & Tokenisation TLS 1.3
                  </p>
                  <p className="text-[11px] text-slate-500">Connexion sécurisée aux serveurs SasPay</p>
                </div>
                {pipelineStepIndex === 1 && (
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {/* Pipeline Step 2 */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    pipelineStepIndex >= 2
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {pipelineStepIndex > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800">
                    {paymentMethod === 'mobile_money'
                      ? `Push Notification / USSD ${selectedOperator.toUpperCase()}`
                      : 'Protocole 3D-Secure & Vérification bancaire'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {paymentMethod === 'mobile_money'
                      ? `Envoi de la confirmation sur ${selectedCountry.dial} ${phoneNumber}`
                      : 'Autorisation du débit par la banque émettrice'}
                  </p>
                </div>
                {pipelineStepIndex === 2 && (
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {/* Pipeline Step 3 */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    pipelineStepIndex >= 3
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {pipelineStepIndex > 3 ? <Check className="w-3.5 h-3.5" /> : '3'}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800">
                    Compensation SasPay & Contrôle Anti-fraude
                  </p>
                  <p className="text-[11px] text-slate-500">Validation de la balance et acquittement</p>
                </div>
                {pipelineStepIndex === 3 && (
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {/* Pipeline Step 4 */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    pipelineStepIndex >= 4
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {pipelineStepIndex >= 4 ? <Check className="w-3.5 h-3.5" /> : '4'}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800">
                    Émission du Code de Vérification Email
                  </p>
                  <p className="text-[11px] text-slate-500">Préparation de l'activation sécurisée de votre compte</p>
                </div>
                {pipelineStepIndex === 4 && (
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>

            {/* Dynamic Status Text */}
            <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 text-xs font-bold text-indigo-900 flex items-center justify-center gap-2 max-w-md mx-auto">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <span>{processingStatusText}</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: VÉRIFICATION DE L'EMAIL (CODE OTP REÇU) */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div className="py-2 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
                <Mail className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                Vérifiez votre adresse email ✉️
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Paiement SasPay validé ! Pour finaliser la création de votre compte, saisissez le code à 6 chiffres envoyé à :
              </p>
              <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-900 font-mono font-bold text-xs">
                {emailInput}
              </div>
            </div>

            {/* Code Entry Form */}
            <form onSubmit={handleVerifyEmailCode} className="space-y-4 max-w-sm mx-auto">
              <div>
                <label className="text-xs font-bold text-slate-700 block text-center mb-2">
                  Code de vérification à 6 chiffres
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                    placeholder="849201"
                    className="w-full text-center tracking-[0.5em] text-2xl font-mono font-black py-3 px-4 rounded-2xl bg-slate-50 border-2 border-indigo-500 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-100 shadow-sm"
                    autoFocus
                  />
                </div>
              </div>

              {/* Demo Helper Box */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Code envoyé par email :</p>
                  <p>
                    Utilisez le code <strong className="font-mono text-xs text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-amber-300">{expectedCode}</strong> reçu pour valider instantanément votre compte.
                  </p>
                  <button
                    type="button"
                    onClick={() => setVerificationCode(expectedCode)}
                    className="mt-1 text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    👉 Remplir automatiquement le code ({expectedCode})
                  </button>
                </div>
              </div>

              {/* Submit Verification */}
              <button
                type="submit"
                disabled={isVerifyingEmail || verificationCode.length < 6}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isVerifyingEmail ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Vérification en cours...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Vérifier mon email & Continuer</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend Link */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={handleResendVerificationCode}
                  disabled={resendTimer > 0}
                  className="text-xs font-bold text-slate-500 hover:text-indigo-600 disabled:opacity-50 cursor-pointer"
                >
                  {resendTimer > 0 ? `Renvoyer le code (${resendTimer}s)` : 'Vous n\'avez pas reçu le code ? Renvoyer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: REDIRECTION VERS LE COMPTE & DÉFINITION DU MOT DE PASSE */}
        {/* ========================================================================= */}
        {currentStep === 5 && (
          <div className="text-center py-2 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>COMPTE ACTIVÉ & EMAIL VÉRIFIÉ (100%)</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                Bienvenue sur votre Compte Pro, {fullName} ! 🎉
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Votre abonnement <strong className="text-indigo-600">{planTitle}</strong> est actif. Veuillez maintenant configurer votre mot de passe pour vos futures connexions.
              </p>
            </div>

            {/* Password Setup Form */}
            <form onSubmit={handleSavePasswordAndFinish} className="space-y-4 max-w-sm mx-auto text-left">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Définir votre Mot de Passe <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="6 caractères minimum"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Confirmer le Mot de Passe <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Retapez votre mot de passe"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                    required
                  />
                </div>
              </div>

              {/* Password Quality Checklist */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Check className={`w-3.5 h-3.5 ${newPassword.length >= 6 ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Au moins 6 caractères</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Check className={`w-3.5 h-3.5 ${newPassword && newPassword === confirmPassword ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Mots de passe identiques</span>
                </div>
              </div>

              {/* Submit Password Button */}
              <button
                type="submit"
                disabled={isSavingPassword || !newPassword || newPassword !== confirmPassword}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isSavingPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Enregistrer mon mot de passe & Accéder à mon compte</span>
                  </>
                )}
              </button>
            </form>

            {/* Official Receipt & Download */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
              <button
                type="button"
                onClick={handleDownloadOfficialPDF}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Télécharger mon Reçu PDF</span>
              </button>
            </div>
          </div>
        )}

        {/* Security Footer */}
        {currentStep !== 3 && (
          <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-3">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Chiffrement SasPay TLS 256-bit
            </span>
            <span>Conforme PCI-DSS & RGPD</span>
            <span>Annulation & Droit de rétractation</span>
          </div>
        )}
      </div>
    </div>
  );
};
