import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Image, Pressable, Animated } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { s, v, clamp } from "../../utils/ui";
import { MACHINES } from "../../data/machines";
import {
  setPreferredMachineId,
  getPreferredMachineId,
  clearPreferredMachineId,
} from "../../utils/storage";

function shadowCard() {
  return {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: s(12),
    shadowOffset: { width: 0, height: s(6) },
    elevation: 2,
  } as const;
}

function ActionTile({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        borderRadius: s(18),
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
        padding: s(14),
        ...shadowCard(),
        transform: [{ scale: pressed ? 0.99 : 1 }],
        opacity: pressed ? 0.97 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: "Nunito_700Bold",
          fontSize: clamp(s(15.5), 14, 17),
          color: "#0B0B0F",
        }}
        numberOfLines={1}
      >
        {title}
      </Text>

      <Text
        style={{
          marginTop: s(6),
          fontSize: clamp(s(13), 12, 14.5),
          lineHeight: clamp(s(18), 16, 20),
          color: "#6B7280",
        }}
        numberOfLines={2}
      >
        {subtitle}
      </Text>

      <Text
        style={{
          marginTop: s(10),
          fontSize: clamp(s(13), 12, 14.5),
          fontWeight: "800",
          color: "#111827",
        }}
      >
        Open →
      </Text>
    </Pressable>
  );
}

export default function MachineHub() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const machine = id ? MACHINES[id] : undefined;

  const [isPreferred, setIsPreferred] = useState(false);
  const [toastText, setToastText] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!machine) return;

    (async () => {
      const saved = await getPreferredMachineId();
      setIsPreferred(saved === machine.id);
    })();
  }, [machine?.id]);

  if (!machine) {
    return (
      <View
        style={{
          flex: 1,
          paddingTop: clamp(v(76), s(56), s(86)),
          paddingHorizontal: s(20),
          backgroundColor: "#F6F6F8",
        }}
      >
        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: clamp(s(18), 16, 20) }}>
          Machine not found
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: s(12) }}>
          <Text style={{ fontWeight: "800" }}>Go back →</Text>
        </Pressable>
      </View>
    );
  }

  const { dose, yield: targetYield, seconds } = machine.baseline;
function showToast(message: string) {
  setToastText(message);

  Animated.sequence([
    Animated.timing(toastOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }),
    Animated.delay(1400),
    Animated.timing(toastOpacity, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }),
  ]).start(() => setToastText(null));
}
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: s(20),
        paddingTop: clamp(v(24), s(20), s(28)),
        paddingBottom: s(40),
        backgroundColor: "#F6F6F8",

      }}
    >
      {/* Hero */}
      <View
        style={{
          borderRadius: s(22),
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.06)",
          backgroundColor: "white",
          ...shadowCard(),
        }}
      >
        <Image
          source={machine.image}
          style={{ width: "100%", height: clamp(v(240), 180, 300) }}
          resizeMode="cover"
        />

        <View style={{ padding: s(16) }}>
          <Text
            style={{
              fontFamily: "Nunito_700Bold",
              fontSize: clamp(s(24), 20, 28),
              lineHeight: clamp(s(28), 24, 32),
              color: "#0B0B0F",
            }}
          >
            {machine.name}
          </Text>

          <Text
            style={{
              marginTop: s(6),
              fontSize: clamp(s(14), 13, 15.5),
              lineHeight: clamp(s(20), 18, 22),
              color: "#6B7280",
            }}
            numberOfLines={2}
          >
            {machine.subtitle}
          </Text>

          {/* Baseline recipe */}
          <View
            style={{
              marginTop: s(14),
              borderRadius: s(16),
              padding: s(14),
              backgroundColor: "rgba(0,0,0,0.04)",
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.06)",
            }}
          >
            <Text style={{ fontFamily: "Nunito_700Bold", fontSize: clamp(s(14.5), 13.5, 16) }}>
              Baseline recipe
            </Text>

            <View style={{ flexDirection: "row", gap: s(10), marginTop: s(10) }}>
              <Stat label="Dose" value={`${dose}g`} />
              <Stat label="Yield" value={`${targetYield}g`} />
              <Stat label="Time" value={`${seconds}s`} />
            </View>

            <Text
              style={{
                marginTop: s(10),
                fontSize: clamp(s(13), 12, 14.5),
                lineHeight: clamp(s(18), 16, 20),
                color: "#6B7280",
              }}
            >
              Target 1:2 ratio. If fast → grind finer. If slow → grind coarser.
            </Text>
          </View>
        </View>
      </View>

      {/* Preferred toggle */}
    <Pressable
  onPress={async () => {
    if (isPreferred) {
      await clearPreferredMachineId();
      setIsPreferred(false);
      showToast("Removed from My Machine");
    } else {
      await setPreferredMachineId(machine.id);
      setIsPreferred(true);
      showToast("Saved as My Machine");
    }
  }}
  style={({ pressed }) => ({
    marginTop: s(12),
    paddingVertical: s(12),
    borderRadius: s(16),
    alignItems: "center",
    backgroundColor: pressed
      ? "rgba(0,0,0,0.08)"
      : isPreferred
      ? "rgba(16,185,129,0.14)"
      : "rgba(0,0,0,0.06)",
    borderWidth: 1,
    borderColor: isPreferred ? "rgba(16,185,129,0.20)" : "rgba(0,0,0,0.06)",
  })}
