import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View, Image } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDrawer } from "./DrawerContext";
import { clamp, s, screen } from "../utils/ui";
import { getPreferredMachineId, getLastRoast } from "../utils/storage";
import { MACHINES } from "../data/machines";
import { Ionicons } from "@expo/vector-icons";

const DRAWER_WIDTH = clamp(screen.W * 0.72, 280, 380);

export default function SideDrawer() {
  const { isOpen, close } = useDrawer();
  const insets = useSafeAreaInsets();

  const [preferredId, setPreferredId] = useState<string | null>(null);
  const [lastRoast, setLastRoast] = useState<string | null>(null);

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: isOpen ? 0 : -DRAWER_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: isOpen ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen, translateX, backdropOpacity]);

  useEffect(() => {
    if (!isOpen) return;

    (async () => {
      const machineId = await getPreferredMachineId();
      setPreferredId(machineId);

      if (machineId) {
        const roast = await getLastRoast(machineId);
        setLastRoast(roast);
      } else {
        setLastRoast(null);
      }
    })();
  }, [isOpen]);

  const go = (path: string) => {
    close();
    router.push(path as any);
  };

  const goToLastShot = () => {
    if (!preferredId) return;
    close();
    router.replace(`/machine/${preferredId}` as any);
    router.push(`/machine/${preferredId}/dial-in` as any);
  };

  const goToAIShotAnalysis = () => {
    close();
    if (preferredId) {
      router.replace(`/machine/${preferredId}` as any);
      router.push(`/machine/${preferredId}/ai` as any);
      return;
    }
    router.push("/ai" as any);
  };

  const preferredMachine = preferredId ? MACHINES[preferredId] : null;

  return (
    <View
      pointerEvents={isOpen ? "auto" : "none"}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Backdrop */}
      <Pressable onPress={close} style={{ flex: 1 }}>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            opacity: backdropOpacity,
          }}
        />
      </Pressable>

      {/* Drawer */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: DRAWER_WIDTH,
          transform: [{ translateX }],
          backgroundColor: "#FFFFFF",
          paddingTop: insets.top + s(8),
          paddingHorizontal: s(14),
          borderRightWidth: 1,
          borderRightColor: "rgba(0,0,0,0.06)",
        }}
      >
        {/* Brand */}
        <View
          style={{
            paddingBottom: s(12),
            borderBottomWidth: 1,
            borderBottomColor: "rgba(0,0,0,0.06)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={require("../assets/images/Logo.png")}
              style={{
                width: s(40),
                height: s(40),
                resizeMode: "contain",
                marginRight: s(9),
              }}
            />

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "Nunito_700Bold",
                  fontSize: clamp(s(21), 18, 24),
                  color: "#0B0B0F",
                }}
              >
                DialedIn
              </Text>

              <Text
                style={{
                  marginTop: s(2),
                  fontSize: clamp(s(12.5), 12, 14),
                  color: "#6B7280",
                }}
              >
                Your espresso copilot
              </Text>
            </View>
          </View>
        </View>

        {/* Continue card */}
        {preferredMachine ? (
          <Pressable
            onPress={goToLastShot}
            style={({ pressed }) => ({
              marginTop: s(12),
              borderRadius: s(16),
              overflow: "hidden",
              backgroundColor: "#0B0B0F",
              opacity: pressed ? 0.95 : 1,
            })}
          >
            <Image
              source={preferredMachine.image}
              style={{
                width: "100%",
                height: s(96),
                opacity: 0.72,
              }}
              resizeMode="cover"
            />

            <View
              style={{
                position: "absolute",
                left: s(13),
                right: s(13),
                top: s(12),
                bottom: s(12),
                justifyContent: "space-between",
              }}
            >
              <View>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.72)",
                    fontWeight: "800",
                    fontSize: clamp(s(11.5), 11, 13),
                  }}
                >
                  CONTINUE LAST SHOT
                </Text>

                <Text
                  style={{
                    marginTop: s(6),
                    color: "white",
                    fontFamily: "Nunito_700Bold",
                    fontSize: clamp(s(17), 15.5, 20),
                  }}
                  numberOfLines={1}
                >
                  {preferredMachine.name}
                </Text>
              </View>

              {lastRoast ? (
                <Text
                  style={{
                    color: "rgba(255,255,255,0.85)",
                    fontSize: clamp(s(12.5), 12, 14),
                  }}
                >
                  Roast: {lastRoast}
                </Text>
              ) : (
                <Text
                  style={{
                    color: "rgba(255,255,255,0.85)",
                    fontSize: clamp(s(12.5), 12, 14),
                  }}
                >
                  Open dial-in →
                </Text>
              )}
            </View>
          </Pressable>
        ) : null}

        {/* NAVIGATION */}
        <Text
          style={{
            marginTop: s(14),
            marginBottom: s(5),
            fontSize: clamp(s(12), 11, 13),
            fontWeight: "800",
            color: "#6B7280",
            letterSpacing: 0.8,
          }}
        >
          NAVIGATION
        </Text>

        <MenuItem
          icon="home-outline"
          label="Home"
          onPress={() => go("/")}
        />

        <MenuItem
          icon="cafe-outline"
          label="Machines"
          onPress={() => go("/select-machine")}
        />

        <MenuItem
          icon="options-outline"
          label="Grinders"
          onPress={() => go("/select-grinder")}
        />

        <MenuItem
          icon="cafe-outline"
          label="Brewing Guide"
          onPress={() => go("/brewing")}
        />

        <MenuItem
          icon="sparkles-outline"
          label="Cleaning Guide"
          onPress={() => go("/cleaning")}
        />

        {/* TOOLS */}
        <Text
          style={{
            marginTop: s(12),
            marginBottom: s(5),
            fontSize: clamp(s(12), 11, 13),
            fontWeight: "800",
            color: "#6B7280",
            letterSpacing: 0.8,
          }}
        >
          TOOLS
        </Text>

        <MenuItem
          icon="camera-outline"
          label="AI Shot Analysis"
          onPress={goToAIShotAnalysis}
        />

        <View style={{ flex: 1 }} />

        {/* ABOUT */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: "rgba(0,0,0,0.06)",
            paddingTop: s(8),
            marginBottom: s(4),
          }}
        >
          <Text
            style={{
              marginBottom: s(5),
              fontSize: clamp(s(12), 11, 13),
              fontWeight: "800",
              color: "#6B7280",
              letterSpacing: 0.8,
            }}
          >
            ABOUT
          </Text>

          <MenuItem
            icon="information-circle-outline"
            label="About us"
            onPress={() => go("/about")}
          />

          <MenuItem
            icon="mail-outline"
            label="Contact us"
            onPress={() => go("/contact")}
          />
        </View>

        {/* Footer */}
        <View
          style={{
            paddingTop: s(12),
            paddingBottom: s(28),
            borderTopWidth: 1,
            borderTopColor: "rgba(0,0,0,0.06)",
          }}
        >
          <Text
            style={{
              fontSize: clamp(s(12), 11.5, 13),
              color: "#6B7280",
            }}
          >
            DialedIn • v1
          </Text>
          <Text
            style={{
              marginTop: s(7),
              fontSize: clamp(s(11.5), 11, 12.5),
              color: "#9CA3AF",
            }}
          >
            Learn espresso the simple way.
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  disabled = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: s(9),
        paddingHorizontal: s(10),
        borderRadius: s(12),
        backgroundColor: pressed && !disabled ? "rgba(0,0,0,0.045)" : "transparent",
        marginBottom: s(1),
        opacity: disabled ? 0.45 : 1,
      })}
    >
      <Ionicons
        name={icon}
        size={19}
        color="#111827"
        style={{ marginRight: s(10) }}
      />
      <Text
        style={{
          fontSize: clamp(s(15), 14, 16.5),
          fontWeight: "600",
          color: "#0B0B0F",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}