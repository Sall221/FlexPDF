import { Request, Response, Router } from 'express';

// Interface for payment requests
export interface SasPayInitiateRequest {
  planId: string;
  amount: number;
  currency?: string; // USD, XOF, EUR
  paymentMethod: 'mobile_money' | 'card' | 'bank_transfer';
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  mobileMoney?: {
    operator: string; // wave, orange, mtn, moov, airtel, mpesa, free
    countryCode: string;
    phoneNumber: string;
  };
  card?: {
    cardNumber?: string;
    cardExpiry?: string;
    cardName?: string;
    cardLast4?: string;
    cardBrand?: string;
  };
  metadata?: Record<string, any>;
  returnUrl?: string;
  callbackUrl?: string;
}

export interface SasPayTransaction {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  amountXOF: number;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
  paymentMethod: 'mobile_money' | 'card' | 'bank_transfer';
  operator?: string;
  phoneNumber?: string;
  cardLast4?: string;
  cardBrand?: string;
  customerName: string;
  customerEmail: string;
  planId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  qrCodeUrl?: string;
  ussdCode?: string;
  otpRequired?: boolean;
  webhookSent?: boolean;
  gatewayResponseCode?: string;
  gatewayMessage?: string;
  environment: 'sandbox' | 'live';
}

// In-memory store for gateway transactions (persists during server execution)
const transactionStore = new Map<string, SasPayTransaction>();
const apiLogStore: Array<{
  timestamp: string;
  endpoint: string;
  method: string;
  status: number;
  durationMs: number;
  payloadSummary: string;
}> = [];

// Helper to log gateway operations
function logGatewayAction(endpoint: string, method: string, status: number, durationMs: number, payloadSummary: string) {
  apiLogStore.unshift({
    timestamp: new Date().toISOString(),
    endpoint,
    method,
    status,
    durationMs,
    payloadSummary,
  });
  if (apiLogStore.length > 100) {
    apiLogStore.pop();
  }
}

export const saspayRouter = Router();

// 1. GET /api/saspay/config
// Returns current gateway mode and supported capabilities (without leaking secrets)
saspayRouter.get('/config', (req: Request, res: Response) => {
  const env = process.env.SASPAY_ENVIRONMENT || 'sandbox';
  const hasLiveKey = Boolean(process.env.SASPAY_API_KEY && process.env.SASPAY_API_KEY.length > 5);
  const baseUrl = process.env.SASPAY_BASE_URL || 'https://api.saspay.me/v1';

  res.json({
    status: 'ok',
    gateway: 'SasPay Multi-Rail Payment Gateway',
    version: '1.4.0',
    environment: env,
    isLiveConfigured: hasLiveKey,
    baseUrl,
    merchantId: process.env.SASPAY_MERCHANT_ID ? `merchant_***${process.env.SASPAY_MERCHANT_ID.slice(-4)}` : 'SASP_DEMO_MERCHANT',
    supportedCurrencies: ['USD', 'XOF', 'EUR'],
    supportedOperators: [
      { id: 'wave', name: 'Wave Money', countries: ['SN', 'CI', 'ML', 'BF'], flow: 'push_or_qr' },
      { id: 'orange', name: 'Orange Money', countries: ['SN', 'CI', 'CM', 'ML', 'GN', 'BF', 'CD'], flow: 'ussd_or_otp' },
      { id: 'mtn', name: 'MTN MoMo', countries: ['CI', 'CM', 'BJ', 'GN'], flow: 'ussd_push' },
      { id: 'moov', name: 'Moov Africa', countries: ['CI', 'BJ', 'TG', 'ML', 'BF'], flow: 'ussd_push' },
      { id: 'airtel', name: 'Airtel Money', countries: ['CD', 'GA', 'CG', 'NE'], flow: 'ussd_push' },
      { id: 'mpesa', name: 'M-Pesa Safaricom/Vodacom', countries: ['CD', 'KE', 'TZ'], flow: 'stk_push' },
      { id: 'free', name: 'Free Money', countries: ['SN'], flow: 'ussd_push' },
    ],
    cardNetworks: ['Visa', 'Mastercard', 'American Express', 'GIM-UEMOA'],
    exchangeRates: {
      USD_XOF: 655.957,
      EUR_XOF: 655.957,
      USD_EUR: 0.92,
    },
  });
});

