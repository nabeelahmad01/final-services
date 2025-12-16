/**
 * Firebase Cloud Functions for Push Notifications
 * 
 * These functions run on Firebase servers and send push notifications
 * when database events occur (new proposals, bookings, etc.)
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Send push notification to a user
 */
async function sendPushNotification(userId, title, body, data = {}) {
    try {
        // Get user's push token from mechanics or customers collection
        let userDoc = await db.collection('mechanics').doc(userId).get();
        
        if (!userDoc.exists) {
            userDoc = await db.collection('customers').doc(userId).get();
        }
        
        if (!userDoc.exists) {
            console.log('User not found:', userId);
            return;
        }
        
        const userData = userDoc.data();
        const pushToken = userData.fcmToken || userData.pushToken;
        
        if (!pushToken) {
            console.log('No push token for user:', userId);
            return;
        }
        
        const message = {
            token: pushToken,
            notification: {
                title,
                body,
            },
            data: {
                ...data,
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: 'default',
                },
            },
        };
        
        const response = await messaging.send(message);
        console.log('Push notification sent:', response);
        return response;
        
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
}

/**
 * Trigger: New Proposal Created
 * Notifies customer when a mechanic sends a proposal
 */
exports.onNewProposal = functions.firestore
    .document('proposals/{proposalId}')
    .onCreate(async (snap, context) => {
        const proposal = snap.data();
        
        await sendPushNotification(
            proposal.customerId,
            '💼 نئی پیشکش آئی!',
            `${proposal.mechanicName} نے ${proposal.price} روپے کی پیشکش بھیجی`,
            {
                type: 'new_proposal',
                proposalId: context.params.proposalId,
                requestId: proposal.requestId,
            }
        );
    });

/**
 * Trigger: Proposal Status Updated
 * Notifies mechanic when proposal is accepted/rejected
 */
exports.onProposalUpdated = functions.firestore
    .document('proposals/{proposalId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        
        // Only trigger if status changed
        if (before.status === after.status) return;
        
        if (after.status === 'accepted') {
            await sendPushNotification(
                after.mechanicId,
                '🎉 پیشکش قبول!',
                `${after.customerName || 'Customer'} نے آپ کی پیشکش قبول کر لی`,
                {
                    type: 'proposal_accepted',
                    proposalId: context.params.proposalId,
                    bookingId: after.bookingId || '',
                }
            );
        }
    });

/**
 * Trigger: Booking Status Updated
 * Notifies customer/mechanic based on booking status changes
 */
exports.onBookingUpdated = functions.firestore
    .document('bookings/{bookingId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        
        // Only trigger if status changed
        if (before.status === after.status) return;
        
        const bookingId = context.params.bookingId;
        
        switch (after.status) {
            case 'ongoing':
                // Mechanic is on the way
                await sendPushNotification(
                    after.customerId,
                    '🚗 مستری آ رہا ہے!',
                    `${after.mechanicName} آپ کی طرف آ رہا ہے`,
                    { type: 'booking_started', bookingId }
                );
                break;
                
            case 'completed':
                // Job completed - notify both
                await sendPushNotification(
                    after.customerId,
                    '✅ کام مکمل!',
                    'براہ کرم اپنا تجربہ درجہ بندی کریں',
                    { type: 'booking_completed', bookingId }
                );
                await sendPushNotification(
                    after.mechanicId,
                    '✅ کام مکمل!',
                    `آپ نے ${after.price} روپے کمائے`,
                    { type: 'booking_completed', bookingId }
                );
                break;
                
            case 'cancelled':
                // Notify the other party
                await sendPushNotification(
                    after.mechanicId,
                    '❌ بکنگ منسوخ',
                    'Customer نے بکنگ منسوخ کر دی',
                    { type: 'booking_cancelled', bookingId }
                );
                break;
        }
    });

/**
 * Trigger: New Chat Message
 * Notifies recipient of new message
 */
exports.onNewMessage = functions.firestore
    .document('chats/{chatId}/messages/{messageId}')
    .onCreate(async (snap, context) => {
        const message = snap.data();
        const chatId = context.params.chatId;
        
        // Get chat to find recipient
        const chatDoc = await db.collection('chats').doc(chatId).get();
        if (!chatDoc.exists) return;
        
        const chat = chatDoc.data();
        const senderId = message.user?._id;
        
        // Find recipient (other participant)
        const recipientId = chat.participants.find(p => p !== senderId);
        if (!recipientId) return;
        
        await sendPushNotification(
            recipientId,
            `💬 ${message.user?.name || 'New Message'}`,
            message.text?.substring(0, 100) || 'New message',
            { type: 'chat_message', chatId }
        );
    });

/**
 * Trigger: KYC Status Updated
 * Notifies mechanic of KYC approval/rejection
 */
exports.onKYCUpdated = functions.firestore
    .document('kycRequests/{requestId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        
        // Only trigger if status changed
        if (before.status === after.status) return;
        
        if (after.status === 'approved') {
            await sendPushNotification(
                after.mechanicId,
                '✅ KYC منظور!',
                'آپ کی تصدیق مکمل ہو گئی۔ اب آپ سروس درخواستیں وصول کر سکتے ہیں!',
                { type: 'kyc_approved' }
            );
        } else if (after.status === 'rejected') {
            await sendPushNotification(
                after.mechanicId,
                '❌ KYC مسترد',
                after.rejectionReason || 'براہ کرم صحیح دستاویزات کے ساتھ دوبارہ جمع کرائیں',
                { type: 'kyc_rejected' }
            );
        }
    });

/**
 * Trigger: New Service Request
 * Notifies nearby mechanics (this is a simplified version - 
 * for real geo-queries, you'd use Geohashing)
 */
exports.onNewServiceRequest = functions.firestore
    .document('serviceRequests/{requestId}')
    .onCreate(async (snap, context) => {
        const request = snap.data();
        const requestId = context.params.requestId;
        
        // Get all mechanics with matching category
        const mechanicsSnapshot = await db.collection('mechanics')
            .where('categories', 'array-contains', request.category)
            .where('kycStatus', '==', 'approved')
            .limit(50)
            .get();
        
        // Send notification to each mechanic
        const notifications = mechanicsSnapshot.docs.map(doc => {
            return sendPushNotification(
                doc.id,
                '🔔 نئی سروس درخواست!',
                `${request.customerName} کو ${request.category} سروس چاہیے`,
                { type: 'new_service_request', requestId }
            );
        });
        
        await Promise.all(notifications);
        console.log(`Notified ${mechanicsSnapshot.size} mechanics of new request`);
    });
