import cookieParser from 'cookie-parser';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertRequiredEnv, env } from './config/env.js';
import { connectDB } from './config/db.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import { paystackWebhook } from './controllers/checkoutController.js';
import orderRoutes from './routes/orderRoutes.js';
import productRoutes from './routes/productRoutes.js';
import vendorOrderRoutes from './routes/vendorOrderRoutes.js';
import vendorProductRoutes from './routes/vendorProductRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { applySecurity } from './middleware/security.js';

assertRequiredEnv();

const app = express();
if (process.env.RENDER) app.set('trust proxy', 1);

applySecurity(app);
app.post('/api/webhooks/paystack', express.raw({ type: 'application/json' }), paystackWebhook);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/vendor/products', vendorProductRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/vendor/orders', vendorOrderRoutes);
app.use('/api/admin', adminRoutes);

if (process.env.NODE_ENV === 'production') {
  const frontendDist = fileURLToPath(new URL('../frontend/dist/', import.meta.url));
  app.use(express.static(frontendDist));
  app.get('/{*path}', (req, res, next) => {
    if (req.path === '/api' || req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

try {
  await connectDB();

  app.listen(env.port, () => {
    console.log(`API listening on port ${env.port}`);
  });
} catch (error) {
  console.error('Failed to start API server');
  console.error(error.message);
  process.exit(1);
}
