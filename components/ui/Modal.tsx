import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Modal as RNModal,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '@/constants/theme';

const { width } = Dimensions.get('window');

export interface ModalButton {
    text: string;
    onPress: () => void;
    style?: 'default' | 'primary' | 'danger' | 'success';
}

export interface ModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    message?: string;
    type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    buttons?: ModalButton[];
    icon?: keyof typeof Ionicons.glyphMap;
    closeOnBackdropPress?: boolean;
}

const MODAL_TYPES = {
    success: {
        icon: 'checkmark-circle',
        color: COLORS.success,
        gradient: [COLORS.success, '#66BB6A'] as const,
    },
    error: {
        icon: 'close-circle',
        color: COLORS.danger,
        gradient: [COLORS.danger, '#EF5350'] as const,
    },
    warning: {
        icon: 'warning',
        color: COLORS.warning,
        gradient: [COLORS.warning, '#FFB74D'] as const,
    },
    info: {
        icon: 'information-circle',
        color: COLORS.info,
        gradient: [COLORS.info, '#42A5F5'] as const,
    },
    confirm: {
        icon: 'help-circle',
        color: COLORS.primary,
        gradient: [COLORS.primary, COLORS.primaryLight] as const,
    },
};

export const Modal: React.FC<ModalProps> = ({
    visible,
    onClose,
    title,
    message,
    type = 'info',
    buttons,
    icon,
    closeOnBackdropPress = true,
}) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    const modalType = MODAL_TYPES[type];
    const displayIcon = icon || modalType.icon;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 50,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const handleBackdropPress = () => {
        if (closeOnBackdropPress) {
            onClose();
        }
    };

    const defaultButtons: ModalButton[] = buttons || [
        { text: 'OK', onPress: onClose, style: 'primary' },
    ];

    const getButtonStyle = (style?: string) => {
        switch (style) {
            case 'primary':
                return styles.buttonPrimary;
            case 'danger':
                return styles.buttonDanger;
            case 'success':
                return styles.buttonSuccess;
            default:
                return styles.buttonDefault;
        }
    };

    const getButtonTextStyle = (style?: string) => {
        return style === 'default' ? styles.buttonTextDefault : styles.buttonTextWhite;
    };

    return (
        <RNModal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <TouchableOpacity
                style={styles.backdrop}
                activeOpacity={1}
                onPress={handleBackdropPress}
            >
                <Animated.View
                    style={[
                        styles.backdropOverlay,
                        {
                            opacity: fadeAnim,
                        },
                    ]}
                />

                <Animated.View
                    style={[
                        styles.modalContainer,
                        {
                            opacity: fadeAnim,
                            transform: [
                                { scale: scaleAnim },
                                { translateY: slideAnim },
                            ],
                        },
                    ]}
                >
                    <TouchableOpacity activeOpacity={1}>
                        <View style={styles.modalContent}>
                            {/* Top Color Bar */}
                            <LinearGradient
                                colors={modalType.gradient}
                                style={styles.topBar}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            />

                            {/* Icon */}
                            <View style={styles.iconContainer}>
                                <LinearGradient
                                    colors={modalType.gradient}
                                    style={styles.iconGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Ionicons
                                        name={displayIcon as any}
                                        size={44}
                                        color={COLORS.white}
                                    />
                                </LinearGradient>
                            </View>

                            {/* Title */}
                            <Text style={styles.title}>{title}</Text>

                            {/* Message */}
                            {message && <Text style={styles.message}>{message}</Text>}

                            {/* Buttons */}
                            <View
                                style={[
                                    styles.buttonContainer,
                                    defaultButtons.length === 1 && styles.buttonContainerSingle,
                                ]}
                            >
                                {defaultButtons.map((button, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.button,
                                            getButtonStyle(button.style),
                                            defaultButtons.length === 1 && styles.buttonFull,
                                        ]}
                                        onPress={() => {
                                            button.onPress();
                                            onClose();
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Text
                                            style={[
                                                styles.buttonText,
                                                getButtonTextStyle(button.style),
                                            ]}
                                        >
                                            {button.text}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            </TouchableOpacity>
        </RNModal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdropOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: width - 48,
        maxWidth: 400,
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        ...SHADOWS.large,
        overflow: 'hidden',
    },
    topBar: {
        height: 6,
        width: '100%',
    },
    iconContainer: {
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 20,
    },
    iconGradient: {
        width: 88,
        height: 88,
        borderRadius: 44,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 12,
        paddingHorizontal: 24,
    },
    message: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 24,
        paddingBottom: 24,
        paddingTop: 8,
    },
    buttonContainerSingle: {
        flexDirection: 'column',
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    buttonFull: {
        flex: undefined,
        width: '100%',
    },
    buttonPrimary: {
        backgroundColor: COLORS.primary,
    },
    buttonDanger: {
        backgroundColor: COLORS.danger,
    },
    buttonSuccess: {
        backgroundColor: COLORS.success,
    },
    buttonDefault: {
        backgroundColor: COLORS.surface,
        borderWidth: 1.5,
        borderColor: COLORS.border,
    },
    buttonText: {
        fontSize: SIZES.base,
        fontWeight: '600',
    },
    buttonTextWhite: {
        color: COLORS.white,
    },
    buttonTextDefault: {
        color: COLORS.text,
    },
});
