import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, SIZES } from '@/constants/theme';

/**
 * Login redirect - now uses phone OTP authentication
 * This screen automatically redirects to the phone login flow
 */
export default function Login() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to phone login
        router.replace('/(auth)/phone-login');
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.text}>Redirecting...</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    text: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
    },
});
