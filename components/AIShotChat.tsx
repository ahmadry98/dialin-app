import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { VideoView, useVideoPlayer } from "expo-video";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { captureEvent, captureException } from "../lib/observability";
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
  grinderName?: string | null;
  usesBuiltInGrinder?: boolean | null;
  chatSessionKey?: string;
};

export type AIShotChatHandle = {
  reset: () => void;
};

type StoredChatSession = {
  messages: LocalMessage[];
  shotContext: ShotContext;
  analysis: AnalyzeShotResponse | null;
};

const CHAT_STORAGE_PREFIX = "dialchat-session-v2";
const MAX_SHOT_VIDEO_SECONDS = 80;
const MAX_SHOT_VIDEO_MS = MAX_SHOT_VIDEO_SECONDS * 1000;
const MAX_RECOGNITION_IMAGE_SIDE = 1200;
const RECOGNITION_IMAGE_QUALITY = 0.78;

const INITIAL_MESSAGE: LocalMessage = {
  id: "assistant-start",
  role: "assistant",
  content: "Let’s dial in your shot. What machine are you using?",
};

function AIShotChat({ machineName, grinderName, usesBuiltInGrinder, chatSessionKey = "default" }: AIShotChatProps, ref: React.Ref<AIShotChatHandle>) {
  const [messages, setMessages] = useState<LocalMessage[]>([INITIAL_MESSAGE]);
  const [shotContext, setShotContext] = useState<ShotContext>(() => ({
    user_id: "demo-user",
    machine: machineName || null,
    grinder: usesBuiltInGrinder ? (machineName ? `${machineName} built-in grinder` : "built-in grinder") : grinderName || null,
    uses_built_in_grinder: Boolean(usesBuiltInGrinder),
  }));
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeShotResponse | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [activityLabel, setActivityLabel] = useState("DialChat is thinking");
  const [hasLoadedSession, setHasLoadedSession] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [composerHeight, setComposerHeight] = useState(s(72));
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const hasLoadedSessionRef = useRef(false);
  const isRestoringSessionRef = useRef(false);
  const storageKey = `${CHAT_STORAGE_PREFIX}:${chatSessionKey}`;

  const scrollToLatest = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated });
    });

    // iOS completes the keyboard resize after keyboardWillShow has fired.
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated });
    }, 220);
  }, []);

  useEffect(() => {
    let isMounted = true;
    hasLoadedSessionRef.current = false;
    isRestoringSessionRef.current = true;
    setHasLoadedSession(false);

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (!raw || !isMounted) return;

        const stored = JSON.parse(raw) as Partial<StoredChatSession>;
        if (Array.isArray(stored.messages) && stored.messages.length > 0) {
          setMessages(stored.messages);
        }
        if (stored.shotContext && typeof stored.shotContext === "object") {
          setShotContext((current) => ({ ...current, ...stored.shotContext }));
        }
        if (stored.analysis) {
          setAnalysis(stored.analysis);
        }
      } catch (loadError) {
        captureException(loadError, { feature: "dialchat", action: "restore_session" });
        console.log("Failed to restore DialChat session:", loadError);
      } finally {
        if (isMounted) {
          hasLoadedSessionRef.current = true;
          isRestoringSessionRef.current = false;
          setHasLoadedSession(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!hasLoadedSession || !machineName && !grinderName && !usesBuiltInGrinder) return;

    const selectedGrinder = usesBuiltInGrinder ? (machineName ? `${machineName} built-in grinder` : "built-in grinder") : grinderName || null;
    setShotContext((current) => ({
      ...current,
      machine: current.machine || machineName || null,
      grinder: current.grinder || selectedGrinder,
      uses_built_in_grinder: current.uses_built_in_grinder || Boolean(usesBuiltInGrinder),
    }));
    setMessages((current) => {
      if (current.length > 1 || current[0]?.id !== INITIAL_MESSAGE.id) return current;
      return initialMessagesForSetup(machineName, grinderName, usesBuiltInGrinder);
    });
  }, [hasLoadedSession, machineName, grinderName, usesBuiltInGrinder]);

  useEffect(() => {
    scrollToLatest();
  }, [messages, isSending, scrollToLatest]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      scrollToLatest();
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollToLatest]);

  useEffect(() => {
    if (!hasLoadedSession || isRestoringSessionRef.current) return;

    const session: StoredChatSession = {
      messages: messages.map(stripMessageForStorage),
      shotContext,
      analysis,
    };
    AsyncStorage.setItem(storageKey, JSON.stringify(session)).catch((saveError) => {
      captureException(saveError, { feature: "dialchat", action: "save_session" });
      console.log("Failed to save DialChat session:", saveError);
    });
  }, [analysis, hasLoadedSession, messages, shotContext, storageKey]);

  const visibleAnalysis = analysis ?? null;
  const canSend = input.trim().length > 0 && !isSending;

  async function submitMessage(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || isSending) return;

    setInput("");
    await sendMessage({ id: `${Date.now()}-user`, role: "user", content: text });
  }

  async function resetChatSession() {
    if (isSending) return;
    const initialContext: ShotContext = {
      user_id: "demo-user",
      machine: machineName || null,
      grinder: usesBuiltInGrinder ? (machineName ? `${machineName} built-in grinder` : "built-in grinder") : grinderName || null,
      uses_built_in_grinder: Boolean(usesBuiltInGrinder),
    };
    const initialMessages = initialMessagesForSetup(machineName, grinderName, usesBuiltInGrinder);
    setMessages(initialMessages);
    setShotContext(initialContext);
    setAnalysis(null);
    setAnalysisOpen(false);
    setError(null);
    await AsyncStorage.removeItem(storageKey);
  }

  useImperativeHandle(ref, () => ({
    reset: () => {
      void resetChatSession();
    },
  }));

  async function sendMessage(userMessage: LocalMessage, contextOverride?: ShotContext) {
    if (isSending) return;

    setError(null);
    setActivityLabel(activityLabelFor(userMessage));
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
      captureException(submitError, {
        feature: "dialchat",
        action: "send_message",
        extra: {
          has_image: Boolean(userMessage.image_base64),
          image_kind: userMessage.image_kind || null,
          has_video_context: Boolean(contextForRequest.video_s3_key),
          message_count: nextMessages.length,
        },
      });
      const message = submitError instanceof Error ? submitError.message : "Could not reach DialChat.";
      setError(cleanErrorMessage(message));
    } finally {
      setIsSending(false);
    }
  }

  async function attachMedia() {
    if (isSending) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      captureEvent("media_permission_denied", { feature: "dialchat" });
      Alert.alert("Permission needed", "Allow photo library access to attach a photo or shot video.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      base64: false,
      mediaTypes: ["images", "videos"],
      quality: 0.65,
      videoExportPreset: ImagePicker.VideoExportPreset.H264_960x540,
      videoMaxDuration: MAX_SHOT_VIDEO_SECONDS,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });

    if (result.canceled || !result.assets.length) {
      captureEvent("media_picker_cancelled", { feature: "dialchat" });
      return;
    }

    const asset = result.assets[0];
    if (asset.type === "video" || isVideoAsset(asset)) {
      await attachShotVideoAsset(asset);
      return;
    }

    const kind = inferPhotoKind(shotContext);
    setActivityLabel("Preparing smaller photo...");
    setIsSending(true);
    try {
      const prepared = await prepareRecognitionPhoto(asset);
      setIsSending(false);
      await sendMessage({
        id: `${Date.now()}-${kind}-photo`,
        role: "user",
        content: "Photo attached",
        image_base64: prepared.base64,
        image_media_type: prepared.mimeType,
        image_kind: kind,
        attachment_uri: prepared.uri,
        attachment_label: null,
        attachment_type: "image",
      });
    } catch (photoError) {
      captureException(photoError, { feature: "dialchat", action: "prepare_photo", extra: { image_kind: kind } });
      setIsSending(false);
      const message = photoError instanceof Error ? photoError.message : "Try choosing a different image.";
      Alert.alert("Could not prepare photo", message);
    }
  }

  async function attachShotVideoAsset(asset: ImagePicker.ImagePickerAsset) {
    if (asset.duration && asset.duration > MAX_SHOT_VIDEO_MS) {
      captureEvent("shot_video_rejected_too_long", { duration_ms: asset.duration, max_seconds: MAX_SHOT_VIDEO_SECONDS });
      Alert.alert(
        "Video is too long",
        `Send a shot video under ${MAX_SHOT_VIDEO_SECONDS} seconds. Trim it in Photos first, then attach it again.`,
      );
      return;
    }

    const filename = normalizedVideoFilename(asset);
    const contentType = normalizedVideoContentType(asset, filename);

    setError(null);
    setActivityLabel("Preparing smaller video...");
    setIsSending(true);
    try {
      const target = await createMediaUploadUrl({
        filename,
        content_type: contentType,
        media_kind: "shot_video",
        user_id: shotContext.user_id || "demo-user",
      });
      setActivityLabel("Uploading compressed video...");
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

      setActivityLabel("Analyzing shot audio...");
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
      captureException(uploadError, {
        feature: "dialchat",
        action: "upload_or_analyze_video",
        extra: { content_type: contentType, duration_ms: asset.duration || null },
      });
      const message = uploadError instanceof Error ? uploadError.message : "Could not upload the shot video.";
      setError(cleanErrorMessage(message));
      setIsSending(false);
    }
  }


  const composerBottom = Platform.OS === "ios" ? keyboardHeight : 0;
  const composerPaddingBottom = keyboardHeight > 0 ? s(8) : Math.max(insets.bottom, s(8));

  return (
      <View style={{ flex: 1, backgroundColor: "#F7F7F8" }}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollToLatest(false)}
          contentContainerStyle={{
            padding: s(16),
            // The composer moves above the iOS keyboard, so the message list
            // needs matching room to scroll its newest message into view.
            paddingBottom: composerHeight + keyboardHeight + s(24),
            gap: s(12),
          }}
        >
          {messages.map((message) => <Bubble key={message.id} message={message} />)}

          {isSending ? (
            <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: s(8), padding: s(12) }}>
              <ActivityIndicator size="small" color="#111827" />
              <Text style={{ color: "#6B7280", fontWeight: "700" }}>{activityLabel}</Text>
            </View>
          ) : null}

          {error ? (
            <View style={{ borderRadius: s(16), borderWidth: 1, borderColor: "#F2B8B5", backgroundColor: "#FFF1F0", padding: s(12) }}>
              <Text style={{ color: "#A33A33", fontWeight: "800" }}>Something went wrong</Text>
              <Text style={{ marginTop: s(4), color: "#A33A33" }}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View
          onLayout={(event) => setComposerHeight(event.nativeEvent.layout.height)}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: composerBottom,
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB",
            paddingHorizontal: s(12),
            paddingTop: s(10),
            paddingBottom: composerPaddingBottom,
            backgroundColor: "white",
          }}
        >
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
              onFocus={() => scrollToLatest()}
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
  );
}

