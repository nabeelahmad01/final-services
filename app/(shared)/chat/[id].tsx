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
    Animated,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/shared/Avatar';
import { subscribeToMessages, sendMessage } from '@/services/firebase/chatService';
import { getDoc, doc } from 'firebase/firestore';
import { firestore } from '@/services/firebase/config';
import { COLORS, SIZES, FONTS } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface Message {
    _id: string;
    text: string;
    createdAt: Date;
    user: {
        _id: string;
        name: string;
        avatar?: string;
    };
}

export default function ChatScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const chatId = id as string;
    const { user } = useAuthStore();

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [isFocused, setIsFocused] = useState(false);
    const [otherUser, setOtherUser] = useState<{ name: string; photo?: string } | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const sendButtonScale = useRef(new Animated.Value(1)).current;

    // Fetch chat participants info
    useEffect(() => {
        const fetchChatInfo = async () => {
            if (!chatId) return;
            try {
                const chatDoc = await getDoc(doc(firestore, 'chats', chatId));
                if (chatDoc.exists()) {
                    const data = chatDoc.data();
                    const participants = data.participants || [];
                    const otherUserId = participants.find((p: string) => p !== user?.id);
                    if (otherUserId && data.participantDetails?.[otherUserId]) {
                        setOtherUser(data.participantDetails[otherUserId]);
                    }
                }
            } catch (error) {
                console.error('Error fetching chat info:', error);
            }
        };
        fetchChatInfo();
    }, [chatId, user?.id]);

    useEffect(() => {
        if (!chatId) return;

        const unsubscribe = subscribeToMessages(chatId, (msgs) => {
            setMessages(msgs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [chatId]);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        });

        return () => {
            keyboardDidShowListener.remove();
        };
    }, []);

    const handleSend = async () => {
        if (!inputText.trim() || !user) return;

        // Animate send button
        Animated.sequence([
            Animated.timing(sendButtonScale, {
                toValue: 0.8,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(sendButtonScale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        const messageText = inputText.trim();
        setInputText('');

        try {
            await sendMessage(chatId, {
                _id: Date.now().toString(),
                text: messageText,
                user: {
                    _id: user.id,
                    name: user.name,
                    avatar: user.profilePic,
                },
            });
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleCall = () => {
        router.push({
            pathname: '/(shared)/call',
            params: {
                userId: 'other-user-id', // TODO: Get from chat participants
                userName: otherUser?.name || 'User',
                userPhoto: otherUser?.photo || '',
                callType: 'voice'
            },
        });
    };

    const handleVideoCall = () => {
        router.push({
            pathname: '/(shared)/call',
            params: {
                userId: 'other-user-id',
                userName: otherUser?.name || 'User',
                userPhoto: otherUser?.photo || '',
                callType: 'video'
            },
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const formatDate = (date: Date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        }
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    const shouldShowDate = (index: number) => {
        if (index === 0) return true;
        const currentDate = new Date(messages[index].createdAt).toDateString();
        const prevDate = new Date(messages[index - 1].createdAt).toDateString();
        return currentDate !== prevDate;
    };

    const renderMessage = ({ item, index }: { item: Message; index: number }) => {
        const isOwn = item.user._id === user?.id;
        const showDate = shouldShowDate(index);
        const messageDate = new Date(item.createdAt);

        return (
            <>
                {showDate && (
                    <View style={styles.dateSeparator}>
                        <View style={styles.dateLine} />
                        <Text style={styles.dateText}>{formatDate(messageDate)}</Text>
                        <View style={styles.dateLine} />
                    </View>
                )}
                <View style={[styles.messageRow, isOwn && styles.ownMessageRow]}>
                    {!isOwn && (
                        <View style={styles.avatarContainer}>
                            <Avatar name={item.user.name} photo={item.user.avatar} size={32} />
                        </View>
                    )}
                    <View style={[styles.messageBubble, isOwn ? styles.ownMessage : styles.otherMessage]}>
                        {isOwn ? (
                            <LinearGradient
                                colors={[COLORS.primary, COLORS.primaryDark]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.messageGradient}
                            >
                                <Text style={styles.ownMessageText}>{item.text}</Text>
                                <View style={styles.messageFooter}>
                                    <Text style={styles.ownMessageTime}>{formatTime(messageDate)}</Text>
                                    <Ionicons
                                        name="checkmark-done"
                                        size={14}
                                        color="#4FC3F7"
                                        style={{ marginLeft: 4 }}
                                    />
                                </View>
                            </LinearGradient>
                        ) : (
                            <>
                                <Text style={styles.otherMessageText}>{item.text}</Text>
                                <Text style={styles.otherMessageTime}>{formatTime(messageDate)}</Text>
                            </>
                        )}
                    </View>
                </View>
            </>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Beautiful Header */}
            <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.userInfoContainer} activeOpacity={0.8}>
                            <View style={styles.avatarWrapper}>
                                <Avatar name={otherUser?.name || 'User'} photo={otherUser?.photo} size={44} />
                                <View style={styles.onlineIndicator} />
                            </View>
                            <View style={styles.headerTextContainer}>
                                <Text style={styles.headerTitle}>{otherUser?.name || 'Chat'}</Text>
                                <Text style={styles.headerSubtitle}>Online</Text>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                onPress={handleVideoCall}
                                style={styles.headerActionButton}
                            >
                                <Ionicons name="videocam" size={22} color={COLORS.white} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleCall}
                                style={styles.headerActionButton}
                            >
                                <Ionicons name="call" size={20} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Messages List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item._id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                            <Ionicons name="chatbubbles-outline" size={48} color={COLORS.primary} />
                        </View>
                        <Text style={styles.emptyTitle}>Start a Conversation</Text>
                        <Text style={styles.emptySubtitle}>
                            Say hi and start chatting!
                        </Text>
                    </View>
                }
            />

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
                    <TouchableOpacity style={styles.attachButton}>
                        <View style={styles.attachButtonInner}>
                            <Ionicons name="add" size={24} color={COLORS.primary} />
                        </View>
                    </TouchableOpacity>

                    <View style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}>
                        <TextInput
                            style={styles.input}
                            placeholder="Type a message..."
                            placeholderTextColor={COLORS.textSecondary}
                            value={inputText}
                            onChangeText={setInputText}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            multiline
                            maxLength={1000}
                        />
                        <TouchableOpacity style={styles.emojiButton}>
                            <Ionicons name="happy-outline" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                !inputText.trim() && styles.sendButtonDisabled
                            ]}
                            onPress={handleSend}
                            disabled={!inputText.trim()}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={inputText.trim()
                                    ? [COLORS.primary, COLORS.primaryDark]
                                    : [COLORS.textSecondary, COLORS.textSecondary]
                                }
                                style={styles.sendButtonGradient}
                            >
                                <Ionicons
                                    name="send"
                                    size={20}
                                    color={COLORS.white}
                                    style={{ marginLeft: 2 }}
                                />
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFA',
    },
    headerGradient: {
        paddingBottom: 12,
    },
    headerSafeArea: {
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingTop: 8,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfoContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 4,
    },
    avatarWrapper: {
        position: 'relative',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    headerTextContainer: {
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: FONTS.bold,
        color: COLORS.white,
    },
    headerSubtitle: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.white + 'CC',
        marginTop: 2,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    headerActionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white + '15',
    },
    messagesList: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexGrow: 1,
    },
    dateSeparator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    dateLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dateText: {
        marginHorizontal: 12,
        fontSize: SIZES.xs,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
        backgroundColor: '#F8FAFA',
        paddingHorizontal: 8,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'flex-end',
    },
    ownMessageRow: {
        justifyContent: 'flex-end',
    },
    avatarContainer: {
        marginRight: 8,
        marginBottom: 4,
    },
    messageBubble: {
        maxWidth: '75%',
        borderRadius: 20,
        overflow: 'hidden',
    },
    ownMessage: {
        borderBottomRightRadius: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
    },
    otherMessage: {
        backgroundColor: COLORS.white,
        borderBottomLeftRadius: 4,
        padding: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    messageGradient: {
        padding: 12,
        paddingHorizontal: 16,
    },
    ownMessageText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.white,
        lineHeight: 22,
    },
    otherMessageText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.text,
        lineHeight: 22,
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        justifyContent: 'flex-end',
    },
    ownMessageTime: {
        fontSize: 11,
        fontFamily: FONTS.regular,
        color: COLORS.white + 'BB',
    },
    otherMessageTime: {
        fontSize: 11,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginTop: 4,
        textAlign: 'right',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border + '50',
        gap: 8,
    },
    inputContainerFocused: {
        borderTopColor: COLORS.primary + '30',
    },
    attachButton: {
        marginBottom: 4,
    },
    attachButtonInner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#F5F5F5',
        borderRadius: 24,
        paddingLeft: 16,
        paddingRight: 8,
        paddingVertical: 8,
        minHeight: 44,
        maxHeight: 120,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    inputWrapperFocused: {
        backgroundColor: COLORS.white,
        borderColor: COLORS.primary + '30',
    },
    input: {
        flex: 1,
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.text,
        paddingTop: 0,
        paddingBottom: 0,
        maxHeight: 100,
    },
    emojiButton: {
        padding: 4,
        marginLeft: 4,
    },
    sendButton: {
        marginBottom: 2,
    },
    sendButtonDisabled: {
        opacity: 0.6,
    },
    sendButtonGradient: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
