import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    FlatList,
    Animated,
    Easing,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
    subscribeToProposals, 
    updateProposalStatus, 
    createBooking, 
    updateServiceRequestStatus, 
    subscribeToServiceRequest, 
    subscribeToFavorites, 
    addToFavorites, 
    removeFromFavorites,
    getNearbyMechanics,
} from '@/services/firebase/firestore';
import { COLORS, SIZES, CATEGORIES } from '@/constants/theme';
import { Proposal, ServiceRequest, Mechanic } from '@/types';
import { MapView, Marker, Circle, PROVIDER_GOOGLE } from '@/utils/mapHelpers';
import { ProposalCard } from '@/components/proposal/ProposalCard';
import { Avatar } from '@/components/shared/Avatar';
import { useModal, showSuccessModal, showErrorModal, showConfirmModal } from '@/utils/modalService';
import { useAuthStore } from '@/stores/authStore';

const { width, height } = Dimensions.get('window');
const RADIUS_KM = 10; // 10km radius

// Radar Pulse Component
const RadarPulse = ({ center }: { center: { latitude: number; longitude: number } }) => {
    const pulse1 = useRef(new Animated.Value(0)).current;
    const pulse2 = useRef(new Animated.Value(0)).current;
    const pulse3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const createPulse = (anim: Animated.Value, delay: number) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 2000,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            );
        };

        const anim1 = createPulse(pulse1, 0);
        const anim2 = createPulse(pulse2, 700);
        const anim3 = createPulse(pulse3, 1400);

        anim1.start();
        anim2.start();
        anim3.start();

        return () => {
            anim1.stop();
            anim2.stop();
            anim3.stop();
        };
    }, []);

    const renderPulseRing = (anim: Animated.Value, size: number) => {
        const scale = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
        });
        const opacity = anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.6, 0.3, 0],
        });

        return (
            <Animated.View
                style={[
                    styles.pulseRing,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        transform: [{ scale }],
                        opacity,
                    },
                ]}
            />
        );
    };

    return (
        <View style={styles.radarContainer}>
            {renderPulseRing(pulse1, 80)}
            {renderPulseRing(pulse2, 80)}
            {renderPulseRing(pulse3, 80)}
        </View>
    );
};

