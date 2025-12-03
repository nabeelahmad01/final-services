import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES } from '@/constants/theme';
import { uploadJobPhoto } from '@/services/firebase/storage';

interface PhotoCaptureProps {
    bookingId: string;
    photoType: 'before' | 'after';
    maxPhotos?: number;
    onPhotosUploaded: (photoUrls: string[]) => void;
    onCancel: () => void;
}

export function PhotoCapture({
    bookingId,
    photoType,
    maxPhotos = 3,
    onPhotosUploaded,
    onCancel,
}: PhotoCaptureProps) {
    const [photos, setPhotos] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        if (photos.length >= maxPhotos) {
            Alert.alert('Limit Reached', `You can only upload ${maxPhotos} photos`);
            return;
        }

        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera permission is required');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7, // Compress for faster upload
        });

        if (!result.canceled && result.assets[0]) {
            setPhotos([...photos, result.assets[0].uri]);
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(photos.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (photos.length === 0) {
            Alert.alert('No Photos', 'Please take at least one photo');
            return;
        }

        setUploading(true);
        try {
            const uploadPromises = photos.map((photoUri, index) =>
                uploadJobPhoto(bookingId, photoType, photoUri, index)
            );
            const photoUrls = await Promise.all(uploadPromises);
            onPhotosUploaded(photoUrls);
        } catch (error: any) {
            Alert.alert('Upload Failed', error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>
                        {photoType === 'before' ? 'Before Photos' : 'After Photos'}
                    </Text>
                    <Text style={styles.subtitle}>
                        Take photos of the {photoType === 'before' ? 'problem' : 'completed work'}
                    </Text>
                </View>
                <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                {photos.map((photo, index) => (
                    <View key={index} style={styles.photoContainer}>
                        <Image source={{ uri: photo }} style={styles.photo} />
                        <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => removePhoto(index)}
                        >
                            <Ionicons name="close-circle" size={24} color={COLORS.error} />
                        </TouchableOpacity>
                    </View>
                ))}

                {photos.length < maxPhotos && (
                    <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
                        <Ionicons name="camera" size={32} color={COLORS.primary} />
                        <Text style={styles.addPhotoText}>
                            {photos.length === 0 ? 'Take Photo' : 'Add More'}
                        </Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color={COLORS.info} />
                <Text style={styles.infoText}>
                    {photos.length}/{maxPhotos} photos • Clear photos help with quality assurance
                </Text>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onCancel}
                    disabled={uploading}
                >
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                    onPress={handleUpload}
                    disabled={uploading || photos.length === 0}
                >
                    {uploading ? (
                        <>
                            <ActivityIndicator color={COLORS.white} size="small" />
                            <Text style={styles.uploadText}>Uploading...</Text>
                        </>
                    ) : (
                        <>
                            <Ionicons name="cloud-upload" size={20} color={COLORS.white} />
                            <Text style={styles.uploadText}>
                                Upload {photos.length} Photo{photos.length !== 1 ? 's' : ''}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: SIZES.padding,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    title: {
        fontSize: SIZES.xl,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    subtitle: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    closeButton: {
        padding: 4,
    },
    photoScroll: {
        marginBottom: 16,
    },
    photoContainer: {
        marginRight: 12,
        position: 'relative',
    },
    photo: {
        width: 150,
        height: 200,
        borderRadius: 12,
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: COLORS.white,
        borderRadius: 12,
    },
    addPhotoButton: {
        width: 150,
        height: 200,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    addPhotoText: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.primary,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.info + '15',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    infoText: {
        flex: 1,
        fontSize: SIZES.sm,
        color: COLORS.info,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cancelText: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
    },
    uploadButton: {
        flex: 2,
        flexDirection: 'row',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: COLORS.primary,
    },
    uploadButtonDisabled: {
        opacity: 0.6,
    },
    uploadText: {
        fontSize: SIZES.base,
        fontWeight: 'bold',
        color: COLORS.white,
    },
});
