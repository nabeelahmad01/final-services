/**
 * Phone OTP Authentication Service
 * 
 * IMPORTANT: Firebase Phone Auth requires:
 * - For production: @react-native-firebase/auth (native module)
 * - Firebase Console: Enable Phone provider + add test phone numbers
 * 
 * This implementation uses a development mode simulation
 * For production, integrate @react-native-firebase/auth
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

// Development mode - simulates OTP flow
// In production, replace with @react-native-firebase/auth
const DEV_MODE = true;

// Store for development OTP simulation
let pendingVerification: {
    phone: string;
    otp: string;
    expiresAt: Date;
} | null = null;

/**
 * Generate a random 6-digit OTP
 */
const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP to phone number
 * In development mode: Generates OTP and logs it
 * In production: Would use Firebase Phone Auth
 */
export const sendOTP = async (
    phoneNumber: string,
    _recaptchaVerifier?: any
): Promise<{ success: boolean; otp?: string; error?: string }> => {
    try {
        console.log('📱 Sending OTP to:', phoneNumber);

        // Format phone number
        const formattedPhone = phoneNumber.startsWith('+')
            ? phoneNumber
            : `+92${phoneNumber.replace(/^0/, '')}`;

        if (DEV_MODE) {
            // Development mode - simulate OTP
            const otp = generateOTP();
            pendingVerification = {
                phone: formattedPhone,
                otp,
                expiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes
            };

            console.log('🔐 [DEV MODE] OTP Code:', otp);
            console.log('⚠️ In production, SMS would be sent via Firebase');

            // Show OTP in alert for development testing
            return { success: true, otp }; // Return OTP for dev testing UI
        }

        // Production mode would use Firebase Phone Auth
        // This requires @react-native-firebase/auth native module
        return {
            success: false,
            error: 'Phone Auth requires native Firebase module. Use development mode or install @react-native-firebase/auth'
        };

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

        if (DEV_MODE) {
            if (!pendingVerification) {
                return { success: false, error: 'No verification in progress. Please request OTP first.' };
            }

            if (new Date() > pendingVerification.expiresAt) {
                pendingVerification = null;
                return { success: false, error: 'OTP expired. Please request a new one.' };
            }

            if (otp !== pendingVerification.otp) {
                return { success: false, error: 'Invalid OTP code' };
            }

            const phone = pendingVerification.phone;

            // Check if user exists with this phone
            const mechanicsQuery = query(
                collection(firestore, 'mechanics'),
                where('phone', '==', phone)
            );
            const customersQuery = query(
                collection(firestore, 'customers'),
                where('phone', '==', phone)
            );

            const [mechanicsSnap, customersSnap] = await Promise.all([
                getDocs(mechanicsQuery),
                getDocs(customersQuery)
            ]);

            const isNewUser = mechanicsSnap.empty && customersSnap.empty;

            console.log('✅ OTP verified, isNewUser:', isNewUser);
            pendingVerification = null;

            return { success: true, phone, isNewUser };
        }

        return { success: false, error: 'Production mode requires Firebase Phone Auth' };

    } catch (error: any) {
        console.error('❌ Error verifying OTP:', error);
        return { success: false, error: error.message || 'Invalid OTP' };
    }
};

/**
 * Complete user profile after phone verification
 * Creates account using email/password (phone stored in profile)
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

        // Create email from phone if not provided
        const userEmail = email || `${phone.replace(/\+/g, '')}@fixkar.app`;

        // Create Firebase Auth account
        const userCredential = await createUserWithEmailAndPassword(auth, userEmail, password);
        const firebaseUser = userCredential.user;

        // Update display name
        await updateProfile(firebaseUser, { displayName: name });

        const userData: User = {
            id: firebaseUser.uid,
            name,
            email: email || '',
            phone,
            role,
            createdAt: new Date(),
        };

        const collectionName = role === 'mechanic' ? 'mechanics' : 'customers';

        if (role === 'mechanic') {
            const mechanicData: Partial<Mechanic> = {
                ...userData,
                categories: ['car_mechanic'],
                rating: 0,
                totalRatings: 0,
                ratingCount: 0,
                totalRating: 0,
                completedJobs: 0,
                diamondBalance: 5, // Free diamonds to start
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

        // Send email verification if real email provided
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
            errorMessage = 'This phone number is already registered. Please login.';
        }

        return { success: false, error: errorMessage };
    }
};

/**
 * Login existing user with phone
 */
export const loginWithPhone = async (
    phone: string,
    password: string
): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
        // Create email from phone
        const userEmail = `${phone.replace(/\+/g, '')}@fixkar.app`;

        const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
        const firebaseUser = userCredential.user;

        // Get user data from Firestore
        let userDoc = await getDoc(doc(firestore, 'mechanics', firebaseUser.uid));
        let role: UserRole = 'mechanic';

        if (!userDoc.exists()) {
            userDoc = await getDoc(doc(firestore, 'customers', firebaseUser.uid));
            role = 'customer';
        }

        if (!userDoc.exists()) {
            return { success: false, error: 'User profile not found' };
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

        return { success: true, user };

    } catch (error: any) {
        console.error('❌ Login error:', error);

        let errorMessage = 'Login failed';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = 'Invalid phone number or password';
        }

        return { success: false, error: errorMessage };
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
 * Clear verification state
 */
export const clearVerificationState = () => {
    pendingVerification = null;
};
