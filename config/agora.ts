export const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || '';

// Agora configuration
export const AgoraConfig = {
    appId: AGORA_APP_ID,
    // Voice call settings
    voiceCall: {
        channelProfile: 0, // Communication
        clientRole: 1, // Broadcaster
        audioProfile: 0, // Default
        audioScenario: 1, // Default
    },
};
