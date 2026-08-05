import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, Image, Dimensions, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { s, v, clamp } from "../utils/ui";

import { getPreferredMachineId, getLastRoast } from "../utils/storage";
import { useSearch } from "../components/SearchContext";
//import { MACHINES } from "../data/machines";
import { fetchMachines, type Machine } from "../lib/api";
const W = Dimensions.get("window").width;
const P = s(20);
function shadowCard() {
  return {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: s(12),
    shadowOffset: { width: 0, height: s(6) },
    elevation: 2,
  } as const;
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: "#0B0B0F",
        paddingVertical: s(14),
        borderRadius: s(16),
        alignItems: "center",
        transform: [{ scale: pressed ? 0.985 : 1 }],
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <Text style={{ color: "white", fontSize: clamp(s(16), 14, 18), fontWeight: "800" }}>
        {label}
      </Text>
    </Pressable>
  );
}

function MachineCard({
  name,
  image,
  onPress,
}: {
  name: string;
  image: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: clamp(s(200), 170, 230),
        marginRight: s(12),
        borderRadius: s(18),
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
        overflow: "hidden",
        ...shadowCard(),
        transform: [{ scale: pressed ? 0.99 : 1 }],
        opacity: pressed ? 0.98 : 1,
      })}
    >
      <Image
        source={image}
        style={{ width: "100%", height: clamp(v(140), s(110), s(160)) }}
        resizeMode="cover"
      />
      <View style={{ padding: s(12) }}>
        <Text
          style={{
            fontFamily: "Nunito_700Bold",
            fontSize: clamp(s(14.5), 13.5, 16),
            color: "#0B0B0F",
          }}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text style={{ marginTop: s(4), fontSize: clamp(s(12.5), 11.5, 14), color: "#6B7280" }}>
          Open →
        </Text>
      </View>
    </Pressable>
  );
}

export default function Home() {
  const { isSearchOpen, query } = useSearch();

  //const [lastMachine, setLastMachine] = useState<any | null>(null);
  const [lastRoast, setLastRoast] = useState<string | null>(null);

  const [lastMachine, setLastMachine] = useState<Machine | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loadingMachines, setLoadingMachines] = useState(true);
  const openAIShotAnalysis = () => {
    if (lastMachine?.slug) {
      router.push(`/machine/${lastMachine.slug}/ai` as any);
      return;
    }
    router.push("/ai" as any);
  };

  useEffect(() => {
  (async () => {
    try {
      const apiMachines = await fetchMachines();
      setMachines(apiMachines);

      const machineId = await getPreferredMachineId();

      if (machineId) {
        const foundMachine = apiMachines.find((m) => m.slug === machineId);

        if (foundMachine) {
          setLastMachine(foundMachine);

          const roast = await getLastRoast(machineId);
          setLastRoast(roast);
        }
      }
    } catch (error) {
      console.log("Failed to load machines:", error);
    } finally {
      setLoadingMachines(false);
    }
  })();
}, []);

