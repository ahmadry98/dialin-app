import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, Nunito_700Bold } from "@expo-google-fonts/nunito";

import AppHeader from "../components/AppHeader";
import SideDrawer from "../components/SideDrawer";
import { DrawerProvider } from "../components/DrawerContext";
import { SearchProvider } from "../components/SearchContext";
import { AuthProvider } from "../lib/auth";

const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#F6F6F8",
    card: "#FFFFFF",
  },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider value={appTheme}>
        <AuthProvider>
        <SearchProvider>
          <DrawerProvider>
            <AppHeader />

            <Stack
              screenOptions={{
                headerShown: false,
                gestureEnabled: false,
                contentStyle: { backgroundColor: "#F6F6F8" },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="select-machine" />
              <Stack.Screen name="select-grinder" />
              <Stack.Screen name="ai" />
              <Stack.Screen name="machine/[slug]" />
              <Stack.Screen name="brewing" />
              <Stack.Screen name="cleaning" />
              <Stack.Screen name="contact" />
              <Stack.Screen name="about" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="account" />
              <Stack.Screen name="upgrade" />
            </Stack>

            <SideDrawer />
          </DrawerProvider>
        </SearchProvider>
        </AuthProvider>

        <StatusBar style="dark" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
