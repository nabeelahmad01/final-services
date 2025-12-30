/**
 * JazzCash WebView Payment Screen
 * 
 * Uses WebView to show JazzCash's official payment page.
 * More reliable than direct MWALLET API.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '@/constants/theme';
import {
  generatePaymentForm,
  handlePaymentCallback,
} from '@/services/payments/jazzcashService';
import { useModal, showSuccessModal, showErrorModal } from '@/utils/modalService';

export default function JazzCashPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showModal } = useModal();
  const webViewRef = useRef<WebView>(null);

  const [loading, setLoading] = useState(true);
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string>('');
  const [billRef, setBillRef] = useState<string>('');

  // Get params
  const amount = params.amount ? parseInt(params.amount as string) : 0;
  const diamonds = params.diamonds ? parseInt(params.diamonds as string) : 0;
  const mechanicId = (params.mechanicId as string) || '';
  const description = (params.description as string) || 'Diamond Purchase';

  useEffect(() => {
    initPayment();
  }, []);

  const initPayment = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!amount || !mechanicId) {
        throw new Error('Missing payment details');
      }

      const result = await generatePaymentForm({
        amount,
        mechanicId,
        diamonds,
        description,
      });

      setHtml(result.html);
      setTransactionId(result.transactionId);
      setBillRef(result.billRef);
    } catch (err: any) {
      console.error('Payment init error:', err);
      setError(err.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigationChange = async (navState: any) => {
    const { url } = navState;
    
    // Check if this is the return URL
    if (url.includes('payment-callback') || url.includes('fixkar.app')) {
      try {
        // Parse URL parameters
        const urlParams = new URLSearchParams(url.split('?')[1] || '');
        const responseParams: Record<string, string> = {};
        urlParams.forEach((value, key) => {
          responseParams[key] = value;
        });

        // Handle callback
        const result = await handlePaymentCallback(
          responseParams,
          transactionId,
          mechanicId,
          diamonds
        );

        if (result.success) {
          showSuccessModal(
            showModal,
            'Payment Successful!',
            'Your diamonds have been added to your wallet.',
            () => router.replace('/(mechanic)/wallet')
          );
        } else {
          showErrorModal(showModal, 'Payment Failed', result.message);
          router.back();
        }
      } catch (err) {
        console.error('Callback error:', err);
        router.back();
      }
    }
  };

  const handleClose = () => {
    Alert.alert(
      'Cancel Payment?',
      'Are you sure you want to cancel this payment?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => router.back() },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Preparing payment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={COLORS.danger} />
          <Text style={styles.errorTitle}>Payment Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initPayment}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.secureIcon}>
            <Ionicons name="lock-closed" size={14} color={COLORS.success} />
          </View>
          <Text style={styles.headerTitle}>Secure Payment</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Payment Info Bar */}
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentInfoText}>
          Invoice: {billRef} • PKR {amount}
        </Text>
      </View>

      {/* WebView */}
      {html && (
        <WebView
          ref={webViewRef}
          source={{ html }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationChange}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color="#ED1C24" />
            </View>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secureIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  paymentInfo: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  paymentInfoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
  },
  backButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
