import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Modal, ModalButton, ModalProps } from '@/components/ui/Modal';

interface ModalContextType {
    showModal: (options: Omit<ModalProps, 'visible' | 'onClose'>) => void;
    hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [modalConfig, setModalConfig] = useState<Omit<ModalProps, 'visible' | 'onClose'> | null>(
        null
    );

    const showModal = (options: Omit<ModalProps, 'visible' | 'onClose'>) => {
        setModalConfig(options);
    };

    const hideModal = () => {
        setModalConfig(null);
    };

    return (
        <ModalContext.Provider value={{ showModal, hideModal }}>
            {children}
            {modalConfig && (
                <Modal
                    {...modalConfig}
                    visible={!!modalConfig}
                    onClose={hideModal}
                />
            )}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};

// Helper functions for common modal types
export const showSuccessModal = (
    showModalFn: (options: Omit<ModalProps, 'visible' | 'onClose'>) => void,
    title: string,
    message?: string,
    onOk?: () => void
) => {
    showModalFn({
        title,
        message,
        type: 'success',
        buttons: [
            {
                text: 'OK',
                onPress: onOk || (() => { }),
                style: 'success',
            },
        ],
    });
};

export const showErrorModal = (
    showModalFn: (options: Omit<ModalProps, 'visible' | 'onClose'>) => void,
    title: string,
    message?: string,
    onOk?: () => void
) => {
    showModalFn({
        title,
        message,
        type: 'error',
        buttons: [
            {
                text: 'OK',
                onPress: onOk || (() => { }),
                style: 'primary',
            },
        ],
    });
};

export const showWarningModal = (
    showModalFn: (options: Omit<ModalProps, 'visible' | 'onClose'>) => void,
    title: string,
    message?: string,
    onOk?: () => void
) => {
    showModalFn({
        title,
        message,
        type: 'warning',
        buttons: [
            {
                text: 'OK',
                onPress: onOk || (() => { }),
                style: 'primary',
            },
        ],
    });
};

export const showConfirmModal = (
    showModalFn: (options: Omit<ModalProps, 'visible' | 'onClose'>) => void,
    title: string,
    message?: string,
    onConfirm?: () => void,
    onCancel?: () => void,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
) => {
    showModalFn({
        title,
        message,
        type: 'confirm',
        closeOnBackdropPress: false,
        buttons: [
            {
                text: cancelText,
                onPress: onCancel || (() => { }),
                style: 'default',
            },
            {
                text: confirmText,
                onPress: onConfirm || (() => { }),
                style: 'primary',
            },
        ],
    });
};

export const showInfoModal = (
    showModalFn: (options: Omit<ModalProps, 'visible' | 'onClose'>) => void,
    title: string,
    message?: string,
    onOk?: () => void
) => {
    showModalFn({
        title,
        message,
        type: 'info',
        buttons: [
            {
                text: 'OK',
                onPress: onOk || (() => { }),
                style: 'primary',
            },
        ],
    });
};
