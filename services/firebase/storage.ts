import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

/**
 * Uploads an image to Firebase Storage and returns the download URL.
 * @param uri The local URI of the image to upload.
 * @param path The path in Firebase Storage where the image should be stored.
 * @returns The download URL of the uploaded image.
 */
export const uploadImage = async (uri: string, path: string): Promise<string> => {
    try {
        console.log('Starting upload for:', path);
        console.log('URI:', uri);

        // Fetch the image as a blob
        const response = await fetch(uri);

        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        console.log('Blob created, size:', blob.size, 'type:', blob.type);

        if (blob.size === 0) {
            throw new Error('Image file is empty');
        }

        // Create storage reference
        const storageRef = ref(storage, path);
        console.log('Storage ref created');

        // Upload the blob
        const uploadTask = uploadBytesResumable(storageRef, blob);

        // Wait for upload to complete with progress tracking
        await new Promise<void>((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload progress:', progress.toFixed(2) + '%');
                },
                (error) => {
                    console.error('Upload error:', error);
                    reject(error);
                },
                () => {
                    console.log('Upload complete');
                    resolve();
                }
            );
        });

        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);
        console.log('Download URL obtained:', downloadURL);

        return downloadURL;
    } catch (error: any) {
        console.error('Upload error details:', {
            message: error.message,
            code: error.code,
            serverResponse: error.serverResponse,
            customData: error.customData
        });

        throw new Error(`Failed to upload image: ${error.code || error.message}`);
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