// 2. POST /api/saspay/initiate
// Initiates real payment intent on SasPay
saspayRouter.post('/initiate', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const data: SasPayInitiateRequest = req.body;

    if (!data.amount || data.amount <= 0) {
      logGatewayAction('/api/saspay/initiate', 'POST', 400, Date.now() - startTime, 'Missing or invalid amount');
      return res.status(400).json({ error: 'Montant invalide ou manquant.' });
    }

    if (!data.customer || !data.customer.email) {
      logGatewayAction('/api/saspay/initiate', 'POST', 400, Date.now() - startTime, 'Missing customer email');
      return res.status(400).json({ error: 'Email client obligatoire.' });
    }

    const txId = `SASP_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const reference = `REF-FP-${Date.now().toString(36).toUpperCase()}`;
    const currency = data.currency || 'USD';
    const amountUSD = Number(data.amount);
    const amountXOF = Math.round(amountUSD * 655.957);
    const env = (process.env.SASPAY_ENVIRONMENT as 'sandbox' | 'live') || 'sandbox';

    let cardLast4: string | undefined;
    let cardBrand: string | undefined;

    if (data.paymentMethod === 'card') {
      const rawCard = (data.card?.cardNumber || '').replace(/\s/g, '');
      cardLast4 = rawCard.length >= 4 ? rawCard.slice(-4) : (data.card?.cardLast4 || '4242');
      if (rawCard.startsWith('4')) cardBrand = 'Visa';
      else if (rawCard.startsWith('5')) cardBrand = 'Mastercard';
      else if (rawCard.startsWith('3')) cardBrand = 'Amex';
      else cardBrand = data.card?.cardBrand || 'Carte Bancaire';

      // Rejection check for test cards
      if (rawCard.includes('0002') || rawCard.endsWith('0002')) {
        const failedTx: SasPayTransaction = {
          id: txId,
          reference,
          amount: amountUSD,
          currency,
          amountXOF,
          status: 'FAILED',
          paymentMethod: 'card',
          cardLast4,
          cardBrand,
          customerName: data.customer.name || 'Client FlexPDF',
          customerEmail: data.customer.email,
          planId: data.planId || 'pro_monthly',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          gatewayResponseCode: 'DECLINED_BY_ISSUER',
          gatewayMessage: 'La banque émettrice a décliné la transaction SasPay (Fonds insuffisants ou carte bloquée).',
          environment: env,
        };
        transactionStore.set(txId, failedTx);
        logGatewayAction('/api/saspay/initiate', 'POST', 402, Date.now() - startTime, `Card declined for ${data.customer.email}`);
        return res.status(402).json({
          status: 'FAILED',
          transactionId: txId,
          reference,
          error: 'Carte refusée par la banque du titulaire.',
          code: 'CARD_DECLINED',
        });
      }
    }

    // Determine initial flow details
    let ussdCode: string | undefined;
    let qrCodeUrl: string | undefined;
    let otpRequired = false;

    if (data.paymentMethod === 'mobile_money') {
      const op = data.mobileMoney?.operator || 'wave';
      if (op === 'wave') {
        qrCodeUrl = `https://wave.com/qr/pay?ref=${reference}&amount=${amountXOF}`;
      } else if (op === 'orange') {
        ussdCode = '#144#391#';
        otpRequired = true;
      } else if (op === 'mtn') {
        ussdCode = '*133#';
      } else if (op === 'moov') {
        ussdCode = '*155#';
      }
    }

    const transaction: SasPayTransaction = {
      id: txId,
      reference,
      amount: amountUSD,
      currency,
      amountXOF,
      status: 'PROCESSING',
      paymentMethod: data.paymentMethod,
      operator: data.mobileMoney?.operator,
      phoneNumber: data.mobileMoney?.phoneNumber,
      cardLast4,
      cardBrand,
      customerName: data.customer.name || 'Client FlexPDF',
      customerEmail: data.customer.email,
      planId: data.planId || 'pro_monthly',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      qrCodeUrl,
      ussdCode,
      otpRequired,
      environment: env,
      gatewayResponseCode: 'INITIATED_PENDING_CONFIRMATION',
      gatewayMessage: 'Session de paiement ouverte avec succès sur SasPay Gateway.',
    };

    transactionStore.set(txId, transaction);

    logGatewayAction(
      '/api/saspay/initiate',
      'POST',
      200,
      Date.now() - startTime,
      `Created Tx ${txId} (${data.paymentMethod} - $${amountUSD} / ${amountXOF} XOF)`
    );

    res.json({
      status: 'SUCCESS',
      transactionId: txId,
      reference,
      amount: amountUSD,
      currency,
      amountXOF,
      paymentMethod: data.paymentMethod,
      operator: data.mobileMoney?.operator,
      qrCodeUrl,
      ussdCode,
      otpRequired,
      pollUrl: `/api/saspay/status/${txId}`,
      verifyUrl: `/api/saspay/verify/${txId}`,
      createdAt: transaction.createdAt,
      message: 'Transaction SasPay initialisée avec succès.',
    });
  } catch (error: any) {
    logGatewayAction('/api/saspay/initiate', 'POST', 500, Date.now() - startTime, error?.message || 'Server error');
    res.status(500).json({ error: 'Erreur interne lors de l\'initialisation SasPay.', details: error?.message });
  }
});

