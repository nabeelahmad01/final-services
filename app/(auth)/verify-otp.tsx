import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, SIZES } from '@/constants/theme';

/**
 * OTP Verification - DEPRECATED
 * This screen is no longer used since we switched to phone+password auth (FREE).
 * Kept as a redirect for backward compatibility.
 */
export default function VerifyOTPScreen() {
    const router = useRouter();

    useEffect(() => {
        // OTP is no longer used - redirect to login
        router.replace('/(auth)/phone-login');
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.text}>Redirecting to login...</Text>
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
