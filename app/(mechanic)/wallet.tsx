import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";
import { getMechanic, getTransactions } from "@/services/firebase/firestore";
import { initiateJazzCashPayment } from "@/services/payments/jazzcashService";
import { initiateEasypaisaPayment } from "@/services/payments/easypaisaService";
import { COLORS, SIZES, DIAMOND_PACKAGES } from "@/constants/theme";
import { Mechanic, Transaction } from "@/types";
import {
  useModal,
  showErrorModal,
  showSuccessModal,
  showConfirmModal,
} from "@/utils/modalService";

export default function WalletScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { showModal } = useModal();
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const mechanicData = await getMechanic(user.id);
    setMechanic(mechanicData);

    const txns = await getTransactions(user.id);
    setTransactions(txns);
  };

  const handlePurchase = (paymentMethod: "jazzcash" | "easypaisa") => {
    if (!selectedPackage || !user) {
      showErrorModal(showModal, "Error", "Please select a package");
      return;
    }

    showConfirmModal(
      showModal,
      `Purchase with ${
        paymentMethod === "jazzcash" ? "JazzCash" : "EasyPaisa"
      }`,
      `You will be charged PKR ${selectedPackage.price} for ${selectedPackage.diamonds} diamonds`,
      async () => {
        setLoading(true);
        try {
          if (paymentMethod === "jazzcash") {
            // Navigate to JazzCash WebView payment screen
            router.push({
              pathname: "/(mechanic)/jazzcash-payment",
              params: {
                amount: selectedPackage.price.toString(),
                mechanicId: user.id,
                diamonds: selectedPackage.diamonds.toString(),
              },
            });
          } else {
            const paymentData = {
              amount: selectedPackage.price,
              mechanicId: user.id,
              diamonds: selectedPackage.diamonds,
            };
            await initiateEasypaisaPayment(paymentData);
            showSuccessModal(
              showModal,
              "Success",
              "Payment initiated. You will be redirected to the payment gateway."
            );
          }
        } catch (error: any) {
          showErrorModal(showModal, "Error", error.message);
        } finally {
          setLoading(false);
        }
      },
      undefined,
      "Continue",
      "Cancel"
    );
  };

  if (!mechanic) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(mechanic)/dashboard")}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Balance Card */}
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <View style={styles.balanceRow}>
            <Ionicons name="diamond" size={32} color={COLORS.primary} />
            <Text style={styles.balanceValue}>{mechanic.diamondBalance}</Text>
            <Text style={styles.balanceUnit}>Diamonds</Text>
          </View>
          <Text style={styles.balanceNote}>
            1 diamond = 1 proposal submission
          </Text>
        </Card>

        {/* Diamond Packages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buy Diamonds</Text>
          <View style={styles.packagesGrid}>
            {DIAMOND_PACKAGES.map((pkg) => {
              const isSelected = selectedPackage?.id === pkg.id;

              return (
                <TouchableOpacity
                  key={pkg.id}
                  style={[
                    styles.packageCard,
                    isSelected && styles.packageCardSelected,
                    pkg.popular && styles.packageCardPopular,
                  ]}
                  onPress={() => setSelectedPackage(pkg)}
                >
                  {pkg.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>POPULAR</Text>
                    </View>
                  )}
                  <Ionicons
                    name="diamond"
                    size={40}
                    color={isSelected ? COLORS.primary : COLORS.textSecondary}
                  />
                  <Text style={styles.packageDiamonds}>{pkg.diamonds}</Text>
                  <Text style={styles.packageLabel}>Diamonds</Text>
                  <Text style={styles.packagePrice}>PKR {pkg.price}</Text>
                  {pkg.discount && (
                    <Text style={styles.packageDiscount}>
                      Save {pkg.discount}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Payment Methods */}
        {selectedPackage && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Payment Method</Text>
            <Button
              title="Pay with JazzCash"
              onPress={() => handlePurchase("jazzcash")}
              loading={loading}
              icon={
                <Ionicons name="card-outline" size={20} color={COLORS.white} />
              }
              style={styles.paymentButton}
            />
            <Button
              title="EasyPaisa (Coming Soon)"
              onPress={() =>
                showErrorModal(
                  showModal,
                  "Coming Soon",
                  "EasyPaisa payment will be available soon!"
                )
              }
              loading={false}
              variant="secondary"
              disabled={true}
              icon={
                <Ionicons name="card-outline" size={20} color={COLORS.white} />
              }
            />
          </View>
        )}

        {/* Transaction History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet</Text>
          ) : (
            transactions.slice(0, 5).map((transaction) => (
              <Card key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionIcon}>
                  <Ionicons
                    name={
                      transaction.type === "purchase"
                        ? "add-circle"
                        : transaction.type === "refund"
                        ? "arrow-undo"
                        : "remove-circle"
                    }
                    size={24}
                    color={
                      transaction.type === "purchase" ||
                      transaction.type === "refund"
                        ? COLORS.success
                        : COLORS.danger
                    }
                  />
                </View>
                <View style={styles.transactionContent}>
                  <Text style={styles.transactionTitle}>
                    {transaction.type.charAt(0).toUpperCase() +
                      transaction.type.slice(1)}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {transaction.createdAt.toLocaleDateString()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    {
                      color:
                        transaction.type === "purchase" ||
                        transaction.type === "refund"
                          ? COLORS.success
                          : COLORS.danger,
                    },
                  ]}
                >
                  {transaction.type === "deduction" ? "-" : "+"}
                  {transaction.amount}
                </Text>
              </Card>
            ))
          )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SIZES.padding,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  scrollContent: {
    padding: SIZES.padding,
  },
  balanceCard: {
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 24,
    backgroundColor: COLORS.primary + "10",
  },
  balanceLabel: {
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  balanceValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: COLORS.text,
  },
  balanceUnit: {
    fontSize: SIZES.lg,
    color: COLORS.textSecondary,
  },
  balanceNote: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 16,
  },
  packagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  packageCard: {
    width: "48%",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
    position: "relative",
  },
  packageCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "10",
  },
  packageCardPopular: {
    borderColor: COLORS.secondary,
  },
  popularBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  popularText: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.white,
  },
  packageDiamonds: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 8,
  },
  packageLabel: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
  },
  packagePrice: {
    fontSize: SIZES.lg,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 8,
  },
  packageDiscount: {
    fontSize: SIZES.xs,
    color: COLORS.success,
    marginTop: 4,
  },
  paymentButton: {
    marginBottom: 12,
  },
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    padding: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: SIZES.base,
    fontWeight: "600",
    color: COLORS.text,
  },
  transactionDate: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: SIZES.lg,
    fontWeight: "bold",
  },
  emptyText: {
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingVertical: 20,
  },
});
