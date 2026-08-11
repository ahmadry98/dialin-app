import React from "react";
import { View, Text, ScrollView, Pressable, Linking, Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { s, v, clamp } from "../utils/ui";

const EMAIL = "support@dialedin.me";

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

async function copyEmail() {
  await Clipboard.setStringAsync(EMAIL);
  Alert.alert("Email copied", "You can paste it into your email app.");
}

async function openEmail() {
  const subject = encodeURIComponent("DialedIn app feedback");
  const body = encodeURIComponent("Hi DialedIn,\n\nI wanted to contact you about the app.\n\n");
  const url = `mailto:${EMAIL}?subject=${subject}&body=${body}`;

  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("Email app not available", "Use the copy button, then paste the email into your mail app.");
  }
}

function ContactCard({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return (
    <View
      style={{
        borderRadius: s(20),
        padding: s(15),
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
        ...shadowCard(),
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: s(10) }}>
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
        <Text style={{ flex: 1, fontFamily: "Nunito_700Bold", fontSize: clamp(s(16), 14.5, 18), color: "#0B0B0F" }}>
          {title}
        </Text>
      </View>
      <Text style={{ marginTop: s(9), color: "#6B7280", fontSize: clamp(s(13.5), 12.5, 15.5), lineHeight: clamp(s(19), 17, 21) }}>
        {body}
      </Text>
    </View>
  );
}

export default function Contact() {
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
            Contact us
          </Text>
          <Text style={{ marginTop: s(5), color: "#6B7280", fontSize: clamp(s(14), 13, 16), lineHeight: clamp(s(19), 17, 21) }}>
            Questions, bugs, machine requests, or feedback for DialedIn.
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
          FASTEST WAY
        </Text>
        <Text style={{ marginTop: s(10), color: "white", fontFamily: "Nunito_700Bold", fontSize: clamp(s(23), 20, 27), lineHeight: clamp(s(29), 25, 33) }}>
          Send a message directly by email.
        </Text>
        <View style={{ flexDirection: "row", gap: s(10), marginTop: s(14) }}>
          <Pressable
            onPress={openEmail}
            style={({ pressed }) => ({
              flex: 1,
              height: s(50),
              borderRadius: s(16),
              backgroundColor: "white",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: s(8),
              opacity: pressed ? 0.88 : 1,
            })}
          >
            <Ionicons name="mail-outline" size={19} color="#0B0B0F" />
            <Text style={{ color: "#0B0B0F", fontFamily: "Nunito_700Bold", fontSize: clamp(s(15.5), 14, 17) }}>
              Email
            </Text>
          </Pressable>

          <Pressable
            onPress={copyEmail}
            style={({ pressed }) => ({
              width: s(58),
              height: s(50),
              borderRadius: s(16),
              backgroundColor: "rgba(255,255,255,0.14)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.18)",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.82 : 1,
            })}
          >
            <Ionicons name="copy-outline" size={20} color="white" />
          </Pressable>
        </View>
      </View>

      <View style={{ marginTop: s(14), gap: s(10) }}>
        <ContactCard icon="bug-outline" title="Report an issue" body="Tell us what happened, what phone you used, and the machine or grinder involved." />
        <ContactCard icon="cafe-outline" title="Request a machine" body="Send the exact model name and, if possible, a product page or photo so the profile can be reviewed." />
        <ContactCard icon="sparkles-outline" title="Suggest an improvement" body="Ideas for the chat flow, shot analysis, machine pages, or grinder recommendations are welcome." />
      </View>
    </ScrollView>
  );
}
