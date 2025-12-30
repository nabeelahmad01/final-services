/**
 * JazzCash MWALLET Payment Service
 * 
 * This service handles direct MWALLET transactions for JazzCash.
 * Hash calculation follows official JazzCash documentation:
 * 1. Sort all parameters alphabetically by key
 * 2. Create key=value pairs joined with &
 * 3. Prepend integritySalt with &
 * 4. Apply HMAC-SHA256 with integritySalt as key
 */

import CryptoJS from 'crypto-js';
import {
  createTransaction,
  updateMechanicDiamonds,
  updateTransactionStatus,
} from '../firebase/firestore';

// Configuration interface
interface MWalletConfig {
  merchantId: string;
  password: string;
  integritySalt: string;
  apiUrl: string;
}

// Payment request data
export interface MWalletPaymentData {
  amount: number; // PKR
  mechanicId: string;
  diamonds: number;
  mobileNumber: string; // Format: 03XXXXXXXXX
  cnic: string; // Last 6 digits
  description?: string;
}

// Payment response
export interface MWalletResponse {
  success: boolean;
  responseCode: string;
  responseMessage: string;
  transactionId?: string;
  invoiceNumber?: string;
  txnRefNo?: string;
}

// Get configuration from environment
const getMWalletConfig = (): MWalletConfig => ({
  merchantId: process.env.EXPO_PUBLIC_JAZZCASH_MERCHANT_ID || '',
  password: process.env.EXPO_PUBLIC_JAZZCASH_PASSWORD || '',
  integritySalt: process.env.EXPO_PUBLIC_JAZZCASH_INTEGRITY_SALT || '',
  // Correct Sandbox API URL for Mobile Account
  apiUrl: 'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/Payment/DoTransaction',
  // Production URL:
  // apiUrl: 'https://payments.jazzcash.com.pk/ApplicationAPI/API/Payment/DoTransaction',
});

// Format date for JazzCash (YYYYMMDDHHmmss)
const formatDateTime = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

// Generate unique transaction reference
const generateTxnRefNo = (): string => {
  return `T${formatDateTime(new Date())}`;
};

// Generate unique bill reference (alphanumeric, max 20 chars)
const generateBillReference = (): string => {
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `FXK${timestamp}${random}`;
};

/**
 * Generate secure hash for JazzCash MWALLET API
 * 
 * JazzCash Hash Format:
 * 1. Sort parameters alphabetically by key name
 * 2. Extract ONLY values (not keys)
 * 3. Concatenate: integritySalt + value1&value2&value3...
 *    NOTE: No & between salt and first value!
 * 4. Apply HMAC-SHA256 with integritySalt as the key
 * 5. Return uppercase hex string
 */
const generateSecureHash = (
  params: Record<string, string>,
  integritySalt: string
): string => {
  // Sort all keys alphabetically, exclude only pp_SecureHash
  // Include pp_Password in hash calculation!
  const sortedKeys = Object.keys(params)
    .filter(key => key !== 'pp_SecureHash')
    .sort();

  // Extract values - SKIP empty strings to avoid &&
  const values: string[] = [];
  for (const key of sortedKeys) {
    const value = params[key];
    // Only include non-empty values (skip empty strings, null, undefined)
    if (value !== undefined && value !== null && value !== '') {
      values.push(value);
    }
  }

  // Format: integritySalt&value1&value2&value3...
  const valuesString = values.join('&');
  const hashString = integritySalt + '&' + valuesString;

  console.log('🔐 Hash Input String:', hashString);

  // HMAC-SHA256 with integritySalt as key
  const hash = CryptoJS.HmacSHA256(hashString, integritySalt);
  const hashHex = hash.toString(CryptoJS.enc.Hex).toUpperCase();

  console.log('🔐 Generated Hash:', hashHex);

  return hashHex;
};

// Format mobile number (ensure 03XXXXXXXXX format)
const formatMobileNumber = (mobile: string): string => {
  let cleaned = mobile.replace(/[\s\-\(\)]/g, '');

  // Remove +92 prefix
  if (cleaned.startsWith('+92')) {
    cleaned = '0' + cleaned.substring(3);
  }
  // Remove 92 prefix (without +)
  else if (cleaned.startsWith('92') && cleaned.length > 10) {
    cleaned = '0' + cleaned.substring(2);
  }
  // Add leading 0 if missing
  else if (!cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }

  return cleaned;
};

/**
 * Initiate MWALLET payment
 */
