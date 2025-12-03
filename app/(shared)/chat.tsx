import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { subscribeToMessages, sendMessage, markMessagesAsRead } from '@/services/firebase/firestore';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { ChatMessage } from '@/types';

export default function ChatScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const chatId = params.chatId as string;
    const otherUserId = params.otherUserId as string;
    const otherUserName = params.otherUserName as string || 'User';
    const { user } = useAuthStore();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [keyboardVisible, setKeyboardVisible] = useState(false);
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

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
            setKeyboardVisible(true);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        });
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardVisible(false);
        });

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

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
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const handleCall = () => {
        if (otherUserId) {
            router.push({
                pathname: '/(shared)/call',
                params: {
                    userId: otherUserId,
                    userName: otherUserName,
                    callType: 'voice'
                },
            });
        }
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isOwn = item.senderId === user?.id;

        return (
            <View style={[styles.messageContainer, isOwn && styles.ownMessageContainer]}>
                <View style={[styles.messageBubble, isOwn && styles.ownMessage]}>
                    <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
                        {item.text}
                    </Text>
                    <View style={styles.messageFooter}>
                        <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
                            {item.createdAt.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </Text>
                        {isOwn && (
                            <Ionicons
                                name={item.read ? "checkmark-done" : "checkmark"}
                                size={14}
                                color={COLORS.white + 'CC'}
                                style={{ marginLeft: 4 }}
                            />
                        )}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{otherUserName}</Text>
                    <Text style={styles.headerSubtitle}>Online</Text>
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={handleCall}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.headerActionButton}
                    >
                        <Ionicons name="call" size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                showsVerticalScrollIndicator={false}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={styles.inputContainer}>
                    <TouchableOpacity style={styles.attachButton}>
                        <Ionicons name="add-circle" size={28} color={COLORS.primary} />
                    </TouchableOpacity>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Type a message..."
                            placeholderTextColor={COLORS.textSecondary}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                        />
                        {inputText.length > 400 && (
                            <Text style={styles.charCounter}>{inputText.length}/500</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            !inputText.trim() && styles.sendButtonDisabled
                        ]}
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                    >
                        <Ionicons
                            name="send"
                            size={20}
                            color={COLORS.white}
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
        paddingHorizontal: SIZES.padding,
        paddingVertical: 12,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 3,
    },
    headerCenter: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    headerSubtitle: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.success,
        marginTop: 2,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerActionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    messagesList: {
        paddingHorizontal: SIZES.padding,
        paddingVertical: 16,
        flexGrow: 1,
    },
    messageContainer: {
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    ownMessageContainer: {
        alignItems: 'flex-end',
    },
    messageBubble: {
        maxWidth: '75%',
        backgroundColor: COLORS.surface,
        padding: 12,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderBottomLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    ownMessage: {
        backgroundColor: COLORS.primary,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 4,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.2,
    },
    messageText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.text,
        lineHeight: 20,
    },
    ownMessageText: {
        color: COLORS.white,
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        justifyContent: 'flex-end',
    },
    messageTime: {
        fontSize: 10,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    ownMessageTime: {
        color: COLORS.white + 'CC',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: SIZES.padding,
        paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 12 : 12,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        gap: 8,
    },
    attachButton: {
        padding: 4,
        marginBottom: 4,
    },
    inputWrapper: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
        maxHeight: 100,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    input: {
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.text,
        paddingTop: 0,
        paddingBottom: 0,
    },
    charCounter: {
        fontSize: 10,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        textAlign: 'right',
        marginTop: 2,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    sendButtonDisabled: {
        backgroundColor: COLORS.textSecondary,
        shadowOpacity: 0.1,
    },
});

