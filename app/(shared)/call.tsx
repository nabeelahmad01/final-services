import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Linking,
    Alert,
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

// Agora functions - loaded dynamically to avoid crash in Expo Go
let agoraService: any = null;
const getAgoraService = () => {
    if (agoraService) return agoraService;
    try {
        const service = require('@/services/agora/callService').default;
        // Check if Agora is actually available
        if (service && service.isAgoraAvailable && service.isAgoraAvailable()) {
            agoraService = service;
            return agoraService;
        } else {
            console.warn('⚠️ Agora SDK not available on this device');
            return null;
        }
    } catch (error) {
        console.warn('Agora service not available:', error);
        return null;
    }
};

export default function CallScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user } = useAuthStore();
    const { endCall } = useCallStore();

    const userId = params.userId as string;
    const userName = (params.userName as string) || 'User';
    const userPhoto = params.userPhoto as string | undefined;
    const userPhone = params.userPhone as string | undefined;
    const callType = (params.callType as 'voice' | 'video') || 'voice';
    const isIncoming = params.isIncoming === 'true';
    const callId = params.callId as string;

    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isConnecting, setIsConnecting] = useState(!isIncoming);
    const [isConnected, setIsConnected] = useState(false);
    const [currentCallId, setCurrentCallId] = useState<string | null>(callId || null);
    const [remoteUserJoined, setRemoteUserJoined] = useState(false);
    const [agoraReady, setAgoraReady] = useState(false);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const channelNameRef = useRef<string>('');

    // Initialize Agora and setup call
    useEffect(() => {
        const setupAgora = async () => {
            try {
                console.log('🎙️ Initializing call...');
                const agora = getAgoraService();

                if (!agora) {
                    console.warn('⚠️ Running in Expo Go - simulated call mode');
                    // Simulate connection for Expo Go
                    setTimeout(() => {
                        setAgoraReady(true);
                        setIsConnecting(false);
                        setIsConnected(true);
                    }, 2000);
                    return;
                }

                const engine = await agora.initializeAgoraEngine();

                if (!engine) {
                    // Simulated mode for Expo Go
                    setTimeout(() => {
                        setAgoraReady(true);
                        setIsConnecting(false);
                        setIsConnected(true);
                    }, 2000);
                    return;
                }

                // Setup event listeners
                agora.setupAgoraListeners({
                    onJoinSuccess: (channel: string, uid: number) => {
                        console.log('✅ Successfully joined channel:', channel);
                        setAgoraReady(true);
                    },
                    onUserJoined: (uid: number) => {
                        console.log('👤 Remote user joined:', uid);
                        setRemoteUserJoined(true);
                        setIsConnecting(false);
                        setIsConnected(true);
                    },
                    onUserOffline: (uid: number, reason: number) => {
                        console.log('👋 Remote user left:', uid);
                        setRemoteUserJoined(false);
                        if (reason !== 2) {
                            handleEndCall();
                        }
                    },
                    onError: (errorCode: number, message: string) => {
                        console.error('❌ Agora error:', errorCode, message);
                    },
                });

                setAgoraReady(true);
            } catch (error) {
                console.error('Failed to setup call:', error);
                // Fallback to simulated mode
                setTimeout(() => {
                    setAgoraReady(true);
                    setIsConnecting(false);
                    setIsConnected(true);
                }, 2000);
            }
        };

        setupAgora();

        return () => {
            const agora = getAgoraService();
            if (agora) {
                agora.leaveCall?.();
                agora.destroyAgoraEngine?.();
            }
        };
    }, []);

    // Create call session and join channel for outgoing calls
    useEffect(() => {
        if (!isIncoming && user && userId && agoraReady) {
            const createCall = async () => {
                try {
                    const agora = getAgoraService();
                    const channelName = agora?.generateChannelName?.(user.id, userId) || `call_${Date.now()}`;
                    channelNameRef.current = channelName;
                    
                    console.log('📞 Creating outgoing call...');
                    console.log('📞 Channel name:', channelName);

                    // Create call session in Firebase (includes channelName for receiver)
                    const newCallId = await createCallSession({
                        callerId: user.id,
                        callerName: user.name,
                        callerPhoto: user.profilePic,
                        receiverId: userId,
                        receiverName: userName,
                        receiverPhoto: userPhoto,
                        callType,
                        channelName, // IMPORTANT: This is saved to Firebase for receiver
                    });
                    setCurrentCallId(newCallId);
                    console.log('📞 Call session created in Firebase:', newCallId);

                    // Join Agora channel
                    if (agora) {
                        const uid = agora.generateUid?.(user.id) || 0;
                        console.log('📞 Caller joining channel with UID:', uid);
                        const joined = await agora.joinVoiceCall?.(channelName, uid);
                        console.log('📞 Caller join result:', joined);
                    }

                    console.log('✅ Outgoing call setup complete');
                } catch (error) {
                    console.error('Error creating call:', error);
                    Alert.alert('Error', 'Could not start call. Please try again.');
                }
            };
            createCall();
        }
    }, [agoraReady, isIncoming, user, userId]);

    // For incoming calls, join the channel from Firebase (MUST match caller's channel)
    useEffect(() => {
        if (isIncoming && user && agoraReady && callId) {
            const joinCall = async () => {
                try {
                    const agora = getAgoraService();
                    
                    // CRITICAL: Use the EXACT channel name from params (saved by caller in Firebase)
                    // DO NOT regenerate - it must be the same channel as the caller joined
                    const channelName = params.channelName as string;
                    
                    if (!channelName) {
                        console.error('❌ No channel name provided for incoming call!');
                        Alert.alert('Error', 'Call connection failed. No channel found.');
                        return;
                    }
                    
                    channelNameRef.current = channelName;
                    console.log('📞 Joining incoming call channel:', channelName);

                    if (agora) {
                        const uid = agora.generateUid?.(user.id) || 0;
                        console.log('📞 Joining with UID:', uid);
                        const joined = await agora.joinVoiceCall?.(channelName, uid);
                        console.log('📞 Join result:', joined);
                    }

                    await updateCallStatus(callId, 'accepted');

                    console.log('✅ Joined incoming call successfully:', channelName);
                    setIsConnected(true);
                    setIsConnecting(false);
                } catch (error) {
                    console.error('Error joining call:', error);
                    Alert.alert('Error', 'Failed to join call');
                }
            };
            joinCall();
        }
    }, [isIncoming, agoraReady, callId, user]);

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

    const handleToggleMute = async () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        const agora = getAgoraService();
        await agora?.toggleMute?.(newMuted);
    };

    const handleToggleSpeaker = async () => {
        const newSpeaker = !isSpeaker;
        setIsSpeaker(newSpeaker);
        const agora = getAgoraService();
        await agora?.toggleSpeaker?.(newSpeaker);
    };

    const handleEndCall = async () => {
        try {
            const agora = getAgoraService();
            await agora?.leaveCall?.();

            if (currentCallId) {
                await endCallSession(currentCallId);
            }
        } catch (error) {
            console.error('Error ending call:', error);
        } finally {
            endCall();
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/(customer)/home');
            }
        }
    };

    // Make native phone call fallback
    const makeNativeCall = async () => {
        if (!userPhone) {
            Alert.alert('Error', 'Phone number not available');
            return;
        }

        const phoneUrl = `tel:${userPhone}`;
        const supported = await Linking.canOpenURL(phoneUrl);

        if (supported) {
            await Linking.openURL(phoneUrl);
        } else {
            Alert.alert('Error', 'Cannot make phone calls from this device');
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
                    {isConnected && (
                        <View style={styles.connectedIndicator}>
                            <View style={styles.liveIndicator} />
                            <Text style={styles.connectedText}>Connected</Text>
                        </View>
                    )}
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
                        onPress={handleToggleSpeaker}
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
                        onPress={handleToggleMute}
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

                    {/* Native Phone Call Button */}
                    {userPhone && (
                        <TouchableOpacity
                            style={[styles.controlButton, styles.phoneButton]}
                            onPress={makeNativeCall}
                        >
                            <Ionicons name="call" size={26} color={COLORS.success} />
                            <Text style={[styles.controlLabel, { color: COLORS.success }]}>Phone</Text>
                        </TouchableOpacity>
                    )}
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
        gap: 8,
    },
    callTypeText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.medium,
        color: COLORS.white + 'AA',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    connectedIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.success + '30',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    liveIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.success,
    },
    connectedText: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.medium,
        color: COLORS.success,
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
    phoneButton: {
        backgroundColor: COLORS.success + '20',
        borderWidth: 1,
        borderColor: COLORS.success + '40',
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
