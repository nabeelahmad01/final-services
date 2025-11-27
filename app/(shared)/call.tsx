import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '@/constants/theme';

export default function CallScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const userName = params.userName as string;
    const callType = (params.callType as 'voice' | 'video') || 'voice';

    const [isMuted, setIsMuted] = React.useState(false);
    const [isSpeaker, setIsSpeaker] = React.useState(false);
    const [duration, setDuration] = React.useState(0);

    React.useEffect(() => {
        // Start call timer
        const interval = setInterval(() => {
            setDuration((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleEndCall = () => {
        router.push('/(shared)/profile');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.callingText}>{callType === 'voice' ? 'Voice Call' : 'Video Call'}</Text>
                <Text style={styles.userName}>{userName}</Text>
                <Text style={styles.duration}>{formatDuration(duration)}</Text>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => setIsSpeaker(!isSpeaker)}
                >
                    <Ionicons
                        name={isSpeaker ? 'volume-high' : 'volume-low-outline'}
                        size={28}
                        color={COLORS.white}
                    />
                    <Text style={styles.controlLabel}>Speaker</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => setIsMuted(!isMuted)}
                >
                    <Ionicons
                        name={isMuted ? 'mic-off' : 'mic'}
                        size={28}
                        color={COLORS.white}
                    />
                    <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
                </TouchableOpacity>

                {callType === 'video' && (
                    <TouchableOpacity style={styles.controlButton}>
                        <Ionicons name="videocam" size={28} color={COLORS.white} />
                        <Text style={styles.controlLabel}>Camera</Text>
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
                <Ionicons name="call" size={32} color={COLORS.white} />
            </TouchableOpacity>

            <Text style={styles.note}>
                Note: Agora SDK integration required for full functionality
            </Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primaryDark,
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SIZES.padding * 2,
    },
    header: {
        alignItems: 'center',
        marginTop: 60,
    },
    callingText: {
        fontSize: SIZES.base,
        color: COLORS.white + 'CC',
        marginBottom: 16,
    },
    userName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 8,
    },
    duration: {
        fontSize: SIZES.lg,
        color: COLORS.white + 'CC',
    },
    controls: {
        flexDirection: 'row',
        gap: 40,
    },
    controlButton: {
        alignItems: 'center',
        gap: 8,
    },
    controlLabel: {
        fontSize: SIZES.sm,
        color: COLORS.white,
    },
    endCallButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: COLORS.danger,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ rotate: '135deg' }],
    },
    note: {
        fontSize: SIZES.sm,
        color: COLORS.white + '80',
        textAlign: 'center',
    },
});
