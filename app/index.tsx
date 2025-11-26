import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
    const router = useRouter();
    const { isAuthenticated, isLoading, user } = useAuthStore();
    const [checkingOnboarding, setCheckingOnboarding] = useState(true);

    useEffect(() => {
        const checkOnboardingStatus = async () => {
            const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');

            if (!isLoading) {
                if (!hasSeenOnboarding) {
                    // First time user - show onboarding
                    router.replace('/(auth)/onboarding');
                } else if (!isAuthenticated) {
                    // Returning user, not authenticated - show role selection
                    router.replace('/(auth)/role-selection');
                } else {
                    // Authenticated user - redirect based on role
                    if (user?.role === 'customer') {
                        router.replace('/(customer)/home');
                    } else if (user?.role === 'mechanic') {
                        router.replace('/(mechanic)/dashboard');
                    }
                }
                setCheckingOnboarding(false);
            }
        };

        checkOnboardingStatus();
    }, [isAuthenticated, isLoading, user]);

    if (checkingOnboarding || isLoading) {
        return (
            <View style={styles.container}>
                <LoadingSpinner fullScreen />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <LoadingSpinner fullScreen />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
