import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, SIZES } from '@/constants/theme';

/**
 * Signup redirect - routes to the signup screen (complete-profile)
 */
export default function Signup() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/(auth)/complete-profile');
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