const filteredMachines = machines.filter((m) =>
  m.name.toLowerCase().includes(query.trim().toLowerCase())
);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: P,
        paddingTop: clamp(v(32), s(26), s(40)),
        paddingBottom: clamp(v(44), s(36), s(60)),
        backgroundColor: "#F6F6F8",
      }}
    >
      {/* HERO CARD */}
      <View
        style={{
          borderRadius: s(22),
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.06)",
          backgroundColor: "white",
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: s(14),
          shadowOffset: { width: 0, height: s(8) },
          elevation: 3,
        }}
      >
        <Image
          source={require("../assets/images/home/hero-shot.jpg")}
          style={{ width: "100%", height: clamp(v(230), 180, 280) }}
          resizeMode="cover"
        />

        <View style={{ padding: s(16) }}>
          <Text
            style={{
              fontSize: clamp(s(12), 11, 13),
              letterSpacing: s(1.6),
              color: "#6B7280",
              fontWeight: "800",
            }}
          >
            YOUR ESPRESSO COPILOT
          </Text>

          <Text
            style={{
              marginTop: s(8),
              fontFamily: "Nunito_700Bold",
              fontSize: clamp(s(26), 22, 30),
              lineHeight: clamp(s(30), 26, 34),
              color: "#0B0B0F",
            }}
          >
            Dial in espresso faster
          </Text>

          <Text
            style={{
              marginTop: s(8),
              fontSize: clamp(s(14.5), 13.5, 16),
              lineHeight: clamp(s(20), 18, 22),
              color: "#6B7280",
            }}
            numberOfLines={3}
          >
            Guides + routines + (soon) AI shot analysis — tailored to your machine.
          </Text>

          <View style={{ marginTop: s(14) }}>
            <PrimaryButton label="Start dialing" onPress={() => router.push("/select-machine")} />
          </View>
        </View>
      </View>

      {/* SEARCH RESULTS */}
      {isSearchOpen && (
        <View style={{ marginTop: s(14) }}>
          {query.trim().length === 0 ? (
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
              <Text
                style={{
                  fontFamily: "Nunito_700Bold",
                  fontSize: clamp(s(16), 14.5, 18),
                  color: "#0B0B0F",
                }}
              >
                Search machines
              </Text>

              <Text
                style={{
                  marginTop: s(6),
                  color: "#6B7280",
                  fontSize: clamp(s(13.5), 12.5, 15),
                  lineHeight: clamp(s(18), 16, 20),
                }}
              >
                Try searching for Gaggia, Silvia, Breville, or any machine name.
              </Text>
            </View>
          ) : filteredMachines.length > 0 ? (
            <View style={{ gap: s(10) }}>
              {filteredMachines.map((machine) => (
                <Pressable
                  key={machine.slug}
                  onPress={() => router.push(`/machine/${machine.slug}`)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    borderRadius: s(18),
                    backgroundColor: "white",
                    borderWidth: 1,
                    borderColor: "rgba(0,0,0,0.06)",
                    overflow: "hidden",
                    ...shadowCard(),
                    opacity: pressed ? 0.97 : 1,
                  })}
                >
                  {machine.image ? (
                  <Image
                    source={{ uri: machine.image }}
                    style={{
                      width: clamp(s(92), 84, 110),
                      height: clamp(s(92), 84, 110),
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: clamp(s(92), 84, 110),
                      height: clamp(s(92), 84, 110),
                      backgroundColor: "#E5E7EB",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#6B7280" }}>No image</Text>
                  </View>
                )}

                  <View style={{ flex: 1, padding: s(12) }}>
                    <Text
                      style={{
                        fontFamily: "Nunito_700Bold",
                        fontSize: clamp(s(15), 14, 17),
                        color: "#0B0B0F",
                      }}
                      numberOfLines={1}
                    >
                      {machine.name}
                    </Text>

                    <Text
                      style={{
                        marginTop: s(4),
                        fontSize: clamp(s(12.5), 11.5, 14),
                        lineHeight: clamp(s(17), 15, 19),
                        color: "#6B7280",
                      }}
                      numberOfLines={2}
                    >
                      {machine.subtitle}
                    </Text>

                    <Text
                      style={{
                        marginTop: s(8),
                        fontWeight: "800",
                        color: "#111827",
                      }}
                    >
                      Open →
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
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
              <Text
                style={{
                  fontFamily: "Nunito_700Bold",
                  fontSize: clamp(s(16), 14.5, 18),
                  color: "#0B0B0F",
                }}
              >
                No machines found
              </Text>

              <Text
                style={{
                  marginTop: s(6),
                  color: "#6B7280",
                  fontSize: clamp(s(13.5), 12.5, 15),
                  lineHeight: clamp(s(18), 16, 20),
                }}
              >
                We couldn’t find “{query.trim()}”. You can add machine suggestions later.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* CONTINUE LAST SHOT */}
      {lastMachine && (
        <Pressable
          onPress={() => {
            router.replace(`/machine/${lastMachine.slug}`);
            router.push(`/machine/${lastMachine.slug}/dial-in`);
          }}
          style={({ pressed }) => ({
            marginBottom: s(14),
            marginTop: s(14),
            borderRadius: s(20),
            padding: s(16),
            backgroundColor: "#0B0B0F",
            opacity: pressed ? 0.95 : 1,
          })}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: clamp(s(12), 11, 13),
              fontWeight: "700",
            }}
          >
            CONTINUE YOUR LAST SHOT
          </Text>

          <Text
            style={{
              marginTop: s(6),
              fontSize: clamp(s(20), 18, 24),
              color: "white",
              fontFamily: "Nunito_700Bold",
            }}
          >
            {lastMachine.name}
          </Text>

          {lastRoast && (
            <Text
              style={{
                marginTop: s(6),
                color: "rgba(255,255,255,0.8)",
                fontSize: clamp(s(13), 12, 15),
              }}
            >
              Roast: {lastRoast}
            </Text>
          )}
        </Pressable>
      )}

      {/* MACHINES PREVIEW */}
      <View
        style={{
          marginTop: s(18),
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: clamp(s(18), 16, 20), color: "#0B0B0F" }}>
          Machine Of the Month
        </Text>

        <Pressable onPress={() => router.push("/select-machine")}>
          <Text style={{ color: "#111827", fontWeight: "800", fontSize: clamp(s(14), 13, 16) }}>
            See all →
          </Text>
        </Pressable>
      </View>

<View style={{ marginTop: s(10), gap: s(14) }}>
  {loadingMachines ? (
    <View style={{ paddingVertical: s(20) }}>
      <ActivityIndicator />
    </View>
  ) : (
    machines.slice(0, 1).map((machine) => (
      <Pressable
        key={machine.slug}
        onPress={() => router.push(`/machine/${machine.slug}`)}
        style={({ pressed }) => ({
          width: "100%",
          borderRadius: s(24),
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.06)",
          overflow: "hidden",
          ...shadowCard(),
          transform: [{ scale: pressed ? 0.99 : 1 }],
          opacity: pressed ? 0.97 : 1,
        })}
      >
        {/* IMAGE SECTION */}
        {machine.image ? (
          <View
  style={{
    width: "100%",
    paddingHorizontal: s(10),
    paddingTop: s(10),
    backgroundColor: "white",
  }}
>
  <Image
    source={{ uri: machine.image }}
    style={{
      width: "100%",
      height: clamp(v(150), 135, 180),
      borderRadius: s(16),
    }}
    resizeMode="cover"
  />
</View>

        ) : (
          <View
            style={{
              width: "100%",
              height: clamp(v(200), 170, 240),
              backgroundColor: "#E5E7EB",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#6B7280" }}>No image</Text>
          </View>
        )}

        {/* TEXT SECTION */}
        <View style={{ padding: s(16) }}>
          <Text
            style={{
              fontFamily: "Nunito_700Bold",
              fontSize: clamp(s(18), 16, 20),
              color: "#0B0B0F",
            }}
          >
            {machine.name}
          </Text>

          <Text
            style={{
              marginTop: s(6),
              fontSize: clamp(s(14), 13, 16),
              lineHeight: clamp(s(20), 18, 22),
              color: "#6B7280",
            }}
          >
            {machine.subtitle}
          </Text>

          <Text
            style={{
              marginTop: s(10),
              fontWeight: "800",
              color: "#111827",
            }}
          >
            Open →
          </Text>
        </View>
      </Pressable>
    ))
  )}
</View>

      {/* AI BANNER */}
      <Pressable
        onPress={openAIShotAnalysis}
        style={({ pressed }) => ({
          marginTop: s(18),
          borderRadius: s(22),
          overflow: "hidden",
          backgroundColor: "#0B0B0F",
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.08)",
          transform: [{ scale: pressed ? 0.99 : 1 }],
          opacity: pressed ? 0.96 : 1,
        })}
      >
        <Image
          source={require("../assets/images/home/ai-shot.jpg")}
          style={{ width: "100%", height: clamp(v(180), 140, 220), opacity: 0.88 }}
          resizeMode="cover"
        />
        <View style={{ position: "absolute", left: s(16), right: s(16), bottom: s(14) }}>
          <Text style={{ color: "white", fontFamily: "Nunito_700Bold", fontSize: clamp(s(18), 16, 20) }}>
            AI Shot Analysis
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.85)",
              marginTop: s(6),
              fontSize: clamp(s(13.5), 12.5, 15),
              lineHeight: clamp(s(18), 16, 20),
            }}
            numberOfLines={2}
          >
            Record your extraction → get grind adjustments.
          </Text>
        </View>
      </Pressable>

      {/* LEARN */}
      <Text
        style={{
          marginTop: s(18),
          marginBottom: s(10),
          fontFamily: "Nunito_700Bold",
          fontSize: clamp(s(18), 16, 20),
          color: "#0B0B0F",
        }}
      >
        Learn The Basics
      </Text>

      <Pressable
        onPress={() => router.push("/brewing")}
        style={({ pressed }) => ({
          borderRadius: s(22),
          overflow: "hidden",
          backgroundColor: "#0B0B0F",
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.08)",
          opacity: pressed ? 0.96 : 1,
        })}
      >
        <Image
          source={require("../assets/images/home/brewing-guide.jpg")}
          style={{ width: "100%", height: clamp(v(190), 150, 230), opacity: 0.92 }}
          resizeMode="cover"
        />
        <View style={{ position: "absolute", left: s(16), right: s(16), bottom: s(14) }}>
          <Text style={{ color: "rgba(255,255,255,0.78)", fontWeight: "800", fontSize: clamp(s(12), 11, 13) }}>
            GLOBAL BREWING GUIDE
          </Text>
          <Text style={{ marginTop: s(6), color: "white", fontFamily: "Nunito_700Bold", fontSize: clamp(s(20), 18, 24) }}>
            Espresso workflow that works.
          </Text>
          <Text
            style={{
              marginTop: s(6),
              color: "rgba(255,255,255,0.85)",
              fontSize: clamp(s(13.5), 12.5, 15),
              lineHeight: clamp(s(18), 16, 20),
            }}
            numberOfLines={2}
          >
            Dose → prep → time → taste. Simple rules you can reuse forever.
          </Text>
        </View>
      </Pressable>

      <View
        style={{
          marginTop: s(12),
          borderRadius: s(20),
          padding: s(14),
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.06)",
          ...shadowCard(),
        }}
      >
        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: clamp(s(15.5), 14, 17), color: "#0B0B0F" }}>
          One change at a time
        </Text>
        <Text style={{ marginTop: s(6), color: "#6B7280", fontSize: clamp(s(13.5), 12.5, 15), lineHeight: clamp(s(18), 16, 20) }}>
          Dial-in gets easy when you adjust only one thing: grind, then dose, then ratio.
        </Text>
      </View>

      <Pressable
        onPress={() => router.push("/cleaning")}
        style={({ pressed }) => ({
          marginTop: s(12),
          flexDirection: "row",
          borderRadius: s(22),
          overflow: "hidden",
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.06)",
          ...shadowCard(),
          opacity: pressed ? 0.98 : 1,
        })}
      >
        <View style={{ flex: 1, padding: s(14) }}>
          <Text style={{ color: "#6B7280", fontWeight: "800", fontSize: clamp(s(12), 11, 13) }}>
            CLEANING GUIDE
          </Text>
          <Text style={{ marginTop: s(6), fontFamily: "Nunito_700Bold", fontSize: clamp(s(18), 16, 22), color: "#0B0B0F" }}>
            Keep the taste clean.
          </Text>
          <Text
            style={{
              marginTop: s(6),
              color: "#6B7280",
              fontSize: clamp(s(13.5), 12.5, 15),
              lineHeight: clamp(s(18), 16, 20),
            }}
            numberOfLines={3}
          >
            Daily rinse, weekly backflush (if supported), and a simple monthly deep clean.
          </Text>

          <Text style={{ marginTop: s(10), fontWeight: "800", color: "#111827" }}>
            Open →
          </Text>
        </View>

        <Image
          source={require("../assets/images/home/cleaning-guide.jpg")}
          style={{ width: clamp(s(120), 110, 150), height: "100%" }}
          resizeMode="cover"
        />
      </Pressable>

      {/* FOOTER */}
      <View style={{ marginTop: s(20), paddingBottom: s(10) }}>
        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: clamp(s(16), 14.5, 18), color: "#0B0B0F" }}>
          DialedIn
        </Text>
        <Text
          style={{
            marginTop: s(6),
            fontSize: clamp(s(13), 12, 14.5),
            lineHeight: clamp(s(18), 16, 20),
            color: "#6B7280",
          }}
          numberOfLines={2}
        >
          Built to make espresso simpler: guides, routines, and data-driven dialing.
        </Text>
      </View>
    </ScrollView>
  );
}