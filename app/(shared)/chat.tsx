import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { subscribeToMessages, sendMessage, markMessagesAsRead } from '@/services/firebase/firestore';
import { COLORS, SIZES } from '@/constants/theme';
import { ChatMessage } from '@/types';

export default function ChatScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const chatId = params.chatId as string;
    const { user } = useAuthStore();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (!chatId) return;

        const unsubscribe = subscribeToMessages(chatId, (msgs) => {
            setMessages(msgs);
            if (user) {
                markMessagesAsRead(chatId, user.id);
            }
        });

        return () => unsubscribe();
    }, [chatId]);

    const handleSend = async () => {
        if (!inputText.trim() || !user) return;

        await sendMessage(chatId, {
            senderId: user.id,
            chatId,
            text: inputText.trim(),
            type: 'text',
            read: false,
        });

        setInputText('');
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isOwn = item.senderId === user?.id;

        return (
            <View style={[styles.messageBubble, isOwn && styles.ownMessage]}>
                <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
                    {item.text}
                </Text>
                <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
                    {item.createdAt.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chat</Text>
                <TouchableOpacity>
                    <Ionicons name="call-outline" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={90}
            >
                <View style={styles.inputContainer}>
                    <TouchableOpacity style={styles.attachButton}>
                        <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity
                        style={styles.sendButton}
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                    >
                        <Ionicons
                            name="send"
                            size={20}
                            color={inputText.trim() ? COLORS.white : COLORS.textSecondary}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
        padding: SIZES.padding,
        backgroundColor: COLORS.surface,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    messagesList: {
        padding: SIZES.padding,
    },
    messageBubble: {
        maxWidth: '75%',
        backgroundColor: COLORS.surface,
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
        alignSelf: 'flex-start',
    },
    ownMessage: {
        backgroundColor: COLORS.primary,
        alignSelf: 'flex-end',
    },
    messageText: {
        fontSize: SIZES.base,
        color: COLORS.text,
        marginBottom: 4,
    },
    ownMessageText: {
        color: COLORS.white,
    },
    messageTime: {
        fontSize: SIZES.xs,
        color: COLORS.textSecondary,
    },
    ownMessageTime: {
        color: COLORS.white + 'CC',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SIZES.padding,
        backgroundColor: COLORS.surface,
        gap: 8,
    },
    attachButton: {
        padding: 8,
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        maxHeight: 100,
        fontSize: SIZES.base,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
