import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { s, v, clamp } from "../../../utils/ui";
import {
  getLastRoast,
  setLastRoast,
  setPreferredMachineId,
  Roast as StoredRoast,
} from "../../../utils/storage";
import { fetchMachine, type Machine } from "../../../lib/api";

type Verdict = "FAST" | "SLOW" | "OK" | "EMPTY";
type Roast = StoredRoast;

function shadowCard() {
  return {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: s(12),
    shadowOffset: { width: 0, height: s(6) },
    elevation: 2,
  } as const;
}

function parseNum(x: string): number | null {
  const t = x.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function Badge({ verdict }: { verdict: Verdict }) {
  const { bg, fg, text } = useMemo(() => {
    if (verdict === "FAST") {
      return { bg: "rgba(255,59,48,0.10)", fg: "#B42318", text: "FAST" };
    }
    if (verdict === "SLOW") {
      return { bg: "rgba(255,149,0,0.12)", fg: "#9A3412", text: "SLOW" };
    }
    if (verdict === "OK") {
      return { bg: "rgba(52,199,89,0.12)", fg: "#166534", text: "OK" };
    }
    return { bg: "rgba(0,0,0,0.06)", fg: "#374151", text: "WAITING" };
  }, [verdict]);

  return (
    <View
      style={{
        paddingVertical: s(6),
        paddingHorizontal: s(10),
        borderRadius: 999,
        backgroundColor: bg,
      }}
    >
      <Text
        style={{
          fontWeight: "800",
          color: fg,
          fontSize: clamp(s(12.5), 12, 14),
        }}
      >
        {text}
      </Text>
    </View>
  );
}

function Segmented({
  value,
  onChange,
}: {
  value: Roast;
  onChange: (r: Roast) => void;
}) {
  const items: Array<{ key: Roast; label: string; icon: string }> = [
    { key: "light", label: "Light", icon: "🌱" },
    { key: "medium", label: "Medium", icon: "☕" },
    { key: "dark", label: "Dark", icon: "🔥" },
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        borderRadius: s(14),
        paddingVertical: s(10),
        paddingHorizontal: s(12),
        backgroundColor: "rgba(0,0,0,0.04)",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
      }}
    >
      <Text style={{ fontSize: clamp(s(12), 11.5, 13), color: "#6B7280" }}>
        {label}
      </Text>

      <Text
        style={{
          marginTop: s(4),
          fontFamily: "Nunito_700Bold",
          fontSize: clamp(s(15.5), 14, 18),
          color: "#0B0B0F",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function DialIn() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [roast, setRoast] = useState<Roast>("medium");
  const [timeSec, setTimeSec] = useState("");

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const data = await fetchMachine(slug);
        setMachine(data);

        const savedRoast = await getLastRoast(slug);
        if (savedRoast) setRoast(savedRoast);
      } catch (error) {
        console.log("Failed to load machine for dial-in:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const targetMin = roast === "light" ? 28 : roast === "dark" ? 24 : 26;
  const targetMax = roast === "light" ? 32 : roast === "dark" ? 28 : 30;
  const targetSeconds = `${targetMin}–${targetMax}`;

  const timeNum = parseNum(timeSec);

  const verdict: Verdict = useMemo(() => {
    if (timeNum === null) return "EMPTY";
    if (timeNum < targetMin) return "FAST";
    if (timeNum > targetMax) return "SLOW";
    return "OK";
  }, [timeNum, targetMin, targetMax]);

  const advice = useMemo(() => {
    const roastHint =
      roast === "light"
        ? "Light roasts usually need a bit more contact time."
        : roast === "dark"
        ? "Dark roasts often run better a bit faster."
        : "Medium roasts are a strong baseline.";

    if (verdict === "EMPTY") {
      return {
        title: "Enter shot time",
        body: `Aim for ${targetSeconds}s. ${roastHint}`,
        tip: "",
      };
    }

    if (verdict === "FAST") {
      return {
        title: "Too fast",
        body: "Grind finer to slow the shot down.",
        tip: roastHint,
      };
    }

    if (verdict === "SLOW") {
      return {
        title: "Too slow",
        body: "Grind coarser to speed the shot up.",
        tip: roastHint,
      };
    }

    return {
      title: "In range",
      body: "Great. Keep this grind and adjust only by taste.",
      tip: roastHint,
    };
  }, [verdict, targetSeconds, roast]);

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
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!machine) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F6F6F8",
          padding: s(20),
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
      </View>
    );
  }

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
      <View
  style={{
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    
  }}
>
  {/* LEFT: ICON + TITLE */}
  <View style={{ flexDirection: "row", alignItems: "center", gap: s(10) }}>
    <View
      style={{
        width: s(38),
        height: s(38),
        borderRadius: 999,
        backgroundColor: "rgba(0,0,0,0.06)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name="speedometer-outline" size={20} color="#0B0B0F" />
    </View>

   <Text
  style={{
    marginLeft: s(6),
    fontFamily: "Nunito_700Bold",
    fontSize: clamp(s(22), 18, 26),
    color: "#0B0B0F",

    paddingHorizontal: s(10), // 👈 space inside
    paddingVertical: s(4),

    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 999,
  }}
>
  Dial-In
</Text>
  </View>

  {/* RIGHT: BACK BUTTON */}
  <Pressable
    onPress={() => router.back()}
    style={({ pressed }) => ({
      width: s(38),
      height: s(38),
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: pressed
        ? "rgba(0,0,0,0.08)"
        : "rgba(0,0,0,0.06)",
    })}
  >
    <Ionicons name="arrow-back" size={20} color="#0B0B0F" />
  </Pressable>
</View>
      <Text
        style={{
          marginTop: s(14),
          color: "#0B0B0F",
          fontSize: clamp(s(14.5), 12.5, 17.5),
        }}
      >
        {machine.name}
      </Text>

      <View
        style={{
          marginTop: s(14),
          borderRadius: s(22),
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.06)",
          padding: s(16),
          ...shadowCard(),
        }}
      >
        <Text
          style={{
            fontFamily: "Nunito_700Bold",
            fontSize: clamp(s(16), 14.5, 18),
            color: "#0B0B0F",
          }}
        >
          Coffee type
        </Text>

        <Text
          style={{
            marginTop: s(6),
            color: "#6B7280",
            fontSize: clamp(s(13), 12, 14.5),
          }}
        >
          Pick the roast level and compare your shot time.
        </Text>

        <View style={{ marginTop: s(12) }}>
          <Segmented
            value={roast}
            onChange={async (r) => {
              setRoast(r);
              if (slug) {
                await setLastRoast(slug, r);
                await setPreferredMachineId(slug);
              }
            }}
          />
        </View>
      </View>

      <View
        style={{
          marginTop: s(12),
          borderRadius: s(22),
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.06)",
          padding: s(16),
          ...shadowCard(),
        }}
      >
        <Text
          style={{
            fontFamily: "Nunito_700Bold",
            fontSize: clamp(s(16), 14.5, 18),
            color: "#0B0B0F",
          }}
        >
          Recommended target
        </Text>

        <View style={{ flexDirection: "row", gap: s(10), marginTop: s(12) }}>
          <MiniStat label="Target time" value={`${targetSeconds}s`} />
          <MiniStat label="Dose" value={`${machine.baseline_dose}g`} />
          <MiniStat label="Yield" value={`${machine.baseline_yield}g`} />
        </View>
      </View>

      <Text
        style={{
          marginTop: s(18),
          marginBottom: s(10),
          fontFamily: "Nunito_700Bold",
          fontSize: clamp(s(18), 16, 20),
          color: "#0B0B0F",
        }}
      >
        Enter your shot time
      </Text>

      <View
        style={{
          borderRadius: s(22),
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.06)",
          padding: s(16),
          ...shadowCard(),
        }}
      >
        <Text style={{ fontSize: clamp(s(12.5), 12, 14), color: "#6B7280" }}>
          Time (seconds)
        </Text>

        <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: s(8) }}>
          <TextInput
            value={timeSec}
            onChangeText={setTimeSec}
            keyboardType="number-pad"
            placeholder="28"
            placeholderTextColor="#9CA3AF"
            style={{
              flex: 1,
              fontFamily: "Nunito_700Bold",
              fontSize: clamp(s(34), 28, 40),
              color: "#0B0B0F",
              paddingVertical: s(6),
            }}
          />

          <Text
            style={{
              marginLeft: s(8),
              fontSize: clamp(s(14), 13, 16),
              color: "#6B7280",
            }}
          >
            sec
          </Text>
        </View>

        <View
          style={{
            marginTop: s(12),
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#6B7280", fontSize: clamp(s(13), 12, 14.5) }}>
            Target: {targetMin}–{targetMax}s
          </Text>

          <Badge verdict={verdict} />
        </View>

        <Pressable
          onPress={() => setTimeSec("")}
          style={({ pressed }) => ({
            marginTop: s(14),
            paddingVertical: s(12),
            borderRadius: s(16),
            alignItems: "center",
            backgroundColor: pressed
              ? "rgba(0,0,0,0.08)"
              : "rgba(0,0,0,0.06)",
          })}
        >
          <Text style={{ fontWeight: "800", color: "#111827" }}>Clear</Text>
        </Pressable>
      </View>

      <View
        style={{
          marginTop: s(14),
          borderRadius: s(22),
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.06)",
          padding: s(16),
          ...shadowCard(),
        }}
      >
        <Text
          style={{
            fontFamily: "Nunito_700Bold",
            fontSize: clamp(s(16), 14.5, 18),
            color: "#0B0B0F",
          }}
        >
          Suggestion
        </Text>

        <Text
          style={{
            marginTop: s(10),
            fontFamily: "Nunito_700Bold",
            fontSize: clamp(s(20), 17, 24),
            color: "#0B0B0F",
          }}
        >
          {advice.title}
        </Text>

        <Text
          style={{
            marginTop: s(6),
            fontSize: clamp(s(14.5), 13.5, 16),
            lineHeight: clamp(s(20), 18, 22),
            color: "#6B7280",
          }}
        >
          {advice.body}
        </Text>

        {advice.tip ? (
          <Text
            style={{
              marginTop: s(10),
              fontSize: clamp(s(13), 12, 14.5),
              lineHeight: clamp(s(18), 16, 20),
              color: "#6B7280",
            }}
          >
            {advice.tip}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}