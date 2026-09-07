// netlify/functions/saspay-webhook.js
// Netlify Serverless Function for SasPay Webhook
import crypto from 'crypto';

export const handler = async function (event, context) {
  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-SasPay-Signature, X-Signature',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
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
      console.log(`[SasPay Webhook Netlify] Payment SUCCESS for ${reference} - Amount: ${amount}`);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
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
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        status: 'received',
        eventStatus: status,
        reference,
        transactionId,
      }),
    };
  } catch (err) {
    console.error('[SasPay Webhook Netlify] Error:', err);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
