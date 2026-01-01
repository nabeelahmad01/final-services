import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage as webStorage } from './config';

// Try to use native Firebase storage if available
let nativeStorage: any = null;
let useNativeStorage = false;

try {
    nativeStorage = require('@react-native-firebase/storage').default;
    useNativeStorage = true;
    console.log('✅ Native Firebase Storage loaded');
} catch (e) {
    console.log('⚠️ Native Firebase Storage not available, using web SDK');
    useNativeStorage = false;
}

/**
 * Uploads an image to Firebase Storage and returns the download URL.
 * Uses native Firebase in dev builds, web SDK in Expo Go
 */
export const uploadImage = async (uri: string, path: string): Promise<string> => {
    try {
        console.log('Starting upload for:', path);
        console.log('Using native storage:', useNativeStorage);

        if (useNativeStorage && nativeStorage) {
            // Native Firebase Storage (development build)
            const reference = nativeStorage().ref(path);
            const task = reference.putFile(uri);

            task.on('state_changed', (taskSnapshot: any) => {
                const progress = (taskSnapshot.bytesTransferred / taskSnapshot.totalBytes) * 100;
                console.log('Upload progress:', progress.toFixed(2) + '%');
            });

            await task;
            const downloadURL = await reference.getDownloadURL();
            console.log('Download URL obtained:', downloadURL);
            return downloadURL;
        } else {
            // Web SDK (Expo Go fallback)
            console.log('Using web SDK for upload...');
            const response = await fetch(uri);
            const blob = await response.blob();
            
            const storageRef = ref(webStorage, path);
            const uploadTask = uploadBytesResumable(storageRef, blob);

            await new Promise<void>((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log('Upload progress:', progress.toFixed(2) + '%');
                    },
                    (error) => reject(error),
                    () => resolve()
                );
            });

            const downloadURL = await getDownloadURL(storageRef);
            console.log('Download URL obtained:', downloadURL);
            return downloadURL;
        }
    } catch (error: any) {
        console.error('Upload error:', error.message, error.code);
        throw new Error(`Failed to upload: ${error.code || error.message}`);
    }
};

/**
 * Uploads a profile picture for a user
 * @param userId The user's ID
 * @param uri The local URI of the image
 * @returns The download URL of the uploaded profile picture
 */
export const uploadProfilePic = async (userId: string, uri: string): Promise<string> => {
    const path = `profilePics/${userId}_${Date.now()}.jpg`;
    return uploadImage(uri, path);
};

/**
 * Uploads a job photo (before/after)
 * @param bookingId The booking ID
 * @param photoType 'before' or 'after'
 * @param uri The local URI of the image
 * @param index The photo index
 * @returns The download URL of the uploaded photo
 */
export const uploadJobPhoto = async (
    bookingId: string, 
    photoType: 'before' | 'after', 
    uri: string, 
    index: number
): Promise<string> => {
    const path = `bookings/${bookingId}/${photoType}/${index}_${Date.now()}.jpg`;
    return uploadImage(uri, path);
};

/**
 * Uploads a voice message for a service request
 * @param customerId The customer's ID
 * @param uri The local URI of the audio file
 * @returns The download URL of the uploaded voice message
 */
export const uploadVoiceMessage = async (customerId: string, uri: string): Promise<string> => {
    const path = `voiceMessages/${customerId}_${Date.now()}.m4a`;
    return uploadImage(uri, path);
};

/**
 * Uploads an image for a service request
 * @param customerId The customer's ID
 * @param uri The local URI of the image
 * @param index The image index
 * @returns The download URL of the uploaded image
 */
export const uploadServiceRequestImage = async (
    customerId: string, 
    uri: string, 
    index: number
): Promise<string> => {
    const path = `serviceRequests/${customerId}/${Date.now()}_${index}.jpg`;
    return uploadImage(uri, path);
};
