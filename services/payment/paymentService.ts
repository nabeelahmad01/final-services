import {
    collection,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc,
    increment,
    runTransaction
} from 'firebase/firestore';
import { firestore as db } from '@/services/firebase/config';
import { Transaction } from '@/types';

export const processPayment = async (
    userId: string,
    amount: number,
    method: 'jazzcash' | 'easypaisa',
    phoneNumber: string
): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
    try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulate success/failure (90% success)
        const isSuccess = Math.random() < 0.9;

        if (!isSuccess) {
            return { success: false, error: 'Payment failed. Please try again.' };
        }

        // Create transaction record
        const transactionId = await runTransaction(db, async (transaction) => {
            // 1. Create transaction document
            const transactionRef = doc(collection(db, 'transactions'));
            const newTransaction: Partial<Transaction> = {
                userId,
                type: 'purchase',
                amount: amount, // Assuming 1 PKR = 1 Diamond for simplicity, or conversion logic
                paymentMethod: method,
                paymentDetails: {
                    transactionId: `TXN-${Date.now()}`,
                    amount: amount
                },
                status: 'completed',
                createdAt: serverTimestamp() as any
            };
            transaction.set(transactionRef, newTransaction);

            // 2. Update user's diamond balance
            const userRef = doc(db, 'users', userId);
            transaction.update(userRef, {
                diamondBalance: increment(amount) // Conversion rate logic here if needed
            });

            return transactionRef.id;
        });

        return { success: true, transactionId };
    } catch (error: any) {
        console.error('Payment error:', error);
        return { success: false, error: error.message || 'Payment processing failed' };
    }
};
