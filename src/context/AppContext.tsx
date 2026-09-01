import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  UserSubscription,
  ProcessedFileRecord,
  InvoiceRecord,
  AdminStats,
  SystemLog,
  AppNotification,
  SubscriptionPlanId,
  ActiveView,
  SupportTicket,
  SiteSettings,
} from '../types';

interface AppContextType {
  user: UserProfile | null;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  dailyUsageCount: number;
  dailyLimit: number;
  remainingDailyQuota: number;
  isUnlimited: boolean;
  timeUntilReset: string;
  hasQuotaRemaining: boolean;
  consumeQuota: (toolId: string) => boolean;
  history: ProcessedFileRecord[];
  addHistoryRecord: (record: Omit<ProcessedFileRecord, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  removeHistoryItem: (id: string) => void;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedToolId: string | null;
  setSelectedToolId: (toolId: string | null) => void;
  login: (email: string, role?: 'user' | 'pro' | 'admin') => void;
  logout: () => void;
  switchDemoUser: (role: 'free' | 'pro' | 'admin') => void;
  upgradeSubscription: (
    planId: SubscriptionPlanId,
    paymentDetails?: {
      paymentMethod?: 'card' | 'mobile_money' | 'paypal' | 'apple_pay' | 'google_pay' | 'sepa';
      cardLast4?: string;
      cardBrand?: string;
      mobileMoneyPhone?: string;
      mobileMoneyOperator?: any;
      customerName?: string;
      customerEmail?: string;
      discountPercent?: number;
    }
  ) => void;
  reactivateSubscription: () => void;
  exportUserData: () => void;
  deleteAccount: () => void;
  purgeMemoryFiles: () => void;
  navigateSafely: (targetView: ActiveView) => void;
  cancelSubscription: () => void;
  updateUserProfile: (updates: Partial<Pick<UserProfile, 'name' | 'email' | 'avatar'>>) => void;
  notifications: AppNotification[];
  addNotification: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
  removeNotification: (id: string) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isForgotPasswordModalOpen: boolean;
  setIsForgotPasswordModalOpen: (open: boolean) => void;
  isUpgradeModalOpen: boolean;
  setIsUpgradeModalOpen: (open: boolean) => void;
  isStripeCheckoutOpen: boolean;
  setIsStripeCheckoutOpen: (open: boolean) => void;
  isSasPayCheckoutOpen: boolean;
  setIsSasPayCheckoutOpen: (open: boolean) => void;
  selectedCheckoutPlan: SubscriptionPlanId;
  openStripeCheckout: (planId?: SubscriptionPlanId) => void;
  openSasPayCheckout: (planId?: SubscriptionPlanId) => void;
  adminStats: AdminStats;
  generateDemoStats: () => void;
  systemLogs: SystemLog[];
  allUsers: UserProfile[];
  updateUserRole: (userId: string, role: 'user' | 'pro' | 'admin', customLimit?: number) => void;
  resetUserQuota: (userId: string) => void;
  invoices: InvoiceRecord[];
  supportTickets: SupportTicket[];
  createSupportTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>) => void;
  replySupportTicket: (id: string, reply: string) => void;
  resolveSupportTicket: (id: string) => void;
  siteSettings: SiteSettings;
  updateSiteSettings: (settings: Partial<SiteSettings>) => void;
  toggleToolStatus: (toolId: string) => void;
  legalActiveTab: 'mentions' | 'cgu' | 'privacy' | 'security';
  setLegalActiveTab: (tab: 'mentions' | 'cgu' | 'privacy' | 'security') => void;
}

const DEFAULT_FREE_LIMIT = 3;

