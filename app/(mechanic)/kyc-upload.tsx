import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function KYCUpload() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);

    // Form state
    const [fullName, setFullName] = useState('');
    const [cnicNumber, setCnicNumber] = useState('');
    const [address, setAddress] = useState('');
    const [vehicleType, setVehicleType] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [vehicleColor, setVehicleColor] = useState('');

    // Document uploads
    const [cnicFront, setCnicFront] = useState<string | null>(null);
    const [cnicBack, setCnicBack] = useState<string | null>(null);
    const [certificate, setCertificate] = useState<string | null>(null);
    const [selfie, setSelfie] = useState<string | null>(null);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const pickImage = async (setter: (uri: string) => void) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setter(result.assets[0].uri);
        }
    };

    const takeSelfie = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission Needed', 'Camera permission is required for selfie verification');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelfie(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!fullName || !cnicNumber || !address) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        if (!cnicFront || !cnicBack || !selfie) {
            Alert.alert('Error', 'Please upload all required documents');
            return;
        }

        if (!termsAccepted) {
            Alert.alert('Error', 'Please accept terms and conditions');
            setLoading(false);
        }
    };

    const DocumentUpload = ({
        label,
        imageUri,
        onPress,
        required = false,
    }: {
        label: string;
        imageUri: string | null;
        onPress: () => void;
        required?: boolean;
    }) => (
        <Card style={styles.uploadCard}>
            <View style={styles.uploadHeader}>
                <Text style={styles.uploadLabel}>
                    {label}
                    {required && <Text style={styles.required}> *</Text>}
                </Text>
            </View>

            <TouchableOpacity
                style={styles.uploadButton}
                onPress={onPress}
                activeOpacity={0.7}
            >
                {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
                ) : (
                    <View style={styles.uploadPlaceholder}>
                        <Ionicons name="cloud-upload-outline" size={48} color={COLORS.primary} />
                        <Text style={styles.uploadText}>Tap to upload</Text>
                    </View>
                )}
            </TouchableOpacity>
        </Card>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>KYC Verification</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Info Banner */}
                <Card style={styles.infoBanner}>
                    <Ionicons name="information-circle" size={24} color={COLORS.primary} />
                    <Text style={styles.infoText}>
                        Complete KYC verification to start receiving service requests
                    </Text>
                </Card>

                {/* Personal Information */}
                <Text style={styles.sectionTitle}>Personal Information</Text>

                <Input
                    label="Full Name"
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                />

                <Input
                    label="CNIC Number"
                    value={cnicNumber}
                    onChangeText={setCnicNumber}
                    placeholder="XXXXX-XXXXXXX-X"
                    keyboardType="numeric"
                    maxLength={13}
                />

                <Input
                    label="Address"
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Enter your complete address"
                    style={{ height: 80 }}
                />

                {/* Vehicle Information */}
                <Text style={styles.sectionTitle}>Vehicle Information</Text>

                <Input
                    label="Vehicle Type"
                    value={vehicleType}
                    onChangeText={setVehicleType}
                    placeholder="e.g., Bike, Car"
                />

                <Input
                    label="Vehicle Number"
                    value={vehicleNumber}
                    onChangeText={setVehicleNumber}
                    placeholder="e.g., ABC-123"
                />

                <Input
                    label="Vehicle Color"
                    value={vehicleColor}
                    onChangeText={setVehicleColor}
                    placeholder="e.g., Black"
                />

                {/* Document Uploads */}
                <Text style={styles.sectionTitle}>Document Uploads</Text>

                <DocumentUpload
                    label="CNIC Front Side"
                    imageUri={cnicFront}
                    onPress={() => pickImage(setCnicFront)}
                    required
                />

                <DocumentUpload
                    label="CNIC Back Side"
                    imageUri={cnicBack}
                    onPress={() => pickImage(setCnicBack)}
                    required
                />

                <DocumentUpload
                    label="Professional Certificate (Optional)"
                    imageUri={certificate}
                    onPress={() => pickImage(setCertificate)}
                />

                <DocumentUpload
                    label="Selfie Verification"
                    imageUri={selfie}
                    onPress={takeSelfie}
                    required
                />

                {/* Terms and Conditions */}
                <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setTermsAccepted(!termsAccepted)}
                    activeOpacity={0.7}
                >
                    <View
                        style={[
                            styles.checkbox,
                            termsAccepted && styles.checkboxChecked,
                        ]}
                    >
                        {termsAccepted && (
                            <Ionicons name="checkmark" size={18} color={COLORS.white} />
                        )}
                    </View>
                    <Text style={styles.checkboxLabel}>
                        I accept the terms and conditions and certify that all information
                        provided is accurate
                    </Text>
                </TouchableOpacity>

                {/* Submit Button */}
                <Button
                    title="Submit for Verification"
                    onPress={handleSubmit}
                    loading={loading}
                    style={{ marginTop: 24 }}
                />

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SIZES.padding,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    content: {
        padding: SIZES.padding,
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: COLORS.primary + '10',
        marginBottom: 24,
        padding: 16,
    },
    infoText: {
        flex: 1,
        fontSize: SIZES.sm,
        color: COLORS.text,
        lineHeight: 20,
    },
    sectionTitle: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 24,
        marginBottom: 16,
    },
    uploadCard: {
        padding: 16,
        marginBottom: 16,
    },
    uploadHeader: {
        marginBottom: 12,
    },
    uploadLabel: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
    },
    required: {
        color: COLORS.danger,
    },
    uploadButton: {
        height: 200,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    uploadPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    uploadText: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 8,
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginTop: 24,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    checkboxLabel: {
        flex: 1,
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
});
