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
 * Notifies nearby mechanics
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

/**
 * JazzCash MWALLET Payment
 * Server-side payment processing for security
 */
const crypto = require('crypto');
const fetch = require('node-fetch');

// JazzCash Config - from .env credentials
const JAZZCASH_CONFIG = {
    merchantId: 'MC489932',
    password: '6355w4835w',
    integritySalt: 'us1gh5vw8x',
    mwalletUrl: 'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction',
};

// Format date for JazzCash
function formatJazzCashDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

// Generate HMAC-SHA256 hash for JazzCash
// Format: IntegritySalt&value1&value2&... (sorted alphabetically by key)
function generateSecureHash(data, integritySalt) {
    const sortedKeys = Object.keys(data).sort();
    let hashString = integritySalt;
    
    for (const key of sortedKeys) {
        // Skip pp_SecureHash from hash calculation
        if (key === 'pp_SecureHash') continue;
        
        const value = data[key];
        // Only include non-empty values
        if (value !== undefined && value !== null && value !== '') {
            hashString += '&' + value;
        }
    }
    
    console.log('Hash String:', hashString);
    
    const hash = crypto.createHmac('sha256', integritySalt)
        .update(hashString)
        .digest('hex')
        .toUpperCase();
    
    return hash;
}

exports.processJazzCashPayment = functions.https.onCall(async (data, context) => {
    // Log auth status (don't require it for now)
    if (!context.auth) {
        console.log('User is not authenticated via Firebase Auth, proceeding anyway...');
    } else {
        console.log('User authenticated:', context.auth.uid);
    }
    
    const { mobileNumber, cnic, amount, diamonds, mechanicId } = data;
    
    if (!mobileNumber || !amount || !diamonds || !mechanicId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }
    
    try {
        const now = new Date();
        const expiryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        const txnRefNo = `T${formatJazzCashDate(now)}`;
        const txnDateTime = formatJazzCashDate(now);
        const txnExpiryDateTime = formatJazzCashDate(expiryDate);
        const amountInPaisa = Math.round(amount * 100).toString();
        
        // Create transaction record
        const transactionRef = await db.collection('transactions').add({
            userId: mechanicId,
            type: 'purchase',
            amount: diamonds,
            paymentMethod: 'jazzcash',
            paymentDetails: {
                transactionId: txnRefNo,
                amount: amount,
            },
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        // MWALLET API parameters
        const formData = {
            pp_Amount: amountInPaisa,
            pp_BillReference: `FXK${Date.now().toString().slice(-10)}`,
            pp_CNIC: cnic || '',
            pp_Description: 'DiamondPurchase',
            pp_Language: 'EN',
            pp_MerchantID: JAZZCASH_CONFIG.merchantId,
            pp_MobileNumber: mobileNumber,
            pp_Password: JAZZCASH_CONFIG.password,
            pp_TxnCurrency: 'PKR',
            pp_TxnDateTime: txnDateTime,
            pp_TxnExpiryDateTime: txnExpiryDateTime,
            pp_TxnRefNo: txnRefNo,
            pp_TxnType: 'MWALLET',
            pp_Version: '2.0',
        };
        
        // Generate secure hash
        const secureHash = generateSecureHash(formData, JAZZCASH_CONFIG.integritySalt);
        formData.pp_SecureHash = secureHash;
        
        console.log('Sending MWALLET request:', JSON.stringify(formData));
        
        // Make API request
        const response = await fetch(JAZZCASH_CONFIG.mwalletUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });
        
        const result = await response.json();
        console.log('JazzCash Response:', JSON.stringify(result));
        
        if (result.pp_ResponseCode === '000') {
            // Payment successful - update mechanic diamonds
            const mechanicRef = db.collection('mechanics').doc(mechanicId);
            await mechanicRef.update({
                diamonds: admin.firestore.FieldValue.increment(diamonds),
            });
            
            // Update transaction status
            await transactionRef.update({
                status: 'completed',
                completedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            
            return {
                success: true,
                message: 'Payment successful',
                transactionId: txnRefNo,
            };
        } else if (result.pp_ResponseCode === '121') {
            // OTP required
            await transactionRef.update({
                status: 'pending_otp',
            });
            
            return {
                success: false,
                requiresOTP: true,
                message: 'OTP sent to your mobile number. Please approve in JazzCash app.',
                transactionId: txnRefNo,
            };
        } else {
            // Payment failed
            await transactionRef.update({
                status: 'failed',
                error: result.pp_ResponseMessage,
            });
            
            return {
                success: false,
                message: result.pp_ResponseMessage || 'Payment failed',
                errorCode: result.pp_ResponseCode,
            };
        }
        
    } catch (error) {
        console.error('JazzCash payment error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// HTTP Endpoint version (no auth required)
exports.jazzCashPaymentHttp = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).send('');
        return;
    }
    
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    const { mobileNumber, cnic, amount, diamonds, mechanicId } = req.body;
    
    if (!mobileNumber || !amount || !diamonds || !mechanicId) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }
    
    try {
        const now = new Date();
        const expiryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        const txnRefNo = `T${formatJazzCashDate(now)}`;
        const txnDateTime = formatJazzCashDate(now);
        const txnExpiryDateTime = formatJazzCashDate(expiryDate);
        const amountInPaisa = Math.round(amount * 100).toString();
        
        // Create transaction record
        const transactionRef = await db.collection('transactions').add({
            userId: mechanicId,
            type: 'purchase',
            amount: diamonds,
            paymentMethod: 'jazzcash',
            paymentDetails: {
                transactionId: txnRefNo,
                amount: amount,
            },
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        // MWALLET API parameters - only include CNIC if provided
        const formData = {
            pp_Amount: amountInPaisa,
            pp_BillReference: `FXK${Date.now().toString().slice(-10)}`,
            pp_Description: 'DiamondPurchase',
            pp_Language: 'EN',
            pp_MerchantID: JAZZCASH_CONFIG.merchantId,
            pp_MobileNumber: mobileNumber,
            pp_Password: JAZZCASH_CONFIG.password,
            pp_TxnCurrency: 'PKR',
            pp_TxnDateTime: txnDateTime,
            pp_TxnExpiryDateTime: txnExpiryDateTime,
            pp_TxnRefNo: txnRefNo,
            pp_TxnType: 'MWALLET',
            pp_Version: '2.0',
        };
        
        // Only add CNIC if provided and valid
        if (cnic && cnic.length === 6) {
            formData.pp_CNIC = cnic;
        }
        
        // Generate secure hash
        const secureHash = generateSecureHash(formData, JAZZCASH_CONFIG.integritySalt);
        formData.pp_SecureHash = secureHash;
        
        console.log('Sending MWALLET request:', JSON.stringify(formData));
        
        // Convert to form-urlencoded format
        const formBody = Object.keys(formData)
            .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(formData[key]))
            .join('&');
        
        // Make API request with form-urlencoded content type
        const response = await fetch(JAZZCASH_CONFIG.mwalletUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formBody,
        });
        
        const result = await response.json();
        console.log('JazzCash Response:', JSON.stringify(result));
        
        if (result.pp_ResponseCode === '000') {
            // Payment successful - update mechanic diamonds
            const mechanicRef = db.collection('mechanics').doc(mechanicId);
            await mechanicRef.update({
                diamonds: admin.firestore.FieldValue.increment(diamonds),
            });
            
            // Update transaction status
            await transactionRef.update({
                status: 'completed',
                completedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            
            res.json({
                success: true,
                message: 'Payment successful',
                transactionId: txnRefNo,
            });
        } else if (result.pp_ResponseCode === '121') {
            // OTP required
            await transactionRef.update({
                status: 'pending_otp',
            });
            
            res.json({
                success: false,
                requiresOTP: true,
                message: 'OTP sent to your mobile number. Please approve in JazzCash app.',
                transactionId: txnRefNo,
            });
        } else {
            // Payment failed
            await transactionRef.update({
                status: 'failed',
                error: result.pp_ResponseMessage,
            });
            
            res.json({
                success: false,
                message: result.pp_ResponseMessage || 'Payment failed',
                errorCode: result.pp_ResponseCode,
            });
        }
        
    } catch (error) {
        console.error('JazzCash payment error:', error);
        res.status(500).json({ error: error.message });
    }
});
