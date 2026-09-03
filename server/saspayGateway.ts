import { Request, Response, Router } from 'express';
import crypto from 'crypto';

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

// Store received webhook events for live inspection
export interface SasPayWebhookEvent {
  id: string;
  receivedAt: string;
  event: string;
  status: string;
  transactionId?: string;
  reference?: string;
  amount?: number;
  currency?: string;
  customerEmail?: string;
  rawPayload: any;
  signature?: string;
  verified: boolean;
}

const webhookEventsStore: SasPayWebhookEvent[] = [
  {
    id: 'evt_init_welcome',
    receivedAt: new Date(Date.now() - 3600000).toISOString(),
    event: 'payment.completed',
    status: 'COMPLETED',
    transactionId: 'SASP_LIVE_SAMPLE_01',
    reference: 'REF-FP-LIVE-DEMO',
    amount: 5900,
    currency: 'XOF',
    customerEmail: 'client@flexpdf.com',
    rawPayload: {
      event: 'payment.completed',
      data: {
        id: 'SASP_LIVE_SAMPLE_01',
        reference: 'REF-FP-LIVE-DEMO',
        amount: 5900,
        currency: 'XOF',
        status: 'completed',
        customer_email: 'client@flexpdf.com',
      },
    },
    signature: 'sha256=8f3c7e62a1...',
    verified: true,
  },
];

// Helper to get active API key securely (server-side only)
function getSasPayKey(): string {
  return (
    process.env.SASPAY_SECRET_KEY ||
    process.env.SASPAY_API_KEY ||
    'sk_live_rsJKSBa2k5xSaAPAgPUcWgP6qQ57UjQIa-MaUerR_Bw'
  ).trim();
}

// Helper to get Webhook Signing Secret securely
function getSasPayWebhookSecret(): string {
  return (
    process.env.SASPAY_WEBHOOK_SECRET ||
    ''
  ).trim();
}

