// Audio service with expo-av for sound and expo-haptics for vibration
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

// Sound objects
let bellSound: Audio.Sound | null = null;
let isRingtoneLooping = false;

/**
 * Initialize audio service - configure audio mode
 */
export const initializeAudio = async (): Promise<void> => {
    try {
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
        });
        console.log('🔊 Audio service initialized');
    } catch (error) {
        console.error('❌ Error initializing audio:', error);
    }
};

/**
 * Load bell ringtone sound
 */
const loadBellSound = async (): Promise<Audio.Sound | null> => {
    try {
        if (bellSound) {
            return bellSound;
        }

        const { sound } = await Audio.Sound.createAsync(
            require('@/assets/sounds/bell.wav'),
            { shouldPlay: false, isLooping: false }
        );
        bellSound = sound;
        return sound;
    } catch (error) {
        console.error('❌ Error loading bell sound:', error);
        return null;
    }
};

/**
 * Play bell ringtone for mechanic service requests
 * Loops until stopped
 */
export const playServiceRequestRingtone = async (): Promise<void> => {
    try {
        const sound = await loadBellSound();
        if (!sound) {
            // Fallback to haptic if sound fails
            await playNotificationSound();
            return;
        }

        isRingtoneLooping = true;
        console.log('🔔 Playing service request ringtone...');

        // Play with looping
        await sound.setIsLoopingAsync(true);
        await sound.setPositionAsync(0);
        await sound.playAsync();

        // Also vibrate
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
        console.error('❌ Error playing ringtone:', error);
        // Fallback to haptic
        await playNotificationSound();
    }
};

/**
 * Stop the service request ringtone
 */
export const stopServiceRequestRingtone = async (): Promise<void> => {
    try {
        isRingtoneLooping = false;
        if (bellSound) {
            await bellSound.stopAsync();
            await bellSound.setPositionAsync(0);
            console.log('🔕 Ringtone stopped');
        }
    } catch (error) {
        console.error('❌ Error stopping ringtone:', error);
    }
};

/**
 * Play notification sound with vibration (for customers)
 */
export const playNotificationSound = async (): Promise<void> => {
    try {
        console.log('🔔 Playing notification...');
        // Heavy haptic for noticeable feedback
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Try to play a short bell sound too
        try {
            const sound = await loadBellSound();
            if (sound) {
                await sound.setIsLoopingAsync(false);
                await sound.setPositionAsync(0);
                await sound.playAsync();
            }
        } catch (e) {
            // Sound failed, haptic already played
        }

        console.log('✅ Notification played');
    } catch (error) {
        console.error('❌ Error playing notification:', error);
    }
};

/**
 * Play customer proposal notification - vibration + sound
 */
export const playProposalNotification = async (): Promise<void> => {
    try {
        console.log('📬 Playing proposal notification...');

        // Strong vibration pattern
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

        // Short delay then another vibration
        setTimeout(async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 200);

        // Try to play bell sound once
        try {
            const sound = await loadBellSound();
            if (sound) {
                await sound.setIsLoopingAsync(false);
                await sound.setPositionAsync(0);
                await sound.playAsync();
            }
        } catch (e) {
            // Sound failed, haptic already played
        }

        console.log('✅ Proposal notification played');
    } catch (error) {
        console.error('❌ Error playing proposal notification:', error);
    }
};

/**
 * Play a custom sound (using haptic patterns)
 */
export const playSound = async (soundType: 'success' | 'warning' | 'error' = 'success', _volume: number = 1.0): Promise<void> => {
    try {
        let feedbackType: Haptics.NotificationFeedbackType;

        switch (soundType) {
            case 'success':
                feedbackType = Haptics.NotificationFeedbackType.Success;
                break;
            case 'warning':
                feedbackType = Haptics.NotificationFeedbackType.Warning;
                break;
            case 'error':
                feedbackType = Haptics.NotificationFeedbackType.Error;
                break;
            default:
                feedbackType = Haptics.NotificationFeedbackType.Success;
        }

        await Haptics.notificationAsync(feedbackType);
    } catch (error) {
        console.error('Error playing haptic:', error);
    }
};

/**
 * Stop notification sound
 */
export const stopNotificationSound = async (): Promise<void> => {
    await stopServiceRequestRingtone();
};

/**
 * Check if audio is available
 */
export const isAudioServiceAvailable = (): boolean => {
    return true;
};

/**
 * Play impact haptic feedback
 */
export const playImpactHaptic = async (style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> => {
    try {
        let impactStyle: Haptics.ImpactFeedbackStyle;

        switch (style) {
            case 'light':
                impactStyle = Haptics.ImpactFeedbackStyle.Light;
                break;
            case 'medium':
                impactStyle = Haptics.ImpactFeedbackStyle.Medium;
                break;
            case 'heavy':
                impactStyle = Haptics.ImpactFeedbackStyle.Heavy;
                break;
            default:
                impactStyle = Haptics.ImpactFeedbackStyle.Medium;
        }

        await Haptics.impactAsync(impactStyle);
    } catch (error) {
        console.error('Error playing impact haptic:', error);
    }
};

/**
 * Play selection haptic (for UI interactions)
 */
export const playSelectionHaptic = async (): Promise<void> => {
    try {
        await Haptics.selectionAsync();
    } catch (error) {
        console.error('Error playing selection haptic:', error);
    }
};

/**
 * Cleanup - unload sounds
 */
export const cleanupAudio = async (): Promise<void> => {
    try {
        if (bellSound) {
            await bellSound.unloadAsync();
            bellSound = null;
        }
    } catch (error) {
        console.error('Error cleaning up audio:', error);
    }
};
