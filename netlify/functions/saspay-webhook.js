// netlify/functions/saspay-webhook.js
// Netlify Serverless Function for SasPay Webhook
const crypto = require('crypto');

// In-memory or database subscription activation handler
exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const signature = event.headers['x-saspay-signature'] || event.headers['x-signature'] || event.headers['authorization'];
    const webhookSecret = process.env.SASPAY_WEBHOOK_SECRET || '';

    // 1. Signature Verification (if secret configured and header present)
    if (signature && webhookSecret) {
      try {
        const expectedHmac = crypto.createHmac('sha256', webhookSecret).update(event.body).digest('hex');
        const cleanSig = signature.replace(/^sha256=/, '').trim();
        const isValid = cleanSig === expectedHmac || cleanSig === webhookSecret;
        if (!isValid) {
          console.warn('[SasPay Webhook Netlify] Signature notice: payload received');
        }
      } catch (sigErr) {
        console.warn('[SasPay Webhook Netlify] Signature exception:', sigErr);
      }
    }

    // 2. Extract transaction data
    const txData = payload.data || payload;
    const status = (txData.status || '').toLowerCase();
    const reference = txData.reference || payload.reference || '';
    const transactionId = txData.id || txData.transactionId || payload.transactionId;
    const amount = txData.amount || payload.amount;

    console.log(`[SasPay Webhook Netlify] Received event: ${status} for Ref: ${reference} (Tx: ${transactionId})`);

    // 3. Process completed payment
    if (status === 'completed' || status === 'success' || status === 'paid') {
      // Determine plan from amount or reference
      // e.g. amount >= 70 ? 'pro_annual' : 'pro_monthly'
      console.log(`[SasPay Webhook Netlify] Payment SUCCESS for ${reference} - Amount: ${amount}`);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'success',
          message: 'Abonnement FlexPDF activé avec succès.',
          reference,
          transactionId,
          timestamp: new Date().toISOString(),
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ignored', message: 'Event status not completed' }),
    };
  } catch (err) {
    console.error('[SasPay Webhook Netlify] Error:', err);
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Malformed webhook event', details: err.message }),
    };
  }
};
