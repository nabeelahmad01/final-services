/**
 * Referral Program Service for FixKar
 * Handles referral codes, tracking, and rewards
 */

import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
} from 'firebase/firestore';
import { firestore } from './config';

export interface Referral {
    id: string;
    referrerId: string;      // User who made the referral
    referrerName: string;
    referredId: string;       // User who signed up using the code
    referredName: string;
    referredPhone: string;
    referrerReward: number;   // Diamonds given to referrer
    referredReward: number;   // Diamonds given to new user
    status: 'pending' | 'completed' | 'expired';
    createdAt: Date;
    completedAt?: Date;
}

export interface ReferralStats {
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    totalDiamondsEarned: number;
}

// Reward amounts (configurable)
const REFERRER_REWARD_DIAMONDS = 5; // Diamonds for the referrer
const REFERRED_REWARD_DIAMONDS = 3; // Diamonds for new user

/**
 * Generate a unique referral code for a user
 * Format: USER_<last6chars>_<random3>
 */
export const generateReferralCode = (userId: string): string => {
    const userPart = userId.slice(-6).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `FK${userPart}${randomPart}`;
};

/**
 * Get or create referral code for a user
 */
export const getUserReferralCode = async (userId: string): Promise<string> => {
    // Check if user already has a referral code saved
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists() && userDoc.data().referralCode) {
        return userDoc.data().referralCode;
    }

    // Also check mechanics collection
    const mechanicRef = doc(firestore, 'mechanics', userId);
    const mechanicDoc = await getDoc(mechanicRef);

    if (mechanicDoc.exists() && mechanicDoc.data().referralCode) {
        return mechanicDoc.data().referralCode;
    }

    // Generate new code
    const code = generateReferralCode(userId);

    // Try to save to appropriate collection
    try {
        if (mechanicDoc.exists()) {
            await updateDoc(mechanicRef, { referralCode: code });
        } else {
            // Create or update in customers collection
            const customerRef = doc(firestore, 'customers', userId);
            await updateDoc(customerRef, { referralCode: code }).catch(() => {
                // If doesn't exist, that's ok
            });
        }
    } catch (error) {
        console.log('Could not save referral code to user profile');
    }

    return code;
};

/**
 * Find who owns a referral code
 */
export const findReferrer = async (
    code: string
): Promise<{ userId: string; name: string } | null> => {
    const normalizedCode = code.toUpperCase().trim();

    // Check mechanics
    const mechanicsQuery = query(
        collection(firestore, 'mechanics'),
        where('referralCode', '==', normalizedCode),
        limit(1)
    );
    const mechanicsSnap = await getDocs(mechanicsQuery);
    if (!mechanicsSnap.empty) {
        const doc = mechanicsSnap.docs[0];
        return { userId: doc.id, name: doc.data().name };
    }

    // Check customers
    const customersQuery = query(
        collection(firestore, 'customers'),
        where('referralCode', '==', normalizedCode),
        limit(1)
    );
    const customersSnap = await getDocs(customersQuery);
    if (!customersSnap.empty) {
        const doc = customersSnap.docs[0];
        return { userId: doc.id, name: doc.data().name };
    }

    return null;
};

/**
 * Record a new referral when someone signs up with a code
 */
export const recordReferral = async (
    referralCode: string,
    newUserId: string,
    newUserName: string,
    newUserPhone: string
): Promise<string | null> => {
    try {
        // Find the referrer
        const referrer = await findReferrer(referralCode);
        if (!referrer) {
            console.log('Referral code not found:', referralCode);
            return null;
        }

        // Don't allow self-referral
        if (referrer.userId === newUserId) {
            console.log('Cannot refer yourself');
            return null;
        }

        // Check if this user was already referred
        const existingQuery = query(
            collection(firestore, 'referrals'),
            where('referredId', '==', newUserId),
            limit(1)
        );
        const existingSnap = await getDocs(existingQuery);
        if (!existingSnap.empty) {
            console.log('User was already referred');
            return null;
        }

        // Create referral record
        const referralData = {
            referrerId: referrer.userId,
            referrerName: referrer.name,
            referredId: newUserId,
            referredName: newUserName,
            referredPhone: newUserPhone,
            referrerReward: REFERRER_REWARD_DIAMONDS,
            referredReward: REFERRED_REWARD_DIAMONDS,
            status: 'pending',
            createdAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(firestore, 'referrals'), referralData);
        return docRef.id;
    } catch (error) {
        console.error('Error recording referral:', error);
        return null;
    }
};

/**
 * Complete a referral and give rewards
 * Called when the referred user makes their first booking or action
 */
export const completeReferral = async (referredUserId: string): Promise<boolean> => {
    try {
        // Find pending referral
        const q = query(
            collection(firestore, 'referrals'),
            where('referredId', '==', referredUserId),
            where('status', '==', 'pending'),
            limit(1)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) return false;

        const referralDoc = snapshot.docs[0];
        const referral = referralDoc.data();

        // Import updateMechanicDiamonds to give rewards
        const { updateMechanicDiamonds } = await import('./firestore');

        // Give reward to referrer (if they're a mechanic)
        try {
            await updateMechanicDiamonds(
                referral.referrerId,
                referral.referrerReward,
                'add'
            );
        } catch (e) {
            // Referrer might be a customer, skip diamond reward
        }

        // Give reward to referred user (if they're a mechanic)
        try {
            await updateMechanicDiamonds(
                referral.referredId,
                referral.referredReward,
                'add'
            );
        } catch (e) {
            // Referred user might be a customer, skip diamond reward
        }

        // Mark referral as completed
        await updateDoc(referralDoc.ref, {
            status: 'completed',
            completedAt: Timestamp.now(),
        });

        return true;
    } catch (error) {
        console.error('Error completing referral:', error);
        return false;
    }
};

/**
 * Get referral stats for a user
 */
export const getReferralStats = async (userId: string): Promise<ReferralStats> => {
    const q = query(
        collection(firestore, 'referrals'),
        where('referrerId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const referrals = snapshot.docs.map(doc => doc.data());

    const completed = referrals.filter(r => r.status === 'completed');
    const pending = referrals.filter(r => r.status === 'pending');

    return {
        totalReferrals: referrals.length,
        completedReferrals: completed.length,
        pendingReferrals: pending.length,
        totalDiamondsEarned: completed.reduce((sum, r) => sum + (r.referrerReward || 0), 0),
    };
};

/**
 * Get referral history for a user
 */
export const getReferralHistory = async (userId: string): Promise<Referral[]> => {
    const q = query(
        collection(firestore, 'referrals'),
        where('referrerId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate(),
    })) as Referral[];
};

export default {
    generateReferralCode,
    getUserReferralCode,
    findReferrer,
    recordReferral,
    completeReferral,
    getReferralStats,
    getReferralHistory,
    REFERRER_REWARD_DIAMONDS,
    REFERRED_REWARD_DIAMONDS,
};