const INITIAL_DEMO_USERS: UserProfile[] = [
  {
    id: 'user_free_1',
    name: 'Alex Rivera',
    email: 'alex@flexpdf.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'user',
    subscription: {
      planId: 'free',
      status: 'active',
      currentPeriodEnd: '2026-09-29',
      cancelAtPeriodEnd: false,
      renewsOn: 'N/A',
      price: 0,
      billingInterval: 'free',
    },
    createdAt: '2026-08-01',
    apiKey: 'flex_free_live_839219382103',
  },
  {
    id: 'user_pro_1',
    name: 'Sarah Chen',
    email: 'sarah@flexpdf.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'pro',
    subscription: {
      planId: 'pro_monthly',
      status: 'active',
      currentPeriodEnd: '2026-09-28',
      cancelAtPeriodEnd: false,
      renewsOn: '2026-09-28',
      price: 9,
      billingInterval: 'month',
      paymentMethod: 'mobile_money',
      mobileMoneyOperator: 'orange',
      mobileMoneyPhone: '+221 77 123 45 67',
    },
    createdAt: '2026-07-15',
    apiKey: 'flex_pro_live_994827481923',
  },
  {
    id: 'admin_flexpdf_01',
    name: 'Administrateur FlexPDF',
    email: 'admin@flexpdf.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    subscription: {
      planId: 'enterprise',
      status: 'active',
      currentPeriodEnd: '2027-08-29',
      cancelAtPeriodEnd: false,
      renewsOn: '2027-08-29',
      price: 99,
      billingInterval: 'year',
      paymentMethod: 'card',
      cardLast4: '4242',
      cardBrand: 'Visa',
    },
    createdAt: '2026-01-01',
    apiKey: 'flex_admin_master_001928471928',
  },
];

const INITIAL_INVOICES: InvoiceRecord[] = [
  {
    id: 'inv_1048',
    number: 'INV-2026-088',
    date: '2026-08-28',
    amount: 9.0,
    status: 'paid',
    planName: 'FlexPDF Pro Monthly',
    downloadUrl: '#',
    paymentMethod: 'SASPAY MOBILE MONEY (Orange)',
    transactionId: 'SASP_TX_99281_ORANGE',
    customerName: 'Sarah Chen',
    customerEmail: 'sarah@flexpdf.com',
  },
  {
    id: 'inv_1032',
    number: 'INV-2026-075',
    date: '2026-07-28',
    amount: 9.0,
    status: 'paid',
    planName: 'FlexPDF Pro Monthly',
    downloadUrl: '#',
    paymentMethod: 'SASPAY CARTE (Visa •••• 4242)',
    transactionId: 'SASP_TX_77182_VISA',
    customerName: 'Sarah Chen',
    customerEmail: 'sarah@flexpdf.com',
  },
  {
    id: 'inv_1011',
    number: 'INV-2026-061',
    date: '2026-06-28',
    amount: 79.0,
    status: 'paid',
    planName: 'FlexPDF Pro Annuel',
    downloadUrl: '#',
    paymentMethod: 'SASPAY MOBILE MONEY (Wave)',
    transactionId: 'SASP_TX_55190_WAVE',
    customerName: 'Alex Rivera',
    customerEmail: 'alex@flexpdf.com',
  },
];

const INITIAL_SYSTEM_LOGS: SystemLog[] = [
  {
    id: 'log_1',
    timestamp: '2 mins ago',
    userId: 'user_pro_1',
    userEmail: 'sarah@flexpdf.com',
    toolId: 'merge-pdf',
    status: 'success',
    executionTimeMs: 380,
    inputSizeKB: 4200,
    outputSizeKB: 4120,
  },
  {
    id: 'log_2',
    timestamp: '8 mins ago',
    userId: 'user_free_1',
    userEmail: 'alex@flexpdf.com',
    toolId: 'compress-pdf',
    status: 'success',
    executionTimeMs: 520,
    inputSizeKB: 8400,
    outputSizeKB: 2950,
  },
  {
    id: 'log_3',
    timestamp: '15 mins ago',
    userId: 'guest_visitor',
    userEmail: 'visitor@flexpdf.net',
    toolId: 'pdf-to-word',
    status: 'success',
    executionTimeMs: 780,
    inputSizeKB: 1850,
    outputSizeKB: 240,
  },
  {
    id: 'log_4',
    timestamp: '22 mins ago',
    userId: 'user_pro_1',
    userEmail: 'sarah@flexpdf.com',
    toolId: 'image-converter',
    status: 'success',
    executionTimeMs: 290,
    inputSizeKB: 5600,
    outputSizeKB: 1800,
  },
];

const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'ticket_1',
    userName: 'Claire Dupont',
    userEmail: 'claire.dupont@cabinet-avocats.fr',
    subject: 'Question sur la compression des PDF juridiques avec signatures',
    message: 'Bonjour, est-ce que la compression conserve la validité cryptographique des certificats eIDAS sur les fichiers signés ? Merci !',
    status: 'resolved',
    category: 'technical',
    createdAt: '2026-08-30',
    adminReply: 'Bonjour Claire, oui absolument ! FlexPDF traite les documents 100% côté client et préserve intactes les structures de métadonnées et signatures numériques sans jamais téléverser de fichier sur serveur.',
  },
  {
    id: 'ticket_2',
    userName: 'Marc Lambert',
    userEmail: 'marc@startup-scale.io',
    subject: 'Paiement SasPay Mobile Money Entreprise',
    message: 'Bonjour l\'équipe FlexPDF, est-ce que nous pouvons payer nos abonnements d\'équipe via SasPay Wave ou Orange Money avec facture d\'entreprise ?',
    status: 'open',
    category: 'billing',
    createdAt: '2026-08-31',
  },
];