export default forwardRef(AIShotChat);

function initialMessagesForSetup(machineName?: string | null, grinderName?: string | null, usesBuiltInGrinder?: boolean | null): LocalMessage[] {
  const selectedGrinder = usesBuiltInGrinder ? (machineName ? `${machineName} built-in grinder` : "built-in grinder") : grinderName || null;
  if (machineName && selectedGrinder) {
    return [
      {
        id: "assistant-start-with-equipment",
        role: "assistant",
        content: `I have ${machineName} and ${usesBuiltInGrinder ? "its built-in grinder" : selectedGrinder} selected. What grind setting are you using?`,
      },
    ];
  }
  if (machineName) {
    return [
      {
        id: "assistant-start-with-machine",
        role: "assistant",
        content: `I have ${machineName} selected. What grinder are you using? If it is built into the machine, say built-in.`,
      },
    ];
  }
  return [INITIAL_MESSAGE];
}

function inferPhotoKind(context: ShotContext): "machine" | "grinder" {
  if (!context.machine || context.pending_gear_type === "machine") return "machine";
  if (!context.uses_built_in_grinder && (!context.grinder || context.pending_gear_type === "grinder")) return "grinder";
  return "machine";
}

async function prepareRecognitionPhoto(asset: ImagePicker.ImagePickerAsset): Promise<{ uri: string; base64: string; mimeType: string }> {
  const width = asset.width || 0;
  const height = asset.height || 0;
  const longestSide = Math.max(width, height);
  const resizeAction = longestSide > MAX_RECOGNITION_IMAGE_SIDE
    ? [width >= height ? { resize: { width: MAX_RECOGNITION_IMAGE_SIDE } } : { resize: { height: MAX_RECOGNITION_IMAGE_SIDE } }]
    : [];

  const result = await manipulateAsync(asset.uri, resizeAction, {
    compress: RECOGNITION_IMAGE_QUALITY,
    format: SaveFormat.JPEG,
    base64: true,
  });

  if (!result.base64) {
    throw new Error("The selected photo could not be prepared for recognition.");
  }

  if (result.base64.length > 900_000) {
    const secondPass = await manipulateAsync(result.uri, [{ resize: { width: 640 } }], {
      compress: 0.45,
      format: SaveFormat.JPEG,
      base64: true,
    });
    if (!secondPass.base64) {
      throw new Error("The selected photo could not be prepared for recognition.");
    }
    return {
      uri: secondPass.uri,
      base64: secondPass.base64,
      mimeType: "image/jpeg",
    };
  }

  return {
    uri: result.uri,
    base64: result.base64,
    mimeType: "image/jpeg",
  };
}


