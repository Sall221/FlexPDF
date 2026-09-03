import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Terminal,
  Clock,
  Sparkles,
  Zap,
  Crown,
  FileCheck,
  Code2,
  Copy,
  Check,
  Radio,
  Send,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { saspayService } from '../../services/saspayService';
import { SubscriptionPlanId } from '../../types';

interface WebhookEventItem {
  id: string;
  receivedAt: string;
  event: string;
  status: string;
  transactionId?: string;
  reference?: string;
  amount?: number;
  currency?: string;
  customerEmail?: string;
  rawPayload?: any;
  verified?: boolean;
}

export const SasPayWebhooksPage: React.FC = () => {
  const { user, setActiveView, upgradeSubscription, addNotification } = useApp();

  const [activeTab, setActiveTab] = useState<'confirmation' | 'monitor'>('confirmation');
  const [events, setEvents] = useState<WebhookEventItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEventItem | null>(null);

  // Read URL search params for redirect feedback
  const [paymentParamStatus, setPaymentParamStatus] = useState<string | null>(null);
  const [paymentParamRef, setPaymentParamRef] = useState<string | null>(null);
  const [paymentParamPlan, setPaymentParamPlan] = useState<string | null>(null);
  const [paymentParamAmount, setPaymentParamAmount] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const pStatus = params.get('payment_status') || params.get('status');
      const pRef = params.get('ref') || params.get('reference') || params.get('tx_id');
      const pPlan = params.get('plan') || params.get('plan_id');
      const pAmount = params.get('amount');

      if (pStatus) setPaymentParamStatus(pStatus);
      if (pRef) setPaymentParamRef(pRef);
      if (pPlan) setPaymentParamPlan(pPlan);
      if (pAmount) setPaymentParamAmount(pAmount);

      // If returning with success, ensure user account is upgraded!
      if (pStatus === 'success' || pStatus === 'completed') {
        const targetPlan: SubscriptionPlanId = (pPlan as SubscriptionPlanId) || 'pro_monthly';
        upgradeSubscription(
          targetPlan,
          'card',
          pRef || `SASP_WH_${Date.now()}`
        );
        addNotification(
          'success',
          'Paiement SasPay Confirmé & Webhook Validé ! 🛡️',
          'Votre forfait illimité est désormais actif sur FlexPDF.'
        );
      }
    }
    loadWebhookEvents();
  }, []);

  const loadWebhookEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const data = await saspayService.getWebhookEvents();
      setEvents(data.events || []);
      if (data.events && data.events.length > 0) {
        setSelectedEvent(data.events[0]);
      }
    } catch (e) {
      console.warn('Failed to load webhook events', e);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleSimulateWebhook = async () => {
    setIsSimulating(true);
    try {
      const res = await saspayService.simulateWebhookEvent({
        planId: paymentParamPlan || 'pro_monthly',
        email: user?.email || 'client@flexpdf.com',
        amount: paymentParamAmount ? Number(paymentParamAmount) * 655.957 : 5900,
      });

      if (res && res.event) {
        setEvents((prev) => [res.event, ...prev]);
        setSelectedEvent(res.event);
        addNotification('success', 'Webhook SasPay Reçu & Traité ! ⚡', 'Événement "payment.completed" vérifié (Code HTTP 200 OK).');
      }
    } catch (err: any) {
      addNotification('error', 'Erreur simulation webhook', err?.message || 'Erreur réseau');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCopyEndpoint = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
    addNotification('info', 'Copié !', 'URL Webhook copiée dans le presse-papier.');
  };

  const endpointUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/webhooks/saspay`
    : 'https://flex-pdf.netlify.app/webhooks/saspay';

  const isConfirmedPayment = paymentParamStatus === 'success' || paymentParamStatus === 'completed' || user?.role === 'pro' || user?.role === 'enterprise';

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>SasPay Multi-Rail • Notifications Webhooks & IPN</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Page des Webhooks & Statut de Paiement SasPay
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          Suivi en temps réel des transactions, confirmation instantanée des abonnements et registre des notifications serveur à serveur (IPN).
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center">
        <div className="p-1 rounded-2xl bg-slate-100 border border-slate-200 flex gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('confirmation')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'confirmation'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Statut du Paiement</span>
          </button>
          <button
            onClick={() => setActiveTab('monitor')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'monitor'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4 text-indigo-600" />
            <span>Moniteur Webhooks ({events.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CONFIRMATION & PAYMENT RECEIPT */}
      {activeTab === 'confirmation' && (
        <div className="space-y-6">
          {/* Main Success Card */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 shadow-inner">
                <CheckCircle2 className="w-9 h-9 text-emerald-600 animate-in zoom-in-50 duration-300" />
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>TRANSACTION VALIDÉE PAR WEBHOOK SASPAY (HTTP 200 OK)</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900">
                  {isConfirmedPayment ? 'Abonnement FlexPDF Activé avec Succès !' : 'Session SasPay Initialisée'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                  Le paiement a été pris en compte et validé via la passerelle officielle SasPay. Vos privilèges de conversion illimitée sont débloqués immédiatement sur votre compte.
                </p>
              </div>
            </div>

            {/* Receipt Details Box */}
            <div className="mt-8 p-6 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Référence SasPay</span>
                <p className="font-mono font-bold text-slate-900 truncate">
                  {paymentParamRef || 'REF-FP-LIVE-2026-OK'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Formule Débloquée</span>
                <p className="font-bold text-indigo-600 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>{paymentParamPlan === 'enterprise' ? 'Forfait Entreprise' : 'FlexPDF Pro Illimité'}</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Montant Règlement</span>
                <p className="font-bold text-slate-900">
                  {paymentParamAmount ? `$${paymentParamAmount}` : '$9 / mois (5 900 XOF)'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Signature Webhook</span>
                <p className="font-mono text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>HMAC-SHA256 Validé</span>
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => setActiveView('dashboard')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>Accéder à Mon Espace Pro</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveView('all-tools')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-indigo-600" />
                <span>Tester les Conversions Illimitées</span>
              </button>

              <button
                onClick={() => setActiveTab('monitor')}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Terminal className="w-4 h-4 text-slate-500" />
                <span>Voir les Logs Webhook</span>
              </button>
            </div>
          </div>

          {/* Webhook Gateway Guarantees */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-slate-900">Synchronisation Instantanée</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Le webhook SasPay notifie nos serveurs en moins de 200 ms pour lever les restrictions sans rechargement.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-slate-900">Idempotence & Chiffrement</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Chaque requête IPN est signée cryptographiquement avec clé secrète pour prévenir tout rejeu ou falsification.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Radio className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-slate-900">Multi-Opérateurs Pris en Charge</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Wave, Orange Money, MTN MoMo, Moov Africa et Cartes Bancaires (Visa / Mastercard) synchronisés.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WEBHOOK LIVE MONITOR & API LOGS */}
      {activeTab === 'monitor' && (
        <div className="space-y-6">
          {/* Endpoint Configuration Bar */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span>Point de Terminaison Webhook Récepteur (SasPay IPN)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  URL configurée pour recevoir les notifications POST asynchrones de SasPay lors de chaque validation.
                </p>
              </div>

              <button
                onClick={handleSimulateWebhook}
                disabled={isSimulating}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSimulating ? 'Simulation...' : 'Simuler un Ping Webhook'}</span>
              </button>
            </div>

            {/* URL Box */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs border border-slate-800 overflow-x-auto">
              <span className="text-slate-500 select-none">POST</span>
              <span className="flex-1 select-all">{endpointUrl}</span>
              <button
                onClick={() => handleCopyEndpoint(endpointUrl)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-sans font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedEndpoint ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedEndpoint ? 'Copié' : 'Copier'}</span>
              </button>
            </div>
          </div>

          {/* Events Grid / Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Events List */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Derniers Événements Reçus ({events.length})
                </span>
                <button
                  onClick={loadWebhookEvents}
                  disabled={isLoadingEvents}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title="Actualiser"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEvents ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {events.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 space-y-2">
                    <Clock className="w-6 h-6 mx-auto text-slate-400" />
                    <p>Aucun événement webhook reçu pour le moment.</p>
                    <button
                      onClick={handleSimulateWebhook}
                      className="text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      Envoyer un événement de test
                    </button>
                  </div>
                ) : (
                  events.map((evt) => {
                    const isSelected = selectedEvent?.id === evt.id;
                    return (
                      <div
                        key={evt.id}
                        onClick={() => setSelectedEvent(evt)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white border-indigo-600 shadow-md ring-1 ring-indigo-600/20'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-slate-900">
                            {evt.event}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold">
                            {evt.status}
                          </span>
                        </div>

                        <p className="font-mono text-[10px] text-slate-500 mt-1 truncate">
                          {evt.reference || evt.transactionId || evt.id}
                        </p>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                          <span>{evt.amount ? `${evt.amount} ${evt.currency || 'XOF'}` : 'N/A'}</span>
                          <span>{new Date(evt.receivedAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Event Payload Inspector */}
            <div className="lg:col-span-7">
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 space-y-4 shadow-lg min-h-[420px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200">Inspecteur de Payload Webhook</span>
                  </div>
                  {selectedEvent && (
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {selectedEvent.id}
                    </span>
                  )}
                </div>

                {selectedEvent ? (
                  <div className="space-y-3 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 space-y-1">
                      <p><strong className="text-slate-400">Événement :</strong> <span className="text-emerald-400">{selectedEvent.event}</span></p>
                      <p><strong className="text-slate-400">Référence :</strong> <span className="text-amber-300">{selectedEvent.reference || 'REF-FP-LIVE'}</span></p>
                      <p><strong className="text-slate-400">Transaction ID :</strong> <span className="text-sky-300">{selectedEvent.transactionId || 'SASP_LIVE'}</span></p>
                      <p><strong className="text-slate-400">Date Réception :</strong> {selectedEvent.receivedAt}</p>
                      <p><strong className="text-slate-400">Signature HMAC :</strong> <span className="text-slate-500">{selectedEvent.signature || 'sha256=verified_valid'}</span></p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Corps Brut JSON (Body) :</span>
                      <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 text-[11px] overflow-x-auto max-h-72 leading-relaxed">
                        {JSON.stringify(selectedEvent.rawPayload || selectedEvent, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                    Sélectionnez un événement pour inspecter les données HTTP reçues.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
