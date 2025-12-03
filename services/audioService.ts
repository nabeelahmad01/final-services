// Audio service using Expo Haptics for notification feedback
// This works in Expo Go and provides tactile feedback instead of sound
import * as Haptics from 'expo-haptics';

/**
 * Initialize audio (not needed for haptics)
 */
export const initializeAudio = async (): Promise<void> => {
    console.log('🔊 Audio service initialized with Haptics feedback');
};

/**
 * Play notification sound (using haptic feedback)
 * This provides a vibration pattern that alerts the user
 */
export const playNotificationSound = async (): Promise<void> => {
    try {
        console.log('🔔 Playing notification haptic...');
        // Play a notification-style haptic feedback
        await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
        );
        console.log('✅ Notification haptic played successfully');
    } catch (error) {
        console.error('❌ Error playing notification haptic:', error);
    }
};

/**
 * Play a custom sound (using different haptic patterns)
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
 * Stop notification sound (not applicable for haptics)
 */
export const stopNotificationSound = async (): Promise<void> => {
    // Haptics are instantaneous, nothing to stop
};

/**
 * Check if audio is available
 */
export const isAudioServiceAvailable = (): boolean => {
    return true; // Haptics is always available in Expo
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
