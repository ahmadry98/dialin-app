import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { AUTH_ENABLED, useAuth } from "../lib/auth";

export default function AuthGate({ children, returnTo }: { children: React.ReactNode; returnTo: string }) {
  const { loading, session } = useAuth();

  useEffect(() => {
    if (AUTH_ENABLED && !loading && !session) {
      router.replace({ pathname: "/auth", params: { returnTo } } as never);
    }
  }, [loading, returnTo, session]);

  if (AUTH_ENABLED && (loading || !session)) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F7F7F8" }}>
        <ActivityIndicator color="#111827" />
      </View>
    );
  }

  return <>{children}</>;
}

