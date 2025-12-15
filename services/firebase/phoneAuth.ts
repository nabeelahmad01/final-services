/**
 * Phone OTP Authentication Service
 * 
 * Uses @react-native-firebase/auth for native Firebase Phone Authentication
 * Works with Firebase Console test phone numbers and real SMS in production
 */

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    sendEmailVerification,
    User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, firestore } from './config';
import { User, UserRole, Mechanic } from '@/types';

// Try to import native Firebase auth
let firebaseAuth: any = null;
let nativeFirebaseAvailable = false;
try {
    firebaseAuth = require('@react-native-firebase/auth').default;
    nativeFirebaseAvailable = true;
    console.log('✅ Native Firebase Auth loaded successfully');
} catch (e: any) {
    console.log('⚠️ Native Firebase Auth not available:', e.message);
    nativeFirebaseAvailable = false;
}

// Check environment for OTP mode
const DEV_MODE = process.env.EXPO_PUBLIC_OTP_DEV_MODE === 'true' || !firebaseAuth;

// Store for OTP verification
let pendingVerification: {
    phone: string;
    otp: string;
    expiresAt: Date;
    confirmationResult?: any;
} | null = null;

/**
 * Generate a random 6-digit OTP (for dev mode)
 */
const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

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
 * Send OTP to phone number
 * Uses Firebase Phone Auth for real SMS or test phone numbers
 */
export const sendOTP = async (
    phoneNumber: string,
    _recaptchaVerifier?: any
): Promise<{ success: boolean; otp?: string; error?: string; isDevMode?: boolean }> => {
    try {
        const formattedPhone = formatPhoneNumber(phoneNumber);
        console.log('📱 Sending OTP to:', formattedPhone);
        console.log('📱 Dev Mode:', DEV_MODE);
        console.log('📱 Firebase Auth available:', !!firebaseAuth);

        // Use native Firebase Phone Auth if available
        if (firebaseAuth && !DEV_MODE) {
            try {
                console.log('🔥 Using Firebase Phone Auth...');
                
                // Configure auth settings to use native verification (Play Integrity)
                // This prevents the reCAPTCHA from opening in Chrome
                const auth = firebaseAuth();
                
                // For testing: uncomment this to disable app verification
                // auth.settings.appVerificationDisabledForTesting = true;
                
                // Use signInWithPhoneNumber with forceResend disabled
                // The second parameter can be used for forceResend token
                const confirmation = await auth.signInWithPhoneNumber(formattedPhone);
                
                pendingVerification = {
                    phone: formattedPhone,
                    otp: '', // Will be entered by user
                    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                    confirmationResult: confirmation,
                };

                console.log('✅ OTP sent via Firebase Phone Auth');
                return { success: true, isDevMode: false };
            } catch (firebaseError: any) {
                console.error('❌ Firebase Phone Auth error:', firebaseError);
                
                // Handle specific Firebase errors
                if (firebaseError.code === 'auth/invalid-phone-number') {
                    return { success: false, error: 'Invalid phone number format' };
                }
                if (firebaseError.code === 'auth/too-many-requests') {
                    return { success: false, error: 'Too many attempts. Please try again later.' };
                }
                if (firebaseError.code === 'auth/quota-exceeded') {
                    return { success: false, error: 'SMS quota exceeded. Please try again later.' };
                }
                
                // Fall back to dev mode if Firebase fails
                console.log('⚠️ Falling back to dev mode...');
            }
        }

        // Development mode - simulate OTP
        const otp = generateOTP();
        pendingVerification = {
            phone: formattedPhone,
            otp,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        };

        console.log('🔐 [DEV MODE] Generated OTP:', otp);
        return { success: true, otp, isDevMode: true };

    } catch (error: any) {
        console.error('❌ Error sending OTP:', error);
        return { success: false, error: error.message || 'Failed to send OTP' };
    }
};

/**
 * Verify OTP code
 */
export const verifyOTP = async (
    otp: string
): Promise<{ success: boolean; phone?: string; isNewUser?: boolean; error?: string }> => {
    try {
        console.log('🔐 Verifying OTP...');

        if (!pendingVerification) {
            return { success: false, error: 'No verification in progress. Please request OTP first.' };
        }

        if (new Date() > pendingVerification.expiresAt) {
            pendingVerification = null;
            return { success: false, error: 'OTP expired. Please request a new one.' };
        }

        const phone = pendingVerification.phone;

        // Verify with Firebase Phone Auth if available
        if (pendingVerification.confirmationResult) {
            try {
                console.log('🔥 Verifying with Firebase Phone Auth...');
                await pendingVerification.confirmationResult.confirm(otp);
                console.log('✅ Firebase OTP verified successfully');
            } catch (e: any) {
                console.error('❌ Firebase OTP verification failed:', e);
                if (e.code === 'auth/invalid-verification-code') {
                    return { success: false, error: 'Invalid OTP code. Please check and try again.' };
                }
                return { success: false, error: e.message || 'Invalid OTP code' };
            }
        } else {
            // Dev mode verification
            if (otp !== pendingVerification.otp) {
                return { success: false, error: 'Invalid OTP code. Please check and try again.' };
            }
        }

        // Check if user exists with this phone
        const [mechanicsSnap, customersSnap] = await Promise.all([
            getDocs(query(collection(firestore, 'mechanics'), where('phone', '==', phone))),
            getDocs(query(collection(firestore, 'customers'), where('phone', '==', phone)))
        ]);

        const isNewUser = mechanicsSnap.empty && customersSnap.empty;

        console.log('✅ OTP verified successfully');
        console.log('📱 Phone:', phone);
        console.log('👤 Is new user:', isNewUser);
        
        pendingVerification = null;

        return { success: true, phone, isNewUser };

    } catch (error: any) {
        console.error('❌ Error verifying OTP:', error);
        return { success: false, error: error.message || 'Verification failed' };
    }
};