>
  <Text style={{ fontWeight: "800", color: isPreferred ? "#059669" : "#111827" }}>
    {isPreferred ? "✓ My machine (tap to remove)" : "⭐ Set as my machine"}
  </Text>
</Pressable>

      {/* Actions */}
      <Text
        style={{
          marginTop: s(18),
          marginBottom: s(10),
          fontFamily: "Nunito_700Bold",
          fontSize: clamp(s(18), 16, 20),
          color: "#0B0B0F",
        }}
      >
        Quick actions
      </Text>

      <View style={{ flexDirection: "row", gap: s(12) }}>
        <ActionTile
          title="Dial-in"
          subtitle="Adjust grind using time + taste"
          onPress={() => router.push(`/machine/${machine.id}/dial-in`)}
        />
        <ActionTile
          title="Guides"
          subtitle="First use + workflow videos"
          onPress={() => router.push(`/machine/${machine.id}/guides`)}
        />
      </View>

      <View style={{ flexDirection: "row", gap: s(12), marginTop: s(12) }}>
        <ActionTile
          title="Cleaning"
          subtitle="Daily / weekly / deep clean"
          onPress={() => router.push(`/machine/${machine.id}/cleaning`)}
        />
        <ActionTile
          title="AI Dial-In"
          subtitle="Camera analysis (coming soon)"
          onPress={() => router.push(`/machine/${machine.id}/ai`)}
        />
      </View>
      {toastText && (
  <Animated.View
    style={{
      position: "absolute",
      bottom: s(28),
      alignSelf: "center",
      backgroundColor: "#0B0B0F",
      paddingHorizontal: s(16),
      paddingVertical: s(10),
      borderRadius: 999,
      opacity: toastOpacity,
    }}
  >
    <Text
      style={{
        color: "white",
        fontWeight: "700",
        fontSize: clamp(s(13.5), 12.5, 15),
      }}
    >
      {toastText}
    </Text>
  </Animated.View>
)}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        borderRadius: s(14),
        paddingVertical: s(10),
        paddingHorizontal: s(12),
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
      }}
    >
      <Text style={{ fontSize: clamp(s(12), 11.5, 13), color: "#6B7280" }}>{label}</Text>
      <Text style={{ marginTop: s(4), fontFamily: "Nunito_700Bold", fontSize: clamp(s(16), 14.5, 18) }}>
        {value}
      </Text>
    </View>
  );
}