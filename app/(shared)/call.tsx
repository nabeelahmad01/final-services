import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '@/components/shared/Avatar';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useCallStore } from '@/stores/useCallStore';
import {
    createCallSession,
    updateCallStatus,
    endCallSession,
    subscribeToCallSession
} from '@/services/firebase/firestore';

const { width, height } = Dimensions.get('window');

export default function CallScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user } = useAuthStore();
    const { endCall } = useCallStore();

    const userId = params.userId as string;
    const userName = (params.userName as string) || 'User';
    const userPhoto = params.userPhoto as string | undefined;
    const callType = (params.callType as 'voice' | 'video') || 'voice';
    const isIncoming = params.isIncoming === 'true';
    const callId = params.callId as string;

    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isConnecting, setIsConnecting] = useState(!isIncoming);
    const [isConnected, setIsConnected] = useState(isIncoming);
    const [currentCallId, setCurrentCallId] = useState<string | null>(callId || null);

    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    // Create call session for outgoing calls
    useEffect(() => {
        if (!isIncoming && user && userId) {
            const createCall = async () => {
                try {
                    const newCallId = await createCallSession({
                        callerId: user.id,
                        callerName: user.name,
                        callerPhoto: user.profilePic,
                        receiverId: userId,
                        receiverName: userName,
                        receiverPhoto: userPhoto,
                        callType,
                    });
                    setCurrentCallId(newCallId);
                    console.log('📞 Call session created:', newCallId);
                } catch (error) {
                    console.error('Error creating call session:', error);
                }
            };
            createCall();
        }
    }, []);

    // Listen to call status updates
    useEffect(() => {
        if (!currentCallId) return;

        const unsubscribe = subscribeToCallSession(currentCallId, (call) => {
            if (!call) return;

            if (call.status === 'accepted') {
                setIsConnecting(false);
                setIsConnected(true);
            } else if (call.status === 'declined' || call.status === 'ended') {
                handleEndCall();
            }
        });

        return () => unsubscribe();
    }, [currentCallId]);

    // Timer for call duration
    useEffect(() => {
        if (!isConnected) return;

        const interval = setInterval(() => {
            setDuration((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isConnected]);

    // Pulse animation while connecting
    useEffect(() => {
        if (!isConnecting) return;

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();

        // Auto end after 60 seconds if not connected
        const timeout = setTimeout(() => {
            if (isConnecting) {
                handleEndCall();
            }
        }, 60000);

        return () => {
            pulse.stop();
            clearTimeout(timeout);
        };
    }, [isConnecting]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleEndCall = async () => {
        try {
            if (currentCallId) {
                await endCallSession(currentCallId);
            }
        } catch (error) {
            console.error('Error ending call:', error);
        } finally {
            endCall();
            // Use replace to navigate away - prevents GO_BACK error
            if (router.canGoBack()) {
                router.back();
            } else {
                // Navigate to appropriate home screen based on user type
                router.replace('/(customer)/home');
            }
        }
    };

    return (
        <LinearGradient
            colors={[COLORS.primaryDark, '#004D54', '#002428']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Decorative elements */}
                <View style={[styles.decorCircle, styles.decorCircle1]} />
                <View style={[styles.decorCircle, styles.decorCircle2]} />

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.callTypeText}>
                        {callType === 'voice' ? '🎙️ Voice Call' : '📹 Video Call'}
                    </Text>
                </View>

                {/* User Info */}
                <View style={styles.userInfo}>
                    <Animated.View style={{ transform: [{ scale: isConnecting ? pulseAnim : 1 }] }}>
                        <View style={styles.avatarContainer}>
                            <Avatar name={userName} photo={userPhoto} size={120} />
                            {isConnected && (
                                <View style={styles.connectedBadge}>
                                    <Ionicons name="checkmark" size={16} color={COLORS.white} />
                                </View>
                            )}
                        </View>
                    </Animated.View>

                    <Text style={styles.userName}>{userName}</Text>

                    <Text style={styles.callStatus}>
                        {isConnecting ? 'Calling...' : formatDuration(duration)}
                    </Text>
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={[styles.controlButton, isSpeaker && styles.controlButtonActive]}
                        onPress={() => setIsSpeaker(!isSpeaker)}
                    >
                        <Ionicons
                            name={isSpeaker ? 'volume-high' : 'volume-low-outline'}
                            size={26}
                            color={COLORS.white}
                        />
                        <Text style={styles.controlLabel}>Speaker</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.controlButton, isMuted && styles.controlButtonActive]}
                        onPress={() => setIsMuted(!isMuted)}
                    >
                        <Ionicons
                            name={isMuted ? 'mic-off' : 'mic'}
                            size={26}
                            color={COLORS.white}
                        />
                        <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
                    </TouchableOpacity>

                    {callType === 'video' && (
                        <TouchableOpacity style={styles.controlButton}>
                            <Ionicons name="videocam" size={26} color={COLORS.white} />
                            <Text style={styles.controlLabel}>Camera</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.controlButton}>
                        <Ionicons name="chatbubble-ellipses" size={26} color={COLORS.white} />
                        <Text style={styles.controlLabel}>Chat</Text>
                    </TouchableOpacity>
                </View>

                {/* End Call Button */}
                <TouchableOpacity
                    style={styles.endCallButton}
                    onPress={handleEndCall}
                    activeOpacity={0.8}
                >
                    <View style={styles.endCallCircle}>
                        <Ionicons name="call" size={32} color={COLORS.white} style={styles.endCallIcon} />
                    </View>
                    <Text style={styles.endCallText}>End Call</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 40,
    },
    decorCircle: {
        position: 'absolute',
        borderRadius: 1000,
        backgroundColor: COLORS.white + '05',
    },
    decorCircle1: {
        width: 500,
        height: 500,
        top: -200,
        right: -200,
    },
    decorCircle2: {
        width: 400,
        height: 400,
        bottom: -100,
        left: -150,
    },
    header: {
        alignItems: 'center',
    },
    callTypeText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.medium,
        color: COLORS.white + 'AA',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    userInfo: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    avatarContainer: {
        position: 'relative',
    },
    connectedBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.primaryDark,
    },
    userName: {
        fontSize: 28,
        fontFamily: FONTS.bold,
        color: COLORS.white,
        marginTop: 20,
    },
    callStatus: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.regular,
        color: COLORS.white + 'AA',
        marginTop: 8,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        paddingHorizontal: 20,
        marginBottom: 40,
    },
    controlButton: {
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 12,
    },
    controlButtonActive: {
        backgroundColor: COLORS.white + '20',
    },
    controlLabel: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.medium,
        color: COLORS.white + 'CC',
    },
    endCallButton: {
        alignItems: 'center',
        gap: 8,
    },
    endCallCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.danger,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.danger,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    endCallIcon: {
        transform: [{ rotate: '135deg' }],
    },
    endCallText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.medium,
        color: COLORS.white + '80',
    },
});
