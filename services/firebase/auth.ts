import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, firestore } from './config';
import { User, UserRole } from '@/types';

export interface SignUpData {
    email: string;
    password: string;
    name: string;
    phone: string;
    role: UserRole;
}

export const signUp = async (data: SignUpData): Promise<User> => {
    try {
        // Create auth user
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            data.email,
            data.password
        );

        // Create user document
        const user: User = {
            id: userCredential.user.uid,
            role: data.role,
            name: data.name,
            phone: data.phone,
            createdAt: new Date(),
        };

        await setDoc(doc(firestore, 'users', user.id), user);

        // If mechanic, create mechanic document with default values
        if (data.role === 'mechanic') {
            await setDoc(doc(firestore, 'mechanics', user.id), {
                ...user,
                categories: [],
                rating: 0,
                totalRatings: 0,
                completedJobs: 0,
                diamondBalance: 0,
                isVerified: false,
                kycStatus: 'pending',
            });
        }

        return user;
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const signIn = async (email: string, password: string): Promise<User> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(firestore, 'users', userCredential.user.uid));

        if (!userDoc.exists()) {
            throw new Error('User data not found');
        }

        return userDoc.data() as User;
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const signOut = async (): Promise<void> => {
    try {
        await firebaseSignOut(auth);
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const getCurrentUser = async (): Promise<User | null> => {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
    if (!userDoc.exists()) return null;

    return userDoc.data() as User;
};

export const subscribeToAuthChanges = (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
};
