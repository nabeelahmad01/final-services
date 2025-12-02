import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    Dimensions,
    FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { subscribeToProposals, updateProposalStatus, createBooking, updateServiceRequestStatus, getServiceRequest, subscribeToServiceRequest } from '@/services/firebase/firestore';
import { COLORS, SIZES } from '@/constants/theme';
import { Proposal, ServiceRequest } from '@/types';
import { MapView, Marker, PROVIDER_GOOGLE } from '@/utils/mapHelpers';
import { ProposalCard } from '@/components/proposal/ProposalCard';
import { Avatar } from '@/components/shared/Avatar';
import { useModal, showSuccessModal, showErrorModal, showConfirmModal } from '@/utils/modalService';

const { width } = Dimensions.get('window');

export default function Proposals() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const requestId = params.requestId as string;
    const { showModal } = useModal();
    const mapRef = useRef<any>(null);

    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
    const [accepting, setAccepting] = useState<string | null>(null);
    const [offeredPrice, setOfferedPrice] = useState<number>(260); // Default or from request
    const [driversViewing, setDriversViewing] = useState(2); // Mock for demo

    useEffect(() => {
        if (!requestId) return;

        // Subscribe to service request for real-time updates
        const unsubscribeRequest = subscribeToServiceRequest(requestId, (req) => {
            if (req) {
                setServiceRequest(req);
                if (req.offeredPrice) setOfferedPrice(req.offeredPrice);
            }
        });

        const unsubscribeProposals = subscribeToProposals(requestId, setProposals);

        return () => {
            unsubscribeRequest();
            unsubscribeProposals();
        };
    }, [requestId]);

    const handleAcceptProposal = async (proposal: Proposal) => {
        setAccepting(proposal.id);
        try {
            if (!serviceRequest) throw new Error('Service request not found');

            // Update proposal status
            await updateProposalStatus(proposal.id, 'accepted');

            // Create booking
            await createBooking({
                customerId: proposal.customerId,
                mechanicId: proposal.mechanicId,
                requestId: proposal.requestId,
                proposalId: proposal.id,
                category: serviceRequest.category,
                customerLocation: serviceRequest.location,
                price: proposal.price,
                estimatedTime: proposal.estimatedTime,
                status: 'ongoing',
            });

            // Update request status
            await updateServiceRequestStatus(requestId, 'accepted');

            showSuccessModal(
                showModal,
                'Success',
                'Proposal accepted! Redirecting to tracking...',
                () => router.replace('/(customer)/tracking')
            );
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


    const adjustFare = async (amount: number) => {
        const newPrice = Math.max(50, offeredPrice + amount); // Minimum 50 PKR
        setOfferedPrice(newPrice);

        try {
            // Update in Firestore
            const { doc, updateDoc } = await import('firebase/firestore');
            const { firestore } = await import('@/services/firebase/config');
            await updateDoc(doc(firestore, 'serviceRequests', requestId), {
                offeredPrice: newPrice,
            });
        } catch (error) {
            console.error('Error updating fare:', error);
        }
    };

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
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
            >
                {Marker && (
                    <Marker
                        coordinate={serviceRequest.location}
                        title="Your Location"
                        pinColor={COLORS.primary}
                    />
                )}
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
                                />
                            )}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    </View>
                ) : (
                    <>
                        {/* Drivers Viewing at BOTTOM */}
                        <View style={styles.driversViewingContainer}>
                            <View style={styles.driversViewing}>
                                <Text style={styles.viewingText}>
                                    {driversViewing} drivers are viewing your request
                                </Text>
                                <View style={styles.avatars}>
                                    <Avatar name="D 1" size={24} />
                                    <Avatar name="D 2" size={24} />
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
                                    <Text style={styles.timer}>0:51</Text>
                                </View>
                                <View style={styles.progressBar} />

                                <View style={styles.fareControls}>
                                    <TouchableOpacity
                                        style={styles.fareButton}
                                        onPress={() => adjustFare(-10)}
                                    >
                                        <Text style={styles.fareButtonText}>-10</Text>
                                    </TouchableOpacity>

                                    <Text style={styles.fareAmount}>PKR{offeredPrice}</Text>

                                    <TouchableOpacity
                                        style={styles.fareButton}
                                        onPress={() => adjustFare(10)}
                                    >
                                        <Text style={styles.fareButtonText}>+10</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity style={styles.raiseFareButton}>
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
        justifyContent: 'flex-start', // Changed from flex-end to flex-start
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
        paddingVertical: 8,
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
    driversViewingContainer: {
        position: 'absolute',
        bottom: 220,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
    },
    fareCardContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    driversViewing: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surface,
        padding: 12,
        borderRadius: 12,
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
    },
    avatars: {
        flexDirection: 'row',
        gap: -8,
    },
    negotiationCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
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
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    progressBar: {
        height: 4,
        backgroundColor: COLORS.text,
        borderRadius: 2,
        width: '100%',
        marginBottom: 20,
    },
    fareControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    fareButton: {
        width: 50,
        height: 40,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fareButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    fareAmount: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    raiseFareButton: {
        backgroundColor: '#F5F5F5',
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
