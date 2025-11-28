import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { firestore } from '@/services/firebase/config';
import { COLORS, SIZES } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { SafeAreaView } from 'react-native-safe-area-context';


interface KYCRequest {
    id: string;
    mechanicId: string;
    mechanicName: string;
    fullName: string;
    cnicNumber: string;
    address: string;
    cnicFront: string;
    cnicBack: string;
    selfie: string;
    certificate?: string;
    vehicleType?: string;
    vehicleNumber?: string;
    vehicleColor?: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: Date;
}

export default function AdminKYCVerification() {
    const [requests, setRequests] = useState<KYCRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        loadKYCRequests();
    }, []);

    const loadKYCRequests = async () => {
        try {
            const q = query(
                collection(firestore, 'kycRequests'),
                where('status', '==', 'pending')
            );

            const snapshot = await getDocs(q);
            const requestsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                submittedAt: doc.data().submittedAt?.toDate() || new Date(),
            })) as KYCRequest[];

            setRequests(requestsData);
        } catch (error) {
            Alert.alert('Error', 'Failed to load KYC requests');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (request: KYCRequest) => {
        if (!request.mechanicId) {
            Alert.alert('Error', 'Invalid mechanic ID');
            return;
        }

        Alert.alert(
            'Approve KYC',
            `Approve KYC for ${request.mechanicName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        setProcessing(request.id);
                        try {
                            // Update KYC request status
                            await updateDoc(doc(firestore, 'kycRequests', request.id), {
                                status: 'approved',
                                approvedAt: new Date(),
                            });

                            // Update mechanic verification status
                            await updateDoc(doc(firestore, 'mechanics', request.mechanicId), {
                                isVerified: true,
                                kycStatus: 'approved',
                            });

                            Alert.alert('Success', 'KYC approved successfully');
                            loadKYCRequests();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to approve KYC');
                        } finally {
                            setProcessing(null);
                        }
                    },
                },
            ]
        );
    };

    const handleReject = async (request: KYCRequest) => {
        if (!request.mechanicId) {
            Alert.alert('Error', 'Invalid mechanic ID');
            return;
        }

        Alert.alert(
            'Reject KYC',
            `Reject KYC for ${request.mechanicName}? They can resubmit.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        setProcessing(request.id);
                        try {
                            // Update KYC request status
                            await updateDoc(doc(firestore, 'kycRequests', request.id), {
                                status: 'rejected',
                                rejectedAt: new Date(),
                            });

                            // Update mechanic verification status
                            await updateDoc(doc(firestore, 'mechanics', request.mechanicId), {
                                isVerified: false,
                                kycStatus: 'rejected',
                            });

                            Alert.alert('Success', 'KYC rejected. User can resubmit.');
                            loadKYCRequests();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to reject KYC');
                        } finally {
                            setProcessing(null);
                        }
                    },
                },
            ]
        );
    };

    const renderRequest = ({ item }: { item: KYCRequest }) => (
        <Card style={styles.requestCard}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.name}>{item.mechanicName}</Text>
                    <Text style={styles.cnic}>CNIC: {item.cnicNumber}</Text>
                    <Text style={styles.date}>
                        {item.submittedAt.toLocaleDateString()}
                    </Text>
                </View>
                <View style={styles.badge}>
                    <Ionicons name="time-outline" size={16} color={COLORS.warning} />
                    <Text style={styles.badgeText}>Pending</Text>
                </View>
            </View>

            <View style={styles.info}>
                <Text style={styles.label}>Full Name:</Text>
                <Text style={styles.value}>{item.fullName}</Text>
            </View>

            <View style={styles.info}>
                <Text style={styles.label}>Address:</Text>
                <Text style={styles.value}>{item.address}</Text>
            </View>

            {item.vehicleType && (
                <View style={styles.info}>
                    <Text style={styles.label}>Vehicle:</Text>
                    <Text style={styles.value}>
                        {item.vehicleType} - {item.vehicleNumber} ({item.vehicleColor})
                    </Text>
                </View>
            )}

            <Text style={styles.docsTitle}>Documents:</Text>
            <View style={styles.documents}>
                <View style={styles.docItem}>
                    <Text style={styles.docLabel}>CNIC Front</Text>
                    <TouchableOpacity style={styles.docImageContainer}>
                        <Image source={{ uri: item.cnicFront }} style={styles.docImage} />
                    </TouchableOpacity>
                </View>

                <View style={styles.docItem}>
                    <Text style={styles.docLabel}>CNIC Back</Text>
                    <TouchableOpacity style={styles.docImageContainer}>
                        <Image source={{ uri: item.cnicBack }} style={styles.docImage} />
                    </TouchableOpacity>
                </View>

                <View style={styles.docItem}>
                    <Text style={styles.docLabel}>Selfie</Text>
                    <TouchableOpacity style={styles.docImageContainer}>
                        <Image source={{ uri: item.selfie }} style={styles.docImage} />
                    </TouchableOpacity>
                </View>

                {item.certificate && (
                    <View style={styles.docItem}>
                        <Text style={styles.docLabel}>Certificate</Text>
                        <TouchableOpacity style={styles.docImageContainer}>
                            <Image source={{ uri: item.certificate }} style={styles.docImage} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <View style={styles.actions}>
                <Button
                    title="Reject"
                    onPress={() => handleReject(item)}
                    loading={processing === item.id}
                    disabled={processing !== null}
                    variant="outline"
                    style={{ ...styles.button, borderColor: COLORS.danger }}
                    textStyle={{ color: COLORS.danger }}
                />
                <Button
                    title="Approve"
                    onPress={() => handleApprove(item)}
                    loading={processing === item.id}
                    disabled={processing !== null}
                    style={styles.button}
                />
            </View>
        </Card>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <LoadingSpinner fullScreen />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerBar}>
                <View style={styles.headerIcon}>
                    <Ionicons name="shield-checkmark" size={28} color={COLORS.primary} />
                </View>
                <View>
                    <Text style={styles.headerTitle}>Admin Panel</Text>
                    <Text style={styles.headerSubtitle}>KYC Verification</Text>
                </View>
            </View>

            {requests.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="checkmark-done-circle-outline" size={80} color={COLORS.textSecondary} />
                    <Text style={styles.emptyTitle}>All Caught Up!</Text>
                    <Text style={styles.emptyText}>
                        No pending KYC verification requests
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={requests}
                    renderItem={renderRequest}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        padding: SIZES.padding,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    headerSubtitle: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
    list: {
        padding: SIZES.padding,
    },
    requestCard: {
        marginBottom: 16,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    name: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    cnic: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    date: {
        fontSize: SIZES.xs,
        color: COLORS.textSecondary,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.warning + '20',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: SIZES.xs,
        fontWeight: '600',
        color: COLORS.warning,
    },
    info: {
        marginBottom: 12,
    },
    label: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    value: {
        fontSize: SIZES.base,
        color: COLORS.text,
    },
    docsTitle: {
        fontSize: SIZES.base,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 8,
        marginBottom: 12,
    },
    documents: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    docItem: {
        width: '48%',
    },
    docLabel: {
        fontSize: SIZES.xs,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 6,
    },
    docImageContainer: {
        height: 100,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    docImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SIZES.padding * 2,
    },
    emptyTitle: {
        fontSize: SIZES.xl,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 24,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});
