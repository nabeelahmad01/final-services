import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SIZES, FONTS } from "@/constants/theme";
import { loginWithPhone } from "@/services/firebase/phoneAuth";
import { useModal, showErrorModal } from "@/utils/modalService";
import { useAuthStore } from "@/stores/authStore";
import { validatePhone } from "@/utils/validation";
import { useTranslation } from "react-i18next";

export default function PhoneLoginScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === "ur";
  const { showModal } = useModal();
  const { setUser } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode] = useState("+92");

  const handleLogin = async () => {
    const cleanNumber = phoneNumber.replace(/\s/g, "");

    // Validate phone number
    const validation = validatePhone(cleanNumber);
    if (!validation.isValid) {
      showErrorModal(
        showModal,
        t("common.error"),
        t("errors.invalidPhone")
      );
      return;
    }

    if (!password || password.length < 6) {
      showErrorModal(
        showModal,
        t("common.error"),
        t("errors.passwordTooShort")
      );
      return;
    }

    setLoading(true);
    try {
      const fullNumber = countryCode + cleanNumber.replace(/^0/, "");
      const result = await loginWithPhone(fullNumber, password);

      if (result.success && result.user) {
        setUser(result.user);

        if (result.user.role === 'mechanic') {
          router.replace('/(mechanic)/dashboard');
        } else if (result.user.role === 'admin') {
          router.replace('/(admin)/');
        } else {
          router.replace('/(customer)/home');
        }
      } else {
        showErrorModal(
          showModal,
          t("common.error"),
          result.error || t("auth.wrongPassword")
        );
      }
    } catch (error: any) {
      showErrorModal(showModal, t("common.error"), error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneDisplay = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    let formatted = cleaned;
    if (cleaned.length > 3) {
      formatted = cleaned.slice(0, 3) + " " + cleaned.slice(3);
    }
    if (cleaned.length > 6) {
      formatted =
        cleaned.slice(0, 3) +
        " " +
        cleaned.slice(3, 6) +
        " " +
        cleaned.slice(6, 10);
    }
    setPhoneNumber(formatted);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.header}
          >
            <View style={styles.logoContainer}>
              <Ionicons name="construct" size={48} color={COLORS.white} />
            </View>
            <Text style={styles.appName}>FixKar</Text>
            <Text style={[styles.tagline, isUrdu && styles.urduText]}>
              {isUrdu ? "آپ کی سروس، آپ کے دروازے پر" : "Your trusted service partner"}
            </Text>
          </LinearGradient>

          <View style={styles.formContainer}>
            <Text style={[styles.title, isUrdu && styles.urduText]}>
              {t("auth.login")}
            </Text>
            <Text style={[styles.subtitle, isUrdu && styles.urduText]}>
              {isUrdu ? "لاگ ان کرنے کے لیے اپنا فون نمبر اور پاس ورڈ درج کریں" : "Enter your phone number and password to login"}
            </Text>

            {/* Phone Number Input */}
            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCode}>
                <Text style={styles.flag}>🇵🇰</Text>
                <Text style={styles.countryCodeText}>{countryCode}</Text>
              </View>
              <TextInput
                style={[styles.phoneInput, isUrdu && styles.rtlInput]}
                placeholder="3XX XXX XXXX"
                placeholderTextColor={COLORS.textSecondary}
                value={phoneNumber}
                onChangeText={formatPhoneDisplay}
                keyboardType="phone-pad"
                maxLength={12}
              />
            </View>

            {/* Password Input */}
            <View style={styles.passwordContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={[styles.passwordInput, isUrdu && styles.rtlInput]}
                placeholder={t("auth.password")}
                placeholderTextColor={COLORS.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                (phoneNumber.replace(/\s/g, "").length < 10 || !password) &&
                  styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading || phoneNumber.replace(/\s/g, "").length < 10 || !password}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>{t("auth.login")}</Text>
                  <Ionicons
                    name={isUrdu ? "arrow-back" : "arrow-forward"}
                    size={20}
                    color={COLORS.white}
                  />
                </>
              )}
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={styles.forgotText}>{t("auth.forgotPassword")}</Text>
            </TouchableOpacity>

            {/* Signup Link */}
            <View style={[styles.signupContainer, isUrdu && { flexDirection: "row-reverse" }]}>
              <Text style={styles.signupText}>
                {t("auth.dontHaveAccount")}{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/complete-profile')}
              >
                <Text style={styles.signupLink}>{t("auth.signup")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 60,
    alignItems: "center",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginBottom: 8,
  },
  tagline: {
    fontSize: SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.white,
    opacity: 0.9,
  },
  urduText: {
    writingDirection: "rtl",
    textAlign: "right",
  },
  formContainer: {
    flex: 1,
    padding: 24,
    marginTop: -30,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 10,
  },
  subtitle: {
    fontSize: SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: "hidden",
    marginBottom: 16,
  },
  countryCode: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    gap: 6,
  },
  flag: {
    fontSize: 20,
  },
  countryCodeText: {
    fontSize: SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: SIZES.lg,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    letterSpacing: 1,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 18,
    fontSize: SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  rtlInput: {
    textAlign: "right",
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    fontSize: SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  forgotButton: {
    alignItems: "center",
    paddingVertical: 14,
  },
  forgotText: {
    fontSize: SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  signupContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  signupText: {
    fontSize: SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  signupLink: {
    fontSize: SIZES.base,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
});
