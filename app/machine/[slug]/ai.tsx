import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import AIShotChat, { type AIShotChatHandle } from "../../../components/AIShotChat";
import { fetchMachine, type Machine } from "../../../lib/api";
import { getPreferredGrinder } from "../../../utils/storage";
import { clamp, s } from "../../../utils/ui";

export default function AIShotAnalysis() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [grinderName, setGrinderName] = useState<string | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const chatRef = useRef<AIShotChatHandle>(null);

  useEffect(() => {
    (async () => {
      try {
        const [machineProfile, grinder] = await Promise.all([
          slug ? fetchMachine(slug) : Promise.resolve(null),
          getPreferredGrinder(),
        ]);
        setMachine(machineProfile);
        setGrinderName(grinder?.name ?? null);
      } catch (error) {
        console.log("Failed to load selected AI machine:", error);
      } finally {
        setLoadingContext(false);
      }
    })();
  }, [slug]);

  return (
    <View style={{ flex: 1, backgroundColor: "#F7F7F8" }}>
      <View
        style={{
          paddingHorizontal: s(18),
          paddingTop: s(18),
          paddingBottom: s(12),
          borderBottomWidth: 1,
          borderBottomColor: "#E6E8EE",
          backgroundColor: "#F7F7F8",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: s(12) }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "Nunito_700Bold", color: "#111827", fontSize: clamp(s(24), 21, 28) }}>AI Shot Analysis</Text>
            <Text numberOfLines={1} style={{ marginTop: s(3), color: "#6B7280", fontSize: clamp(s(13), 12, 15) }}>
              {loadingContext ? "Loading selected setup" : machine?.name || "DialChat espresso coach"}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: s(8) }}>
            <Pressable
              onPress={() => chatRef.current?.reset()}
              accessibilityLabel="Start new shot"
              style={({ pressed }) => ({
                width: s(42),
                height: s(42),
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: pressed ? "#E9EAEE" : "white",
                borderWidth: 1,
                borderColor: "#E1E4EA",
              })}
            >
              <Ionicons name="refresh" size={20} color="#111827" />
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              accessibilityLabel="Go back"
              style={({ pressed }) => ({
                width: s(42),
                height: s(42),
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: pressed ? "#E9EAEE" : "white",
                borderWidth: 1,
                borderColor: "#E1E4EA",
              })}
            >
              <Ionicons name="arrow-back" size={22} color="#111827" />
            </Pressable>
          </View>
        </View>
      </View>

      {loadingContext ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
        </View>
      ) : (
        <AIShotChat ref={chatRef} machineName={machine?.name ?? null} grinderName={grinderName} usesBuiltInGrinder={machine?.has_built_in_grinder ?? false} chatSessionKey={`machine:${slug || "unknown"}`} />
      )}
    </View>
  );
}
