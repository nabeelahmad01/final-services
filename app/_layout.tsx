import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { subscribeToAuthChanges, getCurrentUser } from '@/services/firebase/auth';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
    const { setUser, setLoading } = useAuthStore();

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
            if (firebaseUser) {
                const user = await getCurrentUser();
                setUser(user);
            } else {
                setUser(null);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(customer)" />
                <Stack.Screen name="(mechanic)" />
                <Stack.Screen name="(shared)" />
            </Stack>
        </>
    );
}
