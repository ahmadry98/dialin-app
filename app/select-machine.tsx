import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { s, v, clamp } from "../utils/ui";
import { useSearch } from "../components/SearchContext";
import { fetchMachines, type Machine } from "../lib/api";

function shadowCard() {
  return {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: s(12),
    shadowOffset: { width: 0, height: s(6) },
    elevation: 2,
  } as const;
}

function getMachineTags(name: string) {
  const n = name.toLowerCase();

  if (n.includes("gaggia")) return ["Beginner-friendly", "Classic"];
  if (n.includes("silvia")) return ["Powerful", "Single boiler"];
  if (n.includes("breville")) return ["Built-in grinder", "All-in-one"];

  return ["Espresso", "Manual"];
}

function Tag({ label }: { label: string }) {
  return (
    <View
      style={{
        paddingVertical: s(5),
        paddingHorizontal: s(9),
        borderRadius: 999,
        backgroundColor: "rgba(0,0,0,0.06)",
      }}
    >
      <Text
        style={{
          fontSize: clamp(s(11.5), 11, 13),
          fontWeight: "700",
          color: "#4B5563",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function SelectMachine() {
  const { query, isSearchOpen } = useSearch();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchMachines();
        setMachines(data);
      } catch (error) {
        console.log("Failed to load machines in select-machine:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredMachines = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return machines;

    return machines.filter((m) => {
      const tags = getMachineTags(m.name).join(" ").toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.subtitle.toLowerCase().includes(q) ||
        tags.includes(q)
      );
    });
  }, [query, machines]);

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
        <Text style={{ marginTop: s(10), color: "#6B7280" }}>
          Loading machines...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: s(20),
        paddingTop: clamp(v(24), s(18), s(32)),
        backgroundColor: "#F6F6F8",
      }}
    >
<Text
  style={{
    fontFamily: "Nunito_700Bold",
    fontSize: clamp(s(22), 20, 26),
    marginBottom: s(10),
    color: "#0B0B0F",
  }}
>
  Machines
</Text>

      <FlatList
        data={filteredMachines}
        keyExtractor={(item) => item.slug}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: s(32),
        }}
        ItemSeparatorComponent={() => <View style={{ height: s(16) }} />}
        ListHeaderComponent={
        <View
          style={{
            marginTop: s(14),
            marginBottom: s(14),
            borderRadius: s(18),
            backgroundColor: "white",
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.06)",
            paddingHorizontal: s(14),
            paddingVertical: s(12),
            ...shadowCard(),
          }}
        >
          <Text
            style={{
              fontFamily: "Nunito_700Bold",
              fontSize: clamp(s(15), 14, 17),
              color: "#0B0B0F",
            }}
          >
            {isSearchOpen
              ? query.trim()
                ? `Searching for "${query.trim()}"`
                : "Search is open in the header"
              : "Browse all machines"}
          </Text>

          <Text
            style={{
              marginTop: s(4),
              fontSize: clamp(s(13), 12, 14.5),
              color: "#6B7280",
              lineHeight: clamp(s(18), 16, 20),
            }}
          >
            {isSearchOpen
              ? query.trim()
                ? `${filteredMachines.length} result${filteredMachines.length === 1 ? "" : "s"}`
                : "Use the portafilter icon in the header to type a machine name."
              : "Use the portafilter icon in the header to search instantly."}
          </Text>
        </View>
      }
        ListEmptyComponent={
          <View
            style={{
              marginTop: s(20),
              borderRadius: s(22),
              backgroundColor: "white",
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.06)",
              padding: s(18),
              alignItems: "center",
              ...shadowCard(),
            }}
          >
            <Text
              style={{
                fontFamily: "Nunito_700Bold",
                fontSize: clamp(s(18), 16, 20),
                color: "#0B0B0F",
              }}
            >
              No machines found
            </Text>

            <Text
              style={{
                marginTop: s(8),
                textAlign: "center",
                fontSize: clamp(s(13.5), 12.5, 15),
                lineHeight: clamp(s(19), 17, 21),
                color: "#6B7280",
              }}
            >
              Try a different name in the header search.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const tags = getMachineTags(item.name);

          return (
            <Pressable
              onPress={() => router.push(`/machine/${item.slug}`)}
              style={({ pressed }) => ({
                borderRadius: s(20),
                backgroundColor: "white",
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.06)",
                overflow: "hidden",
                ...shadowCard(),
                transform: [{ scale: pressed ? 0.99 : 1 }],
                opacity: pressed ? 0.97 : 1,
              })}
            >
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={{
                    width: "100%",
                    height: clamp(v(165), 130, 200),
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: "100%",
                    height: clamp(v(165), 130, 200),
                    backgroundColor: "#E5E7EB",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#6B7280" }}>No image</Text>
                </View>
              )}

              <View style={{ padding: s(14) }}>
                <Text
                  style={{
                    fontFamily: "Nunito_700Bold",
                    fontSize: clamp(s(17), 15.5, 19),
                    color: "#0B0B0F",
                  }}
                >
                  {item.name}
                </Text>

                <Text
                  style={{
                    marginTop: s(5),
                    fontSize: clamp(s(13.5), 12.5, 15),
                    lineHeight: clamp(s(19), 17, 21),
                    color: "#6B7280",
                  }}
                >
                  {item.subtitle}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: s(8),
                    marginTop: s(12),
                  }}
                >
                  {tags.map((tag) => (
                    <Tag key={tag} label={tag} />
                  ))}
                </View>

               
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}