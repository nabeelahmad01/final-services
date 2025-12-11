/**
 * Agora Voice Call Service for FixKar
 * 
 * NOTE: This service only works on development builds / APK
 * Expo Go does not support native modules like react-native-agora
 */

import { Platform, PermissionsAndroid } from 'react-native';
import {
    ChannelProfileType,
    ClientRoleType,
    IRtcEngine,
    RtcConnection,
    IRtcEngineEventHandler,
    createAgoraRtcEngine,
} from 'react-native-agora';

// Agora App ID from environment
const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || '';

// Agora engine instance
let agoraEngine: IRtcEngine | null = null;
let isInitialized = false;
let eventHandler: IRtcEngineEventHandler | null = null;

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
 */
export const isAgoraAvailable = (): boolean => {
    try {
        // Check if running in Expo Go
        const Constants = require('expo-constants').default;
        if (Constants.appOwnership === 'expo') {
            console.log('⚠️ Running in Expo Go - Agora not available');
            return false;
        }
    } catch (e) {
        // expo-constants not available, might be a bare workflow
    }

    // Check if createAgoraRtcEngine is available
    try {
        if (typeof createAgoraRtcEngine === 'function') {
            return true;
        }
    } catch (e) {
        console.log('⚠️ Agora SDK not available');
    }

    return false;
};

/**
 * Initialize Agora RTC Engine
 */
export const initializeAgoraEngine = async (): Promise<IRtcEngine | null> => {
    if (isInitialized && agoraEngine) {
        console.log('✅ Agora engine already initialized');
        return agoraEngine;
    }

    try {
        if (!AGORA_APP_ID) {
            console.error('❌ Agora App ID not configured!');
            return null;
        }

        // Check if Agora is available
        if (!isAgoraAvailable()) {
            console.warn('⚠️ Agora not available - using simulated calls');
            return null;
        }

        // Request permissions first
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
            console.error('❌ Microphone permission denied');
            return null;
        }

        // Create the engine
        agoraEngine = createAgoraRtcEngine();

        // Initialize the engine
        agoraEngine.initialize({
            appId: AGORA_APP_ID,
            channelProfile: ChannelProfileType.ChannelProfileCommunication,
        });

        // Enable audio - CRITICAL for voice calls
        agoraEngine.enableAudio();
        agoraEngine.enableLocalAudio(true);
        
        // Set audio profile for voice call quality
        agoraEngine.setAudioProfile(0, 3); // Default profile, Gaming scenario for low latency
        
        // Make sure we can hear remote users
        agoraEngine.muteAllRemoteAudioStreams(false);
        agoraEngine.muteLocalAudioStream(false);
        
        // Adjust volumes to max
        agoraEngine.adjustRecordingSignalVolume(400); // Microphone volume boosted
        agoraEngine.adjustPlaybackSignalVolume(400); // Speaker volume boosted
        agoraEngine.adjustAudioMixingVolume(100);
        
        // IMPORTANT: Set default audio route to SPEAKER so users can hear
        agoraEngine.setDefaultAudioRouteToSpeakerphone(true);
        agoraEngine.setEnableSpeakerphone(true);

        isInitialized = true;
        console.log('✅ Agora Engine initialized successfully');
        console.log('📱 App ID:', AGORA_APP_ID.substring(0, 8) + '...');
        console.log('🎤 Audio enabled, volumes boosted, SPEAKER enabled');

        return agoraEngine;
    } catch (error) {
        console.error('❌ Failed to initialize Agora:', error);
        isInitialized = false;
        agoraEngine = null;
        return null;
    }
};

/**
 * Get or create Agora engine
 */
