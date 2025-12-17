/**
 * Promo Code Service for FixKar Admin
 * Handles creating, managing, and validating promotional codes
 */

import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
} from 'firebase/firestore';
import { firestore } from './config';

export interface PromoCode {
    id: string;
    code: string;
    type: 'percentage' | 'fixed' | 'diamonds';
    value: number; // Percentage (0-100), fixed PKR amount, or number of diamonds
    description: string;
    minAmount?: number; // Minimum purchase amount required
    maxDiscount?: number; // Maximum discount amount (for percentage type)
    maxUses: number; // Total times this code can be used (0 = unlimited)
    usedCount: number; // How many times it's been used
    usedBy: string[]; // User IDs who have used this code
    validFrom: Date;
    validUntil: Date;
    isActive: boolean;
    createdAt: Date;
    createdBy: string;
}

export interface PromoCodeInput {
    code: string;
    type: 'percentage' | 'fixed' | 'diamonds';
    value: number;
    description: string;
    minAmount?: number;
    maxDiscount?: number;
    maxUses?: number;
    validFrom?: Date;
    validUntil: Date;
}

// Create a new promo code
export const createPromoCode = async (
    input: PromoCodeInput,
    adminId: string
): Promise<string> => {
    const code = input.code.toUpperCase().trim();

    // Check if code already exists
    const existingCode = await getPromoCodeByCode(code);
    if (existingCode) {
        throw new Error('This promo code already exists');
    }

    const promoData = {
        code,
        type: input.type,
        value: input.value,
        description: input.description,
        minAmount: input.minAmount || 0,
        maxDiscount: input.maxDiscount || null,
        maxUses: input.maxUses || 0,
        usedCount: 0,
        usedBy: [],
        validFrom: Timestamp.fromDate(input.validFrom || new Date()),
        validUntil: Timestamp.fromDate(input.validUntil),
        isActive: true,
        createdAt: Timestamp.now(),
        createdBy: adminId,
    };

    const docRef = await addDoc(collection(firestore, 'promoCodes'), promoData);
    return docRef.id;
};

// Get promo code by ID
export const getPromoCode = async (id: string): Promise<PromoCode | null> => {
    const docSnap = await getDoc(doc(firestore, 'promoCodes', id));
    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        validFrom: data.validFrom?.toDate() || new Date(),
        validUntil: data.validUntil?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
    } as PromoCode;
};

// Get promo code by code string
export const getPromoCodeByCode = async (code: string): Promise<PromoCode | null> => {
    const q = query(
        collection(firestore, 'promoCodes'),
        where('code', '==', code.toUpperCase().trim()),
        limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const docData = snapshot.docs[0];
    const data = docData.data();
    return {
        id: docData.id,
        ...data,
        validFrom: data.validFrom?.toDate() || new Date(),
        validUntil: data.validUntil?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
    } as PromoCode;
};

// Get all promo codes for admin
export const getAllPromoCodes = async (): Promise<PromoCode[]> => {
    const q = query(
        collection(firestore, 'promoCodes'),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            validFrom: data.validFrom?.toDate() || new Date(),
            validUntil: data.validUntil?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
        } as PromoCode;
    });
};

// Validate a promo code for a user
export const validatePromoCode = async (
    code: string,
    userId: string,
    purchaseAmount: number = 0
): Promise<{
    isValid: boolean;
    error?: string;
    promoCode?: PromoCode;
    discountAmount?: number;
}> => {
    const promo = await getPromoCodeByCode(code);

    if (!promo) {
        return { isValid: false, error: 'Invalid promo code' };
    }

    if (!promo.isActive) {
        return { isValid: false, error: 'This promo code is no longer active' };
    }

    const now = new Date();
    if (now < promo.validFrom) {
        return { isValid: false, error: 'This promo code is not yet valid' };
    }

    if (now > promo.validUntil) {
        return { isValid: false, error: 'This promo code has expired' };
    }

    if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
        return { isValid: false, error: 'This promo code has reached its usage limit' };
    }

    if (promo.usedBy.includes(userId)) {
        return { isValid: false, error: 'You have already used this promo code' };
    }

    if (promo.minAmount && purchaseAmount < promo.minAmount) {
        return { 
            isValid: false, 
            error: `Minimum purchase of PKR ${promo.minAmount} required for this code` 
        };
    }

    // Calculate discount
    let discountAmount = 0;
    if (promo.type === 'percentage') {
        discountAmount = (purchaseAmount * promo.value) / 100;
        if (promo.maxDiscount) {
            discountAmount = Math.min(discountAmount, promo.maxDiscount);
        }
    } else if (promo.type === 'fixed') {
        discountAmount = promo.value;
    } else if (promo.type === 'diamonds') {
        discountAmount = promo.value; // Number of free diamonds
    }

    return {
        isValid: true,
        promoCode: promo,
        discountAmount,
    };
};

// Apply a promo code (mark as used)
export const applyPromoCode = async (
    promoId: string,
    userId: string
): Promise<void> => {
    const promoRef = doc(firestore, 'promoCodes', promoId);
    const promo = await getDoc(promoRef);

    if (!promo.exists()) {
        throw new Error('Promo code not found');
    }

    const data = promo.data();
    await updateDoc(promoRef, {
        usedCount: (data.usedCount || 0) + 1,
        usedBy: [...(data.usedBy || []), userId],
    });
};

// Update promo code
export const updatePromoCode = async (
    id: string,
    updates: Partial<PromoCodeInput & { isActive: boolean }>
): Promise<void> => {
    const updateData: Record<string, any> = { ...updates };

    if (updates.validFrom) {
        updateData.validFrom = Timestamp.fromDate(updates.validFrom);
    }
    if (updates.validUntil) {
        updateData.validUntil = Timestamp.fromDate(updates.validUntil);
    }
    if (updates.code) {
        updateData.code = updates.code.toUpperCase().trim();
    }

    await updateDoc(doc(firestore, 'promoCodes', id), updateData);
};

// Delete promo code
export const deletePromoCode = async (id: string): Promise<void> => {
    await deleteDoc(doc(firestore, 'promoCodes', id));
};

// Deactivate promo code
export const deactivatePromoCode = async (id: string): Promise<void> => {
    await updateDoc(doc(firestore, 'promoCodes', id), { isActive: false });
};

// Activate promo code
export const activatePromoCode = async (id: string): Promise<void> => {
    await updateDoc(doc(firestore, 'promoCodes', id), { isActive: true });
};

export default {
    createPromoCode,
    getPromoCode,
    getPromoCodeByCode,
    getAllPromoCodes,
    validatePromoCode,
    applyPromoCode,
    updatePromoCode,
    deletePromoCode,
    deactivatePromoCode,
    activatePromoCode,
};
