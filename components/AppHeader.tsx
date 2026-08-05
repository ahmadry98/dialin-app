import React from "react";
import { View, Text, Pressable, TextInput, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSearch } from "./SearchContext";
import { useDrawer } from "./DrawerContext";

export default function AppHeader() {
  const insets = useSafeAreaInsets();
  const { isSearchOpen, query, setQuery, toggleSearch } = useSearch();
  const { toggle } = useDrawer();

  return (
    <View style={{ backgroundColor: "white", paddingTop: insets.top }}>
      <View
        style={{
          height: 56,
          paddingHorizontal: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(0,0,0,0.06)",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Pressable onPress={toggle} style={{ padding: 8 }}>
            <Text style={{ fontSize: 22 }}>☰</Text>
          </Pressable>

          {isSearchOpen ? (
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search..."
              autoFocus
              style={{
                marginLeft: 8,
                flex: 1,
                height: 36,
                backgroundColor: "#F3F4F6",
                borderRadius: 999,
                paddingHorizontal: 12,
              }}
            />
          ) : (
            <Text
              style={{
                fontFamily: "Nunito_700Bold",
                fontSize: 22,
                marginLeft: 8,
              }}
            >
              DialedIn
            </Text>
          )}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={require("../assets/images/Logo.png")}
            style={{
              width: 40,
              height: 40,
              resizeMode: "contain",
              marginRight: 10,
            }}
          />

          <Pressable onPress={toggleSearch} style={{ padding: 8 }}>
            {isSearchOpen ? (
              <Text style={{ fontSize: 20 }}>✕</Text>
            ) : (
              <Image
                source={require("../assets/images/icons/portafilter.png")}
                style={{
                  width: 22,
                  height: 22,
                  resizeMode: "contain",
                  tintColor: "#0B0B0F",
                }}
              />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}