export const getAgoraEngine = async (): Promise<IRtcEngine | null> => {
    if (agoraEngine && isInitialized) {
        return agoraEngine;
    }
    return await initializeAgoraEngine();
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
        // Unregister previous handler if exists
        if (eventHandler) {
            agoraEngine.unregisterEventHandler(eventHandler);
        }

        eventHandler = {
            onJoinChannelSuccess: (connection: RtcConnection, elapsed: number) => {
                console.log(`✅ Joined channel: ${connection.channelId}, uid: ${connection.localUid}`);
                callbacks.onJoinSuccess?.(connection.channelId || '', connection.localUid || 0);
            },
            onUserJoined: (connection: RtcConnection, remoteUid: number, elapsed: number) => {
                console.log(`👤 Remote user joined: ${remoteUid}`);
                callbacks.onUserJoined?.(remoteUid);
            },
            onUserOffline: (connection: RtcConnection, remoteUid: number, reason: number) => {
                console.log(`👋 Remote user left: ${remoteUid}, reason: ${reason}`);
                callbacks.onUserOffline?.(remoteUid, reason);
            },
            onError: (err: number, msg: string) => {
                console.error(`❌ Agora error [${err}]: ${msg}`);
                callbacks.onError?.(err, msg);
            },
            onConnectionStateChanged: (connection: RtcConnection, state: number, reason: number) => {
                console.log(`🔌 Connection state: ${state}, reason: ${reason}`);
            },
            onAudioRoutingChanged: (routing: number) => {
                console.log(`🔊 Audio routing changed to: ${routing}`);
            },
        };

        agoraEngine.registerEventHandler(eventHandler);
        console.log('✅ Agora event listeners registered');
    } catch (error) {
        console.warn('⚠️ Failed to register Agora listeners:', error);
    }
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
            return true; // Return true for simulated mode
        }

        console.log(`📞 Attempting to join channel: ${channelName}`);

        // Set client role to broadcaster (can send and receive audio)
        engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

        // Enable audio before joining - CRITICAL
        engine.enableAudio();
        engine.enableLocalAudio(true);
        engine.muteLocalAudioStream(false);
        engine.muteAllRemoteAudioStreams(false);
        
        // Boost volumes for clear audio
        engine.adjustRecordingSignalVolume(400);
        engine.adjustPlaybackSignalVolume(400);
        
        // Enable speaker for loud and clear audio
        engine.setEnableSpeakerphone(true);

        // Join the channel with proper options
        const result = engine.joinChannel(
            token || '', // Token (empty for testing without token)
            channelName,
            uid,
            {
                autoSubscribeAudio: true,
                publishMicrophoneTrack: true,
                clientRoleType: ClientRoleType.ClientRoleBroadcaster,
            }
        );

        console.log(`✅ Join channel result: ${result}`);
        console.log(`📞 Channel: ${channelName}, UID: ${uid}`);
        console.log(`🎤 Local audio enabled, SPEAKER ON, volumes boosted`);
        
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
            agoraEngine.leaveChannel();
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
            agoraEngine.muteLocalAudioStream(muted);
            console.log(`🎤 Audio ${muted ? 'muted' : 'unmuted'}`);
        }
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
            agoraEngine.setEnableSpeakerphone(enabled);
            console.log(`🔊 Speaker ${enabled ? 'enabled' : 'disabled'}`);
        }
    } catch (error) {
        console.error('❌ Failed to toggle speaker:', error);
    }
};

/**
 * Generate unique channel name for a call
 */
export const generateChannelName = (userId1: string, userId2: string): string => {
    const sorted = [userId1, userId2].sort();
    return `fixkar_${sorted[0].slice(-6)}_${sorted[1].slice(-6)}_${Date.now()}`;
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
    // Ensure positive number within valid range (1 to 2^32-1)
    return Math.abs(hash % 2147483647) + 1;
};

/**
 * Cleanup Agora engine
 */
export const destroyAgoraEngine = (): void => {
    try {
        if (agoraEngine) {
            if (eventHandler) {
                agoraEngine.unregisterEventHandler(eventHandler);
                eventHandler = null;
            }
            agoraEngine.leaveChannel();
            agoraEngine.release();
            agoraEngine = null;
            isInitialized = false;
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
