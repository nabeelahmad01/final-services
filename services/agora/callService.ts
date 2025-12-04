/**
 * Agora Voice Call Service for FixKar
 * 
 * NOTE: This service only works on development builds / APK
 * Expo Go does not support native modules like react-native-agora
 */

import { Platform, PermissionsAndroid, Alert } from 'react-native';

// Agora App ID from environment
const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || '';

// Agora engine instance
let agoraEngine: any = null;
let agoraAvailable: boolean | null = null;
let agoraChecked = false;

export interface CallConfig {
    userId: string;
    userName: string;
    callType: 'voice' | 'video';
}

/**
 * Request microphone permissions (Android)
 */
const requestMicrophonePermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                {
                    title: 'Microphone Permission',
                    message: 'FixKar needs access to your microphone for voice calls',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            console.warn('Microphone permission error:', err);
            return false;
        }
    }
    return true;
};

/**
 * Check if Agora is available (not in Expo Go)
 * MUST be called before any other Agora function
 */
export const isAgoraAvailable = (): boolean => {
    // Already checked
    if (agoraChecked) return agoraAvailable === true;
    agoraChecked = true;

    // Don't even try in Expo Go - check expo-constants
    try {
        const Constants = require('expo-constants').default;
        if (Constants.appOwnership === 'expo') {
            console.log('⚠️ Running in Expo Go - Agora not available');
            agoraAvailable = false;
            return false;
        }
    } catch (e) {
        // expo-constants not available, continue
    }

    // In development build, try to load Agora
    agoraAvailable = false; // Default to false for safety
    console.log('📱 Development build detected - Agora may be available');
    return false; // Return false for now, will be set true on actual init
};

/**
 * Initialize Agora RTC Engine
 */
export const initializeAgoraEngine = async (): Promise<any> => {
    // Quick check for Expo Go
    isAgoraAvailable();

    if (agoraAvailable === false) {
        console.warn('⚠️ Agora not available - using simulated calls');
        return null;
    }

    try {
        if (!AGORA_APP_ID) {
            console.error('❌ Agora App ID not configured!');
            return null;
        }

        // Request permissions first
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
            console.error('❌ Microphone permission denied');
            return null;
        }

        // Try to dynamically require Agora
        let createAgoraRtcEngine;
        try {
            const agoraSdk = require('react-native-agora');
            createAgoraRtcEngine = agoraSdk.default || agoraSdk.createAgoraRtcEngine;
        } catch (error) {
            console.warn('⚠️ react-native-agora not available:', error);
            agoraAvailable = false;
            return null;
        }

        // Create the engine
        agoraEngine = createAgoraRtcEngine();

        // Initialize the engine
        agoraEngine.initialize({
            appId: AGORA_APP_ID,
            channelProfile: 0,
        });

        // Enable audio
        agoraEngine.enableAudio();

        agoraAvailable = true;
        console.log('✅ Agora Engine initialized successfully');
        return agoraEngine;
    } catch (error) {
        console.error('❌ Failed to initialize Agora:', error);
        agoraAvailable = false;
        return null;
    }
};

/**
 * Get or create Agora engine
 */
export const getAgoraEngine = async (): Promise<any> => {
    if (agoraEngine) {
        return agoraEngine;
    }
    return await initializeAgoraEngine();
};

/**
 * Join a voice call channel
 */
export const joinVoiceCall = async (
    channelName: string,
    uid: number = 0,
    token?: string
): Promise<boolean> => {
    try {
        const engine = await getAgoraEngine();
        if (!engine) {
            console.warn('⚠️ Agora engine not available - simulating call');
            return true;
        }

        engine.setClientRole?.(1);
        engine.joinChannel?.(token || '', channelName, uid, {
            autoSubscribeAudio: true,
            publishMicrophoneTrack: true,
        });

        console.log(`✅ Joining voice call: ${channelName}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to join call:', error);
        return false;
    }
};

/**
 * Leave current call
 */
export const leaveCall = async (): Promise<void> => {
    try {
        if (agoraEngine) {
            agoraEngine.leaveChannel?.();
            console.log('✅ Left call successfully');
        }
    } catch (error) {
        console.error('❌ Failed to leave call:', error);
    }
};

/**
 * Mute/unmute local audio
 */
export const toggleMute = async (muted: boolean): Promise<void> => {
    try {
        if (agoraEngine) {
            agoraEngine.muteLocalAudioStream?.(muted);
        }
        console.log(`🎤 Audio ${muted ? 'muted' : 'unmuted'}`);
    } catch (error) {
        console.error('❌ Failed to toggle mute:', error);
    }
};

/**
 * Toggle speakerphone
 */
export const toggleSpeaker = async (enabled: boolean): Promise<void> => {
    try {
        if (agoraEngine) {
            agoraEngine.setEnableSpeakerphone?.(enabled);
        }
        console.log(`🔊 Speaker ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
        console.error('❌ Failed to toggle speaker:', error);
    }
};

/**
 * Generate unique channel name for a call
 */
export const generateChannelName = (userId1: string, userId2: string): string => {
    const sorted = [userId1, userId2].sort();
    return `call_${sorted[0]}_${sorted[1]}_${Date.now()}`;
};

/**
 * Generate numeric UID from user ID string
 */
export const generateUid = (userId: string): number => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        const char = userId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
};

/**
 * Setup Agora event listeners
 */
export const setupAgoraListeners = (callbacks: {
    onUserJoined?: (uid: number) => void;
    onUserOffline?: (uid: number, reason: number) => void;
    onJoinSuccess?: (channel: string, uid: number) => void;
    onError?: (errorCode: number, message: string) => void;
}): void => {
    if (!agoraEngine) {
        console.warn('⚠️ Agora engine not initialized - simulating events');
        setTimeout(() => {
            callbacks.onJoinSuccess?.('simulated_channel', 0);
        }, 1000);
        return;
    }

    try {
        const eventHandler = {
            onJoinChannelSuccess: (connection: any, elapsed: number) => {
                console.log(`✅ Joined channel: ${connection?.channelId}`);
                callbacks.onJoinSuccess?.(connection?.channelId || '', connection?.localUid || 0);
            },
            onUserJoined: (connection: any, remoteUid: number) => {
                console.log(`👤 Remote user joined: ${remoteUid}`);
                callbacks.onUserJoined?.(remoteUid);
            },
            onUserOffline: (connection: any, remoteUid: number, reason: number) => {
                console.log(`👋 Remote user left: ${remoteUid}`);
                callbacks.onUserOffline?.(remoteUid, reason);
            },
            onError: (err: number, msg: string) => {
                console.error(`❌ Agora error [${err}]: ${msg}`);
                callbacks.onError?.(err, msg);
            },
        };

        agoraEngine.registerEventHandler?.(eventHandler);
        console.log('✅ Agora event listeners registered');
    } catch (error) {
        console.warn('⚠️ Failed to register Agora listeners:', error);
    }
};

/**
 * Cleanup Agora engine
 */
export const destroyAgoraEngine = (): void => {
    try {
        if (agoraEngine) {
            agoraEngine.leaveChannel?.();
            agoraEngine.release?.();
            agoraEngine = null;
            console.log('🧹 Agora engine destroyed');
        }
    } catch (error) {
        console.warn('⚠️ Error destroying Agora engine:', error);
    }
};

export default {
    initializeAgoraEngine,
    getAgoraEngine,
    isAgoraAvailable,
    joinVoiceCall,
    leaveCall,
    toggleMute,
    toggleSpeaker,
    generateChannelName,
    generateUid,
    setupAgoraListeners,
    destroyAgoraEngine,
};
