const express = require('express');
const cors = require('cors');
require('dotenv').config();

const dashboardController = require('./controllers/dashboardController');
const tenantController = require('./controllers/tenantController');
const billingController = require('./controllers/billingController');
const authController = require('./controllers/authController');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares & Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50kb' })); // Mitigate DoS via large payload flood

// Request logger for observability
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Root Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Rental & Tenant Expense Management API (7-Room / 2-Floor Edition)',
    timestamp: new Date().toISOString()
  });
});

// --- AUTHENTICATION ROUTES (JWT + Bcrypt + Rate Limiter) ---
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', authController.getMe);

// --- DASHBOARD ROUTES ---
app.get('/api/dashboard/stats', dashboardController.getDashboardStats);

// --- ROOMS & TENANTS ROUTES ---
app.get('/api/rooms', tenantController.getAllRooms);
app.post('/api/tenants', tenantController.createTenant);
app.put('/api/tenants/:id', tenantController.updateTenant);
app.get('/api/tenants/:id/ledger', tenantController.getTenantLedger);

// --- MONTHLY BILLING & UTILITY SPLIT ROUTES ---
app.post('/api/bills/preview', billingController.previewMonthlySplit);
app.post('/api/bills/generate', billingController.generateMonthlyBills);
app.get('/api/bills/month/:month', billingController.getMonthlyBills);
app.post('/api/bills/:billId/pay', billingController.recordPayment);
app.get('/api/bills/:billId/whatsapp-link', billingController.getWhatsAppReminderLink);

// --- SETTLEMENT & VACATING ROUTES ---
app.get('/api/settlement/preview/:tenantId', tenantController.previewSettlement);
app.post('/api/settlement/finalize', tenantController.finalizeSettlement);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Exception:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Base API URL: http://localhost:${PORT}/api`);
});
