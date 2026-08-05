import React from "react";
import { View, Text, Pressable, Linking } from "react-native";
import { s, clamp } from "../utils/ui";
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

export default function ResourceCard({
  title,
  desc,
  url,
}: {
  title: string;
  desc: string;
  url: string;
}) {
  return (
    <View
      style={{
        borderRadius: s(18),
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
        padding: s(14),
        ...shadowCard(),
      }}
    >
      <Text style={{ fontFamily: "Nunito_700Bold", fontSize: clamp(s(16), 14.5, 18), color: "#0B0B0F" }}>
        {title}
      </Text>

      <Text
        style={{
          marginTop: s(6),
          color: "#6B7280",
          fontSize: clamp(s(13.5), 12.5, 15),
          lineHeight: clamp(s(19), 17, 21),
        }}
      >
        {desc}
      </Text>

      <Pressable
        onPress={() => Linking.openURL(url)}
        style={({ pressed }) => ({
          marginTop: s(12),
          paddingVertical: s(12),
          borderRadius: s(16),
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: s(8),
          backgroundColor: pressed ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.06)",
        })}
      >
        <Ionicons name="play" size={18} color="#111827" />
        <Text style={{ fontWeight: "800", color: "#111827" }}>Watch</Text>
      </Pressable>
    </View>
  );
}