function normalizedVideoFilename(asset: ImagePicker.ImagePickerAsset): string {
  const rawName = asset.fileName || asset.uri.split("/").pop() || "shot-video.mp4";
  if (asset.mimeType === "video/mp4" && !rawName.toLowerCase().endsWith(".mp4")) {
    return `${rawName.replace(/\.[^.]+$/, "")}.mp4`;
  }
  return rawName;
}

function normalizedVideoContentType(asset: ImagePicker.ImagePickerAsset, filename: string): string {
  if (asset.mimeType) return asset.mimeType;
  if (/\.mov$/i.test(filename)) return "video/quicktime";
  return "video/mp4";
}

function isVideoAsset(asset: ImagePicker.ImagePickerAsset): boolean {
  const mime = asset.mimeType?.toLowerCase() || "";
  const uri = asset.uri.toLowerCase();
  return mime.startsWith("video/") || /\.(mov|mp4|m4v)$/i.test(uri);
}

function activityLabelFor(message: LocalMessage): string {
  if (message.attachment_type === "video") return "Analyzing shot audio...";
  if (message.attachment_type === "image" || message.image_base64) return "Reading the photo...";
  return "DialChat is thinking";
}

function cleanErrorMessage(message: string): string {
  if (/413|request entity too large|payload too large/i.test(message)) return "That photo is still too large to analyze. Try a closer crop of the machine/grinder or take a screenshot and send that.";
  if (/network request failed/i.test(message)) return "Could not reach DialChat. Check that the backend is running and your phone can access it.";
  if (/internal server error/i.test(message)) return "DialChat hit a server error. Try again, or send a shorter video.";
  return message;
}


