import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { fetchGrinders, type Grinder } from "../lib/api";
import { clearPreferredGrinder, getPreferredGrinder, setPreferredGrinder } from "../utils/storage";
import { useSearch } from "../components/SearchContext";
import { clamp, s, v } from "../utils/ui";

function shadowCard() {
  return {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: s(12),
    shadowOffset: { width: 0, height: s(6) },
    elevation: 2,
  } as const;
}

function Chip({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "accent" }) {
  const isAccent = tone === "accent";
  return (
    <View
      style={{
        paddingVertical: s(6),
        paddingHorizontal: s(10),
        borderRadius: 999,
        backgroundColor: isAccent ? "rgba(11,11,15,0.08)" : "rgba(0,0,0,0.05)",
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          fontSize: clamp(s(11.5), 11, 13),
          fontWeight: "800",
          color: isAccent ? "#111827" : "#4B5563",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function SelectGrinder() {
  const { query, isSearchOpen } = useSearch();
  const [grinders, setGrinders] = useState<Grinder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGrinderId, setSelectedGrinderId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [data, selected] = await Promise.all([fetchGrinders(), getPreferredGrinder()]);
        setGrinders(data);
        setSelectedGrinderId(selected?.id ?? null);
      } catch (loadError) {
        console.log("Failed to load grinders:", loadError);
        setError("Could not load grinders.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredGrinders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return grinders;

    return grinders.filter((grinder) => {
      const tags = grinderTags(grinder).join(" ").toLowerCase();
      return grinder.name.toLowerCase().includes(q) || tags.includes(q);
    });
  }, [query, grinders]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F6F6F8" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: s(10), color: "#6B7280" }}>Loading grinders...</Text>
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
        Grinders
      </Text>

      <FlatList
        data={filteredGrinders}
        keyExtractor={(item) => item.slug}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: s(32) }}
        ItemSeparatorComponent={() => <View style={{ height: s(12) }} />}
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
            <Text style={{ fontFamily: "Nunito_700Bold", fontSize: clamp(s(15), 14, 17), color: "#0B0B0F" }}>
              {isSearchOpen && query.trim() ? `Searching for "${query.trim()}"` : "Browse all grinders"}
            </Text>
            <Text style={{ marginTop: s(4), fontSize: clamp(s(13), 12, 14.5), color: "#6B7280" }}>
              {isSearchOpen && query.trim() ? `${filteredGrinders.length} result${filteredGrinders.length === 1 ? "" : "s"}` : "Espresso ranges and setting direction from DialChat profiles."}
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
            <Text style={{ fontFamily: "Nunito_700Bold", fontSize: clamp(s(18), 16, 20), color: "#0B0B0F" }}>
              No grinders found
            </Text>
            <Text style={{ marginTop: s(8), textAlign: "center", fontSize: clamp(s(13.5), 12.5, 15), color: "#6B7280" }}>
              Try a different grinder name in search.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isSelected = item.slug === selectedGrinderId;
          return (
          <Pressable
            onPress={async () => {
              if (isSelected) {
                await clearPreferredGrinder();
                setSelectedGrinderId(null);
                return;
              }

              await setPreferredGrinder(item.slug, item.name);
              setSelectedGrinderId(item.slug);
            }}
            style={({ pressed }) => ({
              borderRadius: s(18),
              backgroundColor: "white",
              borderWidth: 1,
              borderColor: isSelected ? "#111827" : "rgba(0,0,0,0.06)",
              padding: s(14),
              ...shadowCard(),
              transform: [{ scale: pressed ? 0.99 : 1 }],
              opacity: pressed ? 0.97 : 1,
            })}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: s(12) }}>
              <View
                style={{
                  width: s(42),
                  height: s(42),
                  borderRadius: s(14),
                  backgroundColor: "rgba(0,0,0,0.05)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="options-outline" size={20} color="#111827" />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: "Nunito_700Bold",
                    fontSize: clamp(s(17), 15.5, 19),
                    color: "#0B0B0F",
                  }}
                >
                  {item.name}
                </Text>
                <Text numberOfLines={1} style={{ marginTop: s(4), color: "#6B7280", fontSize: clamp(s(13), 12, 14.5) }}>
                  {grinderSubtitle(item)}
                </Text>
              </View>

              {isSelected ? (
                <View style={{ borderRadius: 999, backgroundColor: "#111827", paddingHorizontal: s(10), paddingVertical: s(6) }}>
                  <Text style={{ color: "white", fontSize: clamp(s(11), 10, 12), fontWeight: "900" }}>Selected</Text>
                </View>
              ) : null}
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: s(8), marginTop: s(12) }}>
              {grinderInfoChips(item).map((chip) => (
                <Chip key={chip.label} label={chip.label} tone={chip.tone} />
              ))}
            </View>

            {item.notes ? (
              <Text
                numberOfLines={2}
                style={{
                  marginTop: s(10),
                  color: "#6B7280",
                  fontSize: clamp(s(12.5), 11.5, 14),
                  lineHeight: clamp(s(17), 15.5, 19),
                }}
              >
                {shortGrinderNote(item.notes)}
              </Text>
            ) : null}
          </Pressable>
          );
        }}
      />

      {error ? (
        <Text style={{ position: "absolute", bottom: s(16), alignSelf: "center", color: "#B42318", fontWeight: "800" }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function grinderSubtitle(grinder: Grinder): string {
  const range = rangeLabel(grinder.espresso_range);
  const direction = grinder.lower_is_finer === false ? "higher is finer" : "lower is finer";
  return range ? `Espresso ${range} · ${direction}` : direction;
}

function grinderTags(grinder: Grinder): string[] {
  return grinderInfoChips(grinder).map((chip) => chip.label);
}

function grinderInfoChips(grinder: Grinder): { label: string; tone?: "neutral" | "accent" }[] {
  const chips: { label: string; tone?: "neutral" | "accent" }[] = [];
  const espressoRange = rangeLabel(grinder.espresso_range);
  const fullRange = grinder.min_setting !== null && grinder.min_setting !== undefined && grinder.max_setting !== null && grinder.max_setting !== undefined
    ? `${grinder.min_setting}-${grinder.max_setting}`
    : null;

  if (grinder.small_step !== null && grinder.small_step !== undefined) chips.push({ label: `Move ${grinder.small_step}`, tone: "accent" });
  if (fullRange) chips.push({ label: `Range ${fullRange}` });
  if (grinder.data_confidence) chips.push({ label: `Confidence ${grinder.data_confidence}` });
  if (espressoRange) chips.push({ label: `Espresso ${espressoRange}` });

  if (!chips.length && grinder.setting_type) chips.push({ label: grinder.setting_type.replace(/_/g, " ") });
  return chips.slice(0, 4);
}

function rangeLabel(range?: number[] | null): string | null {
  return range && range.length >= 2 ? `${range[0]}-${range[1]}` : null;
}

function shortGrinderNote(note: string): string {
  return note.split(".")[0].trim() + ".";
}
