/**
 * Push Notifications Service
 * 
 * Implements Firebase Cloud Messaging (FCM) for push notifications
 * along with local notifications for banner alerts
 * 
 * Features:
 * - FCM token registration and management
 * - Foreground and background message handling
 * - Local notification scheduling
 * - Banner notifications for in-app alerts
 * - Type-safe notification data
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { firestore } from './config';
import { useBannerStore } from '@/stores/useBannerStore';
import { playNotificationSound } from '@/services/audioService';

// Try to import native Firebase messaging
let messaging: any = null;
let nativeMessagingAvailable = false;

try {
    messaging = require('@react-native-firebase/messaging').default;
    nativeMessagingAvailable = true;
    console.log('✅ Firebase Messaging loaded successfully');
} catch (e: any) {
    console.log('⚠️ Firebase Messaging not available, using Expo notifications');
    nativeMessagingAvailable = false;
}

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
    | 'mechanic_arriving'
    | 'mechanic_arrived'
    | 'payment_received'
    | 'kyc_approved'
    | 'kyc_rejected'
    | 'diamond_purchased'
    | 'scheduled_reminder';

export interface NotificationData {
    type: NotificationType;
    title: string;
    body: string;
    data?: {
        requestId?: string;
        proposalId?: string;
        bookingId?: string;
        chatId?: string;
        mechanicId?: string;
        customerId?: string;
        [key: string]: any;
    };
}

/**
 * Request notification permissions and get FCM token
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
    console.log('📲 Registering for push notifications...');

    if (!Device.isDevice) {
        console.log('⚠️ Must use physical device for Push Notifications');
        return null;
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('❌ Push notification permission denied');
        return null;
    }

    // Set up Android notification channel
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#00ACC1',
            sound: 'default',
        });

        // High priority channel for service requests
        await Notifications.setNotificationChannelAsync('service_requests', {
            name: 'Service Requests',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 500, 250, 500],
            lightColor: '#FF5722',
            sound: 'default',
        });

        // Chat channel
        await Notifications.setNotificationChannelAsync('chat', {
            name: 'Chat Messages',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 100],
            lightColor: '#00ACC1',
        });
    }

    // Get FCM token if native messaging is available
    if (nativeMessagingAvailable && messaging) {
        try {
            // Request permission for iOS
            if (Platform.OS === 'ios') {
                const authStatus = await messaging().requestPermission();
                const enabled =
                    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

                if (!enabled) {
                    console.log('❌ FCM permission not granted on iOS');
                    return null;
                }
            }

            // Get FCM token
            const fcmToken = await messaging().getToken();
            console.log('✅ FCM Token obtained:', fcmToken?.substring(0, 20) + '...');
            return fcmToken;
        } catch (error) {
            console.error('❌ Error getting FCM token:', error);
        }
    }

    // Fallback to Expo push token
    try {
        const expoPushToken = (await Notifications.getExpoPushTokenAsync({
            projectId: '0b5c778d-4bf3-4859-abc4-06ed5773f8e6', // From app.json
        })).data;
        console.log('✅ Expo Push Token:', expoPushToken?.substring(0, 20) + '...');
        return expoPushToken;
    } catch (error) {
        console.error('❌ Error getting Expo push token:', error);
        return null;
    }
};

/**
 * Set up FCM message handlers for foreground and background
 */
export const setupFCMHandlers = () => {
    if (!nativeMessagingAvailable || !messaging) {
        console.log('⚠️ FCM handlers not set up - using Expo notifications');
        return;
    }

    console.log('🔔 Setting up FCM handlers...');

    // Handle foreground messages
    messaging().onMessage(async (remoteMessage: any) => {
        console.log('📬 FCM Foreground message:', remoteMessage);

        // Show banner notification
        if (remoteMessage.notification) {
            showBannerNotification({
                type: remoteMessage.data?.type || 'info',
                title: remoteMessage.notification.title || '',
                body: remoteMessage.notification.body || '',
                data: remoteMessage.data,
            });

            // Play notification sound
            playNotificationSound();
        }
    });

    // Handle notification open (app in background)
    messaging().onNotificationOpenedApp((remoteMessage: any) => {
        console.log('📲 Notification opened app:', remoteMessage);
        handleNotificationNavigation(remoteMessage.data);
    });

    // Handle notification that opened app from quit state
    messaging()
        .getInitialNotification()
        .then((remoteMessage: any) => {
            if (remoteMessage) {
                console.log('📲 Initial notification:', remoteMessage);
                handleNotificationNavigation(remoteMessage.data);
            }
        });

    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
        console.log('📬 FCM Background message:', remoteMessage);
        // Background messages are automatically shown by the system
        // We can add custom handling here if needed
    });

    // Handle token refresh
    messaging().onTokenRefresh(async (newToken: string) => {
        console.log('🔄 FCM Token refreshed');
        // Token will be saved when the user opens the app
    });
};

/**
 * Handle navigation when notification is tapped
 */
const handleNotificationNavigation = (data: any) => {
    // Navigation will be handled by the app based on notification type
    // This is called from the root layout after router is ready
    console.log('🧭 Navigating based on notification data:', data);
};

/**
 * Save FCM/push token to user document in Firestore
 */
export const savePushTokenToUser = async (userId: string, token: string) => {
    try {
        console.log('💾 Saving push token for user:', userId);

        // Try mechanics collection first
        const mechanicDoc = await getDoc(doc(firestore, 'mechanics', userId));

        if (mechanicDoc.exists()) {
            await updateDoc(doc(firestore, 'mechanics', userId), {
                pushToken: token,
                fcmToken: token, // Also save as fcmToken for clarity
                lastTokenUpdate: new Date(),
                platform: Platform.OS,
            });
            console.log('✅ Push token saved for mechanic:', userId);
            return;
        }

        // Try customers collection
        const customerDoc = await getDoc(doc(firestore, 'customers', userId));
        if (customerDoc.exists()) {
            await updateDoc(doc(firestore, 'customers', userId), {
                pushToken: token,
                fcmToken: token,
                lastTokenUpdate: new Date(),
                platform: Platform.OS,
            });
            console.log('✅ Push token saved for customer:', userId);
            return;
        }

        console.error('❌ User not found in mechanics or customers collection');
    } catch (error) {
        console.error('❌ Error saving push token:', error);
    }
};

/**
 * Send a local notification immediately
 */
export const sendLocalNotification = async (
    notificationData: NotificationData
) => {
    const channelId = getChannelForType(notificationData.type);

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
        trigger: null, // Send immediately
    });

    console.log('📤 Local notification sent:', notificationData.title);
};

/**
 * Get notification channel based on type
 */
const getChannelForType = (type: NotificationType): string => {
    switch (type) {
        case 'new_service_request':
        case 'new_proposal':
            return 'service_requests';
        case 'chat_message':
            return 'chat';
        default:
            return 'default';
    }
};

/**
 * Show banner notification for foreground alerts
 */
export const showBannerNotification = (notificationData: NotificationData) => {
    const { showBanner } = useBannerStore.getState();

    // Determine banner type based on notification type
    let bannerType: 'success' | 'info' | 'warning' | 'error' = 'info';
    
    switch (notificationData.type) {
        case 'proposal_accepted':
        case 'booking_completed':
        case 'payment_received':
        case 'kyc_approved':
        case 'diamond_purchased':
            bannerType = 'success';
            break;
        case 'proposal_rejected':
        case 'kyc_rejected':
            bannerType = 'error';
            break;
        case 'new_service_request':
        case 'new_proposal':
            bannerType = 'warning';
            break;
        default:
            bannerType = 'info';
    }

    showBanner({
        type: bannerType,
        title: notificationData.title,
        message: notificationData.body,
        duration: 5000,
        data: notificationData.data,
    });
};

/**
 * Trigger both banner and local notification
 */
export const triggerNotification = async (notificationData: NotificationData) => {
    // Show banner notification for immediate feedback
    showBannerNotification(notificationData);

    // Send local notification for system tray
    await sendLocalNotification(notificationData);

    // Play sound
    playNotificationSound();
};

/**
 * Subscribe to Expo notification events
 */
