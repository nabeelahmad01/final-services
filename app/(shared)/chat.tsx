import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

/**
 * Chat screen placeholder - redirects to chat list or shows empty state
 * Actual chat is at chat/[id].tsx
 */
export default function ChatScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Ionicons name="chatbubbles-outline" size={64} color={COLORS.textSecondary} />
                <Text style={styles.title}>No Active Chat</Text>
                <Text style={styles.subtitle}>
                    Start a conversation from your active booking
                </Text>
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
        padding: 24,
    },
    title: {
        fontSize: SIZES.xl,
        fontFamily: FONTS.bold,
        color: COLORS.text,
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});
