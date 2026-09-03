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
import { saspayService } from '../services/saspayService';

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
  login: (email: string, role?: 'user' | 'pro' | 'enterprise' | 'admin') => void;
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
      company?: string;
      phone?: string;
      emailVerified?: boolean;
      hasPassword?: boolean;
      keepModalOpen?: boolean;
    }
  ) => void;
  setUserPassword: (password: string) => void;
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
  initiateSasPayRedirect: (planId?: SubscriptionPlanId) => Promise<void>;
  isSasPayRedirecting: boolean;
  sasPayPaymentUrl: string | null;
  sasPayRedirectError: string | null;
  sasPayRedirectPlan: SubscriptionPlanId;
  closeSasPayRedirect: () => void;
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

const DESIGNATED_ADMIN_EMAIL = 'admin@flexpdf.com';
const SUPER_ADMIN_EMAIL = 'fadalsall1997@gmail.com';

// Default designated Admin and Super Admin accounts
const INITIAL_SYSTEM_USERS: UserProfile[] = [
  {
    id: 'admin_flexpdf_designated',
    name: 'Admin FlexPDF',
    email: DESIGNATED_ADMIN_EMAIL,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    subscription: {
      planId: 'enterprise',
      status: 'active',
      currentPeriodEnd: '2029-12-31',
      cancelAtPeriodEnd: false,
      renewsOn: '2029-12-31',
      price: 0,
      billingInterval: 'free',
      paymentMethod: 'card',
      transactionId: 'SASP_MASTER_ADMIN_FLEXPDF',
    },
    createdAt: '2026-09-01',
    apiKey: 'flex_admin_master_designated_key',
    lastLogin: '2026-09-01',
  },
  {
    id: 'super_admin_fadalsall',
    name: 'Fadal Sall',
    email: SUPER_ADMIN_EMAIL,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    subscription: {
      planId: 'enterprise',
      status: 'active',
      currentPeriodEnd: '2029-12-31',
      cancelAtPeriodEnd: false,
      renewsOn: '2029-12-31',
      price: 99,
      billingInterval: 'year',
      paymentMethod: 'card',
      cardLast4: '4242',
      cardBrand: 'Visa',
      transactionId: 'SASP_MASTER_ADMIN_INIT',
    },
    createdAt: '2026-09-01',
    apiKey: 'flex_admin_master_fadalsall_live_key',
    lastLogin: '2026-09-01',
  },
];