export const initiateWalletPayment = async (
  data: MWalletPaymentData
): Promise<MWalletResponse> => {
  try {
    const config = getMWalletConfig();

    // Validate credentials
    if (!config.merchantId || !config.password || !config.integritySalt) {
      throw new Error('JazzCash credentials not configured. Please check .env file.');
    }

    // Validate input
    if (!data.mobileNumber || data.mobileNumber.length < 10) {
      throw new Error('Invalid mobile number');
    }
    if (!data.cnic || data.cnic.length !== 6) {
      throw new Error('CNIC must be exactly 6 digits');
    }
    if (data.amount <= 0) {
      throw new Error('Invalid amount');
    }

    // Generate transaction details
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const txnRefNo = generateTxnRefNo();
    const billReference = generateBillReference();
    const txnDateTime = formatDateTime(now);
    const txnExpiryDateTime = formatDateTime(expiryDate);
    const amountInPaisa = Math.round(data.amount * 100).toString();
    const formattedMobile = formatMobileNumber(data.mobileNumber);

    // Create pending transaction in Firebase
    const firebaseTransactionId = await createTransaction({
      userId: data.mechanicId,
      type: 'purchase',
      amount: data.diamonds,
      paymentMethod: 'jazzcash_mwallet',
      paymentDetails: {
        transactionId: txnRefNo,
        invoiceNumber: billReference,
        amount: data.amount,
        mobileNumber: formattedMobile.substring(0, 4) + '****' + formattedMobile.substring(8),
      },
      status: 'pending',
    });

    // Build API parameters - matching JazzCash v1.1 documentation
    const apiParams: Record<string, string> = {
      pp_Version: '1.1',
      pp_TxnType: 'MWALLET',
      pp_Language: 'EN',
      pp_MerchantID: config.merchantId,
      pp_SubMerchantID: '',
      pp_Password: config.password,
      pp_BankID: '',
      pp_ProductID: '',
      pp_TxnRefNo: txnRefNo,
      pp_Amount: amountInPaisa,
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: txnDateTime,
      pp_BillReference: billReference,
      pp_Description: data.description || 'Diamond Purchase',
      pp_TxnExpiryDateTime: txnExpiryDateTime,
      pp_ReturnURL: 'com.fixkar.app://payment-callback',
      ppmpf_1: formattedMobile, // Mobile number goes in ppmpf_1
      ppmpf_2: '',
      ppmpf_3: '',
      ppmpf_4: '',
      ppmpf_5: '',
    };

    // Generate secure hash
    const secureHash = generateSecureHash(apiParams, config.integritySalt);

    // Build request body
    const requestBody = {
      ...apiParams,
      pp_SecureHash: secureHash,
    };

    console.log('📤 MWALLET Request:', JSON.stringify(requestBody, null, 2));

    // Make API call
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();
    console.log('📥 MWALLET Response:', JSON.stringify(responseData, null, 2));

    // Parse response
    const responseCode = responseData.pp_ResponseCode || '';
    const responseMessage = responseData.pp_ResponseMessage || 'Unknown error';

    // Check response code
    // 000 = Success
    // 124 = Transaction pending (MPIN required - user will get notification)
    if (responseCode === '000') {
      // Payment successful
      await updateMechanicDiamonds(data.mechanicId, data.diamonds, 'add');
      await updateTransactionStatus(firebaseTransactionId, 'completed');

      return {
        success: true,
        responseCode,
        responseMessage: 'Payment successful! Diamonds added to your wallet.',
        transactionId: firebaseTransactionId,
        invoiceNumber: billReference,
        txnRefNo,
      };
    } else if (responseCode === '124') {
      // MPIN pending - normal flow for MWALLET
      return {
        success: false,
        responseCode,
        responseMessage: 'Please enter your JazzCash MPIN on your phone to complete payment.',
        transactionId: firebaseTransactionId,
        invoiceNumber: billReference,
        txnRefNo,
      };
    } else {
      // Payment failed
      await updateTransactionStatus(firebaseTransactionId, 'failed');

      return {
        success: false,
        responseCode,
        responseMessage,
        transactionId: firebaseTransactionId,
        invoiceNumber: billReference,
        txnRefNo,
      };
    }
  } catch (error: any) {
    console.error('❌ MWALLET Error:', error);
    throw new Error(error.message || 'Payment failed. Please try again.');
  }
};

/**
 * Check payment status (for polling if needed)
 */
export const checkPaymentStatus = async (
  txnRefNo: string
): Promise<MWalletResponse> => {
  const config = getMWalletConfig();

  const statusParams: Record<string, string> = {
    pp_MerchantID: config.merchantId,
    pp_Password: config.password,
    pp_TxnRefNo: txnRefNo,
    pp_Version: '2.0',
  };

  const secureHash = generateSecureHash(statusParams, config.integritySalt);

  const requestBody = {
    ...statusParams,
    pp_SecureHash: secureHash,
  };

  try {
    const response = await fetch(
      'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/TransactionStatus',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    const responseData = await response.json();

    return {
      success: responseData.pp_ResponseCode === '000',
      responseCode: responseData.pp_ResponseCode || '',
      responseMessage: responseData.pp_ResponseMessage || '',
      txnRefNo,
    };
  } catch (error: any) {
    return {
      success: false,
      responseCode: 'ERROR',
      responseMessage: error.message || 'Failed to check status',
      txnRefNo,
    };
  }
};
