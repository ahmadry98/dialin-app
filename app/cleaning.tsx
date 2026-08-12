import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Image, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { s, v, clamp } from "../utils/ui";

type Tab = "daily" | "weekly" | "monthly";

function shadowCard() {
  return {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: s(12),
    shadowOffset: { width: 0, height: s(6) },
    elevation: 2,
  } as const;
}

function Segmented({
  value,
  onChange,
}: {
  value: Tab;
  onChange: (t: Tab) => void;
}) {
  const items: { key: Tab; label: string; icon: string }[] = [
    { key: "daily", label: "Daily", icon: "🧼" },
    { key: "weekly", label: "Weekly", icon: "🧽" },
    { key: "monthly", label: "Monthly", icon: "🧪" },
  ];

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "rgba(0,0,0,0.06)",
        borderRadius: 999,
        padding: s(4),
      }}
    >
      {items.map((it) => {
        const active = it.key === value;
        return (
          <Pressable
            key={it.key}
            onPress={() => onChange(it.key)}
            style={({ pressed }) => ({
              flex: 1,
              borderRadius: 999,
              paddingVertical: s(10),
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: s(6),
              backgroundColor: active ? "white" : "transparent",
              opacity: pressed ? 0.95 : 1,
            })}
          >
            <Text style={{ fontSize: clamp(s(16), 14, 18) }}>{it.icon}</Text>
            <Text
              style={{
                fontWeight: "800",
                fontSize: clamp(s(13), 12, 14.5),
                color: active ? "#0B0B0F" : "#6B7280",
              }}
            >
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ChecklistItem({ title, body }: { title: string; body: string }) {
  return (
    <View style={{ flexDirection: "row", gap: s(10) }}>
      <View
        style={{
          width: s(26),
          height: s(26),
          borderRadius: 999,
          backgroundColor: "rgba(16,185,129,0.14)",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: "rgba(16,185,129,0.20)",
        }}
      >
        <Text style={{ color: "#059669", fontWeight: "900" }}>✓</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: clamp(s(15), 14, 17), color: "#0B0B0F" }}>
          {title}
        </Text>
        <Text
          style={{
            marginTop: s(4),
            color: "#6B7280",
            fontSize: clamp(s(13.5), 12.5, 15),
            lineHeight: clamp(s(18), 16, 20),
          }}
        >
          {body}
        </Text>
      </View>
    </View>
  );
}

export default function Cleaning() {
  const [tab, setTab] = useState<Tab>("daily");

  const content = useMemo(() => {
    if (tab === "daily") {
      return {
        title: "Daily clean (2 minutes)",
        subtitle: "This keeps flavor clean and prevents rancid buildup.",
        items: [
          { title: "Flush + wipe", body: "Run water through the group head and wipe the gasket area." },
          { title: "Rinse portafilter + basket", body: "Hot water rinse, dry it. Oils are the enemy." },
          { title: "Purge steam wand", body: "Purge before + after. Wipe with a damp cloth immediately." },
        ],
        tip: "If you smell old coffee: clean more often than you think.",
      };
    }

    if (tab === "weekly") {
      return {
        title: "Weekly routine (10 minutes)",
        subtitle: "Keeps your shots consistent and prevents bitterness.",
        items: [
          { title: "Backflush (if supported)", body: "Use blind basket + water. If your machine supports detergent, follow manual." },
          { title: "Soak basket & screen", body: "Warm water soak. Light detergent only if recommended." },
          { title: "Brush the group", body: "Quick brush around gasket + shower screen to remove grounds." },
        ],
        tip: "Not all machines support detergent backflush. Check your model.",
      };
    }

    return {
      title: "Monthly deep clean (20–30 minutes)",
      subtitle: "Do this when shots start tasting dull or the machine smells.",
      items: [
        { title: "Descale (if needed)", body: "Follow your machine manual. Water hardness decides frequency." },
        { title: "Deep clean steam wand tip", body: "Remove tip (if possible), soak, and clear holes carefully." },
        { title: "Inspect gasket + screen", body: "If leaking or cracked, replacing the gasket is a game changer." },
      ],
      tip: "If your water is hard, descale more often (or use filtered water).",
    };
  }, [tab]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: s(20),
        paddingTop: clamp(v(20), s(16), s(26)),
        paddingBottom: s(40),
        backgroundColor: "#F6F6F8",
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: clamp(s(24), 20, 28), color: "#0B0B0F" }}>
          Cleaning Guide
        </Text>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            paddingVertical: s(10),
            paddingHorizontal: s(12),
            borderRadius: s(14),
            backgroundColor: pressed ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.06)",
          })}
        >
          <Ionicons name="arrow-back" size={22} color="#0B0B0F" />
        </Pressable>
      </View>

      {/* Hero */}
      <View
        style={{
          marginTop: s(12),
          borderRadius: s(22),
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.06)",
          backgroundColor: "white",
          ...shadowCard(),
        }}
      >
        <Image
          source={require("../assets/images/home/cleaning-guide.jpg")}
          style={{ width: "100%", height: clamp(v(220), 170, 270) }}
          resizeMode="cover"
        />
        <View style={{ padding: s(14) }}>
          <Text style={{ color: "#6B7280", fontWeight: "800", fontSize: clamp(s(12), 11, 13) }}>
            CLEAN MACHINE = CLEAN TASTE
          </Text>

          <Text
            style={{
              marginTop: s(8),
              fontFamily: "Nunito_700Bold",
              fontSize: clamp(s(20), 18, 24),
              color: "#0B0B0F",
            }}
          >
            Most “bad shots” are actually dirty gear.
          </Text>

          <Text
            style={{
              marginTop: s(8),
              color: "#6B7280",
              fontSize: clamp(s(13.5), 12.5, 15.5),
              lineHeight: clamp(s(18), 16, 21),
            }}
            numberOfLines={3}
          >
            Oils go rancid fast. A simple routine keeps consistency and improves taste.
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View
        style={{
          marginTop: s(12),
          borderRadius: s(22),
          padding: s(14),
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.06)",
          ...shadowCard(),
        }}
      >
        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: clamp(s(16), 14.5, 18), color: "#0B0B0F" }}>
          Pick a routine
        </Text>
        <Text style={{ marginTop: s(6), color: "#6B7280", fontSize: clamp(s(13), 12, 14.5) }}>
          Daily for taste, weekly for stability, monthly for longevity.
        </Text>

        <View style={{ marginTop: s(12) }}>
          <Segmented value={tab} onChange={setTab} />
        </View>
      </View>

      {/* Checklist */}
      <Text
        style={{
          marginTop: s(16),
          fontFamily: "Nunito_700Bold",
          fontSize: clamp(s(18), 16, 20),
          color: "#0B0B0F",
        }}
      >
        {content.title}
      </Text>

      <Text
        style={{
          marginTop: s(6),
          color: "#6B7280",
          fontSize: clamp(s(13.5), 12.5, 15.5),
          lineHeight: clamp(s(18), 16, 21),
        }}
      >
        {content.subtitle}
      </Text>

      <View
        style={{
          marginTop: s(12),
          borderRadius: s(22),
          padding: s(14),
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.06)",
          ...shadowCard(),
          gap: s(14),
        }}
      >
        {content.items.map((it) => (
          <ChecklistItem key={it.title} title={it.title} body={it.body} />
        ))}
      </View>

      {/* Tip */}
      <View
        style={{
          marginTop: s(12),
          borderRadius: s(22),
          padding: s(14),
          backgroundColor: "rgba(16,185,129,0.14)",
          borderWidth: 1,
          borderColor: "rgba(16,185,129,0.20)",
        }}
      >
        <Text style={{ fontFamily: "Nunito_700Bold", color: "#059669", fontSize: clamp(s(14.5), 13.5, 16) }}>
          Pro tip
        </Text>
        <Text
          style={{
            marginTop: s(6),
            color: "#065F46",
            fontSize: clamp(s(13.5), 12.5, 15),
            lineHeight: clamp(s(18), 16, 20),
          }}
        >
          {content.tip}
        </Text>
      </View>

      {/* Footer CTA */}
      <Pressable
        onPress={() => router.push("/select-machine")}
        style={({ pressed }) => ({
          marginTop: s(16),
          paddingVertical: s(12),
          borderRadius: s(16),
          alignItems: "center",
          backgroundColor: pressed ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.06)",
        })}
      >
        <Text style={{ fontWeight: "800", color: "#111827" }}>Back to machines →</Text>
      </Pressable>
    </ScrollView>
  );
}