import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Server,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Settings,
  Flame,
  ArrowUpRight,
  Database,
  Lock,
  Crown,
  Eye,
  Plus,
  HelpCircle,
  Send,
  ToggleLeft,
  ToggleRight,
  Megaphone,
  CreditCard,
  Smartphone,
  Radio,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserProfile } from '../../types';
import { saspayService, SasPayGatewayConfig } from '../../services/saspayService';

export const AdminPanel: React.FC = () => {
  const {
    adminStats,
    generateDemoStats,
    systemLogs,
    allUsers,
    supportTickets,
    siteSettings,
    updateUserRole,
    resetUserQuota,
    replySupportTicket,
    resolveSupportTicket,
    updateSiteSettings,
    addNotification,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tickets' | 'logs' | 'config' | 'saspay'>('overview');
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'pro' | 'enterprise' | 'admin'>('all');

  // SasPay Admin Gateway State
  const [gatewayConfig, setGatewayConfig] = useState<SasPayGatewayConfig | null>(null);
  const [gatewayTransactions, setGatewayTransactions] = useState<any[]>([]);
  const [gatewayLogs, setGatewayLogs] = useState<any[]>([]);
  const [isLoadingSasPay, setIsLoadingSasPay] = useState(false);
  const [testOp, setTestOp] = useState('wave');
  const [testPhone, setTestPhone] = useState('77 123 45 67');
  const [testAmount, setTestAmount] = useState(9);
  const [testResult, setTestResult] = useState<any | null>(null);

  const fetchSasPayData = async () => {
    setIsLoadingSasPay(true);
    try {
      const [cfg, data] = await Promise.all([
        saspayService.getConfig(),
        saspayService.getAdminTransactions(),
      ]);
      setGatewayConfig(cfg);
      setGatewayTransactions(data.transactions || []);
      setGatewayLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSasPay(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'saspay') {
      fetchSasPayData();
    }
  }, [activeTab]);

  const handleRunSasPayTest = async () => {
    setIsLoadingSasPay(true);
    setTestResult(null);
    try {
      const res = await saspayService.executeFullPaymentFlow(
        {
          planId: 'pro_monthly',
          amount: testAmount,
          currency: 'USD',
          paymentMethod: 'mobile_money',
          customer: {
            name: 'Testeur Sandbox Admin',
            email: 'admin-test@flexpdf.com',
            phone: `+221 ${testPhone}`,
          },
          mobileMoney: {
            operator: testOp as any,
            countryCode: 'SN',
            phoneNumber: `+221 ${testPhone}`,
          },
        },
        (step) => {
          setTestResult({ step, inProgress: true });
        }
      );
      setTestResult({ ...res, inProgress: false, success: true });
      addNotification('success', 'Test SasPay Exécuté', `Transaction ${res.transactionId} validée avec succès !`);
      fetchSasPayData();
    } catch (err: any) {
      setTestResult({ error: err.message, inProgress: false, success: false });
      addNotification('error', 'Échec Test SasPay', err.message);
    } finally {
      setIsLoadingSasPay(false);
    }
  };

  // Config State
  const [defaultFreeLimit, setDefaultFreeLimit] = useState(siteSettings.defaultFreeLimit || 3);
  const [monthlyPrice, setMonthlyPrice] = useState(siteSettings.monthlyPrice || 9);
  const [annualPrice, setAnnualPrice] = useState(siteSettings.annualPrice || 79);
  const [maintenance, setMaintenance] = useState(siteSettings.maintenanceMode || false);
  const [announcement, setAnnouncement] = useState(siteSettings.maintenanceMessage || '');
  const [promoCodes, setPromoCodes] = useState([
    { code: 'LAUNCH50', discount: 50, active: true },
    { code: 'SUMMER25', discount: 25, active: true },
  ]);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState(30);

  // Ticket reply state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAddPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode.trim()) return;
    setPromoCodes((prev) => [
      ...prev,
      { code: newPromoCode.trim().toUpperCase(), discount: newPromoDiscount, active: true },
    ]);
    setNewPromoCode('');
    addNotification('success', 'Code Promo Créé', `Le code ${newPromoCode.toUpperCase()} est actif.`);
  };

  const handleSaveConfigs = () => {
    updateSiteSettings({
      defaultFreeLimit,
      monthlyPrice,
      annualPrice,
      maintenanceMode: maintenance,
      maintenanceMessage: announcement,
    });
    addNotification('success', 'Paramètres Sauvegardés', 'La configuration globale du SaaS a été mise à jour.');
  };

  const handleSendTicketReply = (ticketId: string) => {
    if (!replyText.trim()) return;
    replySupportTicket(ticketId, replyText.trim());
    setReplyText('');
    addNotification('success', 'Réponse Envoyée', 'Votre réponse a été enregistrée et envoyée.');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Admin Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Console d'Administration Globale</h1>
              <p className="text-xs text-slate-500">
                Surveillance en temps réel, quotas, métriques de revenus et configuration du SaaS.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold text-emerald-600">Tous les clusters opérationnels</span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Conversions Aujourd'hui</span>
            <Activity className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {adminStats.totalConversionsToday.toLocaleString()}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center">
              +14.2% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[10px] text-slate-400">{adminStats.totalConversionsAllTime.toLocaleString()} cumulées</p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Revenu Mensuel Récurrent (MRR)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">
              ${adminStats.mrr.toLocaleString()}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center">
              +8.5% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[10px] text-slate-400">${adminStats.arr.toLocaleString()} ARR run-rate</p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Abonnés Pro Actifs</span>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-amber-600">
              {adminStats.activeProUsers}
            </span>
            <span className="text-[11px] font-bold text-amber-600">{adminStats.conversionRate}% conv.</span>
          </div>
          <p className="text-[10px] text-slate-400">{adminStats.totalUsers.toLocaleString()} utilisateurs inscrits</p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Bande Passante Économisée</span>
            <Database className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-sky-600">48.2 Go</span>
            <span className="text-[11px] font-bold text-sky-600">Optimisé</span>
          </div>
          <p className="text-[10px] text-slate-400">Ratio moyen de compression 58%</p>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {[
          { id: 'overview', label: 'Analytique & Trafic', icon: TrendingUp },
          { id: 'saspay', label: 'Passerelle SasPay API', icon: CreditCard },
          { id: 'users', label: `Gestion Utilisateurs (${allUsers.length})`, icon: Users },
          { id: 'tickets', label: `Tickets Support (${supportTickets.length})`, icon: HelpCircle },
          { id: 'logs', label: `Logs Serveurs (${systemLogs.length})`, icon: Activity },
          { id: 'config', label: 'Paramètres & Prix', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Analytics & Traffic Visualizer */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Visual Chart */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Volume de Conversions & Performance du Système</h3>
                <p className="text-xs text-slate-500">Activité en direct sur l'ensemble des modules PDF et Image FlexPDF.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    addNotification('info', 'Données Synchronisées', 'Les métriques, transactions et logs utilisateurs sont à jour.');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Actualiser les métriques calculées en temps réel"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Actualiser Métriques</span>
                </button>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  En direct
                </span>
              </div>
            </div>

            {/* Simulated Clean SVG Bar/Area Chart */}
            <div className="pt-4 pb-2">
              <div className="h-44 w-full flex items-end justify-between gap-3 px-2">
                {[
                  { day: 'Lun', count: 980, height: '55%' },
                  { day: 'Mar', count: 1120, height: '62%' },
                  { day: 'Mer', count: 1340, height: '75%' },
                  { day: 'Jeu', count: 1210, height: '68%' },
                  { day: 'Ven', count: 1540, height: '88%' },
                  { day: 'Sam', count: 890, height: '50%' },
                  { day: 'Aujourd\'hui', count: 1428, height: '82%', active: true },
                ].map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.count}
                    </span>
                    <div className="w-full bg-slate-100 rounded-t-xl h-36 flex items-end p-1">
                      <div
                        className={`w-full rounded-lg transition-all duration-500 group-hover:scale-y-105 ${
                          item.active
                            ? 'bg-gradient-to-t from-indigo-600 to-rose-600 shadow-sm'
                            : 'bg-indigo-400 group-hover:bg-indigo-500'
                        }`}
                        style={{ height: item.height }}
                      />
                    </div>
                    <span className={`text-[11px] font-semibold ${item.active ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tool Popularity Ranking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Top 5 des Outils Populaires</h3>
              <div className="space-y-3">
                {[
                  { name: 'Fusionner PDF', share: '34%', count: '485 conversions aujourd\'hui' },
                  { name: 'Compresser PDF', share: '28%', count: '399 conversions aujourd\'hui' },
                  { name: 'PDF vers Word DOCX', share: '16%', count: '228 conversions aujourd\'hui' },
                  { name: 'Convertisseur d\'Images', share: '12%', count: '171 conversions aujourd\'hui' },
                  { name: 'Découper & Extraire PDF', share: '10%', count: '145 conversions aujourd\'hui' },
                ].map((tool, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-800">{tool.name}</span>
                      <span className="font-mono text-indigo-600 font-bold">{tool.share}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: tool.share }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Santé Système & Latence Workers</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Latence Moyenne d'Exécution</span>
                  <span className="font-mono font-bold text-emerald-600">412 ms</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Workers Node / Canvas Actifs</span>
                  <span className="font-mono font-bold text-slate-800">8 Workers Déployés</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Taux de Réduction Fichiers</span>
                  <span className="font-mono font-bold text-sky-600">58.4% Moyen</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Taux d'Erreurs (24h)</span>
                  <span className="font-mono font-bold text-emerald-600">0.02% (Optimal)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Users Management */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-500 shadow-2xs"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1 text-xs">
              {(['all', 'user', 'pro', 'enterprise', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                    roleFilter === r
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r === 'all' ? 'Tous' : r === 'user' ? 'Gratuit' : r === 'enterprise' ? 'Entreprise' : r === 'pro' ? 'Pro' : 'Admin'}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-4">Utilisateur</th>
                    <th className="p-4">Rôle Actuel</th>
                    <th className="p-4">Quota Quotidien</th>
                    <th className="p-4">Date d'inscription</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-lg object-cover" />
                          <div>
                            <p className="font-bold text-slate-900">{u.name}</p>
                            <p className="text-[10px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <select
                          value={u.role}
                          onChange={(e) => updateUserRole(u.id, e.target.value as any)}
                          className="bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                        >
                          <option value="user">Utilisateur Gratuit</option>
                          <option value="pro">Abonné Pro</option>
                          <option value="enterprise">Abonné Entreprise</option>
                          <option value="admin">Super Admin</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-slate-700">
                          {u.role === 'user' ? `${u.customDailyLimit || 3} tâches/jour` : 'Illimité (∞)'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{u.createdAt}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => resetUserQuota(u.id)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200 transition-colors cursor-pointer"
                          title="Réinitialiser l'usage quotidien"
                        >
                          <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                          Reset Quota
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Support Tickets Manager */}
      {activeTab === 'tickets' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Centre de Support Client & Tickets</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Répondez en direct aux demandes des utilisateurs connectés et visiteurs.
            </p>
          </div>

          <div className="space-y-4">
            {supportTickets.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">Aucun ticket en attente</p>
              </div>
            ) : (
              supportTickets.map((ticket) => (
                <div key={ticket.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-indigo-600">#{ticket.id}</span>
                      <h4 className="text-sm font-bold text-slate-900">{ticket.subject}</h4>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ticket.category === 'billing'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ticket.category === 'technical'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {ticket.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => resolveSupportTicket(ticket.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          ticket.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                      >
                        {ticket.status === 'resolved' ? '✓ Résolu' : 'En Attente (Marquer Résolu)'}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-900 block mb-1">
                      {ticket.userName} ({ticket.userEmail}) :
                    </span>
                    {ticket.message}
                  </p>

                  {/* Existing Admin Response */}
                  {ticket.adminReply && (
                    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-950 space-y-1">
                      <div className="flex items-center justify-between font-bold text-[10px] text-indigo-700">
                        <span>Réponse FlexPDF Support (Admin)</span>
                        <span className="text-emerald-600 font-bold">Transmis</span>
                      </div>
                      <p>{ticket.adminReply}</p>
                    </div>
                  )}

                  {/* Reply Form */}
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Tapez votre réponse support..."
                      value={selectedTicketId === ticket.id ? replyText : ''}
                      onFocus={() => setSelectedTicketId(ticket.id)}
                      onChange={(e) => {
                        setSelectedTicketId(ticket.id);
                        setReplyText(e.target.value);
                      }}
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => handleSendTicketReply(ticket.id)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Répondre</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: System Logs */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Flux des Conversions en Direct</h3>
            <span className="text-xs text-slate-500">Mise à jour temps réel</span>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-4">Horodatage</th>
                    <th className="p-4">Utilisateur</th>
                    <th className="p-4">Outil</th>
                    <th className="p-4">Latence</th>
                    <th className="p-4">Taille Fichier</th>
                    <th className="p-4 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {systemLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 text-slate-500">{log.timestamp}</td>
                      <td className="p-4 text-slate-700">{log.userEmail}</td>
                      <td className="p-4 font-bold text-indigo-600">{log.toolId}</td>
                      <td className="p-4 text-slate-700">{log.executionTimeMs} ms</td>
                      <td className="p-4 text-slate-500">
                        {log.inputSizeKB} KB ➔ <span className="text-emerald-700 font-semibold">{log.outputSizeKB} KB</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                          SUCCÈS
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: System Pricing & Global Site Settings */}
      {activeTab === 'config' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Paramètres Globaux du SaaS & Mode Maintenance</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Contrôlez les quotas gratuits, la tarification Stripe et l'état de service de la plateforme.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Politique de Quota Gratuit & Prix</span>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Limite Gratuite Quotidienne par Visiteur
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={defaultFreeLimit}
                  onChange={(e) => setDefaultFreeLimit(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs shadow-2xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Actuellement réglé à 3 tâches gratuites par 24 heures sans carte bancaire.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Prix Pro Mensuel ($USD)
                </label>
                <input
                  type="number"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs shadow-2xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Prix Pro Annuel ($USD)
                </label>
                <input
                  type="number"
                  value={annualPrice}
                  onChange={(e) => setAnnualPrice(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs shadow-2xs"
                />
              </div>
            </div>

            {/* Maintenance & Site Banner */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contrôle de Disponibilité</span>

              {/* Maintenance Toggle */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Mode Maintenance</h4>
                  <p className="text-[11px] text-slate-500">
                    Affiche la page de maintenance aux visiteurs (les admins conservent l'accès).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMaintenance(!maintenance)}
                  className={`p-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    maintenance ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {maintenance ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  <span>{maintenance ? 'ACTIF' : 'INACTIF'}</span>
                </button>
              </div>

              {/* Site Announcement */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Bannière d'Annonce Globale</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: 🚀 Offre de rentrée : -50% avec le code LAUNCH50 !"
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs shadow-2xs"
                />
              </div>

              {/* Active Promo Codes */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-700">Codes Promos Actifs</span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {promoCodes.map((promo, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-amber-600">{promo.code}</span>
                        <span className="text-slate-500 ml-2">({promo.discount}% Réduction)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        ACTIF
                      </span>
                    </div>
                  ))}
                </div>

                {/* Add Promo */}
                <form onSubmit={handleAddPromo} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="CODE PROMO"
                    value={newPromoCode}
                    onChange={(e) => setNewPromoCode(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs uppercase"
                  />
                  <input
                    type="number"
                    min="5"
                    max="90"
                    value={newPromoDiscount}
                    onChange={(e) => setNewPromoDiscount(parseInt(e.target.value, 10))}
                    className="w-16 px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold cursor-pointer"
                  >
                    Ajouter
                  </button>
                </form>
              </div>

              <button
                onClick={handleSaveConfigs}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Enregistrer la Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: SasPay Gateway Management & Live Engine */}
      {activeTab === 'saspay' && (
        <div className="space-y-6">
          {/* Header & Status Card */}
          <div className="p-6 rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-black text-xs tracking-wider flex items-center gap-1.5 shadow-sm">
                    <Lock className="w-3.5 h-3.5" />
                    <span>SASPAY MULTI-OPERATOR GATEWAY</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Connecté v{gatewayConfig?.version || '1.4.0'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Moteur & Passerelle de Paiement SasPay
                </h2>
                <p className="text-xs text-slate-400">
                  Routage automatisé pour Wave, Orange Money, MTN MoMo, Moov Africa et Cartes Bancaires.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchSasPayData}
                  disabled={isLoadingSasPay}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSasPay ? 'animate-spin' : ''}`} />
                  <span>Actualiser les Flux</span>
                </button>
              </div>
            </div>

            {/* Gateway Technical Specs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono">Environnement Actif</span>
                <p className={`font-bold capitalize flex items-center gap-1 ${gatewayConfig?.environment === 'live' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  <Radio className="w-3.5 h-3.5" />
                  {gatewayConfig?.environment === 'live' ? 'Production Live' : (gatewayConfig?.environment || 'Sandbox Engine')}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono">Clé API Serveur (Live)</span>
                <p className="font-bold text-indigo-300 font-mono text-[11px] truncate">
                  {gatewayConfig?.activeKeyMasked || 'sk_live_••••••••••••'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono">Taux de Change (Fixe XOF)</span>
                <p className="font-bold text-emerald-400">
                  1 USD = {gatewayConfig?.exchangeRates?.USD_XOF || 655.957} FCFA
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono">Protocoles & Sécurité</span>
                <p className="font-bold text-sky-400">TLS 1.3 / 3D-Sec 2.0</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live API Tester / Simulator */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Exécuteur de Requête SasPay (Test Direct)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Simulez l'initiation, le push USSD et la confirmation en direct.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Opérateur Réseau</label>
                  <select
                    value={testOp}
                    onChange={(e) => setTestOp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800"
                  >
                    <option value="wave">Wave Money (Push instantané / QR)</option>
                    <option value="orange">Orange Money (USSD & OTP #144#)</option>
                    <option value="mtn">MTN MoMo (*133#)</option>
                    <option value="moov">Moov Money (*155#)</option>
                    <option value="card">Carte Bancaire Visa / Mastercard</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Numéro Mobile de Test</label>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Montant ($ USD)</label>
                  <input
                    type="number"
                    value={testAmount}
                    onChange={(e) => setTestAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-800"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRunSasPayTest}
                  disabled={isLoadingSasPay}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Exécuter le Flux SasPay Complet</span>
                </button>
              </div>

              {/* Test Result Box */}
              {testResult && (
                <div
                  className={`p-3.5 rounded-2xl text-xs space-y-1.5 border ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : testResult.inProgress
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : testResult.inProgress ? (
                      <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>
                      {testResult.success
                        ? 'Succès : Transaction SasPay Confirmée'
                        : testResult.inProgress
                        ? testResult.step
                        : 'Erreur Transaction'}
                    </span>
                  </div>
                  {testResult.transactionId && (
                    <p className="font-mono text-[11px]">ID : {testResult.transactionId}</p>
                  )}
                  {testResult.reference && (
                    <p className="font-mono text-[11px]">Réf : {testResult.reference}</p>
                  )}
                  {testResult.message && <p className="text-[11px] opacity-90">{testResult.message}</p>}
                </div>
              )}
            </div>

            {/* Transactions Live Feed */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    <span>Transactions SasPay Récentes ({gatewayTransactions.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Paiements traités via Wave, Orange, MTN, Moov et Cartes Bancaires.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Transaction ID</th>
                      <th className="py-2.5 px-3">Client</th>
                      <th className="py-2.5 px-3">Moyen & Opérateur</th>
                      <th className="py-2.5 px-3">Montant</th>
                      <th className="py-2.5 px-3">Statut</th>
                      <th className="py-2.5 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {gatewayTransactions.length > 0 ? (
                      gatewayTransactions.map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors font-medium">
                          <td className="py-2.5 px-3 font-mono text-indigo-600 font-bold">{tx.id}</td>
                          <td className="py-2.5 px-3 text-slate-700">
                            <p className="font-bold text-slate-900">{tx.customerName || 'Client'}</p>
                            <p className="text-[10px] text-slate-400">{tx.customerEmail}</p>
                          </td>
                          <td className="py-2.5 px-3 capitalize text-slate-800">
                            {tx.paymentMethod === 'mobile_money' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                                <Smartphone className="w-3 h-3" />
                                {tx.operator || 'Mobile Money'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full text-[11px]">
                                <CreditCard className="w-3 h-3" />
                                {tx.cardBrand || 'Carte'} •••• {tx.cardLast4 || '4242'}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            ${tx.amount}{' '}
                            <span className="text-[10px] text-slate-400 block font-normal">
                              ({tx.amountXOF?.toLocaleString() || Math.round(tx.amount * 655)} XOF)
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                tx.status === 'SUCCESS'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : tx.status === 'FAILED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-[10px]">
                            {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                          Aucune transaction SasPay enregistrée pour le moment.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* API Server Logs Box */}
          <div className="p-6 rounded-3xl bg-slate-900 text-slate-300 border border-slate-800 shadow-md space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono uppercase font-bold text-indigo-400 flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                Journal des Événements API SasPay en Direct
              </span>
              <span className="text-[10px] text-slate-500">{gatewayLogs.length} requêtes capturées</span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-2">
              {gatewayLogs.length > 0 ? (
                gatewayLogs.map((log: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          log.method === 'POST' ? 'bg-indigo-900 text-indigo-300' : 'bg-emerald-900 text-emerald-300'
                        }`}
                      >
                        {log.method}
                      </span>
                      <span className="text-slate-200 font-bold">{log.endpoint}</span>
                      <span className="text-slate-400 truncate">({log.payloadSummary})</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-slate-400 text-[10px]">
                      <span className={log.status === 200 ? 'text-emerald-400' : 'text-rose-400'}>
                        HTTP {log.status}
                      </span>
                      <span>{log.durationMs}ms</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 italic py-3 text-center">
                  Aucun log de requête SasPay pour l'instant. Les appels /api/saspay/* apparaîtront ici.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
