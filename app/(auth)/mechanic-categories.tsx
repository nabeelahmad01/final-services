import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/Button';
import { updateMechanic } from '@/services/firebase/firestore';
import { useAuthStore } from '@/stores/authStore';
import { useModal, showErrorModal, showSuccessModal } from '@/utils/modalService';
import { COLORS, SIZES, CATEGORIES, FONTS } from '@/constants/theme';
import { ServiceCategory } from '@/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 16) / 2;

export default function MechanicCategories() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { showModal } = useModal();
    const [selectedCategories, setSelectedCategories] = useState<ServiceCategory[]>([]);
    const [loading, setLoading] = useState(false);

    const toggleCategory = (categoryId: ServiceCategory) => {
        if (selectedCategories.includes(categoryId)) {
            setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
        } else {
            setSelectedCategories([...selectedCategories, categoryId]);
        }
    };

    const handleContinue = async () => {
        if (selectedCategories.length === 0) {
            showErrorModal(showModal, 'Required', 'Please select at least one service category');
            return;
        }

        if (!user) return;

        setLoading(true);
        try {
            await updateMechanic(user.id, {
                categories: selectedCategories,
            });

            showSuccessModal(
                showModal,
                'Categories Saved!',
                'You will now receive requests for your selected services. Complete KYC to start receiving job requests.',
                () => router.replace('/(mechanic)/dashboard')
            );
        } catch (error: any) {
            showErrorModal(showModal, 'Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.headerGradient}
                >
                    <View style={styles.headerIconContainer}>
                        <Ionicons name="construct" size={32} color={COLORS.white} />
                    </View>
                    <Text style={styles.headerTitle}>Select Your Services</Text>
                    <Text style={styles.headerSubtitle}>
                        Choose the categories you specialize in.{'\n'}
                        You'll receive service requests for these categories.
                    </Text>
                </LinearGradient>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Category Grid */}
                <View style={styles.categoriesGrid}>
                    {CATEGORIES.map((category) => {
                        const isSelected = selectedCategories.includes(category.id as ServiceCategory);

                        return (
                            <TouchableOpacity
                                key={category.id}
                                style={[
                                    styles.categoryCard,
                                    isSelected && styles.categoryCardSelected,
                                    isSelected && { borderColor: category.color },
                                ]}
                                onPress={() => toggleCategory(category.id as ServiceCategory)}
                                activeOpacity={0.7}
                            >
                                {/* Selection indicator */}
                                {isSelected && (
                                    <View style={[styles.checkmarkBadge, { backgroundColor: category.color }]}>
                                        <Ionicons name="checkmark" size={14} color={COLORS.white} />
                                    </View>
                                )}

                                {/* Icon */}
                                <View
                                    style={[
                                        styles.iconCircle,
                                        { backgroundColor: category.color },
                                        isSelected && styles.iconCircleSelected,
                                    ]}
                                >
                                    <Ionicons
                                        name={category.icon as any}
                                        size={32}
                                        color={COLORS.white}
                                    />
                                </View>

                                {/* Category name */}
                                <Text style={[
                                    styles.categoryName,
                                    isSelected && { color: category.color, fontWeight: '700' }
                                ]}>
                                    {category.name}
                                </Text>

                                {/* Selection ring */}
                                {isSelected && (
                                    <View style={[styles.selectionRing, { borderColor: category.color }]} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.selectedInfo}>
                    <View style={styles.selectedIconRow}>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                        <Text style={styles.selectedText}>
                            {selectedCategories.length} {selectedCategories.length === 1 ? 'service' : 'services'} selected
                        </Text>
                    </View>
                    {selectedCategories.length === 0 && (
                        <Text style={styles.hintText}>
                            Select at least one service to continue
                        </Text>
                    )}
                </View>

                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        selectedCategories.length === 0 && styles.continueButtonDisabled
                    ]}
                    onPress={handleContinue}
                    disabled={loading || selectedCategories.length === 0}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={selectedCategories.length > 0 
                            ? [COLORS.primary, COLORS.primaryDark] 
                            : [COLORS.textSecondary, COLORS.textSecondary]}
                        style={styles.continueButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {loading ? (
                            <Ionicons name="sync" size={22} color={COLORS.white} />
                        ) : (
                            <>
                                <Text style={styles.continueButtonText}>Continue</Text>
                                <Ionicons name="arrow-forward" size={22} color={COLORS.white} />
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        overflow: 'hidden',
    },
    headerGradient: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 32,
        alignItems: 'center',
    },
    headerIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        lineHeight: 22,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 24,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    categoryCard: {
        width: CARD_WIDTH,
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.border,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    categoryCardSelected: {
        backgroundColor: COLORS.white,
        shadowOpacity: 0.12,
        elevation: 6,
    },
    checkmarkBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    iconCircleSelected: {
        transform: [{ scale: 1.05 }],
    },
    categoryName: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        textAlign: 'center',
    },
    selectionRing: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    footer: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        gap: 16,
    },
    selectedInfo: {
        gap: 4,
    },
    selectedIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    selectedText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
    },
    hintText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginLeft: 28,
    },
    continueButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    continueButtonDisabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    continueButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 10,
    },
    continueButtonText: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.white,
    },
});
