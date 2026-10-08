// ============================================================================
// GOLD PLATFORM — MAIN APPLICATION ENTRY POINT
// ============================================================================
// نقطة الدخول الرئيسية للتطبيق
// تشغيل: npm run dev

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { config } from './config';
import { logger } from './config/logger';
import { verifyDatabaseConnection } from './config/database';
import { i18nAndCurrencyMiddleware } from './middleware/i18n';

// استيراد المسارات
import assetRoutes from './routes/assetRoutes';
import aiRoutes from './routes/aiRoutes';
import custodyRoutes from './routes/custodyRoutes';
import erpRoutes from './routes/erpRoutes';
import authRoutes from './routes/authRoutes';
import auditRoutes from './routes/auditRoutes';
import vaultRoutes from './routes/vaultRoutes';
import marketplaceRoutes from './routes/marketplaceRoutes';
import hrRoutes from './routes/hr';
import workerRoutes from './routes/workerRoutes';
import financialRoutes from './routes/financial';
import assayRoutes from './routes/assay';
import digitalIdentityRoutes from './routes/digitalIdentity';
import complianceRoutes from './routes/compliance';
import systemRoutes from './routes/system';
import ownershipRoutes from './routes/ownership';
import logisticsRoutes from './routes/logistics';
import contactRoutes from './routes/contact';
import adminRoutes from './routes/admin';
import statRoutes from './routes/statRoutes';
import orgRoutes from './routes/orgRoutes';
import erpAdvancedRoutes from './routes/erpAdvancedRoutes';
import trustRoutes from './routes/trustRoutes';
import controlCenterRoutes from './routes/controlCenter';
import { b2bPublicRoutes, b2bAdminRoutes } from './routes/b2bRoutes';
import { initOpenApi } from './services/api/openapi';

// ============================================================================
// EXPRESS APPLICATION
// ============================================================================

const app = express();

// Behind Netlify Functions (proxy), forwarded headers are present.
// Trust the single Netlify hop so express-rate-limit reads X-Forwarded-For.
app.set('trust proxy', 1);

// ============================================================================
// GLOBAL MIDDLEWARE
// ============================================================================

// الأمان (Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Language',
    'X-Currency',
    'Accept-Language',
    'X-Request-ID',
  ],
  exposedHeaders: ['Content-Language', 'X-Direction', 'X-Preferred-Currency'],
  credentials: true,
}));

// ضغط الاستجابات
app.use(compression());

// تسجيل الطلبات
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim(), { type: 'http' }),
  },
}));

// تحويل بيانات JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// تحديد المعدل (Rate Limiting)
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ============================================================================
// i18n & CURRENCY MIDDLEWARE
// ============================================================================
// يطبق على جميع مسارات API
app.use('/api/', i18nAndCurrencyMiddleware);

// ============================================================================
// STATIC FILES
// ============================================================================

// خدمة الملفات الثابتة للواجهة الأمامية (Vite build output)
app.use(express.static(path.join(__dirname, '../public/dist')));

// خدمة الملفات الثابتة الأصلية (fallback)
app.use(express.static(path.join(__dirname, '../public')));

// ============================================================================
// API ROUTES
// ============================================================================