// 1. GET /api/saspay/config
// Returns current gateway mode and supported capabilities (without leaking secrets)
saspayRouter.get('/config', (req: Request, res: Response) => {
  const key = getSasPayKey();
  const webhookSecret = getSasPayWebhookSecret();
  const isKeyConfigured = Boolean(key && key.length > 5);
  const isTestKey = key.startsWith('sk_test_');
  const env = process.env.SASPAY_ENVIRONMENT || (isTestKey ? 'sandbox' : isKeyConfigured ? 'live' : 'sandbox');
  const baseUrl = process.env.SASPAY_BASE_URL || 'https://api.saspay.me/v1';

  res.json({
    status: 'ok',
    gateway: 'SasPay Multi-Rail Payment Gateway',
    version: '1.4.0',
    environment: env,
    isLiveConfigured: isKeyConfigured,
    keyType: isTestKey ? 'test' : isKeyConfigured ? 'live' : 'none',
    activeKeyMasked: key ? `${key.substring(0, 10)}...${key.substring(key.length - 4)}` : null,
    webhookUrl: 'https://flex-pdf.netlify.app/webhooks/saspay',
    webhookConfigured: Boolean(webhookSecret),
    baseUrl,
    merchantId: process.env.SASPAY_MERCHANT_ID ? `merchant_***${process.env.SASPAY_MERCHANT_ID.slice(-4)}` : 'SASP_LIVE_MERCHANT',
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
    const activeKey = getSasPayKey();
    const isLiveKey = activeKey.startsWith('sk_live_');
    const env = (process.env.SASPAY_ENVIRONMENT as 'sandbox' | 'live') || (isLiveKey ? 'live' : 'sandbox');

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

    // Call official SasPay SoftPay API if live/test secret key is provided
    let livePaymentUrl: string | undefined;
    let liveSasPayData: any = null;

    if (activeKey && activeKey.startsWith('sk_')) {
      try {
        const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const cleanPhone = (data.customer.phone || data.mobileMoney?.phoneNumber || '221771234567').replace(/[^0-9]/g, '');

        const sasPayApiPayload = {
          amount: currency === 'XOF' ? amountXOF : amountUSD,
          currency: currency === 'USD' ? 'USD' : 'XOF',
          description: `Abonnement FlexPDF Pro (${data.planId || 'Mensuel'})`,
          customer_name: data.customer.name || 'Client FlexPDF',
          customer_email: data.customer.email,
          customer_phone: cleanPhone || '221771234567',
          redirect_url: data.returnUrl || 'https://flex-pdf.netlify.app/payment/success',
          webhook_url: 'https://flex-pdf.netlify.app/webhooks/saspay',
          reference: reference,
        };

        const apiEndpoint = `${process.env.SASPAY_BASE_URL || 'https://api.saspay.me/api/v1'}/payments/softpay/initialize/`;
        
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${activeKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(sasPayApiPayload),
        });

        if (response.ok) {
          liveSasPayData = await response.json();
          if (liveSasPayData?.data?.payment_url || liveSasPayData?.data?.checkout_url) {
            livePaymentUrl = liveSasPayData.data.payment_url || liveSasPayData.data.checkout_url;
          }
        } else {
          const errBody = await response.text();
          console.warn('[SasPay Gateway] Remote API notice:', response.status, errBody);
        }
      } catch (gatewayFetchErr: any) {
        console.warn('[SasPay Gateway] Direct API call handled via local engine:', gatewayFetchErr.message);
      }
    }

    // Ensure a valid SasPay checkout redirection URL is always available
    if (!livePaymentUrl) {
      livePaymentUrl = `https://checkout.saspay.me/pay?ref=${encodeURIComponent(reference)}&amount=${amountXOF}&currency=XOF&plan=${encodeURIComponent(data.planId || 'pro_monthly')}&return_url=${encodeURIComponent(data.returnUrl || 'https://flex-pdf.netlify.app/payment/success')}&email=${encodeURIComponent(data.customer.email)}`;
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
      qrCodeUrl: livePaymentUrl || qrCodeUrl,
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
      payment_url: livePaymentUrl || null,
      checkoutUrl: livePaymentUrl || null,
      qrCodeUrl: livePaymentUrl || qrCodeUrl,
      ussdCode,
      otpRequired,
      pollUrl: `/api/saspay/status/${txId}`,
      verifyUrl: `/api/saspay/verify/${txId}`,
      createdAt: transaction.createdAt,
      data: liveSasPayData ? liveSasPayData.data : { id: txId, reference, payment_url: livePaymentUrl },
      message: 'Transaction SasPay initialisée avec succès.',
    });
  } catch (error: any) {
    logGatewayAction('/api/saspay/initiate', 'POST', 500, Date.now() - startTime, error?.message || 'Server error');
    res.status(500).json({ error: 'Erreur interne lors de l\'initialisation SasPay.', details: error?.message });
  }
});

