import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";

import { fetchAccountStatus } from "../lib/accountApi";
import { captureException } from "../lib/observability";
import { loadProPackage, purchasePro, restorePro, SubscriptionLoadError, type ProPurchaseOption } from "../lib/subscriptions";
import { clamp, s } from "../utils/ui";

const PRIVACY_URL = "https://dialedin.me/privacy";
const TERMS_URL = "https://dialedin.me/terms";

export default function UpgradeScreen() {
  const [offer, setOffer] = useState<ProPurchaseOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<{ message: string; code: string } | null>(null);

  const loadOffer = useCallback(async () => {
    setLoading(true);
    setOffer(null);
    setError(null);
    try {
      const account = await fetchAccountStatus();
      setOffer(await loadProPackage(account.user_id));
    } catch (value) {
      captureException(value, { feature: "upgrade", action: "load_offer" });
      if (value instanceof SubscriptionLoadError) {
        setError({ message: value.message, code: value.code });
      } else {
        setError({ message: "Your DialedIn account could not be loaded. Sign in again and retry.", code: "A1" });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOffer();
  }, [loadOffer]);

  const buy = async () => {
    if (!offer) return;
    setBuying(true);
    try {
      if (await purchasePro(offer)) {
        Alert.alert("Welcome to Pro", "Your subscription is active.", [{ text: "Continue", onPress: () => router.replace("/account" as never) }]);
      }
    } catch (value) {
      const message = value instanceof Error ? value.message : "The purchase could not be completed.";
      if (!message.toLowerCase().includes("cancel")) Alert.alert("Purchase not completed", message);
    } finally {
      setBuying(false);
    }
  };

  const restore = async () => {
    setBuying(true);
    try {
      const active = await restorePro();
      Alert.alert(active ? "Pro restored" : "No subscription found", active ? "Your Pro access is active." : "We could not find an active Pro purchase.");
      if (active) router.replace("/account" as never);
    } catch (value) {
      Alert.alert("Could not restore", value instanceof Error ? value.message : "Try again shortly.");
    } finally {
      setBuying(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: "#F6F6F8", padding: s(22) }}>
      <Pressable onPress={() => router.back()} accessibilityLabel="Close" style={{ alignSelf: "flex-end", width: s(42), height: s(42), borderRadius: 21, backgroundColor: "white", alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="close" size={22} color="#111827" />
      </Pressable>

      <View style={{ marginTop: s(30), width: "100%", maxWidth: 440, alignSelf: "center" }}>
        <Ionicons name="sparkles" size={30} color="#111827" />
        <Text style={{ marginTop: s(14), fontFamily: "Nunito_700Bold", fontSize: clamp(s(32), 28, 36), color: "#111827" }}>DialedIn Pro</Text>
        <Text style={{ marginTop: s(8), color: "#4B5563", fontSize: 16, lineHeight: 23 }}>Keep dialing in without the free monthly limit.</Text>

        <View style={{ marginTop: s(26), gap: s(16) }}>
          <Benefit icon="analytics-outline" text="Up to 20 shot analyses each month" />
          <Benefit icon="time-outline" text="Keep your shot history and recommendations together" />
          <Benefit icon="refresh-outline" text="Restore access on any device using your account" />
        </View>

        <View style={{ marginTop: s(30), borderTopWidth: 1, borderColor: "#D1D5DB", paddingTop: s(22) }}>
          {loading ? <ActivityIndicator /> : (
            <>
              {offer ? <Text style={{ textAlign: "center", fontFamily: "Nunito_700Bold", fontSize: 22, color: "#111827" }}>{offer.priceString} <Text style={{ fontSize: 15, color: "#6B7280" }}>/ year</Text></Text> : null}
              {error ? (
                <View style={{ marginTop: s(10), alignItems: "center" }}>
                  <Text style={{ textAlign: "center", color: "#B42318" }}>{error.message} ({error.code})</Text>
                  <Pressable onPress={() => void loadOffer()} style={{ marginTop: s(10), paddingHorizontal: s(16), paddingVertical: s(9), borderWidth: 1, borderColor: "#D1D5DB", borderRadius: s(8), backgroundColor: "white" }}>
                    <Text style={{ color: "#111827", fontWeight: "800" }}>Try again</Text>
                  </Pressable>
                </View>
              ) : null}
              <Pressable disabled={!offer || buying} onPress={buy} style={{ marginTop: s(20), height: s(54), borderRadius: s(8), backgroundColor: "#0B0B0F", alignItems: "center", justifyContent: "center", opacity: !offer || buying ? 0.5 : 1 }}>
                {buying ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontFamily: "Nunito_700Bold", fontSize: 16 }}>Start Pro</Text>}
              </Pressable>
              <Pressable disabled={buying} onPress={restore} style={{ paddingVertical: s(18), alignItems: "center" }}><Text style={{ color: "#374151", fontWeight: "800" }}>Restore purchases</Text></Pressable>
              <Text style={{ color: "#6B7280", fontSize: 12, lineHeight: 17, textAlign: "center" }}>Payment is charged to your App Store account. The subscription renews annually unless canceled in your App Store settings.</Text>
              <View style={{ marginTop: s(14), flexDirection: "row", justifyContent: "center", gap: s(22) }}>
                <Pressable onPress={() => Linking.openURL(TERMS_URL)} accessibilityRole="link"><Text style={{ color: "#374151", fontSize: 13, fontWeight: "700", textDecorationLine: "underline" }}>Terms of Use</Text></Pressable>
                <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} accessibilityRole="link"><Text style={{ color: "#374151", fontSize: 13, fontWeight: "700", textDecorationLine: "underline" }}>Privacy Policy</Text></Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function Benefit({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>["name"]; text: string }) {
  return <View style={{ flexDirection: "row", alignItems: "center", gap: s(12) }}><View style={{ width: s(38), height: s(38), borderRadius: 19, backgroundColor: "white", alignItems: "center", justifyContent: "center" }}><Ionicons name={icon} size={20} color="#111827" /></View><Text style={{ flex: 1, color: "#111827", fontSize: 16, fontWeight: "700" }}>{text}</Text></View>;
}
