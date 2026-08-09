import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Image, Pressable, Animated } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { s, v, clamp } from "../../utils/ui";
import { fetchMachine, type Machine } from "../../lib/api";
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
  icon,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
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
        borderColor: "rgba(0,0,0,0.05)",
        padding: s(14),
        ...shadowCard(),
        transform: [{ scale: pressed ? 0.985 : 1 }],
        opacity: pressed ? 0.97 : 1,
      })}
    >
      <View
        style={{
          width: s(38),
          height: s(38),
          borderRadius: 999,
          backgroundColor: "rgba(0,0,0,0.05)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={18} color="#111827" />
      </View>

      <Text
        style={{
          marginTop: s(12),
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
          marginTop: s(5),
          fontSize: clamp(s(12.8), 12, 14),
          lineHeight: clamp(s(17), 15, 19),
          color: "#6B7280",
        }}
        numberOfLines={2}
      >
        {subtitle}
      </Text>
    </Pressable>
  );
}

function InfoPill({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
}) {
  return (
    <View
      style={{
        width: "48%",
        minHeight: s(42),
        flexDirection: "row",
        alignItems: "center",
        gap: s(8),
        paddingVertical: s(9),
        paddingHorizontal: s(11),
        borderRadius: s(14),
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
      }}
    >
      <Ionicons name={icon} size={15} color="#111827" />
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.82}
        style={{
          flex: 1,
          fontSize: clamp(s(12.5), 11.5, 13.5),
          fontWeight: "800",
          color: "#374151",
        }}
      >
        {label}
      </Text>
    </View>
  );
}


function MachineHeroImage({ uri, height }: { uri: string | null; height: number }) {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) return <MachineImagePlaceholder height={height} />;
  return (
    <Image
      source={{ uri }}
      style={{ width: "100%", height, backgroundColor: "#F4F2EE" }}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

function MachineImagePlaceholder({ height }: { height: number }) {
  return (
    <View
      style={{
        width: "100%",
        height,
        backgroundColor: "#F0F1F4",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: s(64),
          height: s(64),
          borderRadius: 999,
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "#E1E4EA",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="cafe-outline" size={30} color="#6B7280" />
      </View>
      <Text style={{ marginTop: s(10), color: "#6B7280", fontWeight: "800" }}>Image coming soon</Text>
    </View>
  );
}

export default function MachineHub() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPreferred, setIsPreferred] = useState(false);
  const [toastText, setToastText] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const data = await fetchMachine(slug);
        setMachine(data);

        const saved = await getPreferredMachineId();
        setIsPreferred(saved === data.slug);
      } catch (error) {
        console.log("Failed to load machine:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

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

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F6F6F8",
        }}
      >
        <Text
          style={{
            fontFamily: "Nunito_700Bold",
            fontSize: clamp(s(16), 15, 18),
            color: "#0B0B0F",
          }}
        >
          Loading machine...
        </Text>
      </View>
    );
  }

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
        <Text
          style={{
            fontFamily: "Nunito_700Bold",
            fontSize: clamp(s(18), 16, 20),
            color: "#0B0B0F",
          }}
        >
          Machine not found
        </Text>

        <Pressable onPress={() => router.back()} style={{ marginTop: s(12) }}>
          <Text style={{ fontWeight: "800", color: "#111827" }}>Go back →</Text>
        </Pressable>
      </View>
    );
  }

  const pillData = [
    machine.machine_type ? { icon: "cafe-outline" as const, label: machine.machine_type } : null,
    machine.portafilter_mm ? { icon: "filter-outline" as const, label: `${machine.portafilter_mm}mm` } : null,
    machine.boiler_type ? { icon: "flame-outline" as const, label: machine.boiler_type } : null,
    machine.grinder_recommendation ? { icon: "options-outline" as const, label: machine.grinder_recommendation } : null,
  ].filter(Boolean) as { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string }[];

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
      <View
        style={{
          borderRadius: s(22),
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.05)",
          backgroundColor: "white",
          ...shadowCard(),
        }}
      >
        <MachineHeroImage uri={machine.image} height={s(190)} />

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

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              columnGap: s(10),
              rowGap: s(10),
              marginTop: s(14),
            }}
          >
            {pillData.map((item) => (
              <InfoPill key={item.label} icon={item.icon} label={item.label} />
            ))}
          </View>
        </View>
      </View>

      {!!machine.description && (
        <View
          style={{
            marginTop: s(14),
            borderRadius: s(18),
            padding: s(14),
            backgroundColor: "white",
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.05)",
            ...shadowCard(),
          }}
        >
          <Text
            style={{
              fontSize: clamp(s(13.5), 12.5, 15),
              lineHeight: clamp(s(19), 17, 21),
              color: "#4B5563",
            }}
            numberOfLines={3}
          >
            {machine.description}
          </Text>
        </View>
      )}

      <Pressable
        onPress={async () => {
          if (isPreferred) {
            await clearPreferredMachineId();
            setIsPreferred(false);
            showToast("Removed from My Machine");
          } else {
            await setPreferredMachineId(machine.slug);
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
          {isPreferred ? "✓ My machine" : "⭐ Set as my machine"}
        </Text>
      </Pressable>
      <Text
        style={{
          marginTop: s(20),
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
          subtitle="Adjust shot time and taste"
          icon="speedometer-outline"
          onPress={() => router.push(`/machine/${machine.slug}/dial-in`)}
        />
        <ActionTile
          title="Guides"
          subtitle="Recipe, setup, and first use"
          icon="book-outline"
          onPress={() => router.push(`/machine/${machine.slug}/guides`)}
        />
      </View>

      <View style={{ flexDirection: "row", gap: s(12), marginTop: s(12) }}>
        <ActionTile
          title="Cleaning"
          subtitle="Daily and deep clean steps"
          icon="water-outline"
          onPress={() => router.push(`/machine/${machine.slug}/cleaning`)}
        />
        <ActionTile
          title="AI Dial-In"
          subtitle="Open shot analysis"
          icon="scan-outline"
          onPress={() => router.push(`/machine/${machine.slug}/ai`)}
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