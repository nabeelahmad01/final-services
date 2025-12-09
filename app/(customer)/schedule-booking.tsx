import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/shared/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { createScheduledBooking, getMechanic } from '@/services/firebase/firestore';
import { COLORS, SIZES, FONTS, CATEGORIES } from '@/constants/theme';
import { Mechanic, ServiceCategory } from '@/types';
import { useModal, showSuccessModal, showErrorModal } from '@/utils/modalService';

// Time slots for selection
const TIME_SLOTS = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
    '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM',
];

export default function ScheduleBooking() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user } = useAuthStore();
    const { showModal } = useModal();

    const mechanicId = params.mechanicId as string;
    const mechanicName = params.mechanicName as string;
    const mechanicPhoto = params.mechanicPhoto as string;
    const mechanicRating = parseFloat(params.mechanicRating as string) || 0;
    const category = (params.category as ServiceCategory) || 'car_mechanic';

    const [mechanic, setMechanic] = useState<Mechanic | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [price, setPrice] = useState('');
    const [loading, setLoading] = useState(false);

    const categoryInfo = CATEGORIES.find((c) => c.id === category);

    useEffect(() => {
        // Fetch mechanic details if not passed
        if (mechanicId && !mechanic) {
            getMechanic(mechanicId).then(setMechanic);
        }
        getCurrentLocation();
    }, [mechanicId]);

    const getCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            setLocation({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
            });

            const addressData = await Location.reverseGeocodeAsync({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
            });

            if (addressData[0]) {
                const addr = addressData[0];
                const formattedAddress = `${addr.street || ''} ${addr.city || ''}, ${addr.region || ''}, Pakistan`.trim();
                setAddress(formattedAddress);
            }
        } catch (error) {
            console.error('Error getting location:', error);
        }
    };

    const handleDateChange = (event: any, date?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (date) {
            setSelectedDate(date);
        }
    };

    const handleSubmit = async () => {
        if (!selectedTime) {
            Alert.alert('Error', 'Please select a time slot');
            return;
        }
        if (!address || !location) {
            Alert.alert('Error', 'Please wait for location to be detected');
            return;
        }
        if (!price) {
            Alert.alert('Error', 'Please enter an estimated price');
            return;
        }
        if (!user) {
            Alert.alert('Error', 'Please login to continue');
            return;
        }

        setLoading(true);
        try {
            const bookingId = await createScheduledBooking({
                customerId: user.id,
                customerName: user.name,
                customerPhone: user.phone,
                mechanicId: mechanicId,
                mechanicName: mechanicName || mechanic?.name || 'Mechanic',
                mechanicPhone: mechanic?.phone,
                mechanicPhoto: mechanicPhoto || mechanic?.profilePic,
                mechanicRating: mechanicRating || mechanic?.rating,
                requestId: '', // No request for scheduled booking
                proposalId: '', // No proposal for scheduled booking
                category,
                customerLocation: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    address: address,
                },
                price: parseInt(price),
                estimatedTime: '1-2 hours',
                status: 'scheduled',
                isScheduled: true,
                scheduledDate: selectedDate,
                scheduledTime: selectedTime,
            });

            showSuccessModal(
                showModal,
                'Booking Scheduled!',
                `Your booking has been scheduled for ${selectedDate.toLocaleDateString()} at ${selectedTime}. The mechanic will be notified.`
            );

            router.replace('/(customer)/bookings');
        } catch (error: any) {
            console.error('Error creating scheduled booking:', error);
            showErrorModal(showModal, 'Error', error.message || 'Failed to schedule booking');
        } finally {
            setLoading(false);
        }
    };

    // Calculate minimum date (today) and maximum date (30 days from now)
    const minDate = new Date();
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Schedule Booking</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Mechanic Info Card */}
                <Card style={styles.mechanicCard}>
                    <View style={styles.mechanicRow}>
                        <Avatar name={mechanicName || 'M'} uri={mechanicPhoto} size={56} />
                        <View style={styles.mechanicInfo}>
                            <Text style={styles.mechanicName}>{mechanicName || 'Mechanic'}</Text>
                            <View style={styles.ratingRow}>
                                <Ionicons name="star" size={16} color={COLORS.warning} />
                                <Text style={styles.ratingText}>{mechanicRating.toFixed(1)}</Text>
                            </View>
                        </View>
                        <View style={[styles.categoryBadge, { backgroundColor: (categoryInfo?.color || COLORS.primary) + '20' }]}>
                            <Ionicons name={categoryInfo?.icon as any || 'construct'} size={20} color={categoryInfo?.color || COLORS.primary} />
                        </View>
                    </View>
                    <Text style={styles.categoryText}>{categoryInfo?.name || 'Service'}</Text>
                </Card>

                {/* Date Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Date</Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar" size={24} color={COLORS.primary} />
                        <Text style={styles.dateText}>
                            {selectedDate.toLocaleDateString('en-PK', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                        minimumDate={minDate}
                        maximumDate={maxDate}
                    />
                )}

                {/* Time Slots */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Time</Text>
                    <View style={styles.timeGrid}>
                        {TIME_SLOTS.map((time) => (
                            <TouchableOpacity
                                key={time}
                                style={[
                                    styles.timeSlot,
                                    selectedTime === time && styles.timeSlotSelected,
                                ]}
                                onPress={() => setSelectedTime(time)}
                            >
                                <Text
                                    style={[
                                        styles.timeSlotText,
                                        selectedTime === time && styles.timeSlotTextSelected,
                                    ]}
                                >
                                    {time}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Location */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Service Location</Text>
                    <View style={styles.locationCard}>
                        <Ionicons name="location" size={20} color={COLORS.primary} />
                        <Text style={styles.addressText}>
                            {address || 'Detecting location...'}
                        </Text>
                    </View>
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Description (Optional)</Text>
                    <Input
                        placeholder="Describe the service you need..."
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        style={styles.textArea}
                    />
                </View>

                {/* Price */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Estimated Price (PKR)</Text>
                    <Input
                        placeholder="Enter agreed price"
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="numeric"
                    />
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={24} color={COLORS.info} />
                    <Text style={styles.infoText}>
                        The mechanic will receive a notification about your scheduled booking. They will confirm within 24 hours.
                    </Text>
                </View>

                {/* Submit Button */}
                <Button
                    title="Confirm Booking"
                    onPress={handleSubmit}
                    loading={loading}
                    style={styles.submitButton}
                    icon={<Ionicons name="calendar-outline" size={20} color={COLORS.white} />}
                />

                <Button
                    title="Cancel"
                    onPress={() => router.back()}
                    variant="outline"
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        padding: SIZES.padding,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    mechanicCard: {
        padding: SIZES.padding,
        marginBottom: 20,
    },
    mechanicRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    mechanicInfo: {
        flex: 1,
    },
    mechanicName: {
        fontSize: SIZES.lg,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    ratingText: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
    categoryBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryText: {
        fontSize: SIZES.sm,
        color: COLORS.primary,
        fontFamily: FONTS.medium,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: SIZES.base,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 12,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    dateText: {
        flex: 1,
        fontSize: SIZES.base,
        color: COLORS.text,
        fontFamily: FONTS.medium,
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    timeSlot: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        minWidth: '30%',
        alignItems: 'center',
    },
    timeSlotSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    timeSlotText: {
        fontSize: SIZES.sm,
        color: COLORS.text,
        fontFamily: FONTS.medium,
    },
    timeSlotTextSelected: {
        color: COLORS.white,
        fontWeight: '600',
    },
    locationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    addressText: {
        flex: 1,
        fontSize: SIZES.sm,
        color: COLORS.text,
        fontFamily: FONTS.regular,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.info + '15',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        marginBottom: 20,
    },
    infoText: {
        flex: 1,
        fontSize: SIZES.sm,
        color: COLORS.text,
        fontFamily: FONTS.regular,
        lineHeight: 20,
    },
    submitButton: {
        marginBottom: 12,
    },
});
