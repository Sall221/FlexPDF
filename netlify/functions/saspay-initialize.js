// netlify/functions/saspay-initialize.js
// Netlify Serverless Function for SasPay Hosted Checkout Session
import crypto from 'crypto';

export const handler = async function (event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    const data = JSON.parse(event.body || '{}');
    const secretKey = (
      process.env.SASPAY_SECRET_KEY ||
      process.env.SASPAY_API_KEY ||
      'sk_live_rsJKSBa2k5xSaAPAgPUcWgP6qQ57UjQIa-MaUerR_Bw'
    ).trim();
    const baseUrl = (process.env.SASPAY_BASE_URL || 'https://api.saspay.me/api/v1').replace(/\/$/, '');

    const amount = Number(data.amount || 9);
    const currency = (data.currency || 'USD').toUpperCase();
    const amountXOF = currency === 'XOF' ? amount : Math.round(amount * 655.957);

    const reference = data.reference || `REF-FP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Format amount with 2 decimal places per SasPay specifications
    const formattedAmount = (currency === 'XOF' ? amountXOF : amount).toFixed(2);
    const sasPayCurrency = currency === 'USD' ? 'USD' : 'XOF';

    const sasPayPayload = {
      amount: formattedAmount,
      currency: sasPayCurrency,
      description: data.description || `Abonnement FlexPDF Pro (${data.planId || 'Mensuel'})`,
      customer_name: (data.customer && data.customer.name) || data.customer_name || 'Client FlexPDF',
      customer_email: (data.customer && data.customer.email) || data.customer_email || 'contact@flexpdf.com',
      return_url: data.returnUrl || data.redirect_url || data.return_url || 'https://flex-pdf.netlify.app/?payment_status=success',
      metadata: {
        planId: data.planId || 'pro_monthly',
        reference: reference,
      },
    };

    const cleanPhone = (data.customer && data.customer.phone) || data.customer_phone || (data.mobileMoney && data.mobileMoney.phoneNumber);
    if (cleanPhone) {
      sasPayPayload.customer_phone = cleanPhone.replace(/[^0-9+]/g, '');
    }

    console.log('[SasPay Initialize Netlify] Calling SasPay Checkout Sessions API for ref:', reference);

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
        try {
          const errJson = JSON.parse(errText);
          sasPayError = errJson.message || errJson.error || `Erreur SasPay (${response.status})`;
        } catch {
          sasPayError = `Erreur SasPay HTTP ${response.status}`;
        }
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
          status: 'ERROR',
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
        checkoutUrl: paymentUrl,
        data: sessionObj,
        message: 'Session SasPay créée avec succès sur Netlify.',
      }),
    };
  } catch (err) {
    console.error('[SasPay Initialize Netlify] Fatal error:', err);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        status: 'ERROR',
        error: err.message || 'Erreur interne du serveur Netlify',
      }),
    };
  }
};
