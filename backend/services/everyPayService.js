// EveryPay Payment Service Integration
// Documentation: https://support.every-pay.com/api-documentation/

import axios from 'axios';
import crypto from 'crypto';

class EveryPayService {
  constructor() {
    // EveryPay API Configuration
    this.baseURL = process.env.EVERYPAY_BASE_URL || 'https://igw-demo.every-pay.com';
    this.apiUser = process.env.EVERYPAY_API_USER; // Your merchant username
    this.apiKey = process.env.EVERYPAY_API_KEY;   // Your API key
    this.accountName = process.env.EVERYPAY_ACCOUNT_NAME; // Your account name
    
    // API Client Configuration
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      auth: {
        username: this.apiUser,
        password: this.apiKey
      }
    });

    console.log('🏦 EveryPay Service initialized');
  }

  // Generate HMAC signature for request validation
  generateSignature(params) {
    // Sort parameters alphabetically
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});

    // Create query string
    const queryString = new URLSearchParams(sortedParams).toString();
    
    // Generate HMAC-SHA1 signature
    const signature = crypto
      .createHmac('sha1', this.apiKey)
      .update(queryString)
      .digest('hex');

    return signature;
  }

  // Create payment for course purchase
  async createCoursePayment(orderData) {
    try {
      const {
        userId,
        courseId,
        courseName,
        amount, // in cents (e.g., 29.99 EUR = 2999)
        currency = 'EUR',
        userEmail,
        userName,
        returnUrl,
        orderId
      } = orderData;

      const paymentParams = {
        api_username: this.apiUser,
        account_name: this.accountName,
        amount: amount.toString(),
        order_reference: orderId,
        nonce: this.generateNonce(),
        timestamp: Math.floor(Date.now() / 1000).toString(),
        customer_url: returnUrl,
        
        // Course/product details
        details: JSON.stringify({
          courseId,
          courseName,
          userId,
          type: 'course_purchase'
        }),
        
        // Customer information
        customer_ip: '0.0.0.0', // Will be replaced with actual IP
        customer_email: userEmail,
        customer_name: userName,
        
        // Payment page customization
        locale: 'lv', // Latvian language
        skin_name: 'DeyaRun'
      };

      // Generate signature
      paymentParams.hmac_fields = Object.keys(paymentParams).sort().join(',');
      paymentParams.hmac = this.generateSignature(paymentParams);

      console.log('💳 Creating EveryPay payment:', {
        orderId,
        amount: amount / 100,
        currency,
        course: courseName
      });

      const response = await this.client.post('/api/v4/payments', 
        new URLSearchParams(paymentParams)
      );

      if (response.data.payment_state === 'initial') {
        return {
          success: true,
          paymentUrl: response.data.payment_link,
          paymentReference: response.data.payment_reference,
          orderId: orderId,
          status: 'pending'
        };
      } else {
        throw new Error(`Payment creation failed: ${response.data.payment_state}`);
      }

    } catch (error) {
      console.error('❌ EveryPay payment creation error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Create subscription payment
  async createSubscriptionPayment(subscriptionData) {
    try {
      const {
        userId,
        planId,
        planName,
        amount, // Monthly/yearly amount in cents
        currency = 'EUR',
        userEmail,
        userName,
        returnUrl,
        orderId,
        recurringType = 'monthly' // 'monthly' or 'yearly'
      } = subscriptionData;

      const paymentParams = {
        api_username: this.apiUser,
        account_name: this.accountName,
        amount: amount.toString(),
        order_reference: orderId,
        nonce: this.generateNonce(),
        timestamp: Math.floor(Date.now() / 1000).toString(),
        customer_url: returnUrl,
        
        // Subscription details
        details: JSON.stringify({
          planId,
          planName,
          userId,
          recurringType,
          type: 'subscription'
        }),
        
        // Enable recurring payments
        recurring: 'true',
        
        // Customer information
        customer_email: userEmail,
        customer_name: userName,
        
        // Payment page customization
        locale: 'lv',
        skin_name: 'DeyaRun'
      };

      // Generate signature
      paymentParams.hmac_fields = Object.keys(paymentParams).sort().join(',');
      paymentParams.hmac = this.generateSignature(paymentParams);

      console.log('🔄 Creating EveryPay subscription:', {
        orderId,
        amount: amount / 100,
        currency,
        plan: planName,
        recurring: recurringType
      });

      const response = await this.client.post('/api/v4/payments', 
        new URLSearchParams(paymentParams)
      );

      if (response.data.payment_state === 'initial') {
        return {
          success: true,
          paymentUrl: response.data.payment_link,
          paymentReference: response.data.payment_reference,
          orderId: orderId,
          status: 'pending',
          recurring: true
        };
      } else {
        throw new Error(`Subscription creation failed: ${response.data.payment_state}`);
      }

    } catch (error) {
      console.error('❌ EveryPay subscription creation error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Process recurring payment
  async processRecurringPayment(recurringData) {
    try {
      const {
        originalPaymentReference,
        amount,
        orderId,
        currency = 'EUR'
      } = recurringData;

      const recurringParams = {
        api_username: this.apiUser,
        account_name: this.accountName,
        amount: amount.toString(),
        order_reference: orderId,
        payment_reference: originalPaymentReference,
        nonce: this.generateNonce(),
        timestamp: Math.floor(Date.now() / 1000).toString()
      };

      // Generate signature
      recurringParams.hmac_fields = Object.keys(recurringParams).sort().join(',');
      recurringParams.hmac = this.generateSignature(recurringParams);

      console.log('🔄 Processing recurring payment:', {
        orderId,
        amount: amount / 100,
        originalRef: originalPaymentReference
      });

      const response = await this.client.post('/api/v4/payments/recurring', 
        new URLSearchParams(recurringParams)
      );

      return {
        success: response.data.payment_state === 'settled',
        paymentReference: response.data.payment_reference,
        status: response.data.payment_state,
        transactionId: response.data.cc_transaction
      };

    } catch (error) {
      console.error('❌ EveryPay recurring payment error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Verify payment callback
  async verifyCallback(callbackData) {
    try {
      const {
        payment_reference,
        payment_state,
        order_reference,
        hmac,
        hmac_fields,
        ...otherFields
      } = callbackData;

      // Verify HMAC signature
      const fieldsToVerify = hmac_fields.split(',').reduce((obj, field) => {
        if (callbackData[field] !== undefined) {
          obj[field] = callbackData[field];
        }
        return obj;
      }, {});

      const expectedHmac = this.generateSignature(fieldsToVerify);
      const isValidSignature = hmac === expectedHmac;

      console.log('🔍 EveryPay callback verification:', {
        orderId: order_reference,
        paymentRef: payment_reference,
        state: payment_state,
        signatureValid: isValidSignature
      });

      return {
        isValid: isValidSignature,
        paymentReference: payment_reference,
        paymentState: payment_state,
        orderId: order_reference,
        transactionId: callbackData.cc_transaction,
        amount: callbackData.amount,
        currency: callbackData.currency || 'EUR'
      };

    } catch (error) {
      console.error('❌ EveryPay callback verification error:', error);
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  // Get payment status
  async getPaymentStatus(paymentReference) {
    try {
      const statusParams = {
        api_username: this.apiUser,
        payment_reference: paymentReference,
        nonce: this.generateNonce(),
        timestamp: Math.floor(Date.now() / 1000).toString()
      };

      // Generate signature
      statusParams.hmac_fields = Object.keys(statusParams).sort().join(',');
      statusParams.hmac = this.generateSignature(statusParams);

      const response = await this.client.get(`/api/v4/payments/${paymentReference}`, {
        params: statusParams
      });

      return {
        success: true,
        status: response.data.payment_state,
        amount: response.data.amount,
        currency: response.data.currency,
        transactionId: response.data.cc_transaction,
        createdAt: response.data.initial_time,
        completedAt: response.data.processing_time
      };

    } catch (error) {
      console.error('❌ EveryPay status check error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Process refund
  async processRefund(refundData) {
    try {
      const {
        paymentReference,
        amount, // Amount to refund in cents
        reason = 'Customer request'
      } = refundData;

      const refundParams = {
        api_username: this.apiUser,
        payment_reference: paymentReference,
        amount: amount.toString(),
        details: reason,
        nonce: this.generateNonce(),
        timestamp: Math.floor(Date.now() / 1000).toString()
      };

      // Generate signature
      refundParams.hmac_fields = Object.keys(refundParams).sort().join(',');
      refundParams.hmac = this.generateSignature(refundParams);

      console.log('💸 Processing EveryPay refund:', {
        paymentRef: paymentReference,
        amount: amount / 100,
        reason
      });

      const response = await this.client.post('/api/v4/payments/refunds', 
        new URLSearchParams(refundParams)
      );

      return {
        success: response.data.refund_state === 'settled',
        refundReference: response.data.refund_reference,
        status: response.data.refund_state,
        amount: response.data.amount
      };

    } catch (error) {
      console.error('❌ EveryPay refund error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Get supported payment methods
  async getPaymentMethods() {
    try {
      return {
        success: true,
        methods: [
          {
            id: 'card',
            name: 'Credit/Debit Card',
            types: ['visa', 'mastercard', 'maestro'],
            description: 'Visa, Mastercard, Maestro'
          },
          {
            id: 'bank_lv',
            name: 'Latvian Banks',
            types: ['swedbank_lv', 'seb_lv', 'citadele', 'luminor_lv'],
            description: 'Swedbank, SEB, Citadele, Luminor'
          },
          {
            id: 'bank_lt',
            name: 'Lithuanian Banks', 
            types: ['swedbank_lt', 'seb_lt', 'luminor_lt'],
            description: 'Swedbank, SEB, Luminor Lithuania'
          },
          {
            id: 'bank_ee',
            name: 'Estonian Banks',
            types: ['swedbank_ee', 'seb_ee', 'luminor_ee', 'lhv'],
            description: 'Swedbank, SEB, Luminor, LHV Estonia'
          }
        ]
      };
    } catch (error) {
      console.error('❌ Error getting payment methods:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate unique nonce
  generateNonce() {
    return crypto.randomBytes(16).toString('hex');
  }

  // Validate service configuration
  isConfigured() {
    return !!(this.apiUser && this.apiKey && this.accountName);
  }

  // =====================================================================
  // ADMIN DIAGNOSTICS — EveryPay API v4 (HTTP Basic Auth + JSON body)
  // NOTE: v4 uses Basic Auth (api_username:secret), NOT the HMAC query
  // signing used by the legacy methods above. These methods are the
  // correct v4 contract and are used by the admin diagnostics panel.
  // =====================================================================

  // Detect whether the configured gateway is the demo/test environment.
  isTestEnvironment() {
    return /demo|sandbox|test/i.test(this.baseURL || '');
  }

  // Normalize the configured base URL down to the API host root, stripping
  // common mistakes: the customer landing-page path (/lp), an explicit API
  // version path (/api/v3, /api/v4), and trailing slashes. The v4 paths are
  // appended by the callers, so baseURL must be host-only.
  // e.g. "https://payment.ecommerce.sebgroup.com/lp" -> "https://payment.ecommerce.sebgroup.com"
  _apiRoot() {
    return (this.baseURL || '')
      .replace(/\/+$/, '')
      .replace(/\/lp$/i, '')
      .replace(/\/api\/v[0-9]+$/i, '')
      .replace(/\/+$/, '');
  }

  // Build an axios client that follows the EveryPay v4 contract.
  // validateStatus is permissive so callers can inspect error bodies.
  _v4Client() {
    return axios.create({
      baseURL: this._apiRoot(),
      timeout: 15000,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      auth: { username: this.apiUser, password: this.apiKey },
      validateStatus: () => true
    });
  }

  // Configuration snapshot for the admin panel. Never returns secrets.
  getDiagnostics() {
    const maskedUser = this.apiUser
      ? `${this.apiUser.slice(0, 3)}***${this.apiUser.slice(-2)}`
      : null;

    // Surface common misconfigurations of the base URL.
    const warnings = [];
    const raw = this.baseURL || '';
    if (!process.env.EVERYPAY_BASE_URL) {
      warnings.push('EVERYPAY_BASE_URL nav uzstādīts — tiek lietots demo gateway (igw-demo.every-pay.com).');
    }
    if (/\/lp\/?$/i.test(raw)) {
      warnings.push("EVERYPAY_BASE_URL beidzas ar '/lp' — tas ir klienta maksājuma lapas ceļš, ne API bāze. Lieto tikai host (https://payment.ecommerce.sebgroup.com).");
    }
    if (/\/api\/v[0-9]+\/?$/i.test(raw)) {
      warnings.push("EVERYPAY_BASE_URL satur '/api/vX' — noņem to, kods pievieno /api/v4 automātiski.");
    }

    return {
      configured: this.isConfigured(),
      environment: this.isTestEnvironment() ? 'test/demo' : 'production',
      baseURL: this.baseURL,
      // The actual host the v4 client will call, after normalization.
      effectiveApiBase: `${this._apiRoot()}/api/v4`,
      accountName: this.accountName || null,
      apiUser: maskedUser,
      warnings,
      // Which environment variables are present (booleans only, no values)
      env: {
        EVERYPAY_BASE_URL: !!process.env.EVERYPAY_BASE_URL,
        EVERYPAY_API_USER: !!process.env.EVERYPAY_API_USER,
        EVERYPAY_API_KEY: !!process.env.EVERYPAY_API_KEY,
        EVERYPAY_ACCOUNT_NAME: !!process.env.EVERYPAY_ACCOUNT_NAME
      }
    };
  }

  // Verify authenticated connectivity WITHOUT creating a payment.
  // Strategy: request a non-existent payment reference.
  //   404 (or 2xx)  -> reachable + credentials accepted
  //   401 / 403     -> credentials rejected
  //   network error -> gateway unreachable
  async testConnection() {
    if (!this.isConfigured()) {
      return {
        ok: false,
        reason: 'not_configured',
        message: 'EveryPay credentials missing (EVERYPAY_API_USER / EVERYPAY_API_KEY / EVERYPAY_ACCOUNT_NAME).'
      };
    }

    const probeRef = `conn-check-${this.generateNonce()}`;
    try {
      const client = this._v4Client();
      const response = await client.get(`/api/v4/payments/${probeRef}`, {
        params: { api_username: this.apiUser }
      });

      let ok = false;
      let reason = `http_${response.status}`;
      if (response.status === 404 || (response.status >= 200 && response.status < 300)) {
        ok = true;
        reason = 'authenticated';
      } else if (response.status === 401 || response.status === 403) {
        ok = false;
        reason = 'auth_failed';
      }

      return {
        ok,
        reason,
        httpStatus: response.status,
        baseURL: this.baseURL,
        environment: this.isTestEnvironment() ? 'test/demo' : 'production',
        response: response.data
      };
    } catch (error) {
      return {
        ok: false,
        reason: 'network_error',
        message: error.message,
        code: error.code || null,
        baseURL: this.baseURL
      };
    }
  }

  // Create a minimal REAL one-off payment session to validate the full
  // create flow end-to-end. Returns the payment_link on success, or the
  // full EveryPay error body on failure (admin-only consumption).
  // @param amountCents  amount in cents (default 10 = 0.10 EUR)
  async createTestPayment({ amountCents = 10, customerUrl, customerIp } = {}) {
    if (!this.isConfigured()) {
      return {
        success: false,
        reason: 'not_configured',
        message: 'EveryPay credentials missing (EVERYPAY_API_USER / EVERYPAY_API_KEY / EVERYPAY_ACCOUNT_NAME).'
      };
    }

    const orderId = `ADMIN-TEST-${Date.now()}`;
    const payload = {
      api_username: this.apiUser,
      account_name: this.accountName,
      amount: Number((amountCents / 100).toFixed(2)), // v4 expects EUR decimal, e.g. 0.10
      order_reference: orderId,
      nonce: this.generateNonce(),
      timestamp: new Date().toISOString(),
      customer_url: customerUrl || `${process.env.FRONTEND_URL || 'https://deyarun.com'}/payment/return`,
      customer_ip: customerIp || '0.0.0.0',
      locale: 'lv'
    };

    try {
      const client = this._v4Client();
      const response = await client.post('/api/v4/payments/oneoff', payload);

      if (response.status >= 200 && response.status < 300 && response.data?.payment_link) {
        return {
          success: true,
          httpStatus: response.status,
          orderId,
          paymentLink: response.data.payment_link,
          paymentReference: response.data.payment_reference,
          paymentState: response.data.payment_state,
          amountEur: payload.amount,
          environment: this.isTestEnvironment() ? 'test/demo' : 'production'
        };
      }

      // Detailed error surfaced to the admin panel only.
      return {
        success: false,
        httpStatus: response.status,
        orderId,
        environment: this.isTestEnvironment() ? 'test/demo' : 'production',
        error: response.data,
        // Echo request (no secret is ever part of the body) for debugging.
        sentRequest: { endpoint: '/api/v4/payments/oneoff', payload }
      };
    } catch (error) {
      return {
        success: false,
        reason: 'network_error',
        message: error.message,
        code: error.code || null,
        httpStatus: error.response?.status || null,
        error: error.response?.data || null
      };
    }
  }
}

export default new EveryPayService();