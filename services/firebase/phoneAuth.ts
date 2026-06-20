/**
 * Phone + Password Authentication Service (FREE - No SMS/OTP)
 * 
 * Uses Firebase Email/Password Auth with phone number as username
 * Phone number is converted to email format: {phone}@fixkar.app
 * 
 * Key Features:
 * - Phone number as username (no SMS cost!)
 * - Password-based authentication (FREE)
 * - Complete profile creation and login flow
 * - Backward compatible with existing code
 */

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail,
    updatePassword,
    User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, firestore } from './config';
import { User, UserRole, Mechanic } from '@/types';

/**
 * Format phone number to E.164 format
 */
const formatPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    if (cleaned.startsWith('0')) {
        cleaned = '+92' + cleaned.substring(1);
    }
    
    if (!cleaned.startsWith('+')) {
        cleaned = '+92' + cleaned;
    }
    
    return cleaned;
};

/**
 * Convert phone number to fake email for Firebase Auth
 * This allows us to use Firebase Email/Password auth (FREE) instead of SMS OTP (PAID)
 */
const phoneToEmail = (phone: string): string => {
    const formatted = formatPhoneNumber(phone);
    return `${formatted.replace(/\+/g, '')}@fixkar.app`;
};

/**
 * Sign up with phone number and password (FREE - no SMS!)
 */
export const signUpWithPhonePassword = async ({
    phone,
    password,
    name,
    role,
}: {
    phone: string;
    password: string;
    name: string;
    role: UserRole;
}): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
        const formattedPhone = formatPhoneNumber(phone);
        const email = phoneToEmail(phone);

        console.log('📝 Signing up with phone:', formattedPhone);
        console.log('📧 Using email:', email);

        // Check if phone number already exists in Firestore
        const [mechanicsSnap, customersSnap] = await Promise.all([
            getDocs(query(collection(firestore, 'mechanics'), where('phone', '==', formattedPhone))),
            getDocs(query(collection(firestore, 'customers'), where('phone', '==', formattedPhone)))
        ]);

        if (!mechanicsSnap.empty || !customersSnap.empty) {
            return { success: false, error: 'اس نمبر سے پہلے سے اکاؤنٹ موجود ہے۔ براہ کرم لاگ ان کریں۔' };
        }

        // Create Firebase Auth user with email/password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Update display name
        await updateProfile(firebaseUser, { displayName: name });

        const userData: User = {
            id: firebaseUser.uid,
            name,
            email: '', // No real email needed
            phone: formattedPhone,
            role,
            createdAt: new Date(),
        };

        const collectionName = role === 'mechanic' ? 'mechanics' : 'customers';

        if (role === 'mechanic') {
            const mechanicData: Partial<Mechanic> = {
                ...userData,
                categories: [],
                rating: 0,
                totalRatings: 0,
                ratingCount: 0,
                totalRating: 0,
                completedJobs: 0,
                diamondBalance: 5,
                totalEarnings: 0,
                isVerified: false,
                emailVerified: false,
                kycStatus: 'pending',
            };
            await setDoc(doc(firestore, collectionName, firebaseUser.uid), {
                ...mechanicData,
                createdAt: Timestamp.fromDate(userData.createdAt),
            });
        } else {
            await setDoc(doc(firestore, collectionName, firebaseUser.uid), {
                ...userData,
                emailVerified: false,
                createdAt: Timestamp.fromDate(userData.createdAt),
            });
        }

        console.log('✅ Signup successful for:', name);
        return { success: true, user: userData };

    } catch (error: any) {
        console.error('❌ Signup error:', error);

        let errorMessage = 'اکاؤنٹ بنانے میں ناکامی۔ دوبارہ کوشش کریں۔';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'اس نمبر سے پہلے سے اکاؤنٹ موجود ہے۔ براہ کرم لاگ ان کریں۔';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'پاسورڈ کم از کم 6 حروف کا ہونا چاہیے۔';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'فون نمبر غلط ہے۔ براہ کرم چیک کریں۔';
        }

        return { success: false, error: errorMessage };
    }
};

/**
 * Login with phone number and password (FREE - no SMS!)
 */
export const loginWithPhone = async (
    phone: string,
    password: string
): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
        const formattedPhone = formatPhoneNumber(phone);
        const email = phoneToEmail(phone);

        console.log('🔐 Logging in with phone:', formattedPhone);
        console.log('📧 Using email:', email);

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Find user in Firestore
        let userDoc = await getDoc(doc(firestore, 'mechanics', firebaseUser.uid));
        let role: UserRole = 'mechanic';

        if (!userDoc.exists()) {
            userDoc = await getDoc(doc(firestore, 'customers', firebaseUser.uid));
            role = 'customer';
        }

        if (!userDoc.exists()) {
            return { success: false, error: 'یوزر پروفائل نہیں ملا۔ براہ کرم سپورٹ سے رابطہ کریں۔' };
        }

        const data = userDoc.data();
        const user: User = {
            id: userDoc.id,
            name: data.name,
            email: data.email || '',
            phone: data.phone,
            role,
            createdAt: data.createdAt?.toDate() || new Date(),
            profilePic: data.profilePic,
        };

        console.log('✅ Login successful for:', user.name);
        return { success: true, user };

    } catch (error: any) {
        console.error('❌ Login error:', error);

        let errorMessage = 'لاگ ان ناکام۔ دوبارہ کوشش کریں۔';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'اس نمبر سے کوئی اکاؤنٹ نہیں ملا۔ پہلے سائن اپ کریں۔';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'غلط پاسورڈ۔ دوبارہ کوشش کریں۔';
        } else if (error.code === 'auth/invalid-credential') {
            errorMessage = 'غلط فون نمبر یا پاسورڈ۔';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'بہت زیادہ کوششیں۔ تھوڑی دیر بعد دوبارہ کوشش کریں۔';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'فون نمبر غلط ہے۔ براہ کرم چیک کریں۔';
        }

        return { success: false, error: errorMessage };
    }
};

/**
 * Reset password using phone number
 * Since we use fake emails, we handle this by updating the password directly
 * The user must verify their identity through their phone number match in Firestore
 */
