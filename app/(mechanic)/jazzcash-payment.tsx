import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import CryptoJS from "crypto-js";
import { COLORS } from "@/constants/theme";
import {
  createTransaction,
  updateMechanicDiamonds,
  updateTransactionStatus,
} from "@/services/firebase/firestore";

// JazzCash Production Configuration
const getJazzCashConfig = () => ({
  merchantId: process.env.EXPO_PUBLIC_JAZZCASH_MERCHANT_ID || "",
  password: process.env.EXPO_PUBLIC_JAZZCASH_PASSWORD || "",
  integritySalt: process.env.EXPO_PUBLIC_JAZZCASH_INTEGRITY_SALT || "",
  // Use sandbox for testing, production URL for live
  checkoutUrl: "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/",
  // Production URL (uncomment when going live):
  // checkoutUrl: "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/",
  returnUrl: "com.fixkar.app://payment-callback",
});

// Format date for JazzCash (YYYYMMDDHHmmss)
const formatJazzCashDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

// Generate HMAC-SHA256 hash for JazzCash
const generateSecureHash = (
  data: Record<string, string>,
  integritySalt: string
): string => {
  const sortedKeys = Object.keys(data).sort();
  let finalString = integritySalt + "&";

  for (const key of sortedKeys) {
    if (key === "pp_SecureHash") continue;
    const value = data[key];
    if (value !== undefined && value !== null && value !== "") {
      finalString += value + "&";
    }
  }

  if (finalString.endsWith("&")) {
    finalString = finalString.slice(0, -1);
  }

  const hash = CryptoJS.HmacSHA256(finalString, integritySalt);
  return hash.toString(CryptoJS.enc.Hex).toUpperCase();
};