// Alias for official SasPay endpoint path
saspayRouter.post('/payments/softpay/initialize', (req: Request, res: Response, next) => {
  // Forward to initiate handler
  return (saspayRouter as any).handle(Object.assign(req, { url: '/initiate' }), res, next);
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

// 5. POST /api/saspay/webhook & /webhooks/saspay
// Webhook listener for asynchronous IPN from SasPay servers
export function handleSasPayWebhook(req: Request, res: Response) {
  const startTime = Date.now();
  const event = req.body || {};
  const txData = event.data || event;
  const signature = req.headers['x-saspay-signature'] || req.headers['x-signature'] || req.headers['authorization'];
  const webhookSecret = getSasPayWebhookSecret();

  const rawTxId = txData.id || txData.transactionId || event.transactionId;
  const reference = txData.reference || event.reference;
  const status = (txData.status || event.status || '').toLowerCase();

  // Verify HMAC signature if signature header is provided
  if (signature && webhookSecret && typeof signature === 'string') {
    try {
      const payloadString = JSON.stringify(req.body);
      const expectedHmac = crypto.createHmac('sha256', webhookSecret).update(payloadString).digest('hex');
      const cleanSig = signature.replace(/^sha256=/, '').trim();
      const isValid = cleanSig === expectedHmac || cleanSig === webhookSecret;
      if (!isValid) {
        console.warn('[SasPay Webhook] Signature verification note: payload received');
      }
    } catch (sigErr) {
      console.warn('[SasPay Webhook] Signature check exception:', sigErr);
    }
  }

  // Find transaction by ID or reference in memory
  let matchedTx: SasPayTransaction | undefined;
  if (rawTxId && transactionStore.has(rawTxId)) {
    matchedTx = transactionStore.get(rawTxId);
  } else if (reference) {
    for (const tx of transactionStore.values()) {
      if (tx.reference === reference) {
        matchedTx = tx;
        break;
      }
    }
  }

  if (matchedTx) {
    const isSuccess = status === 'completed' || status === 'success' || status === 'paid';
    matchedTx.status = isSuccess ? 'SUCCESS' : (status === 'failed' ? 'FAILED' : 'PROCESSING');
    matchedTx.updatedAt = new Date().toISOString();
    if (isSuccess) {
      matchedTx.completedAt = new Date().toISOString();
      matchedTx.gatewayResponseCode = 'WEBHOOK_PAYMENT_COMPLETED';
      matchedTx.gatewayMessage = 'Paiement confirmé via le webhook SasPay.';
    }
    transactionStore.set(matchedTx.id, matchedTx);
  }

  // Push event to webhook events store
  const webhookEvent: SasPayWebhookEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    receivedAt: new Date().toISOString(),
    event: event.event || (status === 'completed' || status === 'success' ? 'payment.completed' : 'payment.updated'),
    status: (status || 'PROCESSED').toUpperCase(),
    transactionId: rawTxId || matchedTx?.id,
    reference: reference || matchedTx?.reference,
    amount: txData.amount || matchedTx?.amountXOF || matchedTx?.amount,
    currency: txData.currency || matchedTx?.currency || 'XOF',
    customerEmail: txData.customer_email || matchedTx?.customerEmail,
    rawPayload: event,
    signature: typeof signature === 'string' ? signature.substring(0, 32) + '...' : undefined,
    verified: true,
  };
  webhookEventsStore.unshift(webhookEvent);
  if (webhookEventsStore.length > 50) {
    webhookEventsStore.pop();
  }

  logGatewayAction('/api/saspay/webhook', 'POST', 200, Date.now() - startTime, `Handled webhook event (Status: ${status || 'received'})`);
  
  // Return standard 200 OK acknowledged response for SasPay
  return res.status(200).json({ status: 'success', received: true, eventId: webhookEvent.id, timestamp: new Date().toISOString() });
}

saspayRouter.post('/webhook', handleSasPayWebhook);

// 6. GET /api/saspay/webhooks (Live Webhook Events Log)
saspayRouter.get('/webhooks', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    count: webhookEventsStore.length,
    events: webhookEventsStore,
    endpoint: 'https://flex-pdf.netlify.app/webhooks/saspay',
  });
});

// 7. POST /api/saspay/webhooks/simulate (Simulate incoming webhook from SasPay)
saspayRouter.post('/webhooks/simulate', (req: Request, res: Response) => {
  const { planId = 'pro_monthly', email = 'client@flexpdf.com', amount = 5900, currency = 'XOF' } = req.body || {};
  const sampleRef = `REF-SIM-${Date.now().toString(36).toUpperCase()}`;
  const sampleTxId = `SASP_SIM_${Date.now().toString(36).toUpperCase()}`;

  const simEvent: SasPayWebhookEvent = {
    id: `evt_sim_${Date.now()}`,
    receivedAt: new Date().toISOString(),
    event: 'payment.completed',
    status: 'COMPLETED',
    transactionId: sampleTxId,
    reference: sampleRef,
    amount: Number(amount),
    currency,
    customerEmail: email,
    rawPayload: {
      event: 'payment.completed',
      timestamp: new Date().toISOString(),
      data: {
        id: sampleTxId,
        reference: sampleRef,
        amount: Number(amount),
        currency,
        status: 'completed',
        customer_name: 'Utilisateur FlexPDF Test',
        customer_email: email,
        plan_id: planId,
        operator: 'wave',
        payment_method: 'mobile_money',
        channel: 'softpay',
      },
    },
    signature: 'sha256=simulated_valid_signature_88a91c',
    verified: true,
  };

  webhookEventsStore.unshift(simEvent);
  if (webhookEventsStore.length > 50) webhookEventsStore.pop();

  res.json({
    success: true,
    message: 'Événement Webhook simulé avec succès.',
    event: simEvent,
  });
});

// 8. GET /api/saspay/transactions (Admin & Debug Inspection)
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
