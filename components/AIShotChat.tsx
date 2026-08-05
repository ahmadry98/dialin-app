import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { clamp, s } from "../utils/ui";
import {
  createMediaUploadUrl,
  registerMediaUpload,
  sendAIShotChat,
  uploadFileToMediaUrl,
  type AnalyzeShotResponse,
  type ChatMessage,
  type ShotContext,
} from "../lib/aiShotApi";

type LocalMessage = ChatMessage & {
  id: string;
  attachment_uri?: string | null;
  attachment_label?: string | null;
  attachment_type?: "image" | "video" | null;
};

type AIShotChatProps = {
  machineName?: string | null;
};

const INITIAL_MESSAGE: LocalMessage = {
  id: "assistant-start",
  role: "assistant",
  content: "Hey, I can help dial in your espresso shot. What machine are you using?",
};

export default function AIShotChat({ machineName }: AIShotChatProps) {
  const [messages, setMessages] = useState<LocalMessage[]>([INITIAL_MESSAGE]);
  const [shotContext, setShotContext] = useState<ShotContext>(() => ({
    user_id: "demo-user",
    machine: machineName || null,
  }));
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeShotResponse | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!machineName) return;
    setShotContext((current) => ({ ...current, machine: current.machine || machineName }));
    setMessages((current) => {
      if (current.length > 1) return current;
      return [
        {
          id: "assistant-start-with-machine",
          role: "assistant",
          content: `I have ${machineName} selected. What grinder are you using? If it is built into the machine, say built-in.`,
        },
      ];
    });
  }, [machineName]);

  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [messages, isSending]);

  const visibleAnalysis = analysis ?? null;
  const canSend = input.trim().length > 0 && !isSending;

  async function submitMessage(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || isSending) return;

    setInput("");
    await sendMessage({ id: `${Date.now()}-user`, role: "user", content: text });
  }

  async function sendMessage(userMessage: LocalMessage, contextOverride?: ShotContext) {
    if (isSending) return;

    setError(null);
    const nextMessages = [...messages, userMessage];
    const contextForRequest = contextOverride ?? shotContext;
    setMessages(nextMessages);
    if (contextOverride) setShotContext(contextOverride);
    setIsSending(true);

    try {
      const response = await sendAIShotChat(
        nextMessages.map(({ role, content, image_base64, image_kind, image_media_type }) => ({
          role,
          content,
          image_base64,
          image_kind,
          image_media_type,
        })),
        contextForRequest,
      );
      const assistantMessage: LocalMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: response.response,
      };
      setMessages([...nextMessages, assistantMessage]);
      setShotContext(response.shot_context ?? contextForRequest);
      if (response.analysis_result) {
        setAnalysis(response.analysis_result);
        setAnalysisOpen(true);
      }
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Could not reach DialChat.";
      setError(message);
    } finally {
      setIsSending(false);
    }
  }

  async function attachMedia() {
    if (isSending) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to attach a photo or shot video.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      base64: true,
      mediaTypes: ["images", "videos"],
      quality: 0.8,
    });

    if (result.canceled || !result.assets.length) return;

    const asset = result.assets[0];
    if (asset.type === "video" || isVideoAsset(asset)) {
      await attachShotVideoAsset(asset);
      return;
    }

    const kind = inferPhotoKind(shotContext);
    if (!asset.base64) {
      Alert.alert("Could not read photo", "Try choosing a different image.");
      return;
    }

    await sendMessage({
      id: `${Date.now()}-${kind}-photo`,
      role: "user",
      content: "Photo attached",
      image_base64: asset.base64,
      image_media_type: asset.mimeType || "image/jpeg",
      image_kind: kind,
      attachment_uri: asset.uri,
      attachment_label: null,
      attachment_type: "image",
    });
  }

  async function attachShotVideoAsset(asset: ImagePicker.ImagePickerAsset) {
    const filename = asset.fileName || asset.uri.split("/").pop() || "shot-video.mov";
    const contentType = asset.mimeType || (filename.toLowerCase().endsWith(".mov") ? "video/quicktime" : "video/mp4");

    setError(null);
    setIsSending(true);
    try {
      const target = await createMediaUploadUrl({
        filename,
        content_type: contentType,
        media_kind: "shot_video",
        user_id: shotContext.user_id || "demo-user",
      });
      await uploadFileToMediaUrl({
        file_uri: asset.uri,
        upload_url: target.upload_url,
        content_type: contentType,
        headers: target.headers,
      });
      const registered = await registerMediaUpload({
        media_key: target.media_key,
        media_kind: "shot_video",
        storage_mode: target.storage_mode,
        content_type: contentType,
      });

      const nextContext = { ...shotContext, video_s3_key: registered.video_s3_key || registered.media_key };
      setIsSending(false);
      await sendMessage(
        {
          id: `${Date.now()}-shot-video`,
          role: "user",
          content: "Shot video attached",
          attachment_uri: asset.uri,
          attachment_label: null,
          attachment_type: "video",
        },
        nextContext,
      );
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Could not upload the shot video.";
      setError(message);
      setIsSending(false);
    }
  }


  const contextSummary = useMemo(() => summarizeContext(shotContext), [shotContext]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={s(86)}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, backgroundColor: "#F7F7F8" }}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: s(16), paddingBottom: s(18), gap: s(12) }}
        >
          {messages.map((message) => <Bubble key={message.id} message={message} />)}

          {isSending ? (
            <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: s(8), padding: s(12) }}>
              <ActivityIndicator size="small" color="#111827" />
              <Text style={{ color: "#6B7280", fontWeight: "700" }}>DialChat is thinking</Text>
            </View>
          ) : null}

          {error ? (
            <View style={{ borderRadius: s(16), borderWidth: 1, borderColor: "#F2B8B5", backgroundColor: "#FFF1F0", padding: s(12) }}>
              <Text style={{ color: "#A33A33", fontWeight: "800" }}>Load failed</Text>
              <Text style={{ marginTop: s(4), color: "#A33A33" }}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={{ borderTopWidth: 1, borderTopColor: "#E5E7EB", padding: s(12), backgroundColor: "white" }}>
          {contextSummary.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: s(8), paddingBottom: s(10) }}>
              {contextSummary.map((item) => <ContextPill key={item} label={item} />)}
            </ScrollView>
          ) : null}

          {visibleAnalysis ? (
            <Pressable
              onPress={() => setAnalysisOpen(true)}
              style={({ pressed }) => ({
                marginBottom: s(10),
                borderRadius: s(16),
                padding: s(12),
                backgroundColor: pressed ? "#E9EAEE" : "#F1F2F4",
                borderWidth: 1,
                borderColor: "#DEE1E7",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              })}
            >
              <View style={{ flex: 1, paddingRight: s(12) }}>
                <Text style={{ fontFamily: "Nunito_700Bold", color: "#111827", fontSize: clamp(s(15), 14, 17) }}>View shot analysis</Text>
                <Text numberOfLines={1} style={{ marginTop: s(2), color: "#6B7280" }}>{visibleAnalysis.recommendation.adjustment}</Text>
              </View>
              <Ionicons name="analytics-outline" size={22} color="#111827" />
            </Pressable>
          ) : null}

          <View style={{ flexDirection: "row", alignItems: "center", gap: s(8) }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Message DialChat..."
              placeholderTextColor="#A1A1AA"
              returnKeyType="send"
              onSubmitEditing={() => submitMessage()}
              style={{
                flex: 1,
                minHeight: s(48),
                maxHeight: s(108),
                borderRadius: s(24),
                borderWidth: 1,
                borderColor: "#E0E2E7",
                backgroundColor: "#F7F7F8",
                paddingHorizontal: s(16),
                color: "#111827",
                fontSize: clamp(s(15), 14, 17),
              }}
            />

            <Pressable
              onPress={attachMedia}
              accessibilityLabel="Attach photo or video"
              style={({ pressed }) => ({
                width: s(48),
                height: s(48),
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#E0E2E7",
                backgroundColor: pressed ? "#E9EAEE" : "#F7F7F8",
              })}
            >
              <Ionicons name="attach" size={22} color="#111827" />
            </Pressable>

            <Pressable
              onPress={() => submitMessage()}
              disabled={!canSend}
              accessibilityLabel="Send message"
              style={({ pressed }) => ({
                width: s(48),
                height: s(48),
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: canSend ? (pressed ? "#2E2E33" : "#111113") : "#C9CDD4",
              })}
            >
              <Ionicons name="send" size={20} color="white" />
            </Pressable>
          </View>
        </View>

        <AnalysisModal analysis={visibleAnalysis} visible={analysisOpen} onClose={() => setAnalysisOpen(false)} />
      </View>
    </KeyboardAvoidingView>
  );
}

