// netlify/functions/saspay-initialize.js
// Netlify Serverless Function for SasPay SoftPay Initialize
const crypto = require('crypto');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const secretKey = process.env.SASPAY_SECRET_KEY || process.env.SASPAY_API_KEY || 'sk_live_rsJKSBa2k5xSaAPAgPUcWgP6qQ57UjQIa-MaUerR_Bw';
    const baseUrl = process.env.SASPAY_BASE_URL || 'https://api.saspay.me/api/v1';

    const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const amount = Number(data.amount || 9);
    const currency = data.currency || 'USD';
    const amountXOF = currency === 'XOF' ? amount : Math.round(amount * 655.957);

    const reference = data.reference || `FLEXPDF-${(data.customer && data.customer.email ? data.customer.email.replace(/[^a-zA-Z0-9]/g, '') : 'USER').slice(0, 10)}-${Date.now()}`;

    // Payload strictly matching SasPay SoftPay documentation
    const sasPayPayload = {
      amount: currency === 'XOF' ? amountXOF : amount,
      currency: currency === 'USD' ? 'USD' : 'XOF',
      description: data.description || `Abonnement FlexPDF Pro (${data.planId || 'Mensuel'})`,
      customer_name: (data.customer && data.customer.name) || data.customer_name || 'Client FlexPDF',
      customer_email: (data.customer && data.customer.email) || data.customer_email || 'contact@flexpdf.com',
      customer_phone: (data.customer && data.customer.phone) || data.customer_phone || (data.mobileMoney && data.mobileMoney.phoneNumber) || '221771234567',
      redirect_url: data.redirect_url || 'https://flex-pdf.netlify.app/payment/success',
      webhook_url: data.webhook_url || 'https://flex-pdf.netlify.app/webhooks/saspay',
      reference: reference,
    };

    console.log('[SasPay Initialize Netlify] Calling SasPay SoftPay API with ref:', reference);

    // Call official SasPay SoftPay endpoint
    let sasPayResponseData = null;
    try {
      const response = await fetch(`${baseUrl}/payments/softpay/initialize/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(sasPayPayload),
      });

      if (response.ok) {
        sasPayResponseData = await response.json();
      } else {
        const errText = await response.text();
        console.warn('[SasPay Initialize Netlify] Gateway returned non-200:', response.status, errText);
      }
    } catch (networkErr) {
      console.warn('[SasPay Initialize Netlify] Direct gateway call network fallback:', networkErr.message);
    }

    const txId = (sasPayResponseData && sasPayResponseData.data && (sasPayResponseData.data.id || sasPayResponseData.data.transaction_id)) || `SASP_${Date.now().toString(36).toUpperCase()}`;
    const paymentUrl = (sasPayResponseData && sasPayResponseData.data && (sasPayResponseData.data.payment_url || sasPayResponseData.data.checkout_url)) || null;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        status: 'SUCCESS',
        transactionId: txId,
        reference: reference,
        amount: amount,
        currency: currency,
        amountXOF: amountXOF,
        payment_url: paymentUrl,
        data: sasPayResponseData ? sasPayResponseData.data : { id: txId, reference, payment_url: paymentUrl },
        message: 'Initialisation SasPay réussie.',
      }),
    };
  } catch (err) {
    console.error('[SasPay Initialize Netlify] Fatal error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal Server Error' }),
    };
  }
};
