/**
 * JazzCash MWALLET Payment Flow Component
 * 
 * A professional UI component for handling JazzCash MWALLET payments.
 * Shows mobile number and CNIC input, then processes payment.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '@/constants/theme';
import { initiateWalletPayment, MWalletResponse } from '@/services/payments/mwalletService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface JazzCashPaymentFlowProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
  diamonds: number;
  mechanicId: string;
}

type PaymentStep = 'input' | 'processing' | 'result';

export default function JazzCashPaymentFlow({
  visible,
  onClose,
  onSuccess,
  amount,
  diamonds,
  mechanicId,
}: JazzCashPaymentFlowProps) {
  const [step, setStep] = useState<PaymentStep>('input');
  const [mobileNumber, setMobileNumber] = useState('');
  const [cnic, setCnic] = useState('');
  const [error, setError] = useState('');
  const [paymentResult, setPaymentResult] = useState<MWalletResponse | null>(null);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  React.useEffect(() => {
    if (visible) {
      // Reset state
      setStep('input');
      setMobileNumber('');
      setCnic('');
      setError('');
      setPaymentResult(null);

      // Animate in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      // Animate out
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const validateInputs = (): boolean => {
    setError('');

    const cleanMobile = mobileNumber.replace(/[\s\-\(\)]/g, '');
    if (!cleanMobile || cleanMobile.length < 10) {
      setError('Please enter a valid mobile number (03XXXXXXXXX)');
      return false;
    }

    const cleanCnic = cnic.replace(/[\s\-]/g, '');
    if (!cleanCnic || cleanCnic.length !== 6) {
      setError('Please enter exactly 6 digits of your CNIC');
      return false;
    }

    if (!/^\d{6}$/.test(cleanCnic)) {
      setError('CNIC must contain only numbers');
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    if (!validateInputs()) return;

    setStep('processing');
    setError('');

    try {
      const result = await initiateWalletPayment({
        amount,
        diamonds,
        mechanicId,
        mobileNumber: mobileNumber.replace(/[\s\-\(\)]/g, ''),
        cnic: cnic.replace(/[\s\-]/g, ''),
        description: `${diamonds} Diamonds Purchase`,
      });

      setPaymentResult(result);
      setStep('result');

      if (result.success) {
        // Delay success callback to show result
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err: any) {
      setPaymentResult({
        success: false,
        responseCode: 'ERROR',
        responseMessage: err.message || 'Payment failed. Please try again.',
      });
      setStep('result');
    }
  };

  const handleClose = () => {
    if (step === 'processing') return;
    onClose();
  };

  const handleRetry = () => {
    setStep('input');
    setError('');
    setPaymentResult(null);
  };

  const formatMobileDisplay = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 11)}`;
  };

  // Input Step
  const renderInputStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.jazzcashLogo}>
            <Text style={styles.jazzcashLogoText}>JazzCash</Text>
          </View>
          <Text style={styles.headerTitle}>Mobile Wallet Payment</Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>Amount to Pay</Text>
        <Text style={styles.amountValue}>PKR {amount.toLocaleString()}</Text>
        <Text style={styles.diamondsLabel}>💎 {diamonds} Diamonds</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          JazzCash Mobile Number <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="03XX-XXXXXXX"
            value={formatMobileDisplay(mobileNumber)}
            onChangeText={(text) => setMobileNumber(text.replace(/\D/g, '').slice(0, 11))}
            keyboardType="phone-pad"
            placeholderTextColor={COLORS.textSecondary}
            maxLength={12}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          Last 6 Digits of CNIC <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.inputContainer}>
          <Ionicons name="card-outline" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="XXXXXX"
            value={cnic}
            onChangeText={(text) => setCnic(text.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            placeholderTextColor={COLORS.textSecondary}
            maxLength={6}
          />
        </View>
        <Text style={styles.inputHint}>Enter the last 6 digits of your CNIC</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.payButton,
          (!mobileNumber || cnic.length !== 6) && styles.payButtonDisabled,
        ]}
        onPress={handlePayment}
        disabled={!mobileNumber || cnic.length !== 6}
      >
        <Ionicons name="lock-closed" size={18} color="#fff" />
        <Text style={styles.payButtonText}>Pay Securely</Text>
      </TouchableOpacity>

      <View style={styles.secureNote}>
        <Ionicons name="shield-checkmark" size={14} color={COLORS.success} />
        <Text style={styles.secureNoteText}>
          Secured by JazzCash. You'll receive MPIN prompt on your phone.
        </Text>
      </View>
    </View>
  );

  // Processing Step
  const renderProcessingStep = () => (
    <View style={styles.processingContainer}>
      <ActivityIndicator size={60} color="#ED1C24" />
      <Text style={styles.processingTitle}>Processing Payment...</Text>
      <Text style={styles.processingSubtitle}>
        Please wait while we connect to JazzCash
      </Text>
      <View style={styles.processingAmountBox}>
        <Text style={styles.processingAmount}>PKR {amount.toLocaleString()}</Text>
      </View>
      <Text style={styles.processingNote}>
        You may receive an MPIN prompt on your JazzCash app
      </Text>
    </View>
  );

  // Result Step
  const renderResultStep = () => (
    <View style={styles.resultContainer}>
      <View
        style={[
          styles.resultIcon,
          paymentResult?.success ? styles.resultIconSuccess : styles.resultIconFailed,
        ]}
      >
        <Ionicons
          name={paymentResult?.success ? 'checkmark' : 'close'}
          size={48}
          color="#fff"
        />
      </View>

      <Text
        style={[
          styles.resultTitle,
          paymentResult?.success ? styles.resultTitleSuccess : styles.resultTitleFailed,
        ]}
      >
        {paymentResult?.success ? 'Payment Successful!' : 'Payment Failed'}
      </Text>

      <Text style={styles.resultMessage}>
        {paymentResult?.responseMessage}
      </Text>

      {paymentResult?.invoiceNumber && (
        <View style={styles.invoiceBox}>
          <Text style={styles.invoiceLabel}>Invoice #</Text>
          <Text style={styles.invoiceValue}>{paymentResult.invoiceNumber}</Text>
        </View>
      )}

      <View style={styles.resultAmount}>
        <Text style={styles.resultAmountLabel}>Amount</Text>
        <Text style={styles.resultAmountValue}>PKR {amount.toLocaleString()}</Text>
      </View>

      {!paymentResult?.success && (
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.doneButton} onPress={onClose}>
        <Text style={styles.doneButtonText}>
          {paymentResult?.success ? 'Done' : 'Close'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={step === 'processing' ? undefined : handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={step === 'processing' ? undefined : handleClose}
        />

        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {step === 'input' && renderInputStep()}
          {step === 'processing' && renderProcessingStep()}
          {step === 'result' && renderResultStep()}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
    ...SHADOWS.large,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
  },
  stepContainer: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  jazzcashLogo: {
    backgroundColor: '#ED1C24',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  jazzcashLogoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  closeBtn: {
    padding: 4,
  },
  amountCard: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  diamondsLabel: {
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger + '15',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  required: {
    color: COLORS.danger,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  inputHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginLeft: 4,
  },
  payButton: {
    backgroundColor: '#ED1C24',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  secureNoteText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  // Processing
  processingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  processingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 24,
  },
  processingSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  processingAmountBox: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  processingAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ED1C24',
  },
  processingNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 20,
    textAlign: 'center',
  },
  // Result
  resultContainer: {
    padding: 32,
    alignItems: 'center',
  },
  resultIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultIconSuccess: {
    backgroundColor: COLORS.success,
  },
  resultIconFailed: {
    backgroundColor: COLORS.danger,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultTitleSuccess: {
    color: COLORS.success,
  },
  resultTitleFailed: {
    color: COLORS.danger,
  },
  resultMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  invoiceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  invoiceLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  invoiceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  resultAmount: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultAmountLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  resultAmountValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  retryButton: {
    backgroundColor: '#ED1C24',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  doneButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  doneButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