function inferPhotoKind(context: ShotContext): "machine" | "grinder" {
  if (!context.machine || context.pending_gear_type === "machine") return "machine";
  if (!context.uses_built_in_grinder && (!context.grinder || context.pending_gear_type === "grinder")) return "grinder";
  return "machine";
}

function isVideoAsset(asset: ImagePicker.ImagePickerAsset): boolean {
  const mime = asset.mimeType?.toLowerCase() || "";
  const uri = asset.uri.toLowerCase();
  return mime.startsWith("video/") || /\.(mov|mp4|m4v)$/i.test(uri);
}


function Bubble({ message }: { message: LocalMessage }) {
  const isUser = message.role === "user";
  return (
    <View
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "84%",
        borderRadius: s(22),
        borderBottomRightRadius: isUser ? s(8) : s(22),
        borderBottomLeftRadius: isUser ? s(22) : s(8),
        padding: message.attachment_uri ? s(6) : s(12),
        backgroundColor: isUser ? "#F1F2F4" : "white",
        borderWidth: 1,
        borderColor: isUser ? "#D9DCE3" : "#ECEEF2",
      }}
    >
      {message.attachment_uri ? (
        <View>
          {message.attachment_type === "video" ? (
            <View
              style={{
                width: s(210),
                minHeight: s(142),
                borderRadius: s(17),
                backgroundColor: "#111113",
                alignItems: "center",
                justifyContent: "center",
                padding: s(16),
              }}
            >
              <Ionicons name="play-circle" size={44} color="white" />
            </View>
          ) : (
            <Image
              source={{ uri: message.attachment_uri }}
              style={{ width: s(210), height: s(210), borderRadius: s(17), backgroundColor: "#E5E7EB" }}
              resizeMode="cover"
            />
          )}
        </View>
      ) : (
        <Text style={{ color: "#111827", fontSize: clamp(s(15), 14, 17), lineHeight: clamp(s(21), 19, 23) }}>{message.content}</Text>
      )}
    </View>
  );
}

