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
}

export default new EveryPayService();