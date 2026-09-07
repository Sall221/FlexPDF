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

    // Payload strictly matching SasPay Hosted Checkout Session documentation
    const formattedAmount = (currency === 'XOF' ? amountXOF : amount).toFixed(2);
    const sasPayPayload = {
      amount: formattedAmount,
      currency: currency === 'USD' ? 'USD' : 'XOF',
      description: data.description || `Abonnement FlexPDF Pro (${data.planId || 'Mensuel'})`,
      customer_name: (data.customer && data.customer.name) || data.customer_name || 'Client FlexPDF',
      customer_email: (data.customer && data.customer.email) || data.customer_email || 'contact@flexpdf.com',
      return_url: data.redirect_url || data.return_url || 'https://flex-pdf.netlify.app/?payment_status=success',
      metadata: {
        planId: data.planId,
        reference: reference,
      },
    };

    const cleanPhone = (data.customer && data.customer.phone) || data.customer_phone || (data.mobileMoney && data.mobileMoney.phoneNumber);
    if (cleanPhone) {
      sasPayPayload.customer_phone = cleanPhone.replace(/[^0-9+]/g, '');
    }

    console.log('[SasPay Initialize Netlify] Calling SasPay Checkout Sessions API with ref:', reference);

    // Call official SasPay Checkout Session endpoint
    let sasPayResponseData = null;
    let sasPayError = null;
    try {
      const response = await fetch(`${baseUrl}/checkout-sessions/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sasPayPayload),
      });

      if (response.ok) {
        sasPayResponseData = await response.json();
      } else {
        const errText = await response.text();
        console.warn('[SasPay Initialize Netlify] Gateway returned non-200:', response.status, errText);
        sasPayError = errText;
      }
    } catch (networkErr) {
      console.warn('[SasPay Initialize Netlify] Direct gateway call network error:', networkErr.message);
      sasPayError = networkErr.message;
    }

    const sessionObj = (sasPayResponseData && sasPayResponseData.data) || sasPayResponseData;
    const paymentUrl = sessionObj && (sessionObj.checkout_url || sessionObj.payment_url);
    const txId = (sessionObj && (sessionObj.id || sessionObj.transaction_id)) || `SASP_${Date.now().toString(36).toUpperCase()}`;

    if (!paymentUrl) {
      return {
        statusCode: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: sasPayError || 'Impossible de créer la session de paiement auprès de SasPay.',
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
