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

export default function EditProfile() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [profilePic, setProfilePic] = useState(user?.profilePic || null);

    const selectImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setProfilePic(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }

        setLoading(true);

        try {
            // TODO: Upload profile pic to Firebase Storage if changed
            // TODO: Update user document in Firestore

            Alert.alert(
                'Success',
                'Profile updated successfully',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Picture */}
                <View style={styles.profileSection}>
                    <TouchableOpacity
                        style={styles.profilePicContainer}
                        onPress={selectImage}
                        activeOpacity={0.7}
                    >
                        {profilePic ? (
                            <Image source={{ uri: profilePic }} style={styles.profilePic} />
                        ) : (
                            <View style={styles.profilePicPlaceholder}>
                                <Ionicons name="person" size={48} color={COLORS.textSecondary} />
                            </View>
                        )}

                        <View style={styles.editIcon}>
                            <Ionicons name="camera" size={20} color={COLORS.white} />
                        </View>
                    </TouchableOpacity>

                    <Text style={styles.profileLabel}>Tap to change photo</Text>
                </View>

                {/* Form Fields */}
                <View style={styles.form}>
                    <Input
                        label="Full Name"
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter your name"
                    />

                    <Input
                        label="Phone Number"
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Enter your phone"
                        keyboardType="phone-pad"
                        editable={false}
                        style={{ backgroundColor: COLORS.background }}
                    />

                    <Text style={styles.note}>
                        Note: Phone number cannot be changed. Contact support if needed.
                    </Text>
                </View>

                {/* Save Button */}
                <Button
                    title="Save Changes"
                    onPress={handleSave}
                    loading={loading}
                    style={{ marginTop: 32 }}
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
    profileSection: {
        alignItems: 'center',
        marginVertical: 32,
    },
    profilePicContainer: {
        position: 'relative',
    },
    profilePic: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    profilePicPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.surface,
    },
    profileLabel: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 12,
    },
    form: {
        gap: 16,
    },
    note: {
        fontSize: SIZES.xs,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
        marginTop: -8,
    },
});
