import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

import { deleteAccountData, fetchAccountStatus, type AccountStatus } from "../lib/accountApi";
import { AUTH_ENABLED, useAuth } from "../lib/auth";
import { restorePro } from "../lib/subscriptions";
import { clamp, s } from "../utils/ui";

export default function AccountScreen() {
  const auth = useAuth();
  const [account, setAccount] = useState<AccountStatus | null>(null);
  const [error, setError] = useState("");
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (AUTH_ENABLED && !auth.loading && !auth.session) {
      router.replace({ pathname: "/auth", params: { returnTo: "/account" } } as never);
      return;
    }
    if (auth.session) {
      fetchAccountStatus().then(setAccount).catch((value) => setError(value instanceof Error ? value.message : "Could not load account."));
    }
  }, [auth.loading, auth.session]);

  if (auth.loading || (AUTH_ENABLED && !auth.session) || (auth.session && !account && !error)) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F6F6F8" }}><ActivityIndicator /></View>;
  }

  const usage = account?.usage;
  const restorePurchases = async () => {
    if (!account) return;
    setRestoring(true);
    try {
      const active = await restorePro(account.user_id);
      Alert.alert(
        active ? "Pro restored" : "No subscription found",
        active ? "Your Pro subscription is active." : "No active Pro purchase was found for this App Store account.",
      );
      if (active) {
        const refreshed = await fetchAccountStatus();
        setAccount(refreshed);
      }
    } catch (value) {
      Alert.alert("Could not restore", value instanceof Error ? value.message : "Please try again.");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F6F6F8", padding: s(22) }}>
      <Text style={{ marginTop: s(20), fontFamily: "Nunito_700Bold", fontSize: clamp(s(30), 26, 34), color: "#111827" }}>Account</Text>
      <Text style={{ marginTop: s(5), color: "#6B7280" }}>{account?.email || auth.email || "DialedIn member"}</Text>

      <View style={{ marginTop: s(26), backgroundColor: "white", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: s(8), padding: s(18) }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 18, color: "#111827" }}>{account?.tier === "pro" ? "DialedIn Pro" : "Free plan"}</Text>
          <Ionicons name={account?.tier === "pro" ? "sparkles" : "person-outline"} size={22} color="#111827" />
        </View>
        {usage ? <Text style={{ marginTop: s(12), color: "#4B5563", fontSize: 15 }}>{usage.remaining} of {usage.limit} analyses remaining this month</Text> : null}
        <View style={{ marginTop: s(12), height: 7, borderRadius: 4, backgroundColor: "#E5E7EB", overflow: "hidden" }}>
          <View style={{ width: usage ? `${Math.max(0, Math.min(100, (usage.remaining / usage.limit) * 100))}%` : "0%", height: "100%", backgroundColor: "#111827" }} />
        </View>
      </View>

      {account?.tier !== "pro" ? (
        <Pressable onPress={() => router.push("/upgrade" as never)} style={{ marginTop: s(16), height: s(52), borderRadius: s(8), backgroundColor: "#0B0B0F", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "white", fontFamily: "Nunito_700Bold", fontSize: 16 }}>Explore Pro</Text>
        </Pressable>
      ) : null}

      {error ? <Text style={{ marginTop: s(16), color: "#B42318" }}>{error}</Text> : null}

      <Pressable
        disabled={restoring || !account}
        onPress={restorePurchases}
        style={{ marginTop: s(18), height: s(48), borderWidth: 1, borderColor: "#D1D5DB", borderRadius: s(8), alignItems: "center", justifyContent: "center", opacity: restoring ? 0.65 : 1 }}
      >
        {restoring ? <ActivityIndicator /> : <Text style={{ color: "#111827", fontWeight: "800" }}>Restore purchases</Text>}
      </Pressable>

      <Pressable onPress={async () => { await auth.signOut(); router.replace("/" as never); }} style={{ marginTop: s(12), height: s(48), borderWidth: 1, borderColor: "#D1D5DB", borderRadius: s(8), alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#111827", fontWeight: "800" }}>Sign out</Text>
      </Pressable>

      <Pressable
        onPress={() => Alert.alert(
          "Delete account?",
          "Your profile, shot history, uploaded media, and subscription record will be permanently deleted. Manage or cancel an active subscription in the App Store first.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: async () => {
                try {
                  await deleteAccountData();
                  await auth.deleteUser();
                  router.replace("/" as never);
                } catch (value) {
                  Alert.alert("Account not deleted", value instanceof Error ? value.message : "Please try again.");
                }
              },
            },
          ],
        )}
        style={{ marginTop: s(14), height: s(46), alignItems: "center", justifyContent: "center" }}
      >
        <Text style={{ color: "#B42318", fontWeight: "800" }}>Delete account</Text>
      </Pressable>
    </View>
  );
}
