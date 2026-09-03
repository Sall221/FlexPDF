import React, { useState } from 'react';
import {
  User,
  Clock,
  Download,
  Trash2,
  CreditCard,
  Crown,
  Key,
  Flame,
  FileText,
  FileDown,
  Layers,
  Sparkles,
  ShieldCheck,
  Settings,
  HelpCircle,
  Plus,
  Send,
  MessageSquare,
  Lock,
  Calendar,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  FileCode2,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useApp } from '../../context/AppContext';
import { Invoice } from '../../types';

export const UserDashboard: React.FC = () => {
  const {
    user,
    dailyUsageCount,
    dailyLimit,
    remainingDailyQuota,
    isUnlimited,
    history,
    invoices,
    supportTickets,
    clearHistory,
    removeHistoryItem,
    openStripeCheckout,
    cancelSubscription,
    reactivateSubscription,
    exportUserData,
    deleteAccount,
    purgeMemoryFiles,
    addNotification,
    setActiveView,
    setSelectedToolId,
    updateUserProfile,
    createSupportTicket,
    siteSettings,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'billing' | 'security' | 'settings' | 'tickets' | 'api'>('overview');
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Profile form state
  const [editName, setEditName] = useState(user?.name || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Support ticket form state
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState<'billing' | 'technical' | 'feature' | 'other'>('technical');
  const [ticketMessage, setTicketMessage] = useState('');

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({ name: editName, avatar: editAvatar });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    setCurrentPassword('');
    setNewPassword('');
    addNotification('success', 'Mot de Passe Modifié', 'Votre mot de passe a été sécurisé.');
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    createSupportTicket({
      userName: user?.name || 'Utilisateur',
      userEmail: user?.email || 'user@example.com',
      subject: ticketSubject,
      category: ticketCategory,
      message: ticketMessage,
    });

    setTicketSubject('');
    setTicketMessage('');
    setShowNewTicketForm(false);
  };

  const handleDownloadInvoice = (inv: Invoice) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229);
      doc.text('FlexPDF SaaS', 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('Reçu de Paiement Sécurisé SasPay / TLS 256-bit', 14, 28);
      doc.text(`Facture N° : ${inv.number}`, 14, 34);
      doc.text(`Date d'émission : ${inv.date}`, 14, 40);
      doc.text(`Méthode : ${inv.paymentMethod || 'SasPay (Carte / Mobile Money)'}`, 14, 46);
      doc.text(`Transaction : ${inv.transactionId || 'SASP_CONFIRMED'}`, 14, 52);

      doc.setDrawColor(226, 232, 240);
      doc.line(14, 56, 196, 56);

      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Informations Client & Facturation :', 14, 66);
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Nom : ${inv.customerName || user?.name || 'Client FlexPDF'}`, 14, 73);
      doc.text(`Email : ${inv.customerEmail || user?.email || 'client@example.com'}`, 14, 79);

      doc.setFillColor(248, 250, 252);
      doc.rect(14, 88, 182, 24, 'F');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('Désignation de la prestation', 20, 98);
      doc.text('Total TTC', 150, 98);

      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(inv.planName, 20, 106);
      doc.text(`$${inv.amount.toFixed(2)} USD`, 150, 106);

      doc.setDrawColor(226, 232, 240);
      doc.line(14, 118, 196, 118);

      const subtotal = inv.subtotal || Number((inv.amount / 1.2).toFixed(2));
      const tax = inv.taxAmount || Number((inv.amount - subtotal).toFixed(2));

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Sous-total HT : $${subtotal.toFixed(2)} USD`, 120, 126);
      doc.text(`TVA (20%) : $${tax.toFixed(2)} USD`, 120, 132);

      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(`Total Réglé : $${inv.amount.toFixed(2)} USD`, 120, 142);

      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text('FlexPDF SAS - Conforme TVA et normes comptables SasPay.', 14, 160);

      doc.save(`Facture_SasPay_${inv.number}.pdf`);
      addNotification('success', 'Facture Téléchargée', `Le reçu officiel ${inv.number} a été généré en PDF.`);
    } catch (err) {
      addNotification('info', 'Reçu Téléchargé', `Téléchargement du reçu ${inv.number}`);
    }
  };

  const copyApiKey = () => {
    if (user?.apiKey) {
      navigator.clipboard.writeText(user.apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      addNotification('success', 'Clé API Copiée', 'Clé secrète prête pour vos intégrations.');
    }
  };

  const userTickets = supportTickets.filter((t) => !user || t.userEmail === user.email || user.role === 'admin');

  // Days remaining calculation
  const getDaysRemaining = () => {
    if (!user?.subscription.currentPeriodEnd) return null;
    const end = new Date(user.subscription.currentPeriodEnd).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const daysLeft = getDaysRemaining();

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6 animate-in fade-in duration-200">
      {/* Profile & Plan Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name || 'User'}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-indigo-500/10 shadow-sm"
            />
            {user?.role === 'pro' && (
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-500 text-white shadow-xs">
                <Crown className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {user?.name || 'Utilisateur'}
              </h1>
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  user?.role === 'enterprise'
                    ? 'bg-purple-50 text-purple-900 border-purple-200'
                    : user?.role === 'pro'
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : user?.role === 'admin'
                    ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Forfait {user?.role === 'enterprise' ? 'Entreprise' : user?.role === 'pro' ? 'Pro' : user?.role === 'admin' ? 'Admin' : 'Gratuit'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email || 'non-connecte@flexpdf.com'}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Membre depuis le {user?.createdAt || '2026-08-01'} • ID: {user?.id}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          {!isUnlimited ? (
            <button
              onClick={() => openStripeCheckout('pro_annual')}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Passer à l'Illimité ($9/mois)</span>
            </button>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-600" />
              <span>Abonnement Pro Actif ({user?.subscription.billingInterval === 'year' ? 'Annuel' : 'Mensuel'})</span>
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Daily Quota Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Quota Gratuit du Jour</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {isUnlimited ? '∞' : `${remainingDailyQuota} / ${dailyLimit}`}
              </span>
              <span className="text-xs text-slate-500">
                {isUnlimited ? 'Conversions Illimitées' : 'tâches gratuites restantes'}
              </span>
            </div>
            {!isUnlimited && (
              <div className="mt-2.5 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (dailyUsageCount / dailyLimit) * 100)}%` }}
                />
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {isUnlimited ? 'Aucun bridage quotidien' : 'Réinitialisation automatique chaque nuit'}
          </p>
        </div>

        {/* Processed Files Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Fichiers Convertis</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{history.length}</span>
              <span className="text-xs text-slate-500">documents dans l'historique</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">Téléchargeables et purgables en 1 clic</p>
        </div>

        {/* Bandwidth / Cloud Engine */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Taille & Limites Fichiers</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {user?.role === 'admin' ? '500 Mo' : isUnlimited ? '100 Mo' : '10 Mo'}
              </span>
              <span className="text-xs text-slate-500">par document</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">Lot : {isUnlimited ? '10-50 fichiers' : '1 fichier à la fois'}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
        {[
          { id: 'overview', label: 'Vue d\'Ensemble', icon: User },
          { id: 'history', label: `Historique (${history.length})`, icon: Clock },
          { id: 'billing', label: 'Forfait & Facturation', icon: CreditCard },
          { id: 'security', label: 'Sécurité & RGPD', icon: ShieldCheck },
          { id: 'settings', label: 'Paramètres Profil', icon: Settings },
          { id: 'tickets', label: `Support (${userTickets.length})`, icon: HelpCircle },
          { id: 'api', label: 'Clé API REST', icon: Key },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Accès Rapide aux Outils</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'merge-pdf', name: 'Fusionner PDF', icon: Layers },
                { id: 'compress-pdf', name: 'Compresser PDF', icon: FileDown },
                { id: 'pdf-to-word', name: 'PDF vers Word', icon: FileText },
                { id: 'convert-images', name: 'Convertir Images', icon: Sparkles },
              ].map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setSelectedToolId(tool.id);
                      setActiveView('tool');
                    }}
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-left transition-all group cursor-pointer"
                  >
                    <Icon className="w-5 h-5 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">{tool.name}</p>
                    <span className="text-[10px] text-slate-500">Lancer l'outil →</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: History */}
      {activeTab === 'history' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Historique des Traitements</h3>
              <p className="text-xs text-slate-500">Retrouvez vos documents convertis récemment.</p>
            </div>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Effacer tout l'historique</span>
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl space-y-3">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">Aucun fichier traité pour le moment</p>
              <button
                onClick={() => {
                  setSelectedToolId('merge-pdf');
                  setActiveView('tool');
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Lancer une première conversion
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {history.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.resultFileName}</p>
                      <p className="text-[11px] text-slate-400">
                        {item.toolName} • {formatBytes(item.resultSize)} • {new Date(item.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.downloadUrl && (
                      <a
                        href={item.downloadUrl}
                        download={item.resultFileName}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition-colors"
                        title="Télécharger"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => removeHistoryItem(item.id)}
                      className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Billing & Forfaits */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Subscription State Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Détails & Durée du Forfait</h3>
                <p className="text-xs text-slate-500">Gestion de la récurrence, du moyen de paiement et des limites.</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  user?.subscription.cancelAtPeriodEnd
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : user?.subscription.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {user?.subscription.cancelAtPeriodEnd
                  ? 'Résilié (Actif jusqu\'à échéance)'
                  : user?.subscription.status || 'Gratuit'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Formule</span>
                <span className="font-bold text-slate-900">
                  {user?.role === 'pro'
                    ? user.subscription.billingInterval === 'year'
                      ? 'Pro Annuel (365j)'
                      : 'Pro Mensuel (30j)'
                    : user?.role === 'admin'
                    ? 'Enterprise Master'
                    : 'Gratuit (3 tâches/jour)'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Échéance / Durée</span>
                <span className="font-bold text-slate-900">
                  {user?.subscription.currentPeriodEnd || 'Illimité'}
                  {daysLeft !== null && ` (${daysLeft}j restants)`}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Moyen de Paiement</span>
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  {user?.subscription.paymentMethod
                    ? user.subscription.paymentMethod.toUpperCase()
                    : 'Carte Visa (•••• 4242)'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Taille Fichier Max</span>
                <span className="font-bold text-emerald-700">
                  {user?.role === 'admin' ? '500 Mo' : isUnlimited ? '100 Mo' : '10 Mo'}
                </span>
              </div>
            </div>

            {/* Subscription Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {!isUnlimited ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => openStripeCheckout('pro_monthly')}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition-all cursor-pointer"
                  >
                    Activer Pro Mensuel (${siteSettings.monthlyPrice || 9}/mois)
                  </button>
                  <button
                    onClick={() => openStripeCheckout('pro_annual')}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Activer Pro Annuel (${siteSettings.annualPrice || 79}/an • Économisez {Math.round((((siteSettings.monthlyPrice || 9) * 12 - (siteSettings.annualPrice || 79)) / ((siteSettings.monthlyPrice || 9) * 12)) * 100)}%)</span>
                  </button>
                </div>
              ) : user?.subscription.billingInterval === 'month' && !user?.subscription.cancelAtPeriodEnd ? (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => openStripeCheckout('pro_annual')}
                    className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span>Basculer vers Pro Annuel (${siteSettings.annualPrice || 79}/an - Économisez 27%)</span>
                  </button>
                  <button
                    onClick={cancelSubscription}
                    className="text-xs text-rose-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Annuler le Renouvellement Automatique</span>
                  </button>
                </div>
              ) : user?.subscription.cancelAtPeriodEnd ? (
                <button
                  onClick={reactivateSubscription}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Réactiver le Renouvellement Automatique</span>
                </button>
              ) : (
                <button
                  onClick={cancelSubscription}
                  className="text-xs text-rose-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Annuler le Renouvellement Automatique</span>
                </button>
              )}
            </div>
          </div>

          {/* Stripe & SasPay Invoices */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Factures & Justificatifs de Paiement</h3>
            {invoices.filter((inv) => user?.role === 'admin' ? true : (inv.customerEmail?.toLowerCase() === user?.email?.toLowerCase())).length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl space-y-2">
                <CreditCard className="w-7 h-7 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">Aucune facture enregistrée</p>
                <p className="text-[11px] text-slate-400">Vos justificatifs et reçus officiels SasPay apparaîtront ici après chaque paiement.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                      <th className="pb-3">Numéro</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Forfait</th>
                      <th className="pb-3">Méthode</th>
                      <th className="pb-3">Montant</th>
                      <th className="pb-3">Statut</th>
                      <th className="pb-3 text-right">Télécharger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices
                      .filter((inv) => user?.role === 'admin' ? true : (inv.customerEmail?.toLowerCase() === user?.email?.toLowerCase()))
                      .map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 font-mono font-bold text-slate-900">{inv.number}</td>
                          <td className="py-3 text-slate-500">{inv.date}</td>
                          <td className="py-3 text-slate-700">{inv.planName}</td>
                          <td className="py-3 text-slate-500 uppercase">{inv.paymentMethod || 'SASPAY'}</td>
                          <td className="py-3 font-bold text-slate-900">${inv.amount.toFixed(2)}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                              PAYÉ
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleDownloadInvoice(inv)}
                              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline font-bold cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" /> Reçu PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Security & RGPD */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Sécurité des Données & Conformité RGPD</span>
              </h3>
              <p className="text-xs text-slate-500">
                Vos documents et données privées sont protégés par chiffrement de bout en bout.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* RGPD Export */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <FileCode2 className="w-4 h-4 text-indigo-600" />
                  <span>Portabilité des Données (RGPD Art. 20)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Téléchargez une copie intégrale de votre compte (profil, historique, factures, transactions) au format JSON sécurisé.
                </p>
                <button
                  type="button"
                  onClick={exportUserData}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-800 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exporter mes données JSON</span>
                </button>
              </div>

              {/* Memory Purge */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Trash2 className="w-4 h-4 text-amber-600" />
                  <span>Purge de la Mémoire RAM Locale</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Supprimez immédiatement les jetons de session, les fichiers temporaires et les caches Blob en mémoire.
                </p>
                <button
                  type="button"
                  onClick={purgeMemoryFiles}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-amber-50 text-xs font-bold text-amber-800 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purger la RAM & Caches</span>
                </button>
              </div>
            </div>

            {/* Account Deletion (Right to be Forgotten) */}
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Suppression Définitive du Compte (Droit à l'Oubli RGPD)</span>
              </div>
              <p className="text-[11px] text-rose-700">
                Cette action supprimera irréversiblement votre profil, votre abonnement et toutes vos données personnelles.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Supprimer Définitivement mon Compte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Profile Settings */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Info */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <span>Informations Personnelles</span>
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nom Complet</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Adresse Email (liée à Stripe)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">URL Avatar / Photo</label>
                <input
                  type="url"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                Enregistrer les Modifications
              </button>
            </form>
          </div>

          {/* Security & Password */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>Sécurité du Compte</span>
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Mot de Passe Actuel</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nouveau Mot de Passe</label>
                <input
                  type="password"
                  placeholder="Minimum 8 caractères"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Chiffrement SHA-256 et sessions sécurisées activées.</span>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                Mettre à Jour le Mot de Passe
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Support Tickets */}
      {activeTab === 'tickets' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Assistance Client & Tickets Dédiés</h3>
              <p className="text-xs text-slate-500">Contactez directement notre équipe d'ingénieurs et techniciens.</p>
            </div>

            <button
              onClick={() => setShowNewTicketForm(!showNewTicketForm)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showNewTicketForm ? 'Fermer le formulaire' : 'Nouveau Ticket'}</span>
            </button>
          </div>

          {showNewTicketForm && (
            <form onSubmit={handleCreateTicket} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in duration-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Créer une demande d'assistance</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">Objet de la demande</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Question sur la facturation Stripe ou une fusion PDF"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Catégorie</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="technical">Technique / Outil</option>
                    <option value="billing">Facturation / Stripe</option>
                    <option value="feature">Suggestion</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description détaillée</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Décrivez précisément votre question ou problème..."
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Envoyer le Ticket</span>
              </button>
            </form>
          )}

          {userTickets.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Aucun ticket de support ouvert</p>
              <p className="text-[11px] text-slate-400">Tout fonctionne à merveille !</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {userTickets.map((t) => (
                <div key={t.id} className="py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600">#{t.id}</span>
                      <h4 className="text-xs font-bold text-slate-900">{t.subject}</h4>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        t.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : t.status === 'in_progress'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {t.status === 'open' ? 'Ouvert' : t.status === 'in_progress' ? 'En Traitement' : 'Résolu'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">{t.message}</p>

                  {t.adminReply && (
                    <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 text-xs space-y-1">
                      <span className="font-bold text-indigo-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Réponse du Support FlexPDF :
                      </span>
                      <p className="text-indigo-800">{t.adminReply}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Créé le {t.createdAt} • Catégorie : {t.category.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: API Key */}
      {activeTab === 'api' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-600" />
              <span>Clé API Développeur FlexPDF</span>
            </h3>
            <p className="text-xs text-slate-500">Utilisez cette clé pour convertir vos documents par programmation.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Bearer Secret Token</span>
            <div className="flex items-center justify-between gap-3">
              <code className="text-xs font-mono text-indigo-300 truncate">
                {apiKeyVisible ? user?.apiKey : 'flexpdf_live_••••••••••••••••••••••••'}
              </code>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setApiKeyVisible(!apiKeyVisible)}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  {apiKeyVisible ? 'Masquer' : 'Afficher'}
                </button>
                <button
                  onClick={copyApiKey}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Key className="w-3 h-3" />
                  <span>{copiedKey ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Confirmer la suppression ?</h3>
              <p className="text-xs text-slate-500">
                Toutes vos données (factures, historique, profil) seront définitivement effacées conformément à l'article 17 du RGPD.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  deleteAccount();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-xs text-white"
              >
                Oui, Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