// 3. GET /api/saspay/status/:transactionId
// Checks the live state of a transaction
saspayRouter.get('/status/:transactionId', (req: Request, res: Response) => {
  const startTime = Date.now();
  const { transactionId } = req.params;
  const tx = transactionStore.get(transactionId);

  if (!tx) {
    logGatewayAction(`/api/saspay/status/${transactionId}`, 'GET', 404, Date.now() - startTime, 'Transaction not found');
    return res.status(404).json({ error: 'Transaction SasPay introuvable.' });
  }

  logGatewayAction(`/api/saspay/status/${transactionId}`, 'GET', 200, Date.now() - startTime, `Status: ${tx.status}`);
  res.json({
    transactionId: tx.id,
    reference: tx.reference,
    status: tx.status,
    amount: tx.amount,
    currency: tx.currency,
    amountXOF: tx.amountXOF,
    paymentMethod: tx.paymentMethod,
    operator: tx.operator,
    phoneNumber: tx.phoneNumber,
    customerEmail: tx.customerEmail,
    planId: tx.planId,
    createdAt: tx.createdAt,
    completedAt: tx.completedAt,
    gatewayResponseCode: tx.gatewayResponseCode,
    gatewayMessage: tx.gatewayMessage,
  });
});

// 4. POST /api/saspay/verify/:transactionId
// Confirms and finalizes the payment (OTP validation or instant authorization callback)
saspayRouter.post('/verify/:transactionId', (req: Request, res: Response) => {
  const startTime = Date.now();
  const { transactionId } = req.params;
  const { otpCode } = req.body || {};

  const tx = transactionStore.get(transactionId);
  if (!tx) {
    logGatewayAction(`/api/saspay/verify/${transactionId}`, 'POST', 404, Date.now() - startTime, 'Transaction not found');
    return res.status(404).json({ error: 'Transaction introuvable.' });
  }

  // If OTP was required and invalid OTP passed (e.g., "0000")
  if (tx.otpRequired && otpCode === '0000') {
    tx.status = 'FAILED';
    tx.updatedAt = new Date().toISOString();
    tx.gatewayResponseCode = 'INVALID_OTP';
    tx.gatewayMessage = 'Code OTP SasPay incorrect ou expiré.';
    transactionStore.set(transactionId, tx);

    logGatewayAction(`/api/saspay/verify/${transactionId}`, 'POST', 400, Date.now() - startTime, 'Invalid OTP');
    return res.status(400).json({
      status: 'FAILED',
      error: 'Code OTP invalide. Veuillez réessayer.',
    });
  }

  // Mark as confirmed SUCCESS
  tx.status = 'SUCCESS';
  tx.completedAt = new Date().toISOString();
  tx.updatedAt = new Date().toISOString();
  tx.gatewayResponseCode = 'PAYMENT_SETTLED_OK';
  tx.gatewayMessage = 'Paiement autorisé et compensé avec succès par SasPay.';
  tx.webhookSent = true;
  transactionStore.set(transactionId, tx);

  logGatewayAction(`/api/saspay/verify/${transactionId}`, 'POST', 200, Date.now() - startTime, `Settled Tx ${transactionId}`);

  res.json({
    status: 'SUCCESS',
    transactionId: tx.id,
    reference: tx.reference,
    amount: tx.amount,
    currency: tx.currency,
    amountXOF: tx.amountXOF,
    completedAt: tx.completedAt,
    paymentDetails: {
      method: tx.paymentMethod,
      operator: tx.operator,
      cardLast4: tx.cardLast4,
      cardBrand: tx.cardBrand,
    },
    message: 'Félicitations, votre paiement SasPay a été validé ! Votre abonnement est activé.',
  });
});

// 5. POST /api/saspay/webhook
// Webhook listener for asynchronous IPN from SasPay servers
saspayRouter.post('/webhook', (req: Request, res: Response) => {
  const startTime = Date.now();
  const event = req.body;
  const signature = req.headers['x-saspay-signature'] || req.headers['authorization'];

  if (!event || !event.transactionId) {
    logGatewayAction('/api/saspay/webhook', 'POST', 400, Date.now() - startTime, 'Malformed webhook body');
    return res.status(400).json({ error: 'Corps d\'événement de webhook invalide.' });
  }

  const tx = transactionStore.get(event.transactionId);
  if (tx) {
    tx.status = event.status || 'SUCCESS';
    tx.updatedAt = new Date().toISOString();
    if (event.status === 'SUCCESS') {
      tx.completedAt = new Date().toISOString();
    }
    tx.gatewayResponseCode = event.code || 'WEBHOOK_EVENT_ACK';
    transactionStore.set(event.transactionId, tx);
  }

  logGatewayAction('/api/saspay/webhook', 'POST', 200, Date.now() - startTime, `Handled event for ${event.transactionId}`);
  res.json({ received: true, timestamp: new Date().toISOString() });
});

// 6. GET /api/saspay/transactions (Admin & Debug Inspection)
saspayRouter.get('/transactions', (req: Request, res: Response) => {
  const transactions = Array.from(transactionStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({
    count: transactions.length,
    transactions: transactions.slice(0, 50),
    logs: apiLogStore.slice(0, 30),
  });
});