// مسارات API v1
app.use(`/api/${config.apiVersion}/auth`, authRoutes);
app.use(`/api/${config.apiVersion}/assets`, assetRoutes);
app.use(`/api/${config.apiVersion}/ai`, aiRoutes);
app.use(`/api/${config.apiVersion}/custody`, custodyRoutes);
app.use(`/api/${config.apiVersion}/erp`, erpRoutes);
app.use(`/api/${config.apiVersion}/audit`, auditRoutes);
app.use(`/api/${config.apiVersion}/vaults`, vaultRoutes);
app.use(`/api/${config.apiVersion}/marketplace`, marketplaceRoutes);
app.use('/api/v1/hr', hrRoutes);
app.use('/api/v1/hr', workerRoutes);
app.use('/api/v1/financial', financialRoutes);
app.use('/api/v1/assay', assayRoutes);
app.use('/api/v1/digital-identity', digitalIdentityRoutes);
app.use('/api/v1/compliance', complianceRoutes);
app.use('/api/v1/system', systemRoutes);
app.use('/api/v1/ownership', ownershipRoutes);
app.use('/api/v1/logistics', logisticsRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/stats', statRoutes);
app.use('/api/v1', b2bPublicRoutes);
app.use('/api/v1/admin/content', b2bAdminRoutes);
app.use(`/api/${config.apiVersion}/orgs`, orgRoutes);
app.use(`/api/${config.apiVersion}/erp`, erpAdvancedRoutes);
app.use(`/api/${config.apiVersion}/trust`, trustRoutes);
app.use(`/api/${config.apiVersion}/control-center`, controlCenterRoutes);

// ============================================================================
// API-FIRST REST CONTRACT (§24) — مواصفة OpenAPI حيّة + صفحة توثيق
// ============================================================================

initOpenApi(app);

// مسار التحقق العام (واجهة المستهلك عند مسح NFC/QR)
app.use(`/api/${config.apiVersion}/public`, assetRoutes);

// ============================================================================
// API ROOT
// ============================================================================

app.get('/api/v1', (_req, res) => {
  res.json({
    service: 'JOHAR Platform API',
    version: '1.0.0',
    contract: '/api/v1/openapi.json',
    docs: '/api/v1/docs',
    endpoints: [
      'POST /api/v1/auth/login',
      'POST /api/v1/auth/register',
      'POST /api/v1/assets/register',
      'GET  /api/v1/assets/verify/:passport_id',
      'GET  /api/v1/assets/gold/:gold_id',
      'GET  /api/v1/assets',
      'POST /api/v1/ai/analyze-jewellery',
      'POST /api/v1/ai/fraud-check',
      'GET  /api/v1/erp/dashboard',
      'GET  /api/v1/control-center/summary',
      'GET  /api/v1/control-center/live-transactions',
      'GET  /api/v1/control-center/risk-monitor',
      'GET  /api/v1/control-center/blockchain-events',
      'GET  /api/v1/erp/fraud-alerts',
      'GET  /api/v1/audit/logs',
      'GET  /api/v1/vaults',
      'GET  /api/v1/vaults/:vault_id',
      'GET  /api/v1/vaults/warehouses',
      'GET  /api/v1/marketplace',
      'GET  /api/v1/marketplace/:listing_id',
      'POST /api/v1/marketplace/create',
      'GET  /api/v1/logistics',
      'GET  /api/v1/logistics/:id',
      'POST /api/v1/newsletter/subscribe',
      'GET  /api/v1/articles',
      'GET  /api/v1/exhibitors',
      'POST /api/v1/buyer-program',
      'POST /api/v1/contact/inquiry',
      'GET  /api/v1/hr/worker-types',
      'POST /api/v1/hr/worker-types',
      'GET  /api/v1/hr/workers',
      'POST /api/v1/hr/workers',
      'GET  /api/v1/hr/payroll',
      'POST /api/v1/hr/payroll/run',
      'GET  /api/v1/hr/payroll/overview',
      'POST /api/v1/hr/payroll/:id/pay',
    ],
  });
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'gold-platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================================================
// SPA FALLBACK — توجيه جميع الطلبات للـ SPA
// ============================================================================

app.get('*', (req, res) => {
  // إذا كان الطلب لـ API، أرجع خطأ 404
  if (req.path.startsWith('/api/')) {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'API endpoint not found',
      },
    });
    return;
  }

  // وإلا، أرجع ملف SPA الرئيسي (Vite build أو original)
  const indexPath = path.join(__dirname, '../public/dist/index.html');
  const fallbackPath = path.join(__dirname, '../public/index.html');
  
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.sendFile(fallbackPath);
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// معالج الأخطاء العام
app.use(
  (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message:
          process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
      },
    });
  },
);


export default app;
