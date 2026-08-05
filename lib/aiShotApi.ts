export const AI_SHOT_API_BASE_URL = process.env.EXPO_PUBLIC_AI_SHOT_API_URL || "http://localhost:8000";

export type ShotContext = {
  user_id?: string;
  video_s3_key?: string | null;
  machine?: string | null;
  grinder?: string | null;
  uses_built_in_grinder?: boolean;
  dose_g?: number | null;
  yield_g?: number | null;
  grind_setting?: string | null;
  roast_level?: string | null;
  taste?: string | null;
  timing_confidence?: number | null;
  total_shot_seconds?: number | null;
  requires_manual_confirmation?: boolean;
  pending_gear_type?: string | null;
  pending_gear_name?: string | null;
  pending_gear_confidence?: string | null;
};

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  image_base64?: string | null;
  image_media_type?: string | null;
  image_kind?: "machine" | "grinder" | null;
};

export type TimingResult = {
  source_path?: string;
  machine_start_time: number | null;
  machine_stop_time: number | null;
  total_shot_seconds: number | null;
  start_confidence?: number;
  stop_confidence?: number;
  audio_method?: string;
  requires_manual_confirmation?: boolean;
  warnings?: string[];
};

export type AnalyzeShotResponse = {
  timing: TimingResult;
  machine_profile: Record<string, unknown>;
  recommendation: {
    recommendation: string;
    adjustment: string;
    reason: string;
    confidence: string;
    keep_fixed: string[];
    needs_more_info: string[];
    target_range_seconds: [number, number];
    calculation_explanation?: string[];
    confidence_reasons?: string[];
    exact_grind_setting?: {
      grinder_profile?: { grinder_name?: string };
      current_setting?: string | number | null;
      suggested_setting?: string | number | null;
      setting_label?: string | null;
      adjustment_size?: string | null;
      seconds_gap?: number | null;
      estimated_small_steps?: number | null;
      seconds_per_small_step_estimate?: number | null;
      notes?: string | null;
    } | null;
  };
  missing_fields: string[];
  profile_candidates?: Array<{
    type: string;
    name_entered: string;
    status: string;
    seen_count: number;
  }>;
  message: string;
};

export type ChatResponse = {
  response: string;
  needs_shot_analysis: boolean;
  system_prompt: string;
  shot_context?: ShotContext | null;
  analysis_result?: AnalyzeShotResponse | null;
  next_field?: string | null;
  missing_fields: string[];
  image_guess?: {
    gear_type?: string;
    name?: string | null;
    confidence?: string;
    reason?: string;
  } | null;
};

export async function sendAIShotChat(messages: ChatMessage[], shotContext?: ShotContext | null): Promise<ChatResponse> {
  const response = await fetch(`${AI_SHOT_API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, shot_context: shotContext ?? null }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `DialChat failed with status ${response.status}`);
  }

  return response.json();
}
