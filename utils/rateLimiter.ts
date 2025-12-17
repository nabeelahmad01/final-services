/**
 * Rate Limiter Utility for FixKar
 * Prevents abuse of OTP, login, and other rate-limited operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface RateLimitConfig {
    maxAttempts: number;       // Maximum attempts allowed
    windowMs: number;          // Time window in milliseconds
    blockDurationMs: number;   // How long to block after max attempts
}

interface RateLimitState {
    attempts: number;
    firstAttemptTime: number;
    blockedUntil: number | null;
}

// Default configurations for different action types
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
    otp_request: {
        maxAttempts: 3,
        windowMs: 60 * 1000,        // 1 minute window
        blockDurationMs: 60 * 1000, // Block for 1 minute
    },
    login_attempt: {
        maxAttempts: 5,
        windowMs: 5 * 60 * 1000,     // 5 minute window
        blockDurationMs: 10 * 60 * 1000, // Block for 10 minutes
    },
    password_reset: {
        maxAttempts: 3,
        windowMs: 5 * 60 * 1000,     // 5 minute window
        blockDurationMs: 15 * 60 * 1000, // Block for 15 minutes
    },
    api_request: {
        maxAttempts: 100,
        windowMs: 60 * 1000,         // 1 minute window
        blockDurationMs: 60 * 1000,  // Block for 1 minute
    },
};

const STORAGE_KEY_PREFIX = 'rate_limit_';

/**
 * Get rate limit state from storage
 */
const getRateLimitState = async (key: string): Promise<RateLimitState | null> => {
    try {
        const stored = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
        if (!stored) return null;
        return JSON.parse(stored);
    } catch (error) {
        console.error('Error reading rate limit state:', error);
        return null;
    }
};

/**
 * Save rate limit state to storage
 */
const saveRateLimitState = async (key: string, state: RateLimitState): Promise<void> => {
    try {
        await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, JSON.stringify(state));
    } catch (error) {
        console.error('Error saving rate limit state:', error);
    }
};

/**
 * Clear rate limit state
 */
export const clearRateLimit = async (actionType: string, identifier: string = 'default'): Promise<void> => {
    const key = `${actionType}_${identifier}`;
    try {
        await AsyncStorage.removeItem(`${STORAGE_KEY_PREFIX}${key}`);
    } catch (error) {
        console.error('Error clearing rate limit:', error);
    }
};

/**
 * Check if an action is rate limited
 * Returns { allowed: boolean, remainingAttempts: number, retryAfterMs: number | null }
 */
export const checkRateLimit = async (
    actionType: string,
    identifier: string = 'default'
): Promise<{
    allowed: boolean;
    remainingAttempts: number;
    retryAfterMs: number | null;
    message: string;
}> => {
    const config = RATE_LIMIT_CONFIGS[actionType];
    if (!config) {
        // No rate limiting configured for this action
        return { allowed: true, remainingAttempts: 99, retryAfterMs: null, message: '' };
    }

    const key = `${actionType}_${identifier}`;
    const now = Date.now();
    let state = await getRateLimitState(key);

    // Check if currently blocked
    if (state?.blockedUntil && state.blockedUntil > now) {
        const retryAfterMs = state.blockedUntil - now;
        const seconds = Math.ceil(retryAfterMs / 1000);
        return {
            allowed: false,
            remainingAttempts: 0,
            retryAfterMs,
            message: `Too many attempts. Please wait ${seconds} seconds.`,
        };
    }

    // Reset if window expired
    if (state && (now - state.firstAttemptTime) > config.windowMs) {
        state = null;
    }

    // Calculate remaining attempts
    const attempts = state?.attempts || 0;
    const remainingAttempts = config.maxAttempts - attempts;

    if (remainingAttempts <= 0) {
        // Block the user
        const newState: RateLimitState = {
            attempts: config.maxAttempts,
            firstAttemptTime: state?.firstAttemptTime || now,
            blockedUntil: now + config.blockDurationMs,
        };
        await saveRateLimitState(key, newState);

        const seconds = Math.ceil(config.blockDurationMs / 1000);
        return {
            allowed: false,
            remainingAttempts: 0,
            retryAfterMs: config.blockDurationMs,
            message: `Too many attempts. Please wait ${seconds} seconds.`,
        };
    }

    return {
        allowed: true,
        remainingAttempts,
        retryAfterMs: null,
        message: '',
    };
};

/**
 * Record an attempt for rate limiting
 * Call this AFTER checkRateLimit returns allowed: true
 */
export const recordAttempt = async (
    actionType: string,
    identifier: string = 'default'
): Promise<void> => {
    const config = RATE_LIMIT_CONFIGS[actionType];
    if (!config) return;

    const key = `${actionType}_${identifier}`;
    const now = Date.now();
    let state = await getRateLimitState(key);

    // Reset if window expired
    if (state && (now - state.firstAttemptTime) > config.windowMs) {
        state = null;
    }

    const newState: RateLimitState = {
        attempts: (state?.attempts || 0) + 1,
        firstAttemptTime: state?.firstAttemptTime || now,
        blockedUntil: null,
    };

    await saveRateLimitState(key, newState);
};

/**
 * Record a successful action (clears rate limit)
 */
export const recordSuccess = async (
    actionType: string,
    identifier: string = 'default'
): Promise<void> => {
    await clearRateLimit(actionType, identifier);
};

/**
 * Get formatted time remaining for rate limit
 */
export const getTimeRemaining = (retryAfterMs: number): string => {
    const seconds = Math.ceil(retryAfterMs / 1000);
    if (seconds < 60) {
        return `${seconds} seconds`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
};

export default {
    checkRateLimit,
    recordAttempt,
    recordSuccess,
    clearRateLimit,
    getTimeRemaining,
};
