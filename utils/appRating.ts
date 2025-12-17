/**
 * App Rating Prompt Utility for FixKar
 * Prompts users to rate the app at strategic moments
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking, Platform } from 'react-native';

const STORAGE_KEY = 'app_rating_state';

// App store URLs
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.fixkar.app';
const APP_STORE_URL = 'https://apps.apple.com/app/fixkar/id123456789'; // Update with real ID

interface RatingState {
    hasRated: boolean;
    lastPromptDate: number | null;
    promptCount: number;
    completedBookings: number;
    lastBookingDate: number | null;
}

const DEFAULT_STATE: RatingState = {
    hasRated: false,
    lastPromptDate: null,
    promptCount: 0,
    completedBookings: 0,
    lastBookingDate: null,
};

// Configuration
const CONFIG = {
    minBookingsBeforePrompt: 2,    // Show after 2 completed bookings
    daysBetweenPrompts: 30,        // Don't prompt more than once per month
    maxPrompts: 3,                 // Stop asking after 3 prompts
};

/**
 * Get current rating state
 */
const getRatingState = async (): Promise<RatingState> => {
    try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) return DEFAULT_STATE;
        return { ...DEFAULT_STATE, ...JSON.parse(stored) };
    } catch (error) {
        console.error('Error reading rating state:', error);
        return DEFAULT_STATE;
    }
};

/**
 * Save rating state
 */
const saveRatingState = async (state: RatingState): Promise<void> => {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error('Error saving rating state:', error);
    }
};

/**
 * Record a completed booking
 */
export const recordCompletedBooking = async (): Promise<void> => {
    const state = await getRatingState();
    state.completedBookings += 1;
    state.lastBookingDate = Date.now();
    await saveRatingState(state);
};

/**
 * Check if we should show rating prompt
 */
export const shouldShowRatingPrompt = async (): Promise<boolean> => {
    const state = await getRatingState();

    // Already rated
    if (state.hasRated) return false;

    // Already prompted too many times
    if (state.promptCount >= CONFIG.maxPrompts) return false;

    // Not enough bookings yet
    if (state.completedBookings < CONFIG.minBookingsBeforePrompt) return false;

    // Check if enough time has passed since last prompt
    if (state.lastPromptDate) {
        const daysSinceLastPrompt = 
            (Date.now() - state.lastPromptDate) / (1000 * 60 * 60 * 24);
        if (daysSinceLastPrompt < CONFIG.daysBetweenPrompts) return false;
    }

    return true;
};

/**
 * Show rating prompt dialog
 */
export const showRatingPrompt = async (): Promise<void> => {
    const state = await getRatingState();

    // Update prompt count and date
    state.promptCount += 1;
    state.lastPromptDate = Date.now();
    await saveRatingState(state);

    Alert.alert(
        '⭐ Enjoying FixKar?',
        'Would you like to rate us on the app store? Your feedback helps us improve!',
        [
            {
                text: 'Not Now',
                style: 'cancel',
            },
            {
                text: 'Never Ask',
                onPress: async () => {
                    const s = await getRatingState();
                    s.hasRated = true; // Mark as "done" so we don't ask again
                    await saveRatingState(s);
                },
            },
            {
                text: 'Rate Now ⭐',
                onPress: async () => {
                    await openAppStore();
                    const s = await getRatingState();
                    s.hasRated = true;
                    await saveRatingState(s);
                },
            },
        ]
    );
};

/**
 * Open app store for rating
 */
export const openAppStore = async (): Promise<void> => {
    const storeUrl = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;

    try {
        const canOpen = await Linking.canOpenURL(storeUrl);
        if (canOpen) {
            await Linking.openURL(storeUrl);
        } else {
            console.log('Cannot open store URL');
        }
    } catch (error) {
        console.error('Error opening app store:', error);
    }
};

/**
 * Check and show rating prompt if appropriate
 * Call this after key positive moments (e.g., booking completed, review submitted)
 */
export const checkAndShowRating = async (): Promise<void> => {
    const shouldShow = await shouldShowRatingPrompt();
    if (shouldShow) {
        // Add slight delay for better UX
        setTimeout(() => {
            showRatingPrompt();
        }, 1500);
    }
};

/**
 * Force reset rating state (for testing)
 */
export const resetRatingState = async (): Promise<void> => {
    await AsyncStorage.removeItem(STORAGE_KEY);
};

export default {
    recordCompletedBooking,
    shouldShowRatingPrompt,
    showRatingPrompt,
    openAppStore,
    checkAndShowRating,
    resetRatingState,
};
