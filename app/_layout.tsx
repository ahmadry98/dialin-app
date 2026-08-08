import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useFonts, Nunito_700Bold } from "@expo-google-fonts/nunito";

import AppHeader from "../components/AppHeader";
import SideDrawer from "../components/SideDrawer";
import { DrawerProvider } from "../components/DrawerContext";
import { SearchProvider } from "../components/SearchContext";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    Nunito_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <SearchProvider>
          <DrawerProvider>
            <AppHeader />

            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="select-machine" />
              <Stack.Screen name="select-grinder" />
              <Stack.Screen name="ai" />
              <Stack.Screen name="machine/[slug]" />
              <Stack.Screen name="brewing" />
              <Stack.Screen name="cleaning" />
              <Stack.Screen name="contact" />
              <Stack.Screen name="about" />
            </Stack>

            <SideDrawer />
          </DrawerProvider>
        </SearchProvider>

        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}