import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { updateMechanic } from '@/services/firebase/firestore';
import { useAuthStore } from '@/stores/authStore';
import { useModal, showErrorModal } from '@/utils/modalService';
import { COLORS, SIZES, CATEGORIES } from '@/constants/theme';
import { ServiceCategory } from '@/types';

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
            showErrorModal(showModal, 'Error', 'Please select at least one category');
            return;
        }

        if (!user) return;

        setLoading(true);
        try {
            await updateMechanic(user.id, {
                categories: selectedCategories,
            });

            // Navigate to mechanic dashboard
            router.replace('/(mechanic)/dashboard');
        } catch (error: any) {
            showErrorModal(showModal, 'Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Select Your Services</Text>
                    <Text style={styles.subtitle}>
                        Choose the categories you specialize in
                    </Text>
                </View>

                <View style={styles.categoriesGrid}>
                    {CATEGORIES.map((category) => {
                        const isSelected = selectedCategories.includes(category.id as ServiceCategory);

                        return (
                            <TouchableOpacity
                                key={category.id}
                                style={[
                                    styles.categoryCard,
                                    isSelected && {
                                        borderColor: category.color,
                                        backgroundColor: category.color + '10',
                                    },
                                ]}
                                onPress={() => toggleCategory(category.id as ServiceCategory)}
                                activeOpacity={0.7}
                            >
                                <View
                                    style={[
                                        styles.iconCircle,
                                        { backgroundColor: category.color },
                                    ]}
                                >
                                    <Ionicons
                                        name={category.icon as any}
                                        size={32}
                                        color={COLORS.white}
                                    />
                                </View>
                                <Text style={styles.categoryName}>{category.name}</Text>
                                {isSelected && (
                                    <View style={[styles.checkmark, { backgroundColor: category.color }]}>
                                        <Ionicons name="checkmark" size={16} color={COLORS.white} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.selectedText}>
                        Selected: {selectedCategories.length} {selectedCategories.length === 1 ? 'category' : 'categories'}
                    </Text>
                    <Button
                        title="Continue"
                        onPress={handleContinue}
                        loading={loading}
                        disabled={selectedCategories.length === 0}
                    />
                </View>
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
        padding: SIZES.padding * 1.5,
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 30,
    },
    categoryCard: {
        width: '47%',
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.border,
        position: 'relative',
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryName: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'center',
    },
    checkmark: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        gap: 16,
    },
    selectedText: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
        textAlign: 'center',
        fontWeight: '500',
    },
});
