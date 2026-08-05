import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { s, v, clamp } from "../../../utils/ui";
import { fetchMachine, type Machine } from "../../../lib/api";

function shadowCard() {
  return {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: s(12),
    shadowOffset: { width: 0, height: s(6) },
    elevation: 2,
  } as const;
}

function VideoCard({
  title,
  desc,
  url,
}: {
  title: string;
  desc: string;
  url: string;
}) {
  return (
    <Pressable
      onPress={() => Linking.openURL(url)}
      style={({ pressed }) => ({
        borderRadius: s(18),
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
        padding: s(14),
        ...shadowCard(),
        opacity: pressed ? 0.96 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: s(10) }}>
        <View
          style={{
            width: s(40),
            height: s(40),
            borderRadius: 999,
            backgroundColor: "rgba(0,0,0,0.05)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="play-circle-outline" size={22} color="#111827" />
        </View>

        <View style={{ flex: 1 }}>
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
              marginTop: s(4),
              fontSize: clamp(s(13), 12, 14.5),
              lineHeight: clamp(s(18), 16, 20),
              color: "#6B7280",
            }}
            numberOfLines={2}
          >
            {desc}
          </Text>
        </View>

        <Ionicons name="open-outline" size={18} color="#6B7280" />
      </View>
    </Pressable>
  );
}

export default function CleaningScreen() {
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
        console.log("Failed to load cleaning data:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const cleaningVideos = useMemo(
    () => [
      {
        id: "daily-clean",
        title: "Daily cleaning routine",
        desc: "Quick rinse, wipe, and steam wand cleanup after every session.",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "backflush",
        title: "How to backflush your machine",
        desc: "Step-by-step detergent and water backflush routine.",
        url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
      },
      {
        id: "deep-clean",
        title: "Monthly deep clean",
        desc: "Group head, basket, steam wand, and drip tray cleaning walkthrough.",
        url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
      },
    ],
    []
  );

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
    marginBottom: s(10),
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
      <Ionicons name="water-outline" size={20} color="#0B0B0F" />
    </View>

    <Text
      style={{
        fontFamily: "Nunito_700Bold",
        fontSize: clamp(s(22), 18, 26),
        color: "#0B0B0F",
        backgroundColor: "rgba(0,0,0,0.06)",
        paddingHorizontal: s(12),
        paddingVertical: s(6),
        borderRadius: 999,
      }}
    >
      Cleaning
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
          <Text
            style={{
              fontFamily: "Nunito_700Bold",
              fontSize: clamp(s(16), 14.5, 18),
              color: "#0B0B0F",
            }}
          >
            Cleaning notes
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
          {machine.cleaning_notes || "Add cleaning notes in admin to show machine-specific cleaning steps here."}
        </Text>
      </View>

      <View
        style={{
          marginTop: s(18),
          marginBottom: s(10),
          flexDirection: "row",
          alignItems: "center",
          gap: s(8),
        }}
      >
        <Ionicons name="videocam-outline" size={18} color="#111827" />
        <Text
          style={{
            fontFamily: "Nunito_700Bold",
            fontSize: clamp(s(18), 16, 20),
            color: "#0B0B0F",
          }}
        >
          Cleaning videos
        </Text>
      </View>

      <View style={{ gap: s(12) }}>
        {cleaningVideos.map((video) => (
          <VideoCard
            key={video.id}
            title={video.title}
            desc={video.desc}
            url={video.url}
          />
        ))}
      </View>
    </ScrollView>
  );
}