/**
 * Complete user profile after phone verification
 */
export const completeProfile = async ({
    phone,
    name,
    email,
    password,
    role,
}: {
    phone: string;
    name: string;
    email?: string;
    password: string;
    role: UserRole;
}): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
        console.log('📝 Creating profile for phone:', phone);

        const formattedPhone = formatPhoneNumber(phone);
        const userEmail = email || `${formattedPhone.replace(/\+/g, '')}@fixkar.app`;

        const userCredential = await createUserWithEmailAndPassword(auth, userEmail, password);
        const firebaseUser = userCredential.user;

        await updateProfile(firebaseUser, { displayName: name });

        const userData: User = {
            id: firebaseUser.uid,
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
                categories: [], // Will be set in mechanic-categories screen
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
                createdAt: Timestamp.fromDate(userData.createdAt),
            });
        }

        if (email && !email.endsWith('@fixkar.app')) {
            try {
                await sendEmailVerification(firebaseUser);
            } catch (e) {
                console.log('Could not send verification email:', e);
            }
        }

        console.log('✅ Profile created successfully');
        return { success: true, user: userData };

    } catch (error: any) {
        console.error('❌ Error completing profile:', error);

        let errorMessage = error.message;
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This phone number is already registered. Please login instead.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak. Please use at least 6 characters.';
        }

        return { success: false, error: errorMessage };
    }
};

/**
 * Login existing user with phone and password
 */
export const loginWithPhone = async (
    phone: string,
    password: string
): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
        const formattedPhone = formatPhoneNumber(phone);
        const userEmail = `${formattedPhone.replace(/\+/g, '')}@fixkar.app`;

        console.log('🔐 Logging in with:', userEmail);

        const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
        const firebaseUser = userCredential.user;

        let userDoc = await getDoc(doc(firestore, 'mechanics', firebaseUser.uid));
        let role: UserRole = 'mechanic';

        if (!userDoc.exists()) {
            userDoc = await getDoc(doc(firestore, 'customers', firebaseUser.uid));
            role = 'customer';
        }

        if (!userDoc.exists()) {
            return { success: false, error: 'User profile not found. Please contact support.' };
        }

        const data = userDoc.data();
        const user: User = {
            id: userDoc.id,
            name: data.name,
            email: data.email || '',
            phone: data.phone,
            role,
            createdAt: data.createdAt?.toDate() || new Date(),
        };

        console.log('✅ Login successful for:', user.name);
        return { success: true, user };

    } catch (error: any) {
        console.error('❌ Login error:', error);

        let errorMessage = 'Login failed. Please try again.';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this phone number.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password. Please try again.';
        } else if (error.code === 'auth/invalid-credential') {
            errorMessage = 'Invalid phone number or password.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed attempts. Please try again later.';
        }

        return { success: false, error: errorMessage };
    }
};

/**
 * Send password reset via OTP
 */
export const sendPasswordReset = async (phone: string): Promise<{ success: boolean; otp?: string; error?: string }> => {
    try {
        const formattedPhone = formatPhoneNumber(phone);

        const [mechanicsSnap, customersSnap] = await Promise.all([
            getDocs(query(collection(firestore, 'mechanics'), where('phone', '==', formattedPhone))),
            getDocs(query(collection(firestore, 'customers'), where('phone', '==', formattedPhone)))
        ]);

        if (mechanicsSnap.empty && customersSnap.empty) {
            return { success: false, error: 'No account found with this phone number.' };
        }

        return await sendOTP(phone);

    } catch (error: any) {
        console.error('❌ Password reset error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send email verification link
 */
export const sendVerificationEmail = async (): Promise<{ success: boolean; error?: string }> => {
    try {
        const user = auth.currentUser;
        if (!user) {
            return { success: false, error: 'No authenticated user' };
        }

        if (!user.email || user.email.endsWith('@fixkar.app')) {
            return { success: false, error: 'No real email linked to this account' };
        }

        await sendEmailVerification(user);
        console.log('📧 Verification email sent');
        return { success: true };
    } catch (error: any) {
        console.error('❌ Error sending verification email:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Check if user's email is verified
 */
export const isEmailVerified = (): boolean => {
    const user = auth.currentUser;
    return user?.emailVerified || false;
};

/**
 * Update email verification status in Firestore
 */
export const updateEmailVerificationStatus = async (verified: boolean): Promise<void> => {
    try {
        const user = auth.currentUser;
        if (!user) return;

        const mechanicRef = doc(firestore, 'mechanics', user.uid);
        const mechanicDoc = await getDoc(mechanicRef);

        if (mechanicDoc.exists()) {
            await updateDoc(mechanicRef, { emailVerified: verified });
        } else {
            const customerRef = doc(firestore, 'customers', user.uid);
            const customerDoc = await getDoc(customerRef);
            if (customerDoc.exists()) {
                await updateDoc(customerRef, { emailVerified: verified });
            }
        }
    } catch (error) {
        console.error('Error updating email verification status:', error);
    }
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

/**
 * Get pending verification phone
 */
export const getPendingPhone = (): string | null => {
    return pendingVerification?.phone || null;
};

/**
 * Check if we're in development OTP mode
 */
export const isDevMode = (): boolean => {
    return DEV_MODE;
};

/**
 * Clear verification state
 */
export const clearVerificationState = () => {
    pendingVerification = null;
};
