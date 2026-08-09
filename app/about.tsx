import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { s, v, clamp } from "../utils/ui";

function shadowCard() {
  return {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: s(12),
    shadowOffset: { width: 0, height: s(6) },
    elevation: 2,
  } as const;
}

function BackButton() {
  return (
    <Pressable
      onPress={() => router.back()}
      style={({ pressed }) => ({
        width: s(44),
        height: s(44),
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? "rgba(0,0,0,0.09)" : "rgba(0,0,0,0.06)",
      })}
    >
      <Ionicons name="arrow-back" size={22} color="#0B0B0F" />
    </Pressable>
  );
}

function ValueCard({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: "46%",
        borderRadius: s(18),
        padding: s(14),
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
        ...shadowCard(),
      }}
    >
      <View
        style={{
          width: s(38),
          height: s(38),
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F3F4F6",
        }}
      >
        <Ionicons name={icon} size={19} color="#111827" />
      </View>
      <Text style={{ marginTop: s(12), fontFamily: "Nunito_700Bold", fontSize: clamp(s(15), 14, 17), color: "#0B0B0F" }}>
        {title}
      </Text>
      <Text style={{ marginTop: s(6), color: "#6B7280", fontSize: clamp(s(13), 12, 14.5), lineHeight: clamp(s(18), 16, 20) }}>
        {body}
      </Text>
    </View>
  );
}

export default function About() {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: s(20),
        paddingTop: clamp(v(20), s(16), s(26)),
        paddingBottom: s(42),
        backgroundColor: "#F6F6F8",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flex: 1, paddingRight: s(12) }}>
          <Text style={{ fontFamily: "Nunito_700Bold", fontSize: clamp(s(28), 24, 32), color: "#0B0B0F" }}>
            About DialedIn
          </Text>
          <Text style={{ marginTop: s(5), color: "#6B7280", fontSize: clamp(s(14), 13, 16), lineHeight: clamp(s(19), 17, 21) }}>
            Your espresso copilot for better shots, one small change at a time.
          </Text>
        </View>
        <BackButton />
      </View>

      <View
        style={{
          marginTop: s(16),
          borderRadius: s(24),
          padding: s(18),
          backgroundColor: "#0B0B0F",
          ...shadowCard(),
        }}
      >
        <Text style={{ color: "rgba(255,255,255,0.72)", fontWeight: "800", fontSize: clamp(s(12), 11, 13), letterSpacing: 0.8 }}>
          WHY IT EXISTS
        </Text>
        <Text style={{ marginTop: s(10), color: "white", fontFamily: "Nunito_700Bold", fontSize: clamp(s(24), 21, 28), lineHeight: clamp(s(30), 26, 34) }}>
          Espresso should feel learnable, not random.
        </Text>
        <Text style={{ marginTop: s(10), color: "rgba(255,255,255,0.78)", fontSize: clamp(s(14), 13, 16), lineHeight: clamp(s(21), 19, 23) }}>
          DialedIn helps you track the machine, grinder, dose, taste, and shot timing so the next adjustment is clear.
        </Text>
      </View>

      <View style={{ marginTop: s(14), flexDirection: "row", flexWrap: "wrap", gap: s(10) }}>
        <ValueCard icon="timer-outline" title="Shot timing" body="Use audio analysis or manual timing to understand how fast the extraction ran." />
        <ValueCard icon="options-outline" title="Grind guidance" body="Turn timing and taste into a practical next grinder move." />
        <ValueCard icon="cafe-outline" title="Machine context" body="Profiles keep machine details close so advice is less generic." />
        <ValueCard icon="chatbubble-ellipses-outline" title="Chat first" body="The app asks for only what it needs and keeps the workflow conversational." />
      </View>

      <View
        style={{
          marginTop: s(14),
          borderRadius: s(22),
          padding: s(16),
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.06)",
          ...shadowCard(),
        }}
      >
        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: clamp(s(18), 16, 20), color: "#0B0B0F" }}>
          Built for home baristas
        </Text>
        <Text style={{ marginTop: s(8), color: "#6B7280", fontSize: clamp(s(14), 13, 16), lineHeight: clamp(s(20), 18, 22) }}>
          DialedIn is designed around real home espresso: imperfect videos, different machines, different grinders, and small repeatable improvements.
        </Text>
      </View>
    </ScrollView>
  );
}
