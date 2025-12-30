/**
 * JazzCash Hosted Checkout Service
 * 
 * Uses WebView to redirect user to JazzCash's official payment page.
 * This is the most reliable and officially supported method.
 */

import CryptoJS from 'crypto-js';
import {
  createTransaction,
  updateMechanicDiamonds,
  updateTransactionStatus,
} from '../firebase/firestore';

// Configuration
interface JazzCashConfig {
  merchantId: string;
  password: string;
  integritySalt: string;
  sandboxUrl: string;
  returnUrl: string;
}

// Payment data
export interface JazzCashPaymentData {
  amount: number;
  mechanicId: string;
  diamonds: number;
  description?: string;
}

// Get configuration
const getConfig = (): JazzCashConfig => ({
  merchantId: process.env.EXPO_PUBLIC_JAZZCASH_MERCHANT_ID || '',
  password: process.env.EXPO_PUBLIC_JAZZCASH_PASSWORD || '',
  integritySalt: process.env.EXPO_PUBLIC_JAZZCASH_INTEGRITY_SALT || '',
  sandboxUrl: 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/',
  returnUrl: 'https://fixkar.app/payment-callback',
});

// Format date (YYYYMMDDHHmmss)
const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}${h}${min}${s}`;
};

// Generate transaction reference
const generateTxnRef = (): string => `T${formatDate(new Date())}`;

// Generate bill reference
const generateBillRef = (): string => {
  const ts = Date.now().toString().slice(-10);
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `FXK${ts}${rand}`;
};

/**
 * Generate secure hash for JazzCash Hosted Checkout
 * Uses HMAC-SHA256 with sorted values
 */
const generateSecureHash = (
  params: Record<string, string>,
  salt: string
): string => {
  // Sort keys, exclude pp_SecureHash
  const sortedKeys = Object.keys(params)
    .filter(k => k !== 'pp_SecureHash')
    .sort();

  // Get values only (non-empty)
  const values: string[] = [];
  for (const key of sortedKeys) {
    const val = params[key];
    if (val !== undefined && val !== null && val !== '') {
      values.push(val);
    }
  }

  // Format: salt&val1&val2&...
  const hashString = salt + '&' + values.join('&');
  
  // HMAC-SHA256
  const hash = CryptoJS.HmacSHA256(hashString, salt);
  return hash.toString(CryptoJS.enc.Hex);
};

/**
 * Generate HTML form for WebView
 */
export const generatePaymentForm = async (
  data: JazzCashPaymentData
): Promise<{ html: string; transactionId: string; billRef: string }> => {
  const config = getConfig();

  if (!config.merchantId || !config.password || !config.integritySalt) {
    throw new Error('JazzCash credentials not configured');
  }

  const now = new Date();
  const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  const txnRef = generateTxnRef();
  const billRef = generateBillRef();
  const txnDateTime = formatDate(now);
  const txnExpiry = formatDate(expiry);
  const amountPaisa = Math.round(data.amount * 100).toString();

  // Create Firebase transaction
  const firebaseTxnId = await createTransaction({
    userId: data.mechanicId,
    type: 'purchase',
    amount: data.diamonds,
    paymentMethod: 'jazzcash',
    paymentDetails: {
      transactionId: txnRef,
      invoiceNumber: billRef,
      amount: data.amount,
    },
    status: 'pending',
  });

  // Form parameters
  const formParams: Record<string, string> = {
    pp_Version: '1.1',
    pp_TxnType: '',
    pp_Language: 'EN',
    pp_MerchantID: config.merchantId,
    pp_SubMerchantID: '',
    pp_Password: config.password,
    pp_BankID: '',
    pp_ProductID: '',
    pp_TxnRefNo: txnRef,
    pp_Amount: amountPaisa,
    pp_TxnCurrency: 'PKR',
    pp_TxnDateTime: txnDateTime,
    pp_BillReference: billRef,
    pp_Description: data.description || 'Diamond Purchase',
    pp_TxnExpiryDateTime: txnExpiry,
    pp_ReturnURL: config.returnUrl,
    pp_SecureHash: '',
    ppmpf_1: '',
    ppmpf_2: '',
    ppmpf_3: '',
    ppmpf_4: '',
    ppmpf_5: '',
  };

  // Generate hash
  formParams.pp_SecureHash = generateSecureHash(formParams, config.integritySalt);

  // Build HTML form
  const formFields = Object.entries(formParams)
    .map(([key, val]) => `<input type="hidden" name="${key}" value="${val}" />`)
    .join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirecting to JazzCash...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #ED1C24 0%, #C41E3A 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 40px;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 { margin: 0 0 10px; font-weight: 500; }
    p { margin: 0; opacity: 0.8; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h2>Redirecting to JazzCash</h2>
    <p>Please wait...</p>
  </div>
  <form id="paymentForm" method="POST" action="${config.sandboxUrl}">
    ${formFields}
  </form>
  <script>
    document.getElementById('paymentForm').submit();
  </script>
</body>
</html>
`;

  return { html, transactionId: firebaseTxnId, billRef };
};

/**
 * Handle payment callback
 */
export const handlePaymentCallback = async (
  params: Record<string, string>,
  firebaseTxnId: string,
  mechanicId: string,
  diamonds: number
): Promise<{ success: boolean; message: string }> => {
  const responseCode = params.pp_ResponseCode;
  const responseMessage = params.pp_ResponseMessage || 'Unknown';

  if (responseCode === '000') {
    // Success
    await updateMechanicDiamonds(mechanicId, diamonds, 'add');
    await updateTransactionStatus(firebaseTxnId, 'completed');
    return { success: true, message: 'Payment successful!' };
  } else {
    // Failed
    await updateTransactionStatus(firebaseTxnId, 'failed');
    return { success: false, message: responseMessage };
  }
};