function InlineShotVideo({ uri }: { uri?: string | null }) {
  const player = useVideoPlayer(uri ? { uri } : null, (instance) => {
    instance.loop = false;
  });

  if (!uri) {
    return (
      <View
        style={{
          width: s(210),
          height: s(142),
          borderRadius: s(17),
          backgroundColor: "#111113",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="play-circle" size={44} color="white" />
      </View>
    );
  }

  return (
    <VideoView
      player={player}
      fullscreenOptions={{ enable: true }}
      allowsPictureInPicture={false}
      nativeControls
      style={{ width: s(210), height: s(142), borderRadius: s(17), backgroundColor: "#111113" }}
      contentFit="cover"
    />
  );
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
            <InlineShotVideo uri={message.attachment_uri} />
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

function AnalysisModal({ analysis, visible, onClose }: { analysis: AnalyzeShotResponse | null; visible: boolean; onClose: () => void }) {
  if (!analysis) return null;
  const recommendation = analysis.recommendation;
  const timing = analysis.timing;
  const timingConfidence = Math.min(timing.start_confidence ?? 1, timing.stop_confidence ?? 1);
  const needsTimingConfirmation = recommendation.recommendation === "confirm_timing" || Boolean(timing.requires_manual_confirmation) || timingConfidence < 0.7;
  return (
    <Modal animationType="slide" visible={visible} presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#F7F7F8", padding: s(18) }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: s(14) }}>
          <View>
            <Text style={{ fontFamily: "Nunito_700Bold", fontSize: clamp(s(24), 21, 28), color: "#111827" }}>Shot Analysis</Text>
            <Text style={{ color: "#6B7280", marginTop: s(2) }}>
              {needsTimingConfirmation ? "Timing needs confirmation" : `${recommendation.confidence} confidence`}
            </Text>
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
            <MetricRow label="Confidence" value={`${Math.round(timingConfidence * 100)}%`} />
          </InfoCard>

          <InfoCard title={needsTimingConfirmation ? "Timing check" : "Recommendation"}>
            <Text style={{ fontFamily: "Nunito_700Bold", fontSize: clamp(s(26), 22, 30), color: "#111827" }}>
              {needsTimingConfirmation ? "Confirm Timing" : titleCase(recommendation.recommendation)}
            </Text>
            <Text style={{ marginTop: s(6), color: "#111827", fontWeight: "800" }}>{recommendation.adjustment}</Text>
            <Text style={{ marginTop: s(8), color: "#4B5563", lineHeight: clamp(s(20), 18, 22) }}>{recommendation.reason}</Text>
            {needsTimingConfirmation ? (
              <Text style={{ marginTop: s(10), color: "#92400E", lineHeight: clamp(s(20), 18, 22), fontWeight: "700" }}>
                Confirm the detected timing, type the total shot time, or send another quieter video before changing grind.
              </Text>
            ) : null}
          </InfoCard>

          {!needsTimingConfirmation && recommendation.calculation_explanation?.length ? (
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

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function stripMessageForStorage(message: LocalMessage): LocalMessage {
  const { image_base64, ...rest } = message;
  return rest;
}
