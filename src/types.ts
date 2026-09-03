export type ToolCategory = 'all' | 'pdf-core' | 'convert-from-pdf' | 'convert-to-pdf' | 'image-tools' | 'security-edit';

export interface ToolDefinition {
  id: string;
  name: string;
  shortDesc: string;
  longDesc: string;
  category: ToolCategory;
  icon: string;
  color: string;
  badge?: string;
  accept: string;
  maxFiles: number;
  featured?: boolean;
  popular?: boolean;
}

export type SubscriptionPlanId = 'free' | 'pro_monthly' | 'pro_annual' | 'enterprise';

export type MobileMoneyOperator = 'orange' | 'mtn' | 'wave' | 'moov' | 'airtel' | 'mpesa';

export interface UserSubscription {
  planId: SubscriptionPlanId;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'expired';
  startDate?: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  renewsOn: string;
  price: number;
  billingInterval: 'month' | 'year' | 'free';
  paymentMethod?: 'card' | 'mobile_money' | 'paypal' | 'apple_pay' | 'google_pay' | 'sepa';
  cardLast4?: string;
  cardBrand?: string;
  mobileMoneyPhone?: string;
  mobileMoneyOperator?: MobileMoneyOperator;
  transactionId?: string;
  maxFileSizeMB?: number;
  batchLimit?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'pro' | 'enterprise' | 'admin';
  subscription: UserSubscription;
  createdAt: string;
  apiKey?: string;
  customDailyLimit?: number;
  lastLogin?: string;
  failedLoginAttempts?: number;
  isLocked?: boolean;
  phone?: string;
  company?: string;
  emailVerified?: boolean;
  hasPassword?: boolean;
}

export interface DailyUsage {
  date: string;
  count: number;
  maxDaily: number;
}

export interface ProcessedFileRecord {
  id: string;
  toolId: string;
  toolName: string;
  originalFileName: string;
  originalSize: number;
  resultFileName: string;
  resultSize: number;
  timestamp: string;
  downloadUrl?: string;
  savingsPercentage?: number;
  userId?: string;
}

export interface InvoiceRecord {
  id: string;
  number: string;
  date: string;
  amount: number;
  subtotal?: number;
  taxAmount?: number;
  status: 'paid' | 'pending' | 'refunded';
  planName: string;
  downloadUrl: string;
  paymentMethod?: string;
  cardLast4?: string;
  transactionId?: string;
  customerName?: string;
  customerEmail?: string;
}

export type Invoice = InvoiceRecord;

export interface AdminStats {
  totalConversionsToday: number;
  totalConversionsAllTime: number;
  activeProUsers: number;
  totalUsers: number;
  mrr: number;
  arr: number;
  storageSavedMB: number;
  conversionRate: number;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  toolId: string;
  status: 'success' | 'failed';
  executionTimeMs: number;
  inputSizeKB: number;
  outputSizeKB: number;
}

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

export type ActiveView = 'home' | 'all-tools' | 'tool' | 'dashboard' | 'admin' | 'pricing' | 'contact' | 'legal' | 'auth' | 'forgot-password' | 'maintenance' | 'not-found';

export interface SupportTicket {
  id: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  category: 'technical' | 'billing' | 'feature' | 'other';
  createdAt: string;
  adminReply?: string;
}

export interface SiteSettings {
  siteName: string;
  contactEmail: string;
  defaultFreeLimit: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  disabledTools: string[];
  monthlyPrice: number;
  annualPrice: number;
}
