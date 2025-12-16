import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { firestore } from '@/services/firebase/config';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useModal, showSuccessModal, showErrorModal } from '@/utils/modalService';

interface AppConfig {
    diamondPackages: { diamonds: number; price: number }[];
    commissionRate: number; // Percentage
    minimumDiamonds: number;
    diamondCostPerProposal: number;
    supportPhone: string;
    supportEmail: string;
    maintenanceMode: boolean;
    newUserDiamonds: number;
}

const DEFAULT_CONFIG: AppConfig = {
    diamondPackages: [
        { diamonds: 10, price: 100 },
        { diamonds: 25, price: 225 },
        { diamonds: 50, price: 400 },
        { diamonds: 100, price: 750 },
    ],
    commissionRate: 10,
    minimumDiamonds: 1,
    diamondCostPerProposal: 1,
    supportPhone: '+92 300 1234567',
    supportEmail: 'support@fixkar.app',
    maintenanceMode: false,
    newUserDiamonds: 5,
};

export default function AdminSettingsScreen() {
    const router = useRouter();
    const { showModal } = useModal();
    const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const configDoc = await getDoc(doc(firestore, 'config', 'app'));
            if (configDoc.exists()) {
                setConfig({ ...DEFAULT_CONFIG, ...configDoc.data() } as AppConfig);
            }
        } catch (error) {
            console.error('Error loading config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(firestore, 'config', 'app'), config);
            showSuccessModal(showModal, 'Success', 'Settings saved successfully');
            setHasChanges(false);
        } catch (error) {
            showErrorModal(showModal, 'Error', 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const updateConfig = (key: keyof AppConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const updatePackage = (index: number, field: 'diamonds' | 'price', value: string) => {
        const newPackages = [...config.diamondPackages];
        newPackages[index] = { 
            ...newPackages[index], 
            [field]: parseInt(value) || 0 
        };
        updateConfig('diamondPackages', newPackages);
    };

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Admin Settings</Text>
                <TouchableOpacity 
                    onPress={handleSave} 
                    disabled={!hasChanges || saving}
                >
                    <Text style={[
                        styles.saveButton,
                        (!hasChanges || saving) && styles.saveButtonDisabled
                    ]}>
                        {saving ? 'Saving...' : 'Save'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Maintenance Mode */}
                <Card style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="warning" size={24} color={COLORS.warning} />
                        <View style={styles.sectionTitleContainer}>
                            <Text style={styles.sectionTitle}>Maintenance Mode</Text>
                            <Text style={styles.sectionSubtitle}>
                                Disable app for all users
                            </Text>
                        </View>
                        <Switch
                            value={config.maintenanceMode}
                            onValueChange={(value) => updateConfig('maintenanceMode', value)}
                            trackColor={{ false: COLORS.border, true: COLORS.warning }}
                            thumbColor={COLORS.white}
                        />
                    </View>
                </Card>

                {/* Diamond Settings */}
                <Card style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        <Ionicons name="diamond" size={18} color={COLORS.primary} /> Diamond Settings
                    </Text>

                    <View style={styles.inputRow}>
                        <Text style={styles.inputLabel}>Cost per Proposal</Text>
                        <TextInput
                            style={styles.smallInput}
                            value={config.diamondCostPerProposal.toString()}
                            onChangeText={(value) => updateConfig('diamondCostPerProposal', parseInt(value) || 1)}
                            keyboardType="number-pad"
                        />
                        <Text style={styles.inputSuffix}>diamonds</Text>
                    </View>

                    <View style={styles.inputRow}>
                        <Text style={styles.inputLabel}>New User Bonus</Text>
                        <TextInput
                            style={styles.smallInput}
                            value={config.newUserDiamonds.toString()}
                            onChangeText={(value) => updateConfig('newUserDiamonds', parseInt(value) || 0)}
                            keyboardType="number-pad"
                        />
                        <Text style={styles.inputSuffix}>diamonds</Text>
                    </View>
                </Card>

                {/* Diamond Packages */}
                <Card style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        💎 Diamond Packages
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                        Configure purchasable diamond packages
                    </Text>

                    {config.diamondPackages.map((pkg, index) => (
                        <View key={index} style={styles.packageRow}>
                            <View style={styles.packageItem}>
                                <Text style={styles.packageLabel}>Diamonds</Text>
                                <TextInput
                                    style={styles.packageInput}
                                    value={pkg.diamonds.toString()}
                                    onChangeText={(value) => updatePackage(index, 'diamonds', value)}
                                    keyboardType="number-pad"
                                />
                            </View>
                            <Text style={styles.packageEquals}>=</Text>
                            <View style={styles.packageItem}>
                                <Text style={styles.packageLabel}>Price (PKR)</Text>
                                <TextInput
                                    style={styles.packageInput}
                                    value={pkg.price.toString()}
                                    onChangeText={(value) => updatePackage(index, 'price', value)}
                                    keyboardType="number-pad"
                                />
                            </View>
                        </View>
                    ))}
                </Card>

                {/* Commission Settings */}
                <Card style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        <Ionicons name="cash" size={18} color={COLORS.success} /> Commission
                    </Text>

                    <View style={styles.inputRow}>
                        <Text style={styles.inputLabel}>Commission Rate</Text>
                        <TextInput
                            style={styles.smallInput}
                            value={config.commissionRate.toString()}
                            onChangeText={(value) => updateConfig('commissionRate', parseInt(value) || 0)}
                            keyboardType="number-pad"
                        />
                        <Text style={styles.inputSuffix}>%</Text>
                    </View>
                </Card>

                {/* Support Settings */}
                <Card style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        <Ionicons name="help-circle" size={18} color={COLORS.info} /> Support Information
                    </Text>

                    <View style={styles.fullInputRow}>
                        <Text style={styles.inputLabel}>Support Phone</Text>
                        <TextInput
                            style={styles.fullInput}
                            value={config.supportPhone}
                            onChangeText={(value) => updateConfig('supportPhone', value)}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.fullInputRow}>
                        <Text style={styles.inputLabel}>Support Email</Text>
                        <TextInput
                            style={styles.fullInput}
                            value={config.supportEmail}
                            onChangeText={(value) => updateConfig('supportEmail', value)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>
                </Card>

                {/* Save Button */}
                <Button
                    title={saving ? 'Saving...' : 'Save Settings'}
                    onPress={handleSave}
                    loading={saving}
                    disabled={!hasChanges}
                    style={styles.saveBtn}
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
        padding: SIZES.padding,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    saveButton: {
        fontSize: SIZES.base,
        fontFamily: FONTS.semiBold,
        color: COLORS.primary,
    },
    saveButtonDisabled: {
        color: COLORS.textSecondary,
    },
    content: {
        flex: 1,
        padding: SIZES.padding,
    },
    section: {
        padding: 16,
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionTitleContainer: {
        flex: 1,
        marginLeft: 12,
    },
    sectionTitle: {
        fontSize: SIZES.base,
        fontFamily: FONTS.bold,
        color: COLORS.text,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginBottom: 16,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    inputLabel: {
        flex: 1,
        fontSize: SIZES.sm,
        fontFamily: FONTS.medium,
        color: COLORS.text,
    },
    smallInput: {
        width: 60,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 8,
        textAlign: 'center',
        fontSize: SIZES.base,
        fontFamily: FONTS.medium,
        color: COLORS.text,
        backgroundColor: COLORS.background,
    },
    inputSuffix: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginLeft: 8,
    },
    fullInputRow: {
        marginTop: 12,
    },
    fullInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        marginTop: 6,
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.text,
        backgroundColor: COLORS.background,
    },
    packageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    packageItem: {
        flex: 1,
    },
    packageLabel: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    packageInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 10,
        fontSize: SIZES.base,
        fontFamily: FONTS.medium,
        color: COLORS.text,
        backgroundColor: COLORS.background,
    },
    packageEquals: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.bold,
        color: COLORS.textSecondary,
        marginHorizontal: 12,
        marginTop: 16,
    },
    saveBtn: {
        marginTop: 8,
    },
});
