import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { s, v, clamp } from "../../../utils/ui";
import { fetchMachine, type Machine } from "../../../lib/api";
import { Ionicons } from "@expo/vector-icons";

function shadowCard() {
  return {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: s(12),
    shadowOffset: { width: 0, height: s(6) },
    elevation: 2,
  } as const;
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
      <Text
        style={{
          fontSize: clamp(s(12), 11.5, 13),
          color: "#6B7280",
        }}
      >
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

export default function Guides() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const data = await fetchMachine(slug);
        setMachine(data);
      } catch (error) {
        console.log("Failed to load guides machine:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

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
      contentContainerStyle={{
        
        paddingHorizontal: s(20),
        paddingTop: clamp(v(20), s(16), s(26)),
        paddingBottom: s(40),
        backgroundColor: "#F6F6F8",
      }}
      showsVerticalScrollIndicator={false}
    >
      <View
  style={{
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  }}
>
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
      <Ionicons name="book-outline" size={20} color="#0B0B0F" />
    </View>

    <Text
      style={{
        marginLeft: s(6),
        fontFamily: "Nunito_700Bold",
        fontSize: clamp(s(22), 18, 26),
        color: "#0B0B0F",
        paddingHorizontal: s(10),
        paddingVertical: s(4),
        backgroundColor: "rgba(0,0,0,0.06)",
        borderRadius: 999,
      }}
    >
      Guides
    </Text>
  </View>

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
      {!!machine.quick_tip && (
        <View
          style={{
            marginTop: s(14),
            borderRadius: s(20),
            backgroundColor: "white",
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.06)",
            padding: s(16),
            ...shadowCard(),
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: s(8) }}>
            <Ionicons name="bulb-outline" size={18} color="#111827" />
            <Text
              style={{
                fontFamily: "Nunito_700Bold",
                fontSize: clamp(s(16), 14.5, 18),
                color: "#0B0B0F",
              }}
            >
              Quick tip
            </Text>
          </View>

          <Text
            style={{
              marginTop: s(10),
              color: "#4B5563",
              fontSize: clamp(s(13.5), 12.5, 15),
              lineHeight: clamp(s(19), 17, 21),
            }}
          >
            {machine.quick_tip}
          </Text>
        </View>
      )}

      <View
        style={{
          marginTop: s(14),
          borderRadius: s(20),
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.06)",
          padding: s(16),
          ...shadowCard(),
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: s(8) }}>
          <Ionicons name="cafe-outline" size={18} color="#111827" />
          <Text
            style={{
              fontFamily: "Nunito_700Bold",
              fontSize: clamp(s(16), 14.5, 18),
              color: "#0B0B0F",
            }}
          >
            Baseline recipe
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: s(10), marginTop: s(12) }}>
          <MiniStat label="Dose" value={`${machine.baseline_dose}g`} />
          <MiniStat label="Yield" value={`${machine.baseline_yield}g`} />
          <MiniStat label="Time" value={`${machine.baseline_seconds}s`} />
        </View>
      </View>

      <View
        style={{
          marginTop: s(14),
          borderRadius: s(20),
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.06)",
          padding: s(16),
          ...shadowCard(),
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: s(8) }}>
          <Ionicons name="book-outline" size={18} color="#111827" />
          <Text
            style={{
              fontFamily: "Nunito_700Bold",
              fontSize: clamp(s(16), 14.5, 18),
              color: "#0B0B0F",
            }}
          >
            First use guide
          </Text>
        </View>

        <Text
          style={{
            marginTop: s(10),
            color: "#4B5563",
            fontSize: clamp(s(13.5), 12.5, 15),
            lineHeight: clamp(s(19), 17, 21),
          }}
        >
          {machine.first_use_guide ||
            "Add your machine-specific first-use guide in admin to show setup steps here."}
        </Text>
      </View>
    </ScrollView>
  );
}