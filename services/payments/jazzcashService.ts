import axios from 'axios';
import { Linking } from 'react-native';
import { createTransaction, updateMechanicDiamonds } from '../firebase/firestore';

interface JazzCashPaymentData {
    amount: number; // PKR
    mechanicId: string;
    diamonds: number;
}

export const initiateJazzCashPayment = async (data: JazzCashPaymentData) => {
    try {
        const merchantId = process.env.EXPO_PUBLIC_JAZZCASH_MERCHANT_ID;
        const password = process.env.EXPO_PUBLIC_JAZZCASH_PASSWORD;
        const returnUrl = process.env.EXPO_PUBLIC_JAZZCASH_RETURN_URL;

        // Create transaction record
        const transactionId = await createTransaction({
            userId: data.mechanicId,
            type: 'purchase',
            amount: data.diamonds,
            paymentMethod: 'jazzcash',
            paymentDetails: {
                transactionId: `JC${Date.now()}`,
                amount: data.amount,
            },
            status: 'pending',
        });

        // In production, you would call JazzCash API here
        // For now, we'll simulate a payment URL
        const paymentUrl = `https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/?pp_MerchantID=${merchantId}&pp_Amount=${data.amount * 100}&pp_TxnRefNo=${transactionId}&pp_ReturnURL=${returnUrl}`;

        // Open payment URL in browser
        const canOpen = await Linking.canOpenURL(paymentUrl);
        if (canOpen) {
            await Linking.openURL(paymentUrl);
        }

        return {
            transactionId,
            paymentUrl,
        };
    } catch (error) {
        console.error('JazzCash payment error:', error);
        throw new Error('Failed to initiate JazzCash payment');
    }
};

export const verifyJazzCashPayment = async (
    transactionId: string,
    mechanicId: string,
    diamonds: number
) => {
    try {
        // In production, verify with JazzCash API
        // For now, we'll simulate success

        // Update diamond balance
        await updateMechanicDiamonds(mechanicId, diamonds, 'add');

        // Update transaction status
        await createTransaction({
            userId: mechanicId,
            type: 'purchase',
            amount: diamonds,
            paymentMethod: 'jazzcash',
            paymentDetails: {
                transactionId,
                amount: 0,
            },
            status: 'completed',
        });

        return true;
    } catch (error) {
        console.error('JazzCash verification error:', error);
        throw new Error('Failed to verify payment');
    }
};
