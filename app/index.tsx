import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function Index() {
    const router = useRouter();
    const { isAuthenticated, isLoading, user } = useAuthStore();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.replace('/(auth)/role-selection');
            } else {
                // Redirect based on user role
                if (user?.role === 'customer') {
                    router.replace('/(customer)/home');
                } else if (user?.role === 'mechanic') {
                    router.replace('/(mechanic)/dashboard');
                }
            }
        }
    }, [isAuthenticated, isLoading, user]);

    return (
        <View style={styles.container}>
            <LoadingSpinner fullScreen />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
