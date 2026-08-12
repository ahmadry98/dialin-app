type ObservabilityExtra = Record<string, string | number | boolean | null | undefined>;

type CaptureContext = {
  feature: string;
  action: string;
  extra?: ObservabilityExtra;
};

const OBSERVABILITY_LOGS_ENABLED = process.env.EXPO_PUBLIC_OBSERVABILITY_LOGS !== "false";
const REDACTED_KEYS = new Set([
  "base64",
  "image_base64",
  "upload_url",
  "file_uri",
  "uri",
  "media_key",
  "video_s3_key",
  "message",
  "messages",
  "content",
]);

export function captureEvent(name: string, extra: ObservabilityExtra = {}) {
  if (!OBSERVABILITY_LOGS_ENABLED) return;
  console.log(`[observability] ${name}`, sanitizeExtra(extra));
}

export function captureException(error: unknown, context: CaptureContext) {
  if (!OBSERVABILITY_LOGS_ENABLED) return;
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.warn(`[observability] ${context.feature}.${context.action}`, {
    error: trimError(errorMessage),
    ...sanitizeExtra(context.extra || {}),
  });
}

function sanitizeExtra(extra: ObservabilityExtra): ObservabilityExtra {
  return Object.entries(extra).reduce<ObservabilityExtra>((safe, [key, value]) => {
    safe[key] = REDACTED_KEYS.has(key) ? "[redacted]" : value;
    return safe;
  }, {});
}

function trimError(message: string): string {
  return message.length > 500 ? `${message.slice(0, 500)}...` : message;
}
