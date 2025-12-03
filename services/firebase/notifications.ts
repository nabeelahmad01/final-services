import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from './config';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export type NotificationType =
    | 'new_service_request'
    | 'new_proposal'
    | 'proposal_accepted'
    | 'proposal_rejected'
    | 'booking_started'
    | 'booking_completed'
    | 'chat_message'
    | 'mechanic_arriving';

export interface NotificationData {
    type: NotificationType;
    title: string;
    body: string;
    data?: {
        requestId?: string;
        proposalId?: string;
        bookingId?: string;
        chatId?: string;
        [key: string]: any;
    };
}

export const registerForPushNotifications = async (): Promise<string | null> => {
    if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#00ACC1',
        });
    }

    return token;
};

// Save push token to user document in Firestore
export const savePushTokenToUser = async (userId: string, token: string) => {
    try {
        const userRef = doc(firestore, 'users', userId);
        await updateDoc(userRef, {
            pushToken: token,
            lastTokenUpdate: new Date(),
        });
        console.log('Push token saved for user:', userId);
    } catch (error) {
        console.error('Error saving push token:', error);
    }
};

export const sendLocalNotification = async (
    notificationData: NotificationData
) => {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: notificationData.title,
            body: notificationData.body,
            data: {
                type: notificationData.type,
                ...notificationData.data
            },
            sound: true,
        },
        trigger: null, // Immediately
    });
};

// Trigger notification based on type
export const triggerNotification = async (notificationData: NotificationData) => {
    // In production, this would call Firebase Cloud Functions to send push notification
    // For now, we'll use local notifications for testing
    await sendLocalNotification(notificationData);
};

export const subscribeToNotifications = (
    callback: (notification: Notifications.Notification) => void
) => {
    return Notifications.addNotificationReceivedListener(callback);
};

export const subscribeToNotificationResponse = (
    callback: (response: Notifications.NotificationResponse) => void
) => {
    return Notifications.addNotificationResponseReceivedListener(callback);
};

// Helper functions for specific notification types
export const notifyNewServiceRequest = (requestId: string, category: string, customerName: string) => {
    return triggerNotification({
        type: 'new_service_request',
        title: '🔔 New Service Request',
        body: `${customerName} needs ${category} service nearby`,
        data: { requestId },
    });
};

export const notifyNewProposal = (proposalId: string, mechanicName: string, price: number) => {
    return triggerNotification({
        type: 'new_proposal',
        title: '💼 New Proposal Received',
        body: `${mechanicName} sent a proposal for PKR ${price}`,
        data: { proposalId },
    });
};

export const notifyProposalAccepted = (bookingId: string, customerName: string) => {
    return triggerNotification({
        type: 'proposal_accepted',
        title: '🎉 Proposal Accepted!',
        body: `${customerName} accepted your proposal`,
        data: { bookingId },
    });
};

export const notifyBookingStarted = (bookingId: string, mechanicName: string) => {
    return triggerNotification({
        type: 'booking_started',
        title: '🚗 Mechanic On The Way',
        body: `${mechanicName} is heading to your location`,
        data: { bookingId },
    });
};

export const notifyBookingCompleted = (bookingId: string) => {
    return triggerNotification({
        type: 'booking_completed',
        title: '✅ Job Completed',
        body: 'Please rate your experience',
        data: { bookingId },
    });
};

export const notifyChatMessage = (chatId: string, senderName: string, message: string) => {
    return triggerNotification({
        type: 'chat_message',
        title: `💬 ${senderName}`,
        body: message,
        data: { chatId },
    });
};

