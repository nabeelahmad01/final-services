import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

/**
 * Uploads an image to Firebase Storage and returns the download URL.
 * @param uri The local URI of the image to upload.
 * @param path The path in Firebase Storage where the image should be stored.
 * @returns The download URL of the uploaded image.
 */
export const uploadImage = async (uri: string, path: string): Promise<string> => {
    try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const storageRef = ref(storage, path);

        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);

        return downloadURL;
    } catch (error: any) {
        throw new Error(`Failed to upload image: ${error.message}`);
    }
};
