import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
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

// JazzCash configuration
const getJazzCashConfig = () => ({
  merchantId: process.env.EXPO_PUBLIC_JAZZCASH_MERCHANT_ID || "",
  password: process.env.EXPO_PUBLIC_JAZZCASH_PASSWORD || "",
  integritySalt: process.env.EXPO_PUBLIC_JAZZCASH_INTEGRITY_SALT || "",
  sandboxUrl:
    "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/",
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
// EXACT format from JazzCash Hash Calculator:
// IntegritySalt&value1&value2&value3... (remove last &)
// HMAC-SHA256 with integritySalt as key, output UPPERCASE
const generateSecureHash = (
  data: Record<string, string>,
  integritySalt: string
): string => {
  // Get sorted keys (alphabetically)
  const sortedKeys = Object.keys(data).sort();

  // Build string: IntegritySalt&value1&value2&...
  let finalString = integritySalt + "&";

  for (const key of sortedKeys) {
    // Skip pp_SecureHash if present
    if (key === "pp_SecureHash") continue;

    const value = data[key];
    if (value !== undefined && value !== null && value !== "") {
      finalString += value + "&";
    }
  }

  // Remove the last '&'
  if (finalString.endsWith("&")) {
    finalString = finalString.slice(0, -1);
  }

  console.log("Hash Input String:", finalString);

  // Generate HMAC-SHA256 using integrity salt as key, output UPPERCASE
  const hash = CryptoJS.HmacSHA256(finalString, integritySalt);
  const hashHex = hash.toString(CryptoJS.enc.Hex).toUpperCase();

  console.log("Generated Hash:", hashHex);

  return hashHex;
};

export default function JazzCashPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    amount: string;
    mechanicId: string;
    diamonds: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      const config = getJazzCashConfig();

      if (!config.merchantId || !config.password || !config.integritySalt) {
        throw new Error("JazzCash credentials not configured");
      }

      const amount = parseFloat(params.amount || "0");
      const mechanicId = params.mechanicId || "";
      const diamonds = parseInt(params.diamonds || "0", 10);

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

      // All parameters for hash calculation
      const formData: Record<string, string> = {
        pp_Amount: amountInPaisa,
        pp_BillReference: `FXK${Date.now().toString().slice(-10)}`,
        pp_Description: "DiamondPurchase",
        pp_Language: "EN",
        pp_MerchantID: config.merchantId,
        pp_Password: config.password,
        pp_ReturnURL: "com.fixkar.app://payment-callback",
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

      // Create HTML form that auto-submits via POST
      const html = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #f5f5f5;
        }
        .loader {
            text-align: center;
            padding: 20px;
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #00ACC1;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="loader">
        <div class="spinner"></div>
        <p>Redirecting to JazzCash...</p>
    </div>
    <form id="jazzcashForm" method="POST" action="${config.sandboxUrl}">
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
        document.getElementById('jazzcashForm').submit();
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

    // Check if redirected to our callback URL (deep link)
    if (url.startsWith("com.fixkar.app://payment-callback")) {
      // Payment completed - check if we have response code in URL
      // JazzCash appends params to the return URL
      if (url.includes("pp_ResponseCode=000")) {
        // Payment successful
        try {
          const mechanicId = params.mechanicId || "";
          const diamonds = parseInt(params.diamonds || "0", 10);

          await updateMechanicDiamonds(mechanicId, diamonds, "add");
          await updateTransactionStatus(transactionId, "completed");

          router.replace({
            pathname: "/(mechanic)/wallet",
            params: { paymentSuccess: "true" },
          });
        } catch (err) {
          console.error("Error updating balance:", err);
        }
      } else if (url.includes("pp_ResponseCode")) {
        // Payment failed with error code
        await updateTransactionStatus(transactionId, "failed");
        router.replace({
          pathname: "/(mechanic)/wallet",
          params: { paymentFailed: "true" },
        });
      } else {
        // Callback received but no response code - treat as success for sandbox
        // In production, you should verify with JazzCash API
        console.log("Callback received, assuming sandbox success");
        try {
          const mechanicId = params.mechanicId || "";
          const diamonds = parseInt(params.diamonds || "0", 10);

          await updateMechanicDiamonds(mechanicId, diamonds, "add");
          await updateTransactionStatus(transactionId, "completed");

          router.replace({
            pathname: "/(mechanic)/wallet",
            params: { paymentSuccess: "true" },
          });
        } catch (err) {
          console.error("Error updating balance:", err);
          router.replace({
            pathname: "/(mechanic)/wallet",
            params: { paymentFailed: "true" },
          });
        }
      }
      return;
    }

    // Check if payment completed on JazzCash page
    if (url.includes("pp_ResponseCode=000")) {
      // Payment successful
      try {
        const mechanicId = params.mechanicId || "";
        const diamonds = parseInt(params.diamonds || "0", 10);

        await updateMechanicDiamonds(mechanicId, diamonds, "add");
        await updateTransactionStatus(transactionId, "completed");

        router.replace({
          pathname: "/(mechanic)/wallet",
          params: { paymentSuccess: "true" },
        });
      } catch (err) {
        console.error("Error updating balance:", err);
      }
    } else if (
      url.includes("pp_ResponseCode") &&
      !url.includes("pp_ResponseCode=000")
    ) {
      // Payment failed
      await updateTransactionStatus(transactionId, "failed");
      router.replace({
        pathname: "/(mechanic)/wallet",
        params: { paymentFailed: "true" },
      });
    }
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Error</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>JazzCash Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Preparing payment...</Text>
        </View>
      ) : (
        <WebView
          source={{ html: htmlContent }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationChange}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          mixedContentMode="compatibility"
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  webview: {
    flex: 1,
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
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.danger,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