export const resetPasswordWithPhone = async (
    phone: string,
    newPassword: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const formattedPhone = formatPhoneNumber(phone);

        // Check if user exists with this phone number
        const [mechanicsSnap, customersSnap] = await Promise.all([
            getDocs(query(collection(firestore, 'mechanics'), where('phone', '==', formattedPhone))),
            getDocs(query(collection(firestore, 'customers'), where('phone', '==', formattedPhone)))
        ]);

        if (mechanicsSnap.empty && customersSnap.empty) {
            return { success: false, error: 'اس نمبر سے کوئی اکاؤنٹ نہیں ملا۔' };
        }

        // Get the user's name for verification
        let userName = '';
        if (!mechanicsSnap.empty) {
            userName = mechanicsSnap.docs[0].data().name;
        } else if (!customersSnap.empty) {
            userName = customersSnap.docs[0].data().name;
        }

        // Since we can't send email to fake @fixkar.app, 
        // we need the user to be logged in to change password
        // This function should be called after admin verification or security question
        
        // For now, try to sign in and update password
        const email = phoneToEmail(phone);
        
        // We can't reset without the old password in Firebase client SDK
        // So this needs admin SDK or the user must be currently logged in
        // Return info that admin needs to help
        return { 
            success: false, 
            error: `اکاؤنٹ "${userName}" کا پاسورڈ ری سیٹ کرنے کے لیے ایڈمن سے رابطہ کریں۔` 
        };

    } catch (error: any) {
        console.error('❌ Password reset error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Change password for currently logged in user
 */
export const changePassword = async (
    newPassword: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const user = auth.currentUser;
        if (!user) {
            return { success: false, error: 'No authenticated user' };
        }

        await updatePassword(user, newPassword);
        console.log('✅ Password updated successfully');
        return { success: true };

    } catch (error: any) {
        console.error('❌ Error changing password:', error);
        
        if (error.code === 'auth/requires-recent-login') {
            return { success: false, error: 'براہ کرم دوبارہ لاگ ان کریں اور پھر پاسورڈ تبدیل کریں۔' };
        }
        
        return { success: false, error: error.message };
    }
};

/**
 * Complete user profile (for backward compatibility)
 * Now used directly during signup, not as a separate step
 */
export const completeProfile = async ({
    phone,
    name,
    email,
    role,
    password,
}: {
    phone: string;
    name: string;
    email?: string;
    role: UserRole;
    password?: string;
}): Promise<{ success: boolean; user?: User; error?: string }> => {
    // If password is provided, use the new signup flow
    if (password) {
        return signUpWithPhonePassword({ phone, password, name, role });
    }

    // Legacy flow - create profile without auth (dev mode)
    try {
        const formattedPhone = formatPhoneNumber(phone);
        const userId = `phone_${formattedPhone.replace(/\+/g, '')}`;

        const userData: User = {
            id: userId,
            name,
            email: email || '',
            phone: formattedPhone,
            role,
            createdAt: new Date(),
        };

        const collectionName = role === 'mechanic' ? 'mechanics' : 'customers';

        if (role === 'mechanic') {
            const mechanicData: Partial<Mechanic> = {
                ...userData,
                categories: [],
                rating: 0,
                totalRatings: 0,
                ratingCount: 0,
                totalRating: 0,
                completedJobs: 0,
                diamondBalance: 5,
                totalEarnings: 0,
                isVerified: false,
                emailVerified: false,
                kycStatus: 'pending',
            };
            await setDoc(doc(firestore, collectionName, userId), {
                ...mechanicData,
                createdAt: Timestamp.fromDate(userData.createdAt),
            });
        } else {
            await setDoc(doc(firestore, collectionName, userId), {
                ...userData,
                emailVerified: false,
                createdAt: Timestamp.fromDate(userData.createdAt),
            });
        }

        return { success: true, user: userData };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/**
 * Check if a phone number is already registered
 */
export const isPhoneRegistered = async (phone: string): Promise<boolean> => {
    const formattedPhone = formatPhoneNumber(phone);

    const [mechanicsSnap, customersSnap] = await Promise.all([
        getDocs(query(collection(firestore, 'mechanics'), where('phone', '==', formattedPhone))),
        getDocs(query(collection(firestore, 'customers'), where('phone', '==', formattedPhone)))
    ]);

    return !mechanicsSnap.empty || !customersSnap.empty;
};

/**
 * Check if mechanic can receive service requests
 */
export const canMechanicReceiveRequests = async (mechanicId: string): Promise<boolean> => {
    try {
        const mechanicDoc = await getDoc(doc(firestore, 'mechanics', mechanicId));
        if (!mechanicDoc.exists()) return false;

        const data = mechanicDoc.data();
        return data.kycStatus === 'approved';
    } catch (error) {
        console.error('Error checking mechanic eligibility:', error);
        return false;
    }
};

// ============================================================
// BACKWARD COMPATIBILITY EXPORTS
// These are no-ops or stubs for code that still references old OTP functions
// ============================================================

/** @deprecated No longer needed - using phone+password */
export const sendOTP = async (_phoneNumber: string, _recaptchaVerifier?: any) => {
    console.warn('⚠️ sendOTP is deprecated. Using phone+password auth now.');
    return { success: false, error: 'OTP system removed. Please use phone + password login.' };
};

/** @deprecated No longer needed - using phone+password */
export const verifyOTP = async (_otp: string) => {
    console.warn('⚠️ verifyOTP is deprecated. Using phone+password auth now.');
    return { success: false, error: 'OTP system removed. Please use phone + password login.' };
};

/** @deprecated No longer needed - using phone+password */
export const resendOTP = async () => {
    console.warn('⚠️ resendOTP is deprecated. Using phone+password auth now.');
    return { success: false, error: 'OTP system removed. Please use phone + password login.' };
};

/** @deprecated No longer needed */
export const sendPasswordReset = async (phone: string) => {
    return resetPasswordWithPhone(phone, '');
};

/** @deprecated No longer needed */
export const getPendingPhone = (): string | null => null;

/** @deprecated No longer needed */
export const isDevMode = (): boolean => false;

/** @deprecated No longer needed */
export const clearVerificationState = () => {};

/** @deprecated No longer needed */
export const sendVerificationEmail = async () => ({ success: false, error: 'Not available' });

/** @deprecated No longer needed */
export const isEmailVerified = (): boolean => false;

/** @deprecated No longer needed */
export const updateEmailVerificationStatus = async (_verified: boolean) => {};

/** @deprecated No longer needed */
export const syncAuthToWebSDK = async () => {};

export { formatPhoneNumber };
