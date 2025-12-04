import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from './Avatar';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { useCallStore, CallSession } from '@/stores/useCallStore';
import { updateCallStatus } from '@/services/firebase/firestore';
import { playNotificationSound } from '@/services/audioService';

const { width, height } = Dimensions.get('window');

interface IncomingCallScreenProps {
    call: CallSession;
    onAccept: () => void;
    onDecline: () => void;
}

export const IncomingCallScreen: React.FC<IncomingCallScreenProps> = ({
    call,
    onAccept,
    onDecline,
}) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(height)).current;
    const ringAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Slide in animation
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
        }).start();

        // Pulse animation for avatar
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();

        // Ring animation
        const ring = Animated.loop(
            Animated.sequence([
                Animated.timing(ringAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(ringAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ])
        );
        ring.start();

        // Play haptic notification repeatedly
        const interval = setInterval(() => {
            playNotificationSound();
        }, 2000);

        // Initial notification
        playNotificationSound();

        return () => {
            pulse.stop();
            ring.stop();
            clearInterval(interval);
        };
    }, []);

    const handleAccept = async () => {
        try {
            await updateCallStatus(call.id, 'accepted');
            onAccept();
        } catch (error) {
            console.error('Error accepting call:', error);
        }
    };

    const handleDecline = async () => {
        try {
            await updateCallStatus(call.id, 'declined');
            onDecline();
        } catch (error) {
            console.error('Error declining call:', error);
        }
    };

    const ringScale = ringAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.1],
    });

    return (
        <Modal
            visible={true}
            animationType="none"
            transparent={false}
            statusBarTranslucent
        >
            <Animated.View
                style={[
                    styles.container,
                    { transform: [{ translateY: slideAnim }] }
                ]}
            >
                <LinearGradient
                    colors={[COLORS.primaryDark, '#004D54', COLORS.primaryDark]}
                    style={styles.gradient}
                >
                    {/* Decorative circles */}
                    <View style={[styles.decorCircle, styles.decorCircle1]} />
                    <View style={[styles.decorCircle, styles.decorCircle2]} />
                    <View style={[styles.decorCircle, styles.decorCircle3]} />

                    {/* Header */}
                    <View style={styles.header}>
                        <Animated.View style={{ transform: [{ scale: ringScale }] }}>
                            <Ionicons
                                name={call.callType === 'video' ? 'videocam' : 'call'}
                                size={28}
                                color={COLORS.white}
                            />
                        </Animated.View>
                        <Text style={styles.callingText}>
                            Incoming {call.callType === 'video' ? 'Video' : 'Voice'} Call
                        </Text>
                    </View>

                    {/* Caller Info */}
                    <View style={styles.callerInfo}>
                        {/* Pulse rings behind avatar */}
                        <Animated.View
                            style={[
                                styles.pulseRing,
                                styles.pulseRing1,
                                { transform: [{ scale: pulseAnim }] }
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.pulseRing,
                                styles.pulseRing2,
                                {
                                    transform: [{ scale: pulseAnim }],
                                    opacity: pulseAnim.interpolate({
                                        inputRange: [1, 1.15],
                                        outputRange: [0.3, 0],
                                    })
                                }
                            ]}
                        />

                        <Avatar
                            name={call.callerName}
                            photo={call.callerPhoto}
                            size={120}
                        />

                        <Text style={styles.callerName}>{call.callerName}</Text>
                        <Text style={styles.callStatus}>is calling you...</Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                        {/* Decline Button */}
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleDecline}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.actionCircle, styles.declineCircle]}>
                                <Ionicons name="close" size={36} color={COLORS.white} />
                            </View>
                            <Text style={styles.actionLabel}>Decline</Text>
                        </TouchableOpacity>

                        {/* Accept Button */}
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleAccept}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.actionCircle, styles.acceptCircle]}>
                                <Ionicons
                                    name={call.callType === 'video' ? 'videocam' : 'call'}
                                    size={32}
                                    color={COLORS.white}
                                />
                            </View>
                            <Text style={styles.actionLabel}>Accept</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Bottom hint */}
                    <Text style={styles.hint}>
                        Swipe up to answer with message
                    </Text>
                </LinearGradient>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 80,
        paddingBottom: 60,
    },
    decorCircle: {
        position: 'absolute',
        borderRadius: 1000,
        backgroundColor: COLORS.white + '08',
    },
    decorCircle1: {
        width: 400,
        height: 400,
        top: -150,
        right: -150,
    },
    decorCircle2: {
        width: 300,
        height: 300,
        bottom: 100,
        left: -100,
    },
    decorCircle3: {
        width: 200,
        height: 200,
        top: height / 2,
        right: -50,
    },
    header: {
        alignItems: 'center',
        gap: 12,
    },
    callingText: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.medium,
        color: COLORS.white + 'CC',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    callerInfo: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulseRing: {
        position: 'absolute',
        borderRadius: 100,
        borderWidth: 3,
        borderColor: COLORS.primary + '50',
    },
    pulseRing1: {
        width: 160,
        height: 160,
    },
    pulseRing2: {
        width: 200,
        height: 200,
    },
    callerName: {
        fontSize: 32,
        fontFamily: FONTS.bold,
        color: COLORS.white,
        marginTop: 24,
    },
    callStatus: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.regular,
        color: COLORS.white + 'AA',
        marginTop: 8,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 80,
    },
    actionButton: {
        alignItems: 'center',
        gap: 12,
    },
    actionCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    declineCircle: {
        backgroundColor: COLORS.danger,
    },
    acceptCircle: {
        backgroundColor: COLORS.success,
    },
    actionLabel: {
        fontSize: SIZES.base,
        fontFamily: FONTS.medium,
        color: COLORS.white,
    },
    hint: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.white + '60',
    },
});

export default IncomingCallScreen;
