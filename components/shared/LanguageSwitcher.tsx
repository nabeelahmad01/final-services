import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '@/constants/theme';

interface Language {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
}

const LANGUAGES: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
];

interface LanguageSwitcherProps {
    style?: object;
    showLabel?: boolean;
}

/**
 * Language Switcher Component
 * Allows users to switch between English and Urdu
 */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
    style,
    showLabel = true 
}) => {
    const { i18n, t } = useTranslation();
    const [modalVisible, setModalVisible] = React.useState(false);

    const currentLanguage = LANGUAGES.find(lang => lang.code === i18n.language) || LANGUAGES[0];

    const handleLanguageChange = (langCode: string) => {
        i18n.changeLanguage(langCode);
        setModalVisible(false);
    };

    const renderLanguageItem = ({ item }: { item: Language }) => (
        <TouchableOpacity
            style={[
                styles.languageItem,
                item.code === i18n.language && styles.languageItemActive
            ]}
            onPress={() => handleLanguageChange(item.code)}
        >
            <Text style={styles.flag}>{item.flag}</Text>
            <View style={styles.languageInfo}>
                <Text style={[
                    styles.languageName,
                    item.code === i18n.language && styles.languageNameActive
                ]}>
                    {item.nativeName}
                </Text>
                <Text style={styles.languageSubtitle}>{item.name}</Text>
            </View>
            {item.code === i18n.language && (
                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
            )}
        </TouchableOpacity>
    );

    return (
        <>
            <TouchableOpacity 
                style={[styles.button, style]} 
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.buttonFlag}>{currentLanguage.flag}</Text>
                {showLabel && (
                    <Text style={styles.buttonText}>{currentLanguage.nativeName}</Text>
                )}
                <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('settings.language')}</Text>
                            <TouchableOpacity 
                                onPress={() => setModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={LANGUAGES}
                            renderItem={renderLanguageItem}
                            keyExtractor={(item) => item.code}
                            contentContainerStyle={styles.languageList}
                        />
                    </View>
                </View>
            </Modal>
        </>
    );
};

/**
 * Compact Language Toggle Button
 * Simple toggle between EN and UR
 */
export const LanguageToggle: React.FC<{ style?: object }> = ({ style }) => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'ur' : 'en';
        i18n.changeLanguage(newLang);
    };

    return (
        <TouchableOpacity 
            style={[styles.toggleButton, style]} 
            onPress={toggleLanguage}
        >
            <Text style={styles.toggleText}>
                {i18n.language === 'en' ? 'اردو' : 'EN'}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 6,
    },
    buttonFlag: {
        fontSize: 18,
    },
    buttonText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.medium,
        color: COLORS.text,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 32,
        maxHeight: '50%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SIZES.padding,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    closeButton: {
        padding: 4,
    },
    languageList: {
        padding: SIZES.padding,
    },
    languageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: COLORS.background,
    },
    languageItemActive: {
        backgroundColor: COLORS.primary + '15',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    flag: {
        fontSize: 28,
        marginRight: 12,
    },
    languageInfo: {
        flex: 1,
    },
    languageName: {
        fontSize: SIZES.base,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
    },
    languageNameActive: {
        color: COLORS.primary,
    },
    languageSubtitle: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    toggleButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    toggleText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.white,
    },
});