export const subscribeToNotifications = (
    callback: (notification: Notifications.Notification) => void
) => {
    return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Subscribe to notification tap events
 */
export const subscribeToNotificationResponse = (
    callback: (response: Notifications.NotificationResponse) => void
) => {
    return Notifications.addNotificationResponseReceivedListener(callback);
};

// ============================================
// NOTIFICATION HELPER FUNCTIONS
// ============================================

/**
 * Notify mechanic about new service request
 */
export const notifyNewServiceRequest = (
    requestId: string, 
    category: string, 
    customerName: string
) => {
    return triggerNotification({
        type: 'new_service_request',
        title: '🔔 نئی سروس درخواست',
        body: `${customerName} کو ${category} سروس چاہیے`,
        data: { requestId },
    });
};

/**
 * Notify customer about new proposal
 */
export const notifyNewProposal = async (
    proposalId: string, 
    mechanicName: string, 
    price: number
) => {
    const { getProposal, createNotification } = await import('./firestore');
    const proposal = await getProposal(proposalId);

    if (!proposal) {
        console.error('Proposal not found:', proposalId);
        return;
    }

    // Create notification in Firestore for the customer
    await createNotification({
        userId: proposal.customerId,
        type: 'new_proposal',
        title: '💼 نئی پیشکش',
        message: `${mechanicName} نے ${price} روپے کی پیشکش بھیجی`,
        data: { proposalId, requestId: proposal.requestId },
        read: false
    });

    console.log('✅ Proposal notification created for customer:', proposal.customerId);
};

/**
 * Notify mechanic when proposal is accepted
 */
export const notifyProposalAccepted = async (
    bookingId: string, 
    customerName: string,
    mechanicId: string
) => {
    const { createNotification } = await import('./firestore');

    await createNotification({
        userId: mechanicId,
        type: 'proposal_accepted',
        title: '🎉 پیشکش قبول!',
        message: `${customerName} نے آپ کی پیشکش قبول کر لی`,
        data: { bookingId },
        read: false
    });

    return triggerNotification({
        type: 'proposal_accepted',
        title: '🎉 پیشکش قبول!',
        body: `${customerName} نے آپ کی پیشکش قبول کر لی`,
        data: { bookingId },
    });
};

/**
 * Notify customer when mechanic is on the way
 */
export const notifyMechanicOnWay = async (
    bookingId: string, 
    mechanicName: string,
    customerId: string
) => {
    const { createNotification } = await import('./firestore');

    await createNotification({
        userId: customerId,
        type: 'booking_started',
        title: '🚗 مستری آ رہا ہے',
        message: `${mechanicName} آپ کی طرف آ رہا ہے`,
        data: { bookingId },
        read: false
    });
};

/**
 * Notify customer when mechanic arrives
 */
export const notifyMechanicArrived = async (
    bookingId: string, 
    mechanicName: string,
    customerId: string
) => {
    const { createNotification } = await import('./firestore');

    await createNotification({
        userId: customerId,
        type: 'mechanic_arrived',
        title: '📍 مستری پہنچ گیا!',
        message: `${mechanicName} آپ کے مقام پر پہنچ گیا ہے`,
        data: { bookingId },
        read: false
    });
};

/**
 * Notify when job is completed
 */
export const notifyBookingCompleted = async (
    bookingId: string,
    customerId: string,
    mechanicId: string
) => {
    const { createNotification } = await import('./firestore');

    // Notify customer
    await createNotification({
        userId: customerId,
        type: 'booking_completed',
        title: '✅ کام مکمل',
        message: 'براہ کرم اپنا تجربہ درجہ بندی کریں',
        data: { bookingId },
        read: false
    });

    // Notify mechanic
    await createNotification({
        userId: mechanicId,
        type: 'booking_completed',
        title: '✅ کام مکمل',
        message: 'بہترین کام! آپ کی کمائی اپ ڈیٹ ہو گئی',
        data: { bookingId },
        read: false
    });
};

/**
 * Notify about chat message
 */
export const notifyChatMessage = async (
    chatId: string, 
    senderName: string, 
    message: string,
    recipientId: string
) => {
    const { createNotification } = await import('./firestore');

    await createNotification({
        userId: recipientId,
        type: 'chat_message',
        title: `💬 ${senderName}`,
        message: message.length > 50 ? message.substring(0, 50) + '...' : message,
        data: { chatId },
        read: false
    });
};

/**
 * Notify about payment received
 */
export const notifyPaymentReceived = async (
    mechanicId: string,
    amount: number,
    bookingId: string
) => {
    const { createNotification } = await import('./firestore');

    await createNotification({
        userId: mechanicId,
        type: 'payment_received',
        title: '💰 ادائیگی موصول',
        message: `آپ کو ${amount} روپے موصول ہوئے`,
        data: { bookingId, amount },
        read: false
    });
};

/**
 * Notify about KYC approval
 */
export const notifyKYCApproved = async (mechanicId: string) => {
    const { createNotification } = await import('./firestore');

    await createNotification({
        userId: mechanicId,
        type: 'kyc_approved',
        title: '✅ KYC منظور',
        message: 'آپ کی تصدیق مکمل ہو گئی۔ اب آپ سروس درخواستیں وصول کر سکتے ہیں!',
        data: {},
        read: false
    });
};

/**
 * Notify about KYC rejection
 */
export const notifyKYCRejected = async (mechanicId: string, reason?: string) => {
    const { createNotification } = await import('./firestore');

    await createNotification({
        userId: mechanicId,
        type: 'kyc_rejected',
        title: '❌ KYC مسترد',
        message: reason || 'براہ کرم صحیح دستاویزات کے ساتھ دوبارہ جمع کرائیں',
        data: {},
        read: false
    });
};

/**
 * Schedule a reminder notification
 */
export const scheduleReminder = async (
    title: string,
    body: string,
    triggerDate: Date,
    data?: Record<string, any>
) => {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data: { type: 'scheduled_reminder', ...data },
            sound: true,
        },
        trigger: { type: 'date', date: triggerDate } as any,
    });

    console.log('⏰ Reminder scheduled for:', triggerDate);
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('🗑️ All scheduled notifications cancelled');
};

/**
 * Get badge count
 */
export const getBadgeCount = async (): Promise<number> => {
    return await Notifications.getBadgeCountAsync();
};

/**
 * Set badge count
 */
export const setBadgeCount = async (count: number) => {
    await Notifications.setBadgeCountAsync(count);
};

/**
 * Clear badge
 */
export const clearBadge = async () => {
    await Notifications.setBadgeCountAsync(0);
};
