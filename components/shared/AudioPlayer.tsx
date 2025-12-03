import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '@/constants/theme';

interface AudioPlayerProps {
    audioUrl: string;
    duration: number; // in seconds
    compact?: boolean;
}

export function AudioPlayer({ audioUrl, duration, compact = false }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(0);
    const [sound, setSound] = useState<any>(null);
    const [audioAvailable, setAudioAvailable] = useState(false);

    useEffect(() => {
        // Check if expo-av is available
        checkAudioAvailability();

        return () => {
            if (sound) {
                try {
                    sound.unloadAsync();
                } catch (e) {
                    console.log('Error unloading sound:', e);
                }
            }
        };
    }, [sound]);

    const checkAudioAvailability = async () => {
        try {
            const { Audio } = await import('expo-av');
            setAudioAvailable(true);
        } catch (error) {
            setAudioAvailable(false);
            console.log('Audio not available - using fallback UI');
        }
    };

    const playPauseAudio = async () => {
        if (!audioAvailable) {
            // Fallback: Open audio URL in browser
            Linking.openURL(audioUrl);
            return;
        }

        try {
            const { Audio } = await import('expo-av');

            if (sound) {
                if (isPlaying) {
                    await sound.pauseAsync();
                    setIsPlaying(false);
                } else {
                    await sound.playAsync();
                    setIsPlaying(true);
                }
            } else {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
                });

                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: audioUrl },
                    { shouldPlay: true },
                    onPlaybackStatusUpdate
                );

                setSound(newSound);
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Error playing audio:', error);
            // Fallback to opening in browser
            Linking.openURL(audioUrl);
        }
    };

    const onPlaybackStatusUpdate = (status: any) => {
        if (status.isLoaded) {
            setPosition(status.positionMillis / 1000);

            if (status.didJustFinish) {
                setIsPlaying(false);
                setPosition(0);
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (position / duration) * 100 : 0;

    if (compact) {
        return (
            <TouchableOpacity
                style={[styles.compactContainer, isPlaying && styles.compactContainerPlaying]}
                onPress={playPauseAudio}
            >
                <View style={styles.compactPlayButton}>
                    <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={16}
                        color={COLORS.white}
                    />
                </View>
                <View style={styles.compactWaveform}>
                    <View style={[styles.compactProgress, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.compactDuration}>
                    {formatTime(isPlaying ? position : duration)}
                </Text>
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.playButton} onPress={playPauseAudio}>
                <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={24}
                    color={COLORS.primary}
                />
            </TouchableOpacity>

            <View style={styles.waveformContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progress, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.duration}>
                    {formatTime(isPlaying ? position : duration)}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 12,
        gap: 12,
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    waveformContainer: {
        flex: 1,
        gap: 4,
    },
    progressBar: {
        height: 4,
        backgroundColor: COLORS.border,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progress: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
    duration: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    // Compact mode styles
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '15',
        borderRadius: 20,
        padding: 8,
        gap: 8,
        maxWidth: 180,
    },
    compactContainerPlaying: {
        backgroundColor: COLORS.primary + '25',
    },
    compactPlayButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    compactWaveform: {
        flex: 1,
        height: 3,
        backgroundColor: COLORS.border,
        borderRadius: 2,
        overflow: 'hidden',
    },
    compactProgress: {
        height: '100%',
        backgroundColor: COLORS.primary,
    },
    compactDuration: {
        fontSize: 11,
        color: COLORS.text,
        fontWeight: '500',
    },
});
