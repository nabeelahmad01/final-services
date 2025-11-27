import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { subscribeToAuthChanges, getCurrentUser } from '@/services/firebase/authService';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from '@expo-google-fonts/plus-jakarta-sans';
import {
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ModalProvider } from '@/utils/modalService';
import '@/utils/i18n';

export default function RootLayout() {
    const { setUser, setLoading } = useAuthStore();

    // Load custom fonts
    const [fontsLoaded, fontError] = useFonts({
        PlusJakartaSans_300Light,
        PlusJakartaSans_400Regular,
        PlusJakartaSans_500Medium,
        PlusJakartaSans_600SemiBold,
        PlusJakartaSans_700Bold,
    });

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

    // Show loading screen while fonts are loading
    if (!fontsLoaded && !fontError) {
        return (
            <View style={{ flex: 1 }}>
                <LoadingSpinner fullScreen />
            </View>
        );
    }

    return (
        <ModalProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(customer)" />
                <Stack.Screen name="(mechanic)" />
                <Stack.Screen name="(shared)" />
            </Stack>
        </ModalProvider>
    );
}

