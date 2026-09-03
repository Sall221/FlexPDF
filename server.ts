import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { saspayRouter, handleSasPayWebhook } from './server/saspayGateway';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logger for API calls
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/webhooks')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'FlexPDF API & SasPay Gateway Server',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // Direct webhook endpoint: /webhooks/saspay & /api/webhooks/saspay & /api/saspay/webhook
  app.post('/webhooks/saspay', handleSasPayWebhook);
  app.post('/api/webhooks/saspay', handleSasPayWebhook);

  // Direct SoftPay initialize endpoints matching official SasPay paths
  app.post('/payments/softpay/initialize', (req, res, next) => (saspayRouter as any).handle(Object.assign(req, { url: '/initiate' }), res, next));
  app.post('/payments/softpay/initialize/', (req, res, next) => (saspayRouter as any).handle(Object.assign(req, { url: '/initiate' }), res, next));
  app.post('/api/payments/softpay/initialize', (req, res, next) => (saspayRouter as any).handle(Object.assign(req, { url: '/initiate' }), res, next));
  app.post('/api/payments/softpay/initialize/', (req, res, next) => (saspayRouter as any).handle(Object.assign(req, { url: '/initiate' }), res, next));

  // Mount SasPay payment gateway routes
  app.use('/api/saspay', saspayRouter);

  // Vite middleware for dev or static bundle for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FlexPDF Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
