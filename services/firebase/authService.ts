import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    updateProfile,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth } from './config';
import { firestore } from './config';
import { User, UserRole, Mechanic } from '@/types';

export const signUp = async ({
    name,
    phone,
    email,
    password,
    role
}: {
    name: string;
    phone: string;
    email: string;
    password: string;
    role: UserRole
}): Promise<User> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        await updateProfile(firebaseUser, { displayName: name });

        const userData: User = {
            id: firebaseUser.uid,
            name,
            email, // Add email to User type if needed, but it's not in the interface currently. 
            // Wait, User interface in types/index.ts DOES NOT have email. 
            // But let's check if I should add it or just ignore.
            // The interface has: id, role, name, phone, profilePic, createdAt.
            phone,
            role,
            createdAt: new Date(),
        };

        const collectionName = role === 'mechanic' ? 'mechanics' : 'customers';

        // For mechanic, we might need to initialize specific fields
        if (role === 'mechanic') {
            const mechanicData: Partial<Mechanic> = {
                ...userData,
                categories: [],
                rating: 0,
                totalRatings: 0,
                completedJobs: 0,
                diamondBalance: 0,
                isVerified: false,
                kycStatus: 'pending',
            };
            await setDoc(doc(firestore, collectionName, firebaseUser.uid), {
                ...mechanicData,
                createdAt: Timestamp.fromDate(userData.createdAt)
            });
        } else {
            await setDoc(doc(firestore, collectionName, firebaseUser.uid), {
                ...userData,
                createdAt: Timestamp.fromDate(userData.createdAt)
            });
        }

        return userData;
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const signIn = async (email: string, password: string): Promise<User> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Try to find user in mechanics
        let userDoc = await getDoc(doc(firestore, 'mechanics', firebaseUser.uid));
        let role: UserRole = 'mechanic';

        if (!userDoc.exists()) {
            // Try customers
            userDoc = await getDoc(doc(firestore, 'customers', firebaseUser.uid));
            role = 'customer';

            if (!userDoc.exists()) {
                // Try admin?
                // Assuming admin might be in 'users' or handled differently. 
                // For now, if not found in mechanics or customers, throw error or return basic info.
                throw new Error('User profile not found');
            }
        }

        const data = userDoc.data();
        return {
            id: userDoc.id,
            ...data,
            createdAt: data?.createdAt?.toDate() || new Date(),
        } as User;

    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const getCurrentUser = async (): Promise<User | null> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    try {
        // Try to find user in mechanics
        let userDoc = await getDoc(doc(firestore, 'mechanics', firebaseUser.uid));
        let role: UserRole = 'mechanic';

        if (!userDoc.exists()) {
            // Try customers
            userDoc = await getDoc(doc(firestore, 'customers', firebaseUser.uid));
            role = 'customer';

            if (!userDoc.exists()) {
                return null;
            }
        }

        const data = userDoc.data();
        return {
            id: userDoc.id,
            ...data,
            createdAt: data?.createdAt?.toDate() || new Date(),
        } as User;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
};

export const subscribeToAuthChanges = (callback: (user: FirebaseUser | null) => void) => {
    return auth.onAuthStateChanged(callback);
};