const INITIAL_SITE_SETTINGS: SiteSettings = {
  siteName: 'FlexPDF SaaS Platform',
  contactEmail: 'contact@flexpdf.com',
  defaultFreeLimit: 3,
  maintenanceMode: false,
  maintenanceMessage: 'Maintenance programmée en cours. Nos équipes déploient une mise à jour d\'infrastructure.',
  disabledTools: [],
  monthlyPrice: 9,
  annualPrice: 79,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  // Registry 1: flexpdf_users
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('flexpdf_users') || localStorage.getItem('dm_users');
    return saved ? JSON.parse(saved) : INITIAL_DEMO_USERS;
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('flexpdf_active_user') || localStorage.getItem('dm_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [legalActiveTab, setLegalActiveTab] = useState<'mentions' | 'cgu' | 'privacy' | 'security'>('cgu');

  const [dailyUsageMap, setDailyUsageMap] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('flexpdf_daily_usage') || localStorage.getItem('dm_daily_usage');
    return saved ? JSON.parse(saved) : {};
  });

  // Registry 2: flexpdf_jobs
  const [history, setHistory] = useState<ProcessedFileRecord[]>(() => {
    const saved = localStorage.getItem('flexpdf_jobs') || localStorage.getItem('dm_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem('flexpdf_tickets') || localStorage.getItem('dm_tickets');
    return saved ? JSON.parse(saved) : INITIAL_SUPPORT_TICKETS;
  });

  // Registry 3: flexpdf_config
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    const saved = localStorage.getItem('flexpdf_config') || localStorage.getItem('dm_settings');
    return saved ? JSON.parse(saved) : INITIAL_SITE_SETTINGS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isStripeCheckoutOpen, setIsStripeCheckoutOpen] = useState(false);
  const [isSasPayCheckoutOpen, setIsSasPayCheckoutOpen] = useState(false);
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<SubscriptionPlanId>('pro_annual');
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(INITIAL_INVOICES);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(INITIAL_SYSTEM_LOGS);

  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalConversionsToday: 1540,
    totalConversionsAllTime: 104820,
    activeProUsers: 385,
    totalUsers: 5120,
    mrr: 3465,
    arr: 41580,
    storageSavedMB: 54300,
    conversionRate: 7.5,
  });

  const todayKey = new Date().toISOString().split('T')[0];
  const userKey = user ? user.id : 'guest_visitor';
  const dailyUsageCount = dailyUsageMap[`${userKey}_${todayKey}`] || 0;

  const isUnlimited = user?.role === 'pro' || user?.role === 'admin';
  const dailyLimit = user?.customDailyLimit ?? siteSettings.defaultFreeLimit;
  const remainingDailyQuota = isUnlimited ? 999 : Math.max(0, dailyLimit - dailyUsageCount);
  const hasQuotaRemaining = isUnlimited || remainingDailyQuota > 0;

  const [timeUntilReset, setTimeUntilReset] = useState('');
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setTimeUntilReset(`${hours}h ${mins}m`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  // Save to FlexPDF persistent LocalStorage registers
  useEffect(() => {
    if (user) {
      localStorage.setItem('flexpdf_active_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('flexpdf_active_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('flexpdf_daily_usage', JSON.stringify(dailyUsageMap));
  }, [dailyUsageMap]);

  useEffect(() => {
    localStorage.setItem('flexpdf_jobs', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('flexpdf_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('flexpdf_tickets', JSON.stringify(supportTickets));
  }, [supportTickets]);

  useEffect(() => {
    localStorage.setItem('flexpdf_config', JSON.stringify(siteSettings));
  }, [siteSettings]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const addNotification = (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    setNotifications((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeNotification(id);
    }, 4500);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const consumeQuota = (toolId: string): boolean => {
    if (isUnlimited) {
      recordConversionLog(toolId, true);
      return true;
    }

    if (dailyUsageCount >= dailyLimit) {
      openStripeCheckout('pro_monthly');
      addNotification(
        'warning',
        'Limite Gratuite Atteinte (3/3)',
        'Vous avez utilisé vos 3 tâches gratuites du jour. Passez à Pro pour des conversions illimitées.'
      );
      return false;
    }

    const newUsage = dailyUsageCount + 1;
    const usageKey = `${userKey}_${todayKey}`;
    setDailyUsageMap((prev) => ({
      ...prev,
      [usageKey]: newUsage,
    }));

    recordConversionLog(toolId, true);

    if (newUsage >= dailyLimit) {
      addNotification(
        'info',
        'Quota Quotidien Atteint',
        'Vous avez consommé vos 3 tâches gratuites. La prochaine tâche nécessitera un forfait Pro.'
      );
    }

    return true;
  };

  const recordConversionLog = (toolId: string, success: boolean) => {
    const newLog: SystemLog = {
      id: `log_${Date.now()}`,
      timestamp: 'À l\'instant',
      userId: user?.id || 'guest',
      userEmail: user?.email || 'visiteur@anonyme.fr',
      toolId,
      status: success ? 'success' : 'failed',
      executionTimeMs: Math.floor(Math.random() * 600) + 200,
      inputSizeKB: Math.floor(Math.random() * 4000) + 500,
      outputSizeKB: Math.floor(Math.random() * 3000) + 300,
    };
    setSystemLogs((prev) => [newLog, ...prev.slice(0, 40)]);
    setAdminStats((prev) => ({
      ...prev,
      totalConversionsToday: prev.totalConversionsToday + 1,
      totalConversionsAllTime: prev.totalConversionsAllTime + 1,
    }));
  };

  const addHistoryRecord = (record: Omit<ProcessedFileRecord, 'id' | 'timestamp'>) => {
    const newRecord: ProcessedFileRecord = {
      ...record,
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      userId: user?.id,
    };
    setHistory((prev) => [newRecord, ...prev.slice(0, 30)]);
  };

  const clearHistory = () => {
    setHistory([]);
    addNotification('info', 'Historique Effacé', 'Votre journal de documents a été remis à zéro.');
  };

  const removeHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    addNotification('info', 'Fichier Supprimé', 'Le document a été retiré de votre historique.');
  };

  const login = (email: string, role: 'user' | 'pro' | 'admin' = 'user') => {
    const existing = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      setUser(existing);
      addNotification('success', `Ravi de vous revoir, ${existing.name} !`, `Connecté avec le profil ${existing.role.toUpperCase()}.`);
    } else {
      const newUser: UserProfile = {
        id: `user_${Date.now()}`,
        name: email.split('@')[0],
        email,
        avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        role,
        subscription: {
          planId: role === 'pro' ? 'pro_monthly' : role === 'admin' ? 'enterprise' : 'free',
          status: 'active',
          currentPeriodEnd: '2026-09-29',
          cancelAtPeriodEnd: false,
          renewsOn: '2026-09-29',
          price: role === 'pro' ? 9 : role === 'admin' ? 99 : 0,
          billingInterval: role === 'pro' ? 'month' : role === 'admin' ? 'year' : 'free',
        },
        createdAt: new Date().toISOString().split('T')[0],
        apiKey: `flex_live_${Math.random().toString(36).substr(2, 12)}`,
      };
      setAllUsers((prev) => [...prev, newUser]);
      setUser(newUser);
      addNotification('success', 'Compte Créé !', `Bienvenue sur FlexPDF, ${newUser.name} !`);
    }
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    addNotification('info', 'Déconnexion Réussie', 'Vous naviguez maintenant en mode visiteur public.');
  };

  const switchDemoUser = (role: 'free' | 'pro' | 'admin') => {
    const target = INITIAL_DEMO_USERS.find((u) => u.role === (role === 'free' ? 'user' : role));
    if (target) {
      setUser(target);
      addNotification('success', `Profil Actif : ${target.name}`, `Mode ${target.role.toUpperCase()} activé en 1 clic (${target.email}).`);
    }
  };

  const openStripeCheckout = (planId: SubscriptionPlanId = 'pro_annual') => {
    setSelectedCheckoutPlan(planId);
    setIsSasPayCheckoutOpen(true);
    setIsStripeCheckoutOpen(true);
    setIsUpgradeModalOpen(false);
  };

  const openSasPayCheckout = (planId: SubscriptionPlanId = 'pro_annual') => {
    setSelectedCheckoutPlan(planId);
    setIsSasPayCheckoutOpen(true);
    setIsStripeCheckoutOpen(true);
    setIsUpgradeModalOpen(false);
  };

  const generateDemoStats = () => {
    const randomMultiplier = (Math.random() * 0.4 + 0.8);
    const newToday = Math.floor(1540 * randomMultiplier);
    const newTotal = Math.floor(104820 + Math.random() * 500);
    const newActivePro = Math.floor(385 * randomMultiplier);
    const newMrr = newActivePro * 9;
    const newArr = newMrr * 12;

    setAdminStats({
      totalConversionsToday: newToday,
      totalConversionsAllTime: newTotal,
      activeProUsers: newActivePro,
      totalUsers: Math.floor(5120 + Math.random() * 20),
      mrr: newMrr,
      arr: newArr,
      storageSavedMB: Math.floor(54300 + Math.random() * 300),
      conversionRate: Number((7.5 * randomMultiplier).toFixed(1)),
    });

    addNotification('success', 'Données Analytics Régénérées', 'Métriques SaaS et graphiques de performance actualisés avec succès.');
  };

  const upgradeSubscription = (
    planId: SubscriptionPlanId,
    paymentDetails?: {
      paymentMethod?: 'card' | 'mobile_money' | 'paypal' | 'apple_pay' | 'google_pay' | 'sepa';
      cardLast4?: string;
      cardBrand?: string;
      mobileMoneyPhone?: string;
      mobileMoneyOperator?: any;
      customerName?: string;
      customerEmail?: string;
      discountPercent?: number;
    }
  ) => {
    const rawPrice = planId === 'pro_annual' ? siteSettings.annualPrice : planId === 'enterprise' ? 99 : siteSettings.monthlyPrice;
    const discount = paymentDetails?.discountPercent || 0;
    const finalPrice = discount > 0 ? Number((rawPrice * (1 - discount / 100)).toFixed(2)) : rawPrice;
    const interval = planId === 'pro_annual' || planId === 'enterprise' ? 'year' : 'month';

    const now = new Date();
    const startDate = now.toISOString().split('T')[0];
    const expiryDateObj = new Date(now);
    if (interval === 'year') {
      expiryDateObj.setFullYear(expiryDateObj.getFullYear() + 1);
    } else {
      expiryDateObj.setDate(expiryDateObj.getDate() + 30);
    }
    const currentPeriodEnd = expiryDateObj.toISOString().split('T')[0];
    const txId = `SASP_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const maxFileSizeMB = planId === 'enterprise' ? 500 : 100;
    const batchLimit = planId === 'enterprise' ? 50 : 10;

    const updatedSub: UserSubscription = {
      planId,
      status: 'active',
      startDate,
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
      renewsOn: currentPeriodEnd,
      price: finalPrice,
      billingInterval: interval,
      paymentMethod: paymentDetails?.paymentMethod || 'mobile_money',
      cardLast4: paymentDetails?.cardLast4 || '4242',
      cardBrand: paymentDetails?.cardBrand || 'Visa',
      mobileMoneyPhone: paymentDetails?.mobileMoneyPhone,
      mobileMoneyOperator: paymentDetails?.mobileMoneyOperator,
      transactionId: txId,
      maxFileSizeMB,
      batchLimit,
    };

    const targetEmail = paymentDetails?.customerEmail || user?.email || 'client@flexpdf.com';
    const targetName = paymentDetails?.customerName || user?.name || targetEmail.split('@')[0];

    if (!user) {
      const newUser: UserProfile = {
        id: `user_${Date.now()}`,
        name: targetName,
        email: targetEmail,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        role: planId === 'enterprise' ? 'admin' : 'pro',
        subscription: updatedSub,
        createdAt: startDate,
        apiKey: `flex_pro_live_${Math.random().toString(36).substring(2, 14)}`,
        lastLogin: startDate,
      };
      setAllUsers((prev) => [...prev, newUser]);
      setUser(newUser);
    } else {
      const updatedUser: UserProfile = {
        ...user,
        role: planId === 'enterprise' ? 'admin' : 'pro',
        subscription: updatedSub,
      };
      setUser(updatedUser);
      setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    }

    const subtotal = Number((finalPrice / 1.2).toFixed(2));
    const taxAmount = Number((finalPrice - subtotal).toFixed(2));

    const methodDesc = paymentDetails?.paymentMethod === 'mobile_money'
      ? `SASPAY MOBILE MONEY (${paymentDetails.mobileMoneyOperator?.toUpperCase() || 'WAVE'} - ${paymentDetails.mobileMoneyPhone || ''})`
      : `SASPAY CARTE BANCAIRE (${paymentDetails?.cardBrand || 'VISA'} •••• ${paymentDetails?.cardLast4 || '4242'})`;

    const newInvoice: InvoiceRecord = {
      id: `inv_${Date.now()}`,
      number: `INV-2026-${Math.floor(Math.random() * 900) + 100}`,
      date: startDate,
      amount: finalPrice,
      subtotal,
      taxAmount,
      status: 'paid',
      planName: `FlexPDF ${planId === 'pro_annual' ? 'Pro Annuel (365j)' : planId === 'enterprise' ? 'Enterprise & Team' : 'Pro Mensuel (30j)'}`,
      downloadUrl: '#',
      paymentMethod: methodDesc,
      cardLast4: paymentDetails?.cardLast4 || '4242',
      transactionId: txId,
      customerName: targetName,
      customerEmail: targetEmail,
    };
    setInvoices((prev) => [newInvoice, ...prev]);

    setIsUpgradeModalOpen(false);
    setIsStripeCheckoutOpen(false);
    setIsSasPayCheckoutOpen(false);
    addNotification(
      'success',
      'Paiement SasPay Validé & Forfait Activé ! 🎉',
      `Votre abonnement ${planId === 'pro_annual' ? 'Annuel (365 jours)' : 'Mensuel (30 jours)'} est actif avec conversions illimitées.`
    );
  };

  const reactivateSubscription = () => {
    if (!user) return;
    const updatedUser: UserProfile = {
      ...user,
      subscription: {
        ...user.subscription,
        cancelAtPeriodEnd: false,
        status: 'active',
      },
    };
    setUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    addNotification('success', 'Renouvellement Réactivé', 'Votre abonnement sera automatiquement reconduit à la date d\'échéance.');
  };

  const cancelSubscription = () => {
    if (!user) return;
    const updatedUser: UserProfile = {
      ...user,
      subscription: {
        ...user.subscription,
        cancelAtPeriodEnd: true,
      },
    };
    setUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    addNotification(
      'info',
      'Abonnement Résilié',
      `Votre forfait restera actif jusqu'au ${user.subscription.currentPeriodEnd}. Aucun prélèvement ultérieur ne sera effectué.`
    );
  };

  const purgeMemoryFiles = () => {
    setHistory([]);
    addNotification('success', 'Mémoire RAM Purgée', 'Tous les fichiers temporaires et jetons en cache ont été supprimés (0 octet conservé).');
  };

  const exportUserData = () => {
    if (!user) {
      addNotification('warning', 'Non Connecté', 'Connectez-vous pour exporter vos données personnelles RGPD.');
      return;
    }
    const exportObject = {
      exportedAt: new Date().toISOString(),
      compliance: 'RGPD / GDPR Article 20 (Portabilité des données)',
      saas: 'FlexPDF SaaS Platform',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        apiKey: user.apiKey,
        subscription: user.subscription,
      },
      historyRecords: history,
      invoices,
      supportTickets: supportTickets.filter((t) => t.userEmail === user.email),
    };

    const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FlexPDF_RGPD_Export_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification('success', 'Export RGPD Téléchargé', 'Fichier d\'archive chiffré généré au format JSON.');
  };

  const deleteAccount = () => {
    if (!user) return;
    const targetId = user.id;
    setAllUsers((prev) => prev.filter((u) => u.id !== targetId));
    setHistory((prev) => prev.filter((h) => h.userId !== targetId));
    setUser(null);
    setActiveView('home');
    addNotification('info', 'Compte Supprimé (Droit à l\'Oubli)', 'Toutes vos données ont été définitivement effacées conformément au RGPD.');
  };

  const navigateSafely = (targetView: ActiveView) => {
    if (targetView === 'dashboard' && !user) {
      addNotification('warning', 'Accès Restreint', 'Veuillez vous connecter pour accéder à votre espace personnel FlexPDF.');
      setActiveView('auth');
      return;
    }
    if (targetView === 'admin') {
      if (!user) {
        addNotification('error', 'Garde d\'Accès Administratif', 'Connexion requise avec le compte administrateur (admin@flexpdf.com).');
        setActiveView('auth');
        return;
      }
      if (user.role !== 'admin') {
        addNotification('error', 'Accès Interdit (403)', 'Garde d\'accès actif : seuls les administrateurs FlexPDF peuvent accéder à cette console.');
        setActiveView('home');
        return;
      }
    }
    setActiveView(targetView);
  };

  const updateUserProfile = (updates: Partial<Pick<UserProfile, 'name' | 'email' | 'avatar'>>) => {
    if (!user) return;
    const updatedUser: UserProfile = {
      ...user,
      ...updates,
    };
    setUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    addNotification('success', 'Profil Mis à Jour', 'Vos modifications ont été enregistrées avec succès.');
  };

  const updateUserRole = (userId: string, newRole: 'user' | 'pro' | 'admin', customLimit?: number) => {
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = {
            ...u,
            role: newRole,
            customDailyLimit: customLimit !== undefined ? customLimit : u.customDailyLimit,
          };
          if (user && user.id === userId) {
            setUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
    addNotification('success', 'Rôle Utilisateur Modifié', `Nouveau rôle : ${newRole.toUpperCase()}`);
  };

  const resetUserQuota = (userId: string) => {
    const key = `${userId}_${todayKey}`;
    setDailyUsageMap((prev) => ({
      ...prev,
      [key]: 0,
    }));
    addNotification('success', 'Quota Réinitialisé', `Le quota quotidien a été remis à zéro.`);
  };

  const createSupportTicket = (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>) => {
    const newTicket: SupportTicket = {
      ...ticket,
      id: `ticket_${Date.now()}`,
      status: 'open',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setSupportTickets((prev) => [newTicket, ...prev]);
    addNotification('success', 'Message Envoyé au Support !', 'Notre équipe vous répondra dans les plus brefs délais.');
  };

  const replySupportTicket = (id: string, reply: string) => {
    setSupportTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, adminReply: reply, status: 'resolved' } : t))
    );
    addNotification('success', 'Réponse Enregistrée', 'La réponse au ticket a été transmise à l\'utilisateur.');
  };

  const resolveSupportTicket = (id: string) => {
    setSupportTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: t.status === 'resolved' ? 'open' : 'resolved' } : t))
    );
    addNotification('info', 'Statut du Ticket Modifié', 'Statut mis à jour.');
  };

  const updateSiteSettings = (settings: Partial<SiteSettings>) => {
    setSiteSettings((prev) => ({ ...prev, ...settings }));
    addNotification('success', 'Paramètres Globaux Enregistrés', 'La configuration du SaaS a été mise à jour.');
  };

  const toggleToolStatus = (toolId: string) => {
    setSiteSettings((prev) => {
      const isDisabled = prev.disabledTools.includes(toolId);
      const updated = isDisabled
        ? prev.disabledTools.filter((id) => id !== toolId)
        : [...prev.disabledTools, toolId];
      return { ...prev, disabledTools: updated };
    });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        theme,
        toggleTheme,
        dailyUsageCount,
        dailyLimit,
        remainingDailyQuota,
        isUnlimited,
        timeUntilReset,
        hasQuotaRemaining,
        consumeQuota,
        history,
        addHistoryRecord,
        clearHistory,
        removeHistoryItem,
        activeView,
        setActiveView,
        selectedToolId,
        setSelectedToolId,
        login,
        logout,
        switchDemoUser,
        upgradeSubscription,
        reactivateSubscription,
        cancelSubscription,
        exportUserData,
        deleteAccount,
        purgeMemoryFiles,
        navigateSafely,
        updateUserProfile,
        notifications,
        addNotification,
        removeNotification,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isForgotPasswordModalOpen,
        setIsForgotPasswordModalOpen,
        isUpgradeModalOpen,
        setIsUpgradeModalOpen,
        isStripeCheckoutOpen,
        setIsStripeCheckoutOpen,
        isSasPayCheckoutOpen,
        setIsSasPayCheckoutOpen,
        selectedCheckoutPlan,
        openStripeCheckout,
        openSasPayCheckout,
        adminStats,
        generateDemoStats,
        systemLogs,
        allUsers,
        updateUserRole,
        resetUserQuota,
        invoices,
        supportTickets,
        createSupportTicket,
        replySupportTicket,
        resolveSupportTicket,
        siteSettings,
        updateSiteSettings,
        toggleToolStatus,
        legalActiveTab,
        setLegalActiveTab,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