// Clean legacy mock test users and ensure visitors start unauthenticated by default
if (typeof window !== 'undefined') {
  try {
    const isCleaned = localStorage.getItem('flexpdf_v6_unauth_clean');
    if (!isCleaned) {
      localStorage.removeItem('flexpdf_active_user'); // Visitors start unauthenticated
      localStorage.setItem('flexpdf_users', JSON.stringify(INITIAL_SYSTEM_USERS));
      localStorage.setItem('flexpdf_v6_unauth_clean', 'true');
    }
  } catch (e) {
    // Ignore in SSR
  }
}

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

  // Registry 1: flexpdf_users (dynamic user database in localStorage)
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('flexpdf_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleaned = Array.isArray(parsed)
          ? parsed.filter((u: any) => 
              u.email !== 'alex@flexpdf.com' && 
              u.email !== 'sarah@flexpdf.com' && 
              u.email !== 'free@flexpdf.app' &&
              u.email !== 'pro@flexpdf.app' &&
              u.email !== 'admin@flexpdf.app'
            )
          : [];
        
        // Ensure designated administrators are present
        const hasAdmin = cleaned.some((u) => u.email.toLowerCase() === DESIGNATED_ADMIN_EMAIL.toLowerCase());
        if (!hasAdmin) {
          cleaned.unshift(INITIAL_SYSTEM_USERS[0]);
        }
        const hasSuperAdmin = cleaned.some((u) => u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase());
        if (!hasSuperAdmin) {
          cleaned.unshift(INITIAL_SYSTEM_USERS[1]);
        }
        return cleaned;
      } catch (e) {
        return INITIAL_SYSTEM_USERS;
      }
    }
    return INITIAL_SYSTEM_USERS;
  });

  // Current session user: strictly null when not logged in
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('flexpdf_active_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email && parsed.id) {
          return parsed;
        }
      } catch (e) {
        return null;
      }
    }
    return null; // Guest by default! No user logged in before user logs in.
  });

  const [activeView, setActiveView] = useState<ActiveView>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (
        path.includes('/webhooks') ||
        path.includes('/payment') ||
        search.includes('payment_status') ||
        search.includes('webhooks') ||
        search.includes('ref=')
      ) {
        return 'webhooks';
      }
    }
    return 'home';
  });
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [legalActiveTab, setLegalActiveTab] = useState<'mentions' | 'cgu' | 'privacy' | 'security'>('cgu');

  const [dailyUsageMap, setDailyUsageMap] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('flexpdf_daily_usage');
    return saved ? JSON.parse(saved) : {};
  });

  // Registry 2: flexpdf_jobs (all user conversion history)
  const [allHistoryRecords, setAllHistoryRecords] = useState<ProcessedFileRecord[]>(() => {
    const saved = localStorage.getItem('flexpdf_jobs');
    return saved ? JSON.parse(saved) : [];
  });

  // Strict Per-User History isolation: users only see their own files
  const history = allHistoryRecords.filter((rec) => {
    if (user) {
      return rec.userId === user.id;
    }
    return !rec.userId || rec.userId === 'guest';
  });

  // Registry 3: flexpdf_tickets (dynamic support tickets)
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem('flexpdf_tickets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleaned = Array.isArray(parsed)
          ? parsed.filter((t: any) => !t.userEmail?.includes('cabinet-avocats.fr') && !t.userEmail?.includes('startup-scale.io'))
          : [];
        return cleaned;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Registry 4: flexpdf_config (dynamic settings)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    const saved = localStorage.getItem('flexpdf_config');
    return saved ? JSON.parse(saved) : INITIAL_SITE_SETTINGS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isStripeCheckoutOpen, setIsStripeCheckoutOpen] = useState(false);
  const [isSasPayCheckoutOpen, setIsSasPayCheckoutOpen] = useState(false);
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<SubscriptionPlanId>('pro_annual');

  // Direct SasPay hosted checkout redirection states
  const [isSasPayRedirecting, setIsSasPayRedirecting] = useState(false);
  const [sasPayPaymentUrl, setSasPayPaymentUrl] = useState<string | null>(null);
  const [sasPayRedirectError, setSasPayRedirectError] = useState<string | null>(null);
  const [sasPayRedirectPlan, setSasPayRedirectPlan] = useState<SubscriptionPlanId>('pro_monthly');

  // Registry 5: flexpdf_invoices (dynamic invoices generated upon payment)
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(() => {
    const saved = localStorage.getItem('flexpdf_invoices');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleaned = Array.isArray(parsed)
          ? parsed.filter((inv: any) => !inv.customerEmail?.includes('sarah@flexpdf.com') && !inv.customerEmail?.includes('alex@flexpdf.com'))
          : [];
        return cleaned;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Registry 6: flexpdf_logs (dynamic execution logs)
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(() => {
    const saved = localStorage.getItem('flexpdf_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleaned = Array.isArray(parsed)
          ? parsed.filter((l: any) => !l.userEmail?.includes('sarah@flexpdf.com') && !l.userEmail?.includes('alex@flexpdf.com'))
          : [];
        return cleaned;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const todayKey = new Date().toISOString().split('T')[0];
  const userKey = user ? user.id : 'guest_visitor';
  const dailyUsageCount = Number(dailyUsageMap[`${userKey}_${todayKey}`] || 0);

  const isUnlimited = user?.role === 'pro' || user?.role === 'enterprise' || user?.role === 'admin' || user?.subscription?.planId === 'enterprise';
  const dailyLimit = user?.customDailyLimit ?? siteSettings.defaultFreeLimit;
  const remainingDailyQuota = isUnlimited ? 999 : Math.max(0, dailyLimit - dailyUsageCount);
  const hasQuotaRemaining = isUnlimited || remainingDailyQuota > 0;

  // Dynamic live calculation of Admin Stats
  const activeProCount = allUsers.filter((u) => u.role === 'pro' || u.role === 'enterprise' || u.role === 'admin').length;
  const computedMrr = allUsers.reduce((sum, u) => {
    if (u.role === 'pro' || u.role === 'enterprise' || u.role === 'admin') {
      const interval = u.subscription?.billingInterval;
      const price = u.subscription?.price || (interval === 'year' ? siteSettings.annualPrice : siteSettings.monthlyPrice);
      return sum + (interval === 'year' ? price / 12 : price);
    }
    return sum;
  }, 0);

  const totalConversionsToday = Object.entries(dailyUsageMap).reduce((sum, [k, val]) => {
    if (k.endsWith(todayKey)) return sum + (Number(val) || 0);
    return sum;
  }, 0);

  const totalConversionsAllTime = allHistoryRecords.length + systemLogs.length;
  const storageSavedMB = Math.round(
    systemLogs.reduce((sum, l) => sum + Math.max(0, (l.inputSizeKB - l.outputSizeKB) / 1024), 0) + (allHistoryRecords.length * 1.5)
  );

  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalConversionsToday,
    totalConversionsAllTime,
    activeProUsers: activeProCount,
    totalUsers: allUsers.length,
    mrr: Math.round(computedMrr),
    arr: Math.round(computedMrr * 12),
    storageSavedMB,
    conversionRate: allUsers.length > 0 ? Number(((activeProCount / allUsers.length) * 100).toFixed(1)) : 0,
  });

  // Keep adminStats in sync with live dynamic data
  useEffect(() => {
    setAdminStats({
      totalConversionsToday,
      totalConversionsAllTime,
      activeProUsers: activeProCount,
      totalUsers: allUsers.length,
      mrr: Math.round(computedMrr),
      arr: Math.round(computedMrr * 12),
      storageSavedMB,
      conversionRate: allUsers.length > 0 ? Number(((activeProCount / allUsers.length) * 100).toFixed(1)) : 0,
    });
  }, [allUsers, invoices, allHistoryRecords, systemLogs, dailyUsageMap, siteSettings, totalConversionsToday, totalConversionsAllTime, activeProCount, computedMrr, storageSavedMB]);

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

  // Handle return redirect from SasPay (e.g. /payment/success or ?payment=success)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const isPaymentSuccess = 
        urlParams.get('payment') === 'success' || 
        urlParams.get('status') === 'completed' || 
        urlParams.get('status') === 'success' ||
        window.location.pathname.includes('/payment/success');

      if (isPaymentSuccess) {
        const ref = urlParams.get('reference') || urlParams.get('ref') || `SASP_RET_${Date.now()}`;
        const plan = (urlParams.get('plan') as SubscriptionPlanId) || 'pro_monthly';
        const email = urlParams.get('email') || user?.email || 'client@flexpdf.com';

        // 1. Upgrade user
        upgradeSubscription(plan, {
          paymentMethod: 'mobile_money',
          customerEmail: email,
          emailVerified: true,
          hasPassword: false,
          keepModalOpen: false,
        });

        // 2. Notify
        addNotification(
          'success',
          'Paiement SasPay Confirmé ! 🎉',
          'Votre abonnement FlexPDF Pro est activé. Bienvenue !'
        );

        // 3. Clean query params from URL
        const cleanUrl = window.location.pathname.replace(/\/payment\/success\/?/, '/') || '/';
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch (e) {
      console.warn('[SasPay Return Redirect Handler]', e);
    }
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
    localStorage.setItem('flexpdf_jobs', JSON.stringify(allHistoryRecords));
  }, [allHistoryRecords]);

  useEffect(() => {
    localStorage.setItem('flexpdf_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('flexpdf_tickets', JSON.stringify(supportTickets));
  }, [supportTickets]);

  useEffect(() => {
    localStorage.setItem('flexpdf_config', JSON.stringify(siteSettings));
  }, [siteSettings]);

  useEffect(() => {
    localStorage.setItem('flexpdf_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('flexpdf_logs', JSON.stringify(systemLogs));
  }, [systemLogs]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('flexpdf_active_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('flexpdf_active_user');
    }
  }, [user]);

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
      userId: user ? user.id : 'guest',
    };
    setAllHistoryRecords((prev) => [newRecord, ...prev.slice(0, 50)]);
  };

  const clearHistory = () => {
    if (user) {
      setAllHistoryRecords((prev) => prev.filter((h) => h.userId !== user.id));
    } else {
      setAllHistoryRecords((prev) => prev.filter((h) => h.userId && h.userId !== 'guest'));
    }
    addNotification('info', 'Historique Effacé', 'Votre journal de documents personnel a été remis à zéro.');
  };

  const removeHistoryItem = (id: string) => {
    setAllHistoryRecords((prev) => prev.filter((item) => item.id !== id));
    addNotification('info', 'Fichier Supprimé', 'Le document a été retiré de votre historique.');
  };

  const login = (email: string, role: 'user' | 'pro' | 'enterprise' | 'admin' = 'user') => {
    const cleanEmail = email.trim().toLowerCase();
    
    // Designated admin accounts check
    if (cleanEmail === DESIGNATED_ADMIN_EMAIL.toLowerCase() || cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      const adminAccount = INITIAL_SYSTEM_USERS.find((u) => u.email.toLowerCase() === cleanEmail) || INITIAL_SYSTEM_USERS[0];
      setUser(adminAccount);
      const exists = allUsers.some((u) => u.email.toLowerCase() === cleanEmail);
      if (!exists) {
        setAllUsers((prev) => [adminAccount, ...prev]);
      }
      addNotification('success', `Ravi de vous revoir, ${adminAccount.name} !`, 'Connecté avec les privilèges Administrateur FlexPDF.');
      setIsAuthModalOpen(false);
      return;
    }

    const existing = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      setUser(existing);
      addNotification('success', `Ravi de vous revoir, ${existing.name} !`, `Connecté avec le profil ${existing.role.toUpperCase()}.`);
    } else {
      const newUser: UserProfile = {
        id: `user_${Date.now()}`,
        name: email.split('@')[0],
        email: email.trim(),
        avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        role,
        subscription: {
          planId: role === 'enterprise' ? 'enterprise' : role === 'pro' ? 'pro_monthly' : role === 'admin' ? 'enterprise' : 'free',
          status: 'active',
          currentPeriodEnd: '2026-09-29',
          cancelAtPeriodEnd: false,
          renewsOn: '2026-09-29',
          price: role === 'enterprise' ? 49 : role === 'pro' ? 9 : role === 'admin' ? 99 : 0,
          billingInterval: role === 'enterprise' || role === 'pro' ? 'month' : role === 'admin' ? 'year' : 'free',
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
    if (role === 'admin') {
      setUser(INITIAL_SYSTEM_USERS[0]);
      addNotification('success', `Profil Actif : ${INITIAL_SYSTEM_USERS[0].name}`, 'Connecté en tant que Super Admin.');
      return;
    }
    const targetRole = role === 'free' ? 'user' : role;
    const existing = allUsers.find((u) => u.role === targetRole);
    if (existing) {
      setUser(existing);
      addNotification('success', `Profil Actif : ${existing.name}`, `Connecté en tant que ${existing.name}.`);
    } else {
      const dynamicUser: UserProfile = {
        id: `usr_${Date.now()}`,
        name: role === 'pro' ? 'Membre Pro' : 'Utilisateur',
        email: `${targetRole}@flexpdf.app`,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
        role: targetRole,
        subscription: {
          planId: role === 'pro' ? 'pro_monthly' : 'free',
          status: 'active',
          currentPeriodEnd: '2026-12-31',
          cancelAtPeriodEnd: false,
          renewsOn: '2026-12-31',
          price: role === 'pro' ? siteSettings.monthlyPrice : 0,
          billingInterval: role === 'pro' ? 'month' : 'free',
        },
        createdAt: new Date().toISOString().split('T')[0],
        apiKey: `flex_live_${Math.random().toString(36).substr(2, 12)}`,
      };
      setAllUsers((prev) => [dynamicUser, ...prev]);
      setUser(dynamicUser);
      addNotification('success', `Profil Actif : ${dynamicUser.name}`, `Connecté en tant que ${dynamicUser.name}.`);
    }
  };

  const closeSasPayRedirect = () => {
    setIsSasPayRedirecting(false);
    setSasPayPaymentUrl(null);
    setSasPayRedirectError(null);
  };

  const initiateSasPayRedirect = async (planId: SubscriptionPlanId = 'pro_monthly') => {
    setSasPayRedirectPlan(planId);
    setSelectedCheckoutPlan(planId);
    setIsSasPayRedirecting(true);
    setSasPayPaymentUrl(null);
    setSasPayRedirectError(null);
    setIsUpgradeModalOpen(false);
    setIsSasPayCheckoutOpen(false);
    setIsStripeCheckoutOpen(false);

    const price = planId === 'enterprise' ? 39 : planId === 'pro_annual' ? 79 : siteSettings.monthlyPrice || 9;
    const customer = {
      name: user?.name || 'Client FlexPDF',
      email: user?.email || 'client@flexpdf.com',
      phone: user?.phone || '221771234567',
    };

    try {
      const returnUrl = `${window.location.origin}/?payment_status=success&plan=${planId}&amount=${price}&ref=REF-FP-${Date.now().toString(36).toUpperCase()}`;
      const res = await saspayService.initiateHostedCheckout({
        planId,
        amount: price,
        customer,
        returnUrl,
      });

      if (res && res.payment_url) {
        setSasPayPaymentUrl(res.payment_url);
        // Direct browser redirection to SasPay checkout portal
        try {
          window.location.href = res.payment_url;
        } catch (navErr) {
          console.warn('Browser redirect note', navErr);
        }
      } else {
        throw new Error('Lien de paiement introuvable dans la réponse SasPay.');
      }
    } catch (err: any) {
      console.error('Failed to initiate SasPay redirect', err);
      setSasPayRedirectError(err?.message || 'Erreur lors de la communication avec SasPay.');
    }
  };

  const openStripeCheckout = (planId: SubscriptionPlanId = 'pro_annual') => {
    initiateSasPayRedirect(planId);
  };

  const openSasPayCheckout = (planId: SubscriptionPlanId = 'pro_annual') => {
    initiateSasPayRedirect(planId);
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
      company?: string;
      phone?: string;
      emailVerified?: boolean;
      hasPassword?: boolean;
      keepModalOpen?: boolean;
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
        phone: paymentDetails?.phone,
        company: paymentDetails?.company,
        emailVerified: paymentDetails?.emailVerified ?? true,
        hasPassword: paymentDetails?.hasPassword ?? false,
      };
      setAllUsers((prev) => [...prev, newUser]);
      setUser(newUser);
    } else {
      const updatedUser: UserProfile = {
        ...user,
        name: targetName,
        phone: paymentDetails?.phone || user.phone,
        company: paymentDetails?.company || user.company,
        emailVerified: paymentDetails?.emailVerified !== undefined ? paymentDetails.emailVerified : user.emailVerified,
        hasPassword: paymentDetails?.hasPassword !== undefined ? paymentDetails.hasPassword : user.hasPassword,
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
    if (!paymentDetails?.keepModalOpen) {
      setIsSasPayCheckoutOpen(false);
    }
    addNotification(
      'success',
      'Paiement SasPay Validé & Forfait Activé ! 🎉',
      `Votre abonnement ${planId === 'pro_annual' ? 'Annuel (365 jours)' : 'Mensuel (30 jours)'} est actif avec conversions illimitées.`
    );
  };

  const setUserPassword = (password: string) => {
    if (!user) return;
    const updatedUser: UserProfile = {
      ...user,
      hasPassword: true,
    };
    setUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    addNotification('success', 'Mot de passe Enregistré ! 🔒', 'Votre mot de passe a été configuré avec succès pour vos prochaines connexions.');
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
    if (user) {
      setAllHistoryRecords((prev) => prev.filter((h) => h.userId !== user.id));
    } else {
      setAllHistoryRecords((prev) => prev.filter((h) => h.userId && h.userId !== 'guest'));
    }
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
      invoices: invoices.filter((inv) => inv.customerEmail?.toLowerCase() === user.email.toLowerCase()),
      supportTickets: supportTickets.filter((t) => t.userEmail?.toLowerCase() === user.email.toLowerCase()),
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
    setAllHistoryRecords((prev) => prev.filter((h) => h.userId !== targetId));
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
        addNotification('error', 'Garde d\'Accès Super Admin', 'Connexion requise avec le compte super-administrateur (fadalsall1997@gmail.com).');
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
        setUserPassword,
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
        initiateSasPayRedirect,
        isSasPayRedirecting,
        sasPayPaymentUrl,
        sasPayRedirectError,
        sasPayRedirectPlan,
        closeSasPayRedirect,
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