export default function JazzCashPaymentScreen() {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const params = useLocalSearchParams<{
    amount: string;
    mechanicId: string;
    diamonds: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [paymentProcessed, setPaymentProcessed] = useState(false);

  const amount = parseFloat(params.amount || "0");
  const diamonds = parseInt(params.diamonds || "0", 10);

  // Initialize payment on component mount
  React.useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      const config = getJazzCashConfig();

      if (!config.merchantId || !config.password || !config.integritySalt) {
        throw new Error("JazzCash credentials not configured");
      }

      const mechanicId = params.mechanicId || "";
      const now = new Date();
      const expiryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const txnRefNo = `T${formatJazzCashDate(now)}`;
      const txnDateTime = formatJazzCashDate(now);
      const txnExpiryDateTime = formatJazzCashDate(expiryDate);
      const amountInPaisa = Math.round(amount * 100).toString();

      // Create transaction record in Firebase
      const fbTransactionId = await createTransaction({
        userId: mechanicId,
        type: "purchase",
        amount: diamonds,
        paymentMethod: "jazzcash",
        paymentDetails: {
          transactionId: txnRefNo,
          amount: amount,
        },
        status: "pending",
      });

      setTransactionId(fbTransactionId);

      // JazzCash Hosted Checkout parameters
      const formData: Record<string, string> = {
        pp_Amount: amountInPaisa,
        pp_BillReference: `FXK${Date.now().toString().slice(-10)}`,
        pp_Description: "DiamondPurchase",
        pp_Language: "EN",
        pp_MerchantID: config.merchantId,
        pp_Password: config.password,
        pp_ReturnURL: config.returnUrl,
        pp_TxnCurrency: "PKR",
        pp_TxnDateTime: txnDateTime,
        pp_TxnExpiryDateTime: txnExpiryDateTime,
        pp_TxnRefNo: txnRefNo,
        pp_TxnType: "",
        pp_Version: "1.1",
        ppmpf_1: "",
        ppmpf_2: "",
        ppmpf_3: "",
        ppmpf_4: "",
        ppmpf_5: "",
      };

      // Generate secure hash
      const secureHash = generateSecureHash(formData, config.integritySalt);

      // Create HTML form that auto-submits to JazzCash
      const html = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        }
        .loader {
            text-align: center;
            padding: 40px;
            background: rgba(255,255,255,0.05);
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        .spinner {
            border: 4px solid rgba(255,255,255,0.1);
            border-top: 4px solid #ED1C24;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        p { color: #fff; font-size: 16px; margin-bottom: 8px; }
        .amount { color: #ED1C24; font-size: 24px; font-weight: bold; }
        .secure { color: #4CAF50; font-size: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="loader">
        <div class="spinner"></div>
        <p>Connecting to JazzCash...</p>
        <p class="amount">PKR ${amount.toLocaleString()}</p>
        <p class="secure">🔒 Secure Payment</p>
    </div>
    <form id="jazzcashForm" method="POST" action="${config.checkoutUrl}">
        <input type="hidden" name="pp_Amount" value="${formData.pp_Amount}" />
        <input type="hidden" name="pp_BillReference" value="${formData.pp_BillReference}" />
        <input type="hidden" name="pp_Description" value="${formData.pp_Description}" />
        <input type="hidden" name="pp_Language" value="${formData.pp_Language}" />
        <input type="hidden" name="pp_MerchantID" value="${formData.pp_MerchantID}" />
        <input type="hidden" name="pp_Password" value="${formData.pp_Password}" />
        <input type="hidden" name="pp_ReturnURL" value="${formData.pp_ReturnURL}" />
        <input type="hidden" name="pp_TxnCurrency" value="${formData.pp_TxnCurrency}" />
        <input type="hidden" name="pp_TxnDateTime" value="${formData.pp_TxnDateTime}" />
        <input type="hidden" name="pp_TxnExpiryDateTime" value="${formData.pp_TxnExpiryDateTime}" />
        <input type="hidden" name="pp_TxnRefNo" value="${formData.pp_TxnRefNo}" />
        <input type="hidden" name="pp_TxnType" value="${formData.pp_TxnType}" />
        <input type="hidden" name="pp_Version" value="${formData.pp_Version}" />
        <input type="hidden" name="ppmpf_1" value="${formData.ppmpf_1}" />
        <input type="hidden" name="ppmpf_2" value="${formData.ppmpf_2}" />
        <input type="hidden" name="ppmpf_3" value="${formData.ppmpf_3}" />
        <input type="hidden" name="ppmpf_4" value="${formData.ppmpf_4}" />
        <input type="hidden" name="ppmpf_5" value="${formData.ppmpf_5}" />
        <input type="hidden" name="pp_SecureHash" value="${secureHash}" />
    </form>
    <script>
        setTimeout(() => {
            document.getElementById('jazzcashForm').submit();
        }, 1000);
    </script>
</body>
</html>`;

      setHtmlContent(html);
      setLoading(false);
    } catch (err: any) {
      console.error("Payment initialization error:", err);
      setError(err.message || "Failed to initialize payment");
      setLoading(false);
    }
  };

  const handleNavigationChange = async (navState: any) => {
    const { url } = navState;
    console.log("WebView URL:", url);

    // Prevent duplicate processing
    if (paymentProcessed) return;

    // Check if redirected to our callback URL
    if (url.startsWith("com.fixkar.app://payment-callback")) {
      setPaymentProcessed(true);
      
      if (url.includes("pp_ResponseCode=000")) {
        // Payment successful
        try {
          const mechanicId = params.mechanicId || "";
          await updateMechanicDiamonds(mechanicId, diamonds, "add");
          await updateTransactionStatus(transactionId, "completed");

          Alert.alert(
            "Payment Successful! ✅",
            `${diamonds} diamonds have been added to your wallet.`,
            [
              {
                text: "OK",
                onPress: () =>
                  router.replace({
                    pathname: "/(mechanic)/wallet",
                    params: { paymentSuccess: "true" },
                  }),
              },
            ]
          );
        } catch (err) {
          console.error("Error updating balance:", err);
          router.replace({
            pathname: "/(mechanic)/wallet",
            params: { paymentSuccess: "true" },
          });
        }
      } else if (url.includes("pp_ResponseCode")) {
        // Payment failed
        await updateTransactionStatus(transactionId, "failed");
        Alert.alert(
          "Payment Failed",
          "Your payment could not be processed. Please try again.",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        // Generic callback - check with JazzCash if payment was successful
        // For now, assume success if no error code
        try {
          const mechanicId = params.mechanicId || "";
          await updateMechanicDiamonds(mechanicId, diamonds, "add");
          await updateTransactionStatus(transactionId, "completed");

          Alert.alert(
            "Payment Successful! ✅",
            `${diamonds} diamonds have been added to your wallet.`,
            [
              {
                text: "OK",
                onPress: () =>
                  router.replace({
                    pathname: "/(mechanic)/wallet",
                    params: { paymentSuccess: "true" },
                  }),
              },
            ]
          );
        } catch (err) {
          console.error("Error updating balance:", err);
        }
      }
    }
  };

  const handleCancel = async () => {
    Alert.alert(
      "Cancel Payment",
      "Are you sure you want to cancel this payment?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            if (transactionId) {
              await updateTransactionStatus(transactionId, "failed");
            }
            router.back();
          },
        },
      ]
    );
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color={COLORS.danger} />
          <Text style={styles.errorTitle}>Payment Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializePayment}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>JazzCash Payment</Text>
          <Text style={styles.headerAmount}>PKR {amount.toLocaleString()}</Text>
        </View>
        <View style={styles.secureIcon}>
          <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ED1C24" />
          <Text style={styles.loadingText}>Initializing secure payment...</Text>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationChange}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          mixedContentMode="compatibility"
          originWhitelist={["*"]}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  headerAmount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  secureIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#ED1C24",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
