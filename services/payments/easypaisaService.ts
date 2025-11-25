import axios from 'axios';
import { Linking } from 'react-native';
import { createTransaction, updateMechanicDiamonds } from '../firebase/firestore';

interface EasypaisaPaymentData {
    amount: number; // PKR
    mechanicId: string;
    diamonds: number;
}

export const initiateEasypaisaPayment = async (data: EasypaisaPaymentData) => {
    try {
        const storeId = process.env.EXPO_PUBLIC_EASYPAISA_STORE_ID;
        const apiKey = process.env.EXPO_PUBLIC_EASYPAISA_API_KEY;

        // Create transaction record
        const transactionId = await createTransaction({
            userId: data.mechanicId,
            type: 'purchase',
            amount: data.diamonds,
            paymentMethod: 'easypaisa',
            paymentDetails: {
                transactionId: `EP${Date.now()}`,
                amount: data.amount,
            },
            status: 'pending',
        });

        // In production, you would call EasyPaisa MA API here
        // This is a simplified simulation
        const paymentUrl = `https://easypaisa.com.pk/merchant-checkout?storeId=${storeId}&amount=${data.amount}&orderId=${transactionId}`;

        // Open payment URL
        const canOpen = await Linking.canOpenURL(paymentUrl);
        if (canOpen) {
            await Linking.openURL(paymentUrl);
        }

        return {
            transactionId,
            paymentUrl,
        };
    } catch (error) {
        console.error('EasyPaisa payment error:', error);
        throw new Error('Failed to initiate EasyPaisa payment');
    }
};

export const verifyEasypaisaPayment = async (
    transactionId: string,
    mechanicId: string,
    diamonds: number
) => {
    try {
        // In production, verify with EasyPaisa API
        // For now, we'll simulate success

        // Update diamond balance
        await updateMechanicDiamonds(mechanicId, diamonds, 'add');

        // Update transaction status
        await createTransaction({
            userId: mechanicId,
            type: 'purchase',
            amount: diamonds,
            paymentMethod: 'easypaisa',
            paymentDetails: {
                transactionId,
                amount: 0,
            },
            status: 'completed',
        });

        return true;
    } catch (error) {
        console.error('EasyPaisa verification error:', error);
        throw new Error('Failed to verify payment');
    }
};