export default function Proposals() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const requestId = params.requestId as string;
    const { user } = useAuthStore();
    const { showModal } = useModal();
    const mapRef = useRef<any>(null);

    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
    const [accepting, setAccepting] = useState<string | null>(null);
    const [offeredPrice, setOfferedPrice] = useState<number>(260);
    const [nearbyMechanics, setNearbyMechanics] = useState<Mechanic[]>([]);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [countdown, setCountdown] = useState(300); // 5 minutes in seconds

    // Fetch service request and subscribe to updates
    useEffect(() => {
        if (!requestId || !user) return;

        const unsubscribeRequest = subscribeToServiceRequest(requestId, (req) => {
            if (req) {
                setServiceRequest(req);
                if (req.offeredPrice) setOfferedPrice(req.offeredPrice);
            }
        });

        const unsubscribeProposals = subscribeToProposals(requestId, setProposals);

        const unsubscribeFavorites = subscribeToFavorites(user.id, (favs) => {
            const favIds = new Set(favs.map(f => f.mechanicId));
            setFavorites(favIds);
        });

        return () => {
            unsubscribeRequest();
            unsubscribeProposals();
            unsubscribeFavorites();
        };
    }, [requestId, user]);

    // Fetch nearby mechanics when service request is available
    useEffect(() => {
        if (!serviceRequest) return;

        const fetchNearbyMechanics = async () => {
            const mechanics = await getNearbyMechanics(
                serviceRequest.location,
                serviceRequest.category,
                RADIUS_KM
            );
            setNearbyMechanics(mechanics);
        };

        fetchNearbyMechanics();
        
        // Refresh every 30 seconds
        const interval = setInterval(fetchNearbyMechanics, 30000);
        return () => clearInterval(interval);
    }, [serviceRequest]);

    // Countdown timer
    useEffect(() => {
        if (countdown <= 0) return;
        
        const timer = setInterval(() => {
            setCountdown(prev => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [countdown]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAcceptProposal = async (proposal: Proposal) => {
        setAccepting(proposal.id);
        try {
            if (!serviceRequest) throw new Error('Service request not found');

            const isScheduledRequest = serviceRequest.isScheduled === true;

            await updateProposalStatus(proposal.id, 'accepted');

            const bookingId = await createBooking({
                customerId: proposal.customerId,
                customerName: serviceRequest.customerName,
                customerPhone: serviceRequest.customerPhone,
                mechanicId: proposal.mechanicId,
                mechanicName: proposal.mechanicName,
                mechanicPhoto: proposal.mechanicPhoto || null,
                mechanicRating: proposal.mechanicRating,
                mechanicPhone: proposal.mechanicPhone || null,
                requestId: proposal.requestId,
                proposalId: proposal.id,
                category: serviceRequest.category,
                customerLocation: serviceRequest.location,
                price: proposal.price,
                estimatedTime: proposal.estimatedTime,
                status: isScheduledRequest ? 'scheduled' : 'ongoing',
                isScheduled: isScheduledRequest,
                scheduledDate: isScheduledRequest ? serviceRequest.scheduledDate : undefined,
                scheduledTime: isScheduledRequest ? serviceRequest.scheduledTime : undefined,
            });

            await updateServiceRequestStatus(requestId, 'accepted');

            if (isScheduledRequest) {
                const scheduledDateStr = serviceRequest.scheduledDate 
                    ? (typeof (serviceRequest.scheduledDate as any).toDate === 'function'
                        ? (serviceRequest.scheduledDate as any).toDate().toLocaleDateString()
                        : new Date(serviceRequest.scheduledDate).toLocaleDateString())
                    : 'TBD';
                
                showModal({
                    type: 'success',
                    title: '🎉 Booking Confirmed!',
                    message: `Your service is scheduled for:\n\n📅 ${scheduledDateStr}\n⏰ ${serviceRequest.scheduledTime || 'TBD'}\n\nYou can now chat or call the mechanic.`,
                    buttons: [
                        {
                            text: 'Go to Home',
                            onPress: () => router.replace('/(customer)/home'),
                            style: 'default',
                        },
                        {
                            text: 'View Booking',
                            onPress: () => router.replace(`/(customer)/booking-details?id=${bookingId}`),
                            style: 'success',
                        },
                    ],
                });
            } else {
                showSuccessModal(
                    showModal,
                    'Success',
                    'Proposal accepted! Redirecting to tracking...',
                    () => router.replace('/(customer)/tracking')
                );
            }
        } catch (error: any) {
            showErrorModal(showModal, 'Error', error.message);
        } finally {
            setAccepting(null);
        }
    };

    const handleDeclineProposal = async (proposal: Proposal) => {
        try {
            await updateProposalStatus(proposal.id, 'rejected');
        } catch (error: any) {
            console.error('Error rejecting proposal:', error);
        }
    };

    const handleToggleFavorite = async (proposal: Proposal) => {
        if (!user) return;
        
        try {
            if (favorites.has(proposal.mechanicId)) {
                await removeFromFavorites(user.id, proposal.mechanicId);
            } else {
                await addToFavorites(user.id, {
                    id: proposal.mechanicId,
                    name: proposal.mechanicName,
                    phone: proposal.mechanicPhone || '',
                    profilePic: proposal.mechanicPhoto,
                    rating: proposal.mechanicRating,
                    totalRatings: proposal.mechanicTotalRatings,
                } as any);
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const adjustFare = async (amount: number) => {
        const newPrice = Math.max(50, offeredPrice + amount);
        setOfferedPrice(newPrice);

        try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const { firestore } = await import('@/services/firebase/config');
            await updateDoc(doc(firestore, 'serviceRequests', requestId), {
                offeredPrice: newPrice,
            });
        } catch (error) {
            console.error('Error updating fare:', error);
        }
    };

    const progressPercent = (countdown / 300) * 100;
    const categoryInfo = CATEGORIES.find(c => c.id === serviceRequest?.category);

    const renderMap = () => {
        if (!serviceRequest || !MapView) return null;

        return (
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={StyleSheet.absoluteFill}
                initialRegion={{
                    latitude: serviceRequest.location.latitude,
                    longitude: serviceRequest.location.longitude,
                    latitudeDelta: 0.08,
                    longitudeDelta: 0.08,
                }}
            >
                {/* 10km Radius Circle - Outer */}
                {Circle && (
                    <Circle
                        center={serviceRequest.location}
                        radius={RADIUS_KM * 1000}
                        fillColor="rgba(0, 0, 0, 0.3)"
                        strokeColor="rgba(0, 172, 193, 0.6)"
                        strokeWidth={2}
                    />
                )}

                {/* Inner glow circle */}
                {Circle && (
                    <Circle
                        center={serviceRequest.location}
                        radius={RADIUS_KM * 500}
                        fillColor="rgba(0, 0, 0, 0.15)"
                        strokeColor="transparent"
                        strokeWidth={0}
                    />
                )}

                {/* Customer Location - Center with pulsing effect */}
                {Marker && (
                    <Marker
                        coordinate={serviceRequest.location}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View style={styles.customerMarkerContainer}>
                            <RadarPulse center={serviceRequest.location} />
                            <View style={styles.customerMarkerDot} />
                        </View>
                    </Marker>
                )}

                {/* Nearby Mechanics Markers */}
                {Marker && nearbyMechanics.map((mechanic) => (
                    <Marker
                        key={mechanic.id}
                        coordinate={mechanic.location!}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View style={[styles.mechanicMarker, { borderColor: categoryInfo?.color || COLORS.primary }]}>
                            {mechanic.profilePic ? (
                                <Image 
                                    source={{ uri: mechanic.profilePic }} 
                                    style={styles.mechanicMarkerImage}
                                />
                            ) : (
                                <Ionicons 
                                    name={categoryInfo?.icon as any || 'construct'} 
                                    size={18} 
                                    color={categoryInfo?.color || COLORS.primary} 
                                />
                            )}
                        </View>
                    </Marker>
                ))}
            </MapView>
        );
    };

    return (
        <View style={styles.container}>
            {renderMap()}

            <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => {
                            showConfirmModal(
                                showModal,
                                'Cancel Request',
                                'Are you sure you want to cancel?',
                                () => router.back(),
                                undefined,
                                'Yes',
                                'No'
                            );
                        }}
                        style={styles.cancelButton}
                    >
                        <Ionicons name="close" size={20} color={COLORS.text} />
                        <Text style={styles.cancelText}>Cancel request</Text>
                    </TouchableOpacity>
                </View>

                {proposals.length > 0 ? (
                    /* Proposals at TOP */
                    <View style={styles.proposalsContainer}>
                        <Text style={styles.title}>Choose a driver</Text>
                        <FlatList
                            data={proposals}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <ProposalCard
                                    proposal={item}
                                    onAccept={() => handleAcceptProposal(item)}
                                    onDecline={() => handleDeclineProposal(item)}
                                    isProcessing={accepting === item.id}
                                    isFavorite={favorites.has(item.mechanicId)}
                                    onToggleFavorite={() => handleToggleFavorite(item)}
                                />
                            )}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    </View>
                ) : (
                    <>
                        {/* Drivers Viewing Card at BOTTOM */}
                        <View style={styles.driversViewingContainer}>
                            <View style={styles.driversViewing}>
                                <Text style={styles.viewingText}>
                                    {nearbyMechanics.length} {nearbyMechanics.length === 1 ? 'driver is' : 'drivers are'} viewing your request
                                </Text>
                                <View style={styles.avatars}>
                                    {nearbyMechanics.slice(0, 5).map((mechanic, index) => (
                                        <View 
                                            key={mechanic.id} 
                                            style={[styles.avatarWrapper, { marginLeft: index > 0 ? -10 : 0, zIndex: 5 - index }]}
                                        >
                                            <Avatar 
                                                name={mechanic.name} 
                                                uri={mechanic.profilePic || undefined} 
                                                size={32} 
                                            />
                                        </View>
                                    ))}
                                    {nearbyMechanics.length > 5 && (
                                        <View style={[styles.avatarWrapper, { marginLeft: -10, zIndex: 0 }]}>
                                            <View style={styles.moreAvatar}>
                                                <Text style={styles.moreAvatarText}>+{nearbyMechanics.length - 5}</Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Fare Card at BOTTOM */}
                        <View style={styles.fareCardContainer}>
                            <View style={styles.negotiationCard}>
                                <View style={styles.negotiationHeader}>
                                    <Text style={styles.negotiationTitle}>
                                        Good fare. Your request gets priority
                                    </Text>
                                    <Text style={styles.timer}>{formatTime(countdown)}</Text>
                                </View>
                                
                                {/* Progress Bar */}
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                                </View>

                                <View style={styles.fareControls}>
                                    <TouchableOpacity
                                        style={styles.fareButton}
                                        onPress={() => adjustFare(-5)}
                                    >
                                        <Text style={styles.fareButtonText}>-5</Text>
                                    </TouchableOpacity>

                                    <Text style={styles.fareAmount}>PKR{offeredPrice}</Text>

                                    <TouchableOpacity
                                        style={styles.fareButton}
                                        onPress={() => adjustFare(5)}
                                    >
                                        <Text style={styles.fareButtonText}>+5</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity 
                                    style={styles.raiseFareButton}
                                    onPress={() => adjustFare(20)}
                                >
                                    <Text style={styles.raiseFareText}>Raise fare</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    overlay: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        alignSelf: 'flex-start',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 24,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    proposalsContainer: {
        marginTop: 12,
        maxHeight: '70%',
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        marginHorizontal: 8,
        paddingTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginLeft: 16,
        marginBottom: 12,
    },
    // Radar Pulse Animation
    radarContainer: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
    },
    pulseRing: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(0, 172, 193, 0.1)',
    },
    // Customer Marker - Center dot with radar
    customerMarkerContainer: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    customerMarkerDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        borderWidth: 4,
        borderColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    // Mechanic Marker
    mechanicMarker: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.surface,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    mechanicMarkerImage: {
        width: 38,
        height: 38,
        borderRadius: 19,
    },
    // Drivers Viewing Section
    driversViewingContainer: {
        position: 'absolute',
        bottom: 250,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
    },
    driversViewing: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surface,
        padding: 14,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    viewingText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        flex: 1,
    },
    avatars: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarWrapper: {
        borderWidth: 2,
        borderColor: COLORS.surface,
        borderRadius: 18,
    },
    moreAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    moreAvatarText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    // Fare Card
    fareCardContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    negotiationCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    negotiationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    negotiationTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        flex: 1,
    },
    timer: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    progressBarBg: {
        height: 4,
        backgroundColor: COLORS.border,
        borderRadius: 2,
        marginBottom: 20,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: COLORS.text,
        borderRadius: 2,
    },
    fareControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    fareButton: {
        width: 60,
        height: 44,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fareButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    fareAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    raiseFareButton: {
        backgroundColor: COLORS.background,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    raiseFareText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
});
