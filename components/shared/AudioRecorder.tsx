import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '@/constants/theme';

interface AudioRecorderProps {
    onSend: (uri: string, duration: number) => void;
    onCancel: () => void;
}

export function AudioRecorder({ onSend, onCancel }: AudioRecorderProps) {
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [duration, setDuration] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [meterLevel, setMeterLevel] = useState(0);

    // Animation for recording indicator
    const pulseAnim = new Animated.Value(1);

    useEffect(() => {
        startRecording();

        // Pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        return () => {
            if (recording) {
                stopRecording();
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status === 'granted') {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });

                const { recording } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY
                );

                setRecording(recording);
                setIsRecording(true);

                recording.setOnRecordingStatusUpdate((status) => {
                    setDuration(status.durationMillis / 1000);
                    if (status.metering) {
                        setMeterLevel(status.metering);
                    }
                });
            }
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    };

    const stopRecording = async () => {
        if (!recording) return;

        setIsRecording(false);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);

        return uri;
    };

    const handleSend = async () => {
        const uri = await stopRecording();
        if (uri) {
            onSend(uri, duration);
        }
    };

    const handleCancel = async () => {
        await stopRecording();
        onCancel();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.recordingInfo}>
                <Animated.View
                    style={[
                        styles.recordingDot,
                        { transform: [{ scale: pulseAnim }] }
                    ]}
                />
                <Text style={styles.timerText}>{formatTime(duration)}</Text>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
                    <Ionicons name="arrow-up" size={24} color={COLORS.white} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        flex: 1,
    },
    recordingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    recordingDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.error,
    },
    timerText: {
        fontSize: 16,
        fontFamily: 'medium',
        color: COLORS.text,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    cancelButton: {
        padding: 8,
    },
    cancelText: {
        color: COLORS.error,
        fontSize: 16,
        fontFamily: 'medium',
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
