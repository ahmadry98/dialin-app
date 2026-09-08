import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../lib/auth";
import { clamp, s } from "../utils/ui";

type Mode = "signIn" | "signUp" | "confirm" | "forgot" | "reset";

export default function AuthScreen() {
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const title = mode === "signUp" ? "Create your account"
    : mode === "confirm" ? "Verify your email"
    : mode === "forgot" ? "Reset your password"
    : mode === "reset" ? "Choose a new password"
    : "Welcome back";

  const submit = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "signUp") {
        await auth.signUp(email, password);
        setMode("confirm");
        setNotice("We sent a verification code to your email.");
      } else if (mode === "confirm") {
        await auth.confirmSignUp(email, code);
        setMode("signIn");
        setNotice("Email verified. You can sign in now.");
      } else if (mode === "forgot") {
        await auth.requestPasswordReset(email);
        setMode("reset");
        setNotice("Enter the code from your email.");
      } else if (mode === "reset") {
        await auth.confirmPasswordReset(email, code, password);
        setMode("signIn");
        setNotice("Password updated. Sign in with your new password.");
      } else {
        await auth.signIn(email, password);
        router.replace((params.returnTo || "/ai") as never);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const needsPassword = mode === "signIn" || mode === "signUp" || mode === "reset";
  const needsCode = mode === "confirm" || mode === "reset";
  const actionLabel = mode === "signUp" ? "Create account"
    : mode === "confirm" ? "Verify email"
    : mode === "forgot" ? "Send reset code"
    : mode === "reset" ? "Update password"
    : "Sign in";

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#F6F6F8" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: s(22),
          paddingTop: s(72),
          paddingBottom: s(28),
          justifyContent: "flex-start",
        }}
      >
        <Pressable onPress={() => router.back()} accessibilityLabel="Close account screen" style={{ position: "absolute", top: s(18), right: s(20), width: s(42), height: s(42), borderRadius: 21, backgroundColor: "white", alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="close" size={22} color="#111827" />
        </Pressable>

        <View style={{ width: "100%", maxWidth: 440, alignSelf: "center" }}>
          <Text style={{ color: "#6B7280", fontWeight: "800", fontSize: 12 }}>DIALEDIN ACCOUNT</Text>
          <Text style={{ marginTop: s(8), fontFamily: "Nunito_700Bold", fontSize: clamp(s(30), 26, 34), color: "#111827" }}>{title}</Text>
          <Text style={{ marginTop: s(7), color: "#6B7280", fontSize: 15, lineHeight: 21 }}>
            Save your setup and shot history across devices.
          </Text>

          <View style={{ marginTop: s(28), gap: s(14) }}>
            <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            {needsCode ? <Field label="Verification code" value={code} onChangeText={setCode} keyboardType="number-pad" /> : null}
            {needsPassword ? <Field label={mode === "reset" ? "New password" : "Password"} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" /> : null}
          </View>

          {error ? <Text style={{ marginTop: s(14), color: "#B42318", lineHeight: 20 }}>{error}</Text> : null}
          {notice ? <Text style={{ marginTop: s(14), color: "#166534", lineHeight: 20 }}>{notice}</Text> : null}

          <Pressable disabled={busy || !email.trim() || (needsPassword && password.length < 8) || (needsCode && !code.trim())} onPress={submit} style={({ pressed }) => ({ marginTop: s(22), height: s(52), borderRadius: s(8), backgroundColor: "#0B0B0F", alignItems: "center", justifyContent: "center", opacity: busy || pressed ? 0.7 : 1 })}>
            {busy ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontFamily: "Nunito_700Bold", fontSize: 16 }}>{actionLabel}</Text>}
          </Pressable>

          {mode === "signIn" ? (
            <>
              <Pressable onPress={() => { setMode("forgot"); setError(""); }} style={{ paddingVertical: s(16), alignItems: "center" }}><Text style={{ color: "#374151", fontWeight: "700" }}>Forgot password?</Text></Pressable>
              <Pressable onPress={() => { setMode("signUp"); setError(""); }} style={{ borderTopWidth: 1, borderTopColor: "#E5E7EB", paddingTop: s(18), alignItems: "center" }}><Text style={{ color: "#111827" }}>New to DialedIn? <Text style={{ fontWeight: "800" }}>Create an account</Text></Text></Pressable>
            </>
          ) : (
            <Pressable onPress={() => { setMode("signIn"); setError(""); }} style={{ paddingVertical: s(18), alignItems: "center" }}><Text style={{ color: "#111827", fontWeight: "800" }}>Back to sign in</Text></Pressable>
          )}

          {mode === "confirm" ? <Pressable onPress={async () => { try { await auth.resendConfirmation(email); setNotice("A new code was sent."); } catch (e) { setError(e instanceof Error ? e.message : "Could not resend code."); } }} style={{ alignItems: "center" }}><Text style={{ color: "#4B5563" }}>Resend verification code</Text></Pressable> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, ...inputProps } = props;
  return (
    <View>
      <Text style={{ marginBottom: s(7), color: "#374151", fontWeight: "700" }}>{label}</Text>
      <TextInput {...inputProps} placeholderTextColor="#9CA3AF" style={{ height: s(50), borderWidth: 1, borderColor: "#D1D5DB", borderRadius: s(8), paddingHorizontal: s(14), backgroundColor: "white", color: "#111827", fontSize: 16 }} />
    </View>
  );
}
