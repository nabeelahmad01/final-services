import { Linking } from 'react-native';
import CryptoJS from 'crypto-js';
import { createTransaction, updateMechanicDiamonds, updateTransactionStatus } from '../firebase/firestore';

interface JazzCashPaymentData {
    amount: number; // PKR
    mechanicId: string;
    diamonds: number;
    description?: string;
}

interface JazzCashConfig {
    merchantId: string;
    password: string;
    integritySalt: string;
    sandboxUrl: string;
    returnUrl: string;
}

// Get JazzCash configuration from environment variables
const getJazzCashConfig = (): JazzCashConfig => ({
    merchantId: process.env.EXPO_PUBLIC_JAZZCASH_MERCHANT_ID || '',
    password: process.env.EXPO_PUBLIC_JAZZCASH_PASSWORD || '',
    integritySalt: process.env.EXPO_PUBLIC_JAZZCASH_INTEGRITY_SALT || '',
    sandboxUrl: process.env.EXPO_PUBLIC_JAZZCASH_SANDBOX_URL || '',
    returnUrl: process.env.EXPO_PUBLIC_JAZZCASH_RETURN_URL || '',
});

// Format date for JazzCash (YYYYMMDDHHmmss)
const formatJazzCashDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

// Generate transaction reference number
const generateTxnRefNo = (): string => {
    return `T${formatJazzCashDate(new Date())}`;
};

// Generate SHA256 hash for JazzCash
// JazzCash docs: Salt is PREPENDED to the sorted values string, then SHA256 is computed
const generateSecureHash = (params: Record<string, string>, salt: string): string => {
    // Sort parameters alphabetically by key name
    const sortedKeys = Object.keys(params).sort();
    const hashValues: string[] = [];
    
    for (const key of sortedKeys) {
        if (params[key] && params[key] !== '') {
            hashValues.push(params[key]);
        }
    }
    
    // Prepend salt to the beginning, then join with &
    const hashString = salt + '&' + hashValues.join('&');
    
    console.log('Hash String:', hashString);
    
    // Generate SHA256 hash (NOT HMAC - simple hash)
    const hash = CryptoJS.SHA256(hashString);
    
    return hash.toString(CryptoJS.enc.Hex).toUpperCase();
};

export const initiateJazzCashPayment = async (data: JazzCashPaymentData) => {
    try {
        const config = getJazzCashConfig();
        
        if (!config.merchantId || !config.password || !config.integritySalt) {
            throw new Error('JazzCash credentials not configured');
        }

        const now = new Date();
        const expiryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours expiry
        
        const txnRefNo = generateTxnRefNo();
        const txnDateTime = formatJazzCashDate(now);
        const txnExpiryDateTime = formatJazzCashDate(expiryDate);
        const amountInPaisa = (data.amount * 100).toString(); // Convert to paisa

        // Create transaction record in Firebase
        const transactionId = await createTransaction({
            userId: data.mechanicId,
            type: 'purchase',
            amount: data.diamonds,
            paymentMethod: 'jazzcash',
            paymentDetails: {
                transactionId: txnRefNo,
                amount: data.amount,
            },
            status: 'pending',
        });

        // All parameters for hash calculation (including password)
        const hashParams: Record<string, string> = {
            pp_Amount: amountInPaisa,
            pp_BillReference: `FIXKAR-${transactionId}`,
            pp_Description: data.description || 'FixKar Diamond Purchase',
            pp_Language: 'EN',
            pp_MerchantID: config.merchantId,
            pp_Password: config.password,
            pp_ReturnURL: config.returnUrl,
            pp_TxnCurrency: 'PKR',
            pp_TxnDateTime: txnDateTime,
            pp_TxnExpiryDateTime: txnExpiryDateTime,
            pp_TxnRefNo: txnRefNo,
            pp_Version: '1.1',
            ppmpf_1: data.mechanicId,
            ppmpf_2: data.diamonds.toString(),
            ppmpf_3: transactionId,
        };

        // Generate secure hash (includes password in calculation)
        const secureHash = generateSecureHash(hashParams, config.integritySalt);
        
        // URL parameters (EXCLUDE password, include only non-empty values)
        const urlParams: Record<string, string> = {
            pp_Amount: amountInPaisa,
            pp_BillReference: `FIXKAR-${transactionId}`,
            pp_Description: data.description || 'FixKar Diamond Purchase',
            pp_Language: 'EN',
            pp_MerchantID: config.merchantId,
            pp_Password: config.password, // JazzCash still needs password in POST
            pp_ReturnURL: config.returnUrl,
            pp_TxnCurrency: 'PKR',
            pp_TxnDateTime: txnDateTime,
            pp_TxnExpiryDateTime: txnExpiryDateTime,
            pp_TxnRefNo: txnRefNo,
            pp_Version: '1.1',
            ppmpf_1: data.mechanicId,
            ppmpf_2: data.diamonds.toString(),
            ppmpf_3: transactionId,
            pp_SecureHash: secureHash,
        };

        const queryParams = new URLSearchParams(urlParams);
        const paymentUrl = `${config.sandboxUrl}?${queryParams.toString()}`;

        console.log('JazzCash Payment URL:', paymentUrl);
        console.log('Transaction Ref:', txnRefNo);

        // Open payment URL in browser
        const canOpen = await Linking.canOpenURL(paymentUrl);
        if (canOpen) {
            await Linking.openURL(paymentUrl);
        } else {
            throw new Error('Cannot open payment URL');
        }

        return {
            transactionId,
            txnRefNo,
            paymentUrl,
        };
    } catch (error) {
        console.error('JazzCash payment error:', error);
        throw new Error('Failed to initiate JazzCash payment');
    }
};

// Handle payment callback from JazzCash
export const handleJazzCashCallback = async (responseParams: Record<string, string>) => {
    try {
        const {
            pp_ResponseCode,
            pp_ResponseMessage,
            pp_TxnRefNo,
            ppmpf_1: mechanicId,
            ppmpf_2: diamondsStr,
            ppmpf_3: firebaseTransactionId,
        } = responseParams;

        const diamonds = parseInt(diamondsStr || '0', 10);

        // Check if payment was successful
        if (pp_ResponseCode === '000') {
            // Payment successful
            await updateMechanicDiamonds(mechanicId, diamonds, 'add');
            await updateTransactionStatus(firebaseTransactionId, 'completed');
            
            return {
                success: true,
                message: 'Payment successful! Diamonds added to your wallet.',
                diamonds,
            };
        } else {
            // Payment failed
            await updateTransactionStatus(firebaseTransactionId, 'failed');
            
            return {
                success: false,
                message: pp_ResponseMessage || 'Payment failed. Please try again.',
            };
        }
    } catch (error) {
        console.error('JazzCash callback error:', error);
        throw new Error('Failed to process payment callback');
    }
};

export const verifyJazzCashPayment = async (
    transactionId: string,
    mechanicId: string,
    diamonds: number
) => {
    try {
        // Update diamond balance
        await updateMechanicDiamonds(mechanicId, diamonds, 'add');

        // Update transaction status
        await updateTransactionStatus(transactionId, 'completed');

        return true;
    } catch (error) {
        console.error('JazzCash verification error:', error);
        throw new Error('Failed to verify payment');
    }
};
