import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Image, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { s, v, clamp } from "../utils/ui";

type Tab = "start" | "fix" | "taste";

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
  const items: Array<{ key: Tab; label: string; icon: string }> = [
    { key: "start", label: "Start", icon: "🚀" },
    { key: "fix", label: "Fix", icon: "🛠️" },
    { key: "taste", label: "Taste", icon: "👅" },
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

function MiniChip({ text }: { text: string }) {
  return (
    <View
      style={{
        paddingVertical: s(6),
        paddingHorizontal: s(10),
        borderRadius: 999,
        backgroundColor: "rgba(0,0,0,0.06)",
      }}
    >
      <Text style={{ fontWeight: "800", color: "#374151", fontSize: clamp(s(12.5), 12, 14) }}>
        {text}
      </Text>
    </View>
  );
}

function StepCard({
  title,
  body,
  badge,
}: {
  title: string;
  body: string;
  badge: string;
}) {
  return (
    <View
      style={{
        borderRadius: s(20),
        padding: s(14),
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
        ...shadowCard(),
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: clamp(s(16), 14.5, 18), color: "#0B0B0F" }}>
          {title}
        </Text>
        <MiniChip text={badge} />
      </View>
      <Text
        style={{
          marginTop: s(8),
          color: "#6B7280",
          fontSize: clamp(s(13.5), 12.5, 15),
          lineHeight: clamp(s(18), 16, 20),
        }}
      >
        {body}
      </Text>
    </View>
  );
}

export default function Brewing() {
  const [tab, setTab] = useState<Tab>("start");

  const content = useMemo(() => {
    if (tab === "start") {
      return {
        title: "A simple workflow that works",
        subtitle: "Use this as your baseline, then adjust one thing at a time.",
        chips: ["1:2 ratio", "25–30s", "Start with medium roast"],
        cards: [
          {
            badge: "Prep",
            title: "Puck prep",
            body: "Grind fresh → distribute evenly → tamp level. Your goal is repeatability, not perfection.",
          },
          {
            badge: "Pull",
            title: "Pull the shot",
            body: "Time from pump on. If it blondes very early or gushes, go finer. If it drips slowly, go coarser.",
          },
          {
            badge: "Adjust",
            title: "Adjust one thing",
            body: "Change grind first. Keep dose and ratio stable until time is in range.",
          },
        ],
      };
    }

    if (tab === "fix") {
      return {
        title: "Fix issues fast",
        subtitle: "Diagnose by shot time first, then confirm by taste.",
        chips: ["Too fast → finer", "Too slow → coarser", "One change"],
        cards: [
          {
            badge: "FAST",
            title: "Shot is too fast (< 25s)",
            body: "Grind finer. If you’re already near the finest, increase dose slightly (0.5–1g) or improve puck prep.",
          },
          {
            badge: "SLOW",
            title: "Shot is too slow (> 30s)",
            body: "Grind coarser. If still slow, check for over-tamping (don’t) and channel-blocking clumps.",
          },
          {
            badge: "WEIRD",
            title: "Channeling / spraying",
            body: "This is prep. WDT if you have it, distribute, tamp level. A good tamp is consistent, not stronger.",
          },
        ],
      };
    }

    return {
      title: "Taste-based tuning",
      subtitle: "When time is good, taste becomes the final boss.",
      chips: ["Sour → slower", "Bitter → faster", "Thin → finer"],
      cards: [
        {
          badge: "SOUR",
          title: "Sour / sharp",
          body: "Usually under-extracted. Slightly finer OR increase contact time (target the upper end of your range).",
        },
        {
          badge: "BITTER",
          title: "Bitter / harsh",
          body: "Usually over-extracted. Slightly coarser OR shorten time (lower end of your range).",
        },
        {
          badge: "BODY",
          title: "Thin / watery",
          body: "Try a little finer grind, or increase dose slightly. Keep ratio stable while you test.",
        },
      ],
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
          Brewing Guide
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
          source={require("../assets/images/home/brewing-guide.jpg")}
          style={{ width: "100%", height: clamp(v(220), 170, 270) }}
          resizeMode="cover"
        />
        <View style={{ padding: s(14) }}>
          <Text style={{ color: "#6B7280", fontWeight: "800", fontSize: clamp(s(12), 11, 13) }}>
            SIMPLE • REPEATABLE • FAST
          </Text>

          <Text
            style={{
              marginTop: s(8),
              fontFamily: "Nunito_700Bold",
              fontSize: clamp(s(20), 18, 24),
              color: "#0B0B0F",
            }}
          >
            Better espresso comes from a better process.
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
            Use time to find the grind range, then use taste to refine. Don’t chase 10 variables at once.
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
          Choose a mode
        </Text>
        <Text style={{ marginTop: s(6), color: "#6B7280", fontSize: clamp(s(13), 12, 14.5) }}>
          Start from baseline → fix timing → finish with taste.
        </Text>

        <View style={{ marginTop: s(12) }}>
          <Segmented value={tab} onChange={setTab} />
        </View>
      </View>

      {/* Content */}
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

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: s(8), marginTop: s(12) }}>
        {content.chips.map((c) => (
          <MiniChip key={c} text={c} />
        ))}
      </View>

      <View style={{ marginTop: s(12), gap: s(12) }}>
        {content.cards.map((c) => (
          <StepCard key={c.title} badge={c.badge} title={c.title} body={c.body} />
        ))}
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
        <Text style={{ fontWeight: "800", color: "#111827" }}>Pick a machine →</Text>
      </Pressable>
    </ScrollView>
  );
}