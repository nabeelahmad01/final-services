import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { GiftedChat, Bubble, Send } from 'react-native-gifted-chat';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { subscribeToMessages, sendMessage } from '@/services/firebase/chatService';
import { TouchableOpacity } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export default function ChatScreen() {
    const themeColors = useThemeColor();
    const router = useRouter();
    // ... rest of component ...
    const { id } = useLocalSearchParams(); // Chat ID
    const { user } = useAuthStore();
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        const unsubscribe = subscribeToMessages(id as string, (newMessages) => {
            setMessages(newMessages);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [id]);

    const onSend = useCallback(async (newMessages: any[] = []) => {
        if (!user || !id) return;

        const message = newMessages[0];
        try {
            await sendMessage(id as string, {
                _id: message._id,
                text: message.text,
                user: {
                    _id: user.id,
                    name: user.name,
                    avatar: user.profilePic,
                },
            });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }, [id, user]);

    const renderBubble = (props: any) => {
        return (
            <Bubble
                {...props}
                wrapperStyle={{
                    right: {
                        backgroundColor: themeColors.primary,
                    },
                    left: {
                        backgroundColor: themeColors.surface,
                        borderWidth: 1,
                        borderColor: themeColors.border,
                    },
                }}
                textStyle={{
                    right: {
                        color: themeColors.white,
                    },
                    left: {
                        color: themeColors.text,
                    },
                }}
            />
        );
    };

    const renderSend = (props: any) => {
        return (
            <Send {...props}>
                <View style={styles.sendButton}>
                    <Ionicons name="send" size={24} color={themeColors.primary} />
                </View>
            </Send>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={themeColors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chat</Text>
                <View style={{ width: 40 }} />
            </View>
            <GiftedChat
                messages={messages}
                onSend={(messages) => onSend(messages)}
                user={{
                    _id: user?.id || '',
                    name: user?.name,
                    avatar: user?.profilePic,
                }}
                renderBubble={renderBubble}
                renderSend={renderSend}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SIZES.padding,
        paddingVertical: 12,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    sendButton: {
        marginBottom: 10,
        marginRight: 10,
    },
});