function ContextPill({ label }: { label: string }) {
  return (
    <View style={{ borderRadius: 999, backgroundColor: "#F1F2F4", borderWidth: 1, borderColor: "#E1E4EA", paddingVertical: s(7), paddingHorizontal: s(10) }}>
      <Text style={{ color: "#4B5563", fontWeight: "800", fontSize: clamp(s(12), 11, 13) }}>{label}</Text>
    </View>
  );
}

function AnalysisModal({ analysis, visible, onClose }: { analysis: AnalyzeShotResponse | null; visible: boolean; onClose: () => void }) {
  if (!analysis) return null;
  const recommendation = analysis.recommendation;
  const timing = analysis.timing;
  return (
    <Modal animationType="slide" visible={visible} presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#F7F7F8", padding: s(18) }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: s(14) }}>
          <View>
            <Text style={{ fontFamily: "Nunito_700Bold", fontSize: clamp(s(24), 21, 28), color: "#111827" }}>Shot Analysis</Text>
            <Text style={{ color: "#6B7280", marginTop: s(2) }}>{recommendation.confidence} confidence</Text>
          </View>
          <Pressable onPress={onClose} style={{ width: s(42), height: s(42), borderRadius: 999, backgroundColor: "white", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="close" size={22} color="#111827" />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: s(12), paddingBottom: s(20) }}>
          <InfoCard title="Timing">
            <MetricRow label="Total" value={timing.total_shot_seconds == null ? "unknown" : `${timing.total_shot_seconds}s`} />
            <MetricRow label="Start" value={timing.machine_start_time == null ? "manual" : `${timing.machine_start_time}s`} />
            <MetricRow label="Stop" value={timing.machine_stop_time == null ? "manual" : `${timing.machine_stop_time}s`} />
          </InfoCard>

          <InfoCard title="Recommendation">
            <Text style={{ fontFamily: "Nunito_700Bold", fontSize: clamp(s(26), 22, 30), color: "#111827" }}>{titleCase(recommendation.recommendation)}</Text>
            <Text style={{ marginTop: s(6), color: "#111827", fontWeight: "800" }}>{recommendation.adjustment}</Text>
            <Text style={{ marginTop: s(8), color: "#4B5563", lineHeight: clamp(s(20), 18, 22) }}>{recommendation.reason}</Text>
          </InfoCard>

          {recommendation.calculation_explanation?.length ? (
            <InfoCard title="Why this setting">
              {recommendation.calculation_explanation.map((item) => <Bullet key={item} text={item} />)}
            </InfoCard>
          ) : null}

          {recommendation.confidence_reasons?.length ? (
            <InfoCard title="Confidence">
              {recommendation.confidence_reasons.map((item) => <Bullet key={item} text={item} />)}
            </InfoCard>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ borderRadius: s(20), backgroundColor: "white", borderWidth: 1, borderColor: "#E6E8EE", padding: s(16) }}>
      <Text style={{ fontFamily: "Nunito_700Bold", color: "#111827", fontSize: clamp(s(16), 15, 18), marginBottom: s(8) }}>{title}</Text>
      {children}
    </View>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: s(6) }}>
      <Text style={{ color: "#6B7280", fontWeight: "700" }}>{label}</Text>
      <Text style={{ color: "#111827", fontWeight: "900" }}>{value}</Text>
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: "row", gap: s(8), marginTop: s(6) }}>
      <Text style={{ color: "#6B7280" }}>•</Text>
      <Text style={{ flex: 1, color: "#4B5563", lineHeight: clamp(s(19), 17, 21) }}>{text}</Text>
    </View>
  );
}

function summarizeContext(context: ShotContext): string[] {
  const items: string[] = [];
  if (context.machine) items.push(`Machine: ${context.machine}`);
  if (context.uses_built_in_grinder) items.push("Grinder: built-in");
  else if (context.grinder) items.push(`Grinder: ${context.grinder}`);
  if (context.grind_setting) items.push(`Grind: ${context.grind_setting}`);
  if (context.dose_g) items.push(`Dose: ${context.dose_g}g`);
  if (context.roast_level) items.push(`Roast: ${context.roast_level}`);
  if (context.taste) items.push(`Taste: ${context.taste}`);
  if (context.total_shot_seconds) items.push(`Timing: ${context.total_shot_seconds}s`);
  return items;
}

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
