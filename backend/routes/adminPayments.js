// Admin-only EveryPay payment diagnostics
// Lets administrators verify gateway connectivity, inspect configuration,
// and initialize a real test payment to surface the EXACT error returned by
// EveryPay (production credentials are used; detailed errors are admin-only).
//
// Mounted at: /api/admin/payment  (see server.js)

import express from 'express';
import * as Sentry from '@sentry/node';
import adminMiddleware from '../middleware/adminMiddleware.js';
import everyPayService from '../services/everyPayService.js';

const router = express.Router();

/**
 * GET /api/admin/payment/diagnostics
 * Returns the current EveryPay configuration (no secrets).
 */
router.get('/diagnostics', adminMiddleware, async (req, res) => {
  try {
    return res.json({ success: true, diagnostics: everyPayService.getDiagnostics() });
  } catch (error) {
    Sentry.captureException(error);
    console.error('❌ Admin payment diagnostics error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/payment/test-connection
 * Verifies authenticated connectivity to EveryPay without creating a payment.
 */
router.post('/test-connection', adminMiddleware, async (req, res) => {
  try {
    const result = await everyPayService.testConnection();
    return res.status(result.ok ? 200 : 502).json({ success: !!result.ok, result });
  } catch (error) {
    Sentry.captureException(error);
    console.error('❌ Admin payment test-connection error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/payment/test-payment
 * Creates a minimal real one-off payment (0.10 EUR by default) and returns the
 * payment link on success or the full EveryPay error body on failure.
 */
router.post('/test-payment', adminMiddleware, async (req, res) => {
  try {
    const forwarded = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const customerIp = forwarded || req.socket?.remoteAddress || undefined;

    const amountCents = Number.isFinite(req.body?.amountCents) ? req.body.amountCents : 10;

    const result = await everyPayService.createTestPayment({ amountCents, customerIp });
    return res.status(result.success ? 200 : 502).json({ success: !!result.success, result });
  } catch (error) {
    Sentry.captureException(error);
    console.error('❌ Admin payment test-payment error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
