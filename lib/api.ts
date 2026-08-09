import { Image } from "react-native";

import { MACHINES as LOCAL_MACHINES, type Machine as LocalMachine } from "../data/machines";

export const API_BASE_URL = process.env.EXPO_PUBLIC_DIALEDIN_API_URL || "http://localhost:8000";

export type Machine = {
  slug: string;
  name: string;
  subtitle: string;
  image: string | null;
  image_url: string;
  baseline_dose: number;
  baseline_yield: number;
  baseline_seconds: number | string;
  description: string;
  machine_type: string;
  boiler_type: string;
  grinder_recommendation: string;
  beginner_friendly: boolean;
  quick_tip: string;
  cleaning_notes: string;
  first_use_guide: string;
  tags?: string[];
  target_total_shot_seconds?: number[];
  target_visible_flow_seconds?: number[];
  portafilter_mm?: number | null;
  has_built_in_grinder?: boolean | null;
  has_preinfusion?: boolean | null;
};

type EquipmentProfileMachine = {
  slug: string;
  display_name?: string;
  name?: string;
  subtitle?: string;
  tags?: string[];
  image_url?: string | null;
  image?: {
    url?: string | null;
    local_asset_key?: string | null;
    source_url?: string | null;
    license_or_source_type?: string | null;
    status?: string | null;
    review_notes?: string | null;
  } | null;
  specs?: {
    portafilter_mm?: number | null;
    pump_type?: string | null;
    has_built_in_grinder?: boolean | null;
    has_preinfusion?: boolean | null;
  };
  brew_defaults?: {
    target_total_shot_seconds?: [number, number] | number[];
    target_visible_flow_seconds?: [number, number] | number[];
  };
  grind_adjustment_notes?: string | null;
};

export type Grinder = {
  slug: string;
  name: string;
  tags: string[];
  setting_type?: string | null;
  lower_is_finer?: boolean | null;
  min_setting?: number | null;
  max_setting?: number | null;
  espresso_range?: number[] | null;
  data_confidence?: string | null;
  small_step?: number | null;
  medium_step?: number | null;
  large_step?: number | null;
  notes?: string | null;
};

export async function fetchMachines(): Promise<Machine[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/machines`);

    if (!response.ok) {
      throw new Error(`Failed to fetch machines: ${response.status}`);
    }

    const payload = await response.json();
    const profiles: EquipmentProfileMachine[] = Array.isArray(payload) ? payload : payload.machines || [];
    return sortMachines(profiles.map(normalizeProfileMachine));
  } catch (error) {
    console.log("Using local machine fallback:", error);
    return localMachines();
  }
}

export async function fetchMachine(slug: string): Promise<Machine> {
  try {
    const response = await fetch(`${API_BASE_URL}/machines/${encodeURIComponent(slug)}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch machine: ${response.status}`);
    }

    return normalizeProfileMachine(await response.json());
  } catch (error) {
    console.log("Using local machine fallback:", error);
    const machine = LOCAL_MACHINES[slug];
    if (!machine) {
      throw new Error(`Machine not found: ${slug}`);
    }
    return normalizeLocalMachine(machine);
  }
}

export async function fetchGrinders(): Promise<Grinder[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/grinders`);

    if (!response.ok) {
      throw new Error(`Failed to fetch grinders: ${response.status}`);
    }

    const payload = await response.json();
    const grinders = Array.isArray(payload) ? payload : payload.grinders || [];
    return sortGrinders(grinders.map(normalizeProfileGrinder));
  } catch (error) {
    console.log("Using local grinder fallback:", error);
    return LOCAL_GRINDERS;
  }
}

function normalizeProfileGrinder(grinder: any): Grinder {
  return {
    slug: grinder.slug,
    name: grinder.display_name || grinder.name,
    tags: grinder.tags || [],
    setting_type: grinder.setting_type,
    lower_is_finer: grinder.lower_is_finer,
    min_setting: grinder.min_setting,
    max_setting: grinder.max_setting,
    espresso_range: grinder.espresso_range,
    data_confidence: grinder.data_confidence,
    small_step: grinder.small_step,
    medium_step: grinder.medium_step,
    large_step: grinder.large_step,
    notes: grinder.notes,
  };
}

function sortGrinders(grinders: Grinder[]): Grinder[] {
  return [...grinders].sort((a, b) => a.name.localeCompare(b.name));
}

const LOCAL_GRINDERS: Grinder[] = sortGrinders([
  {
    slug: "baratza-encore-esp",
    name: "Baratza Encore ESP",
    tags: ["Stepped", "Espresso 1-18", "Data B"],
    setting_type: "numeric_integer",
    lower_is_finer: true,
    min_setting: 1,
    max_setting: 40,
    espresso_range: [1, 18],
    data_confidence: "B",
    small_step: 1,
    medium_step: 2,
    large_step: 4,
    notes: "Use whole-number steps; lower settings are finer.",
  },
  {
    slug: "breville-smart-grinder-pro",
    name: "Breville Smart Grinder Pro",
    tags: ["Stepped", "Espresso 3-15", "Data B"],
    setting_type: "numeric_integer",
    lower_is_finer: true,
    min_setting: 1,
    max_setting: 60,
    espresso_range: [3, 15],
    data_confidence: "B",
    small_step: 1,
    medium_step: 2,
    large_step: 4,
    notes: "Use small setting moves and keep dose stable while dialing in.",
  },
  {
    slug: "eureka-mignon-specialita",
    name: "Eureka Mignon Specialita",
    tags: ["Numeric", "Espresso 0.5-3.5", "Data C"],
    setting_type: "numeric_decimal",
    lower_is_finer: true,
    min_setting: 0,
    max_setting: 20,
    espresso_range: [0.5, 3.5],
    data_confidence: "C",
    small_step: 0.1,
    medium_step: 0.3,
    large_step: 0.6,
    notes: "Small dial changes can be meaningful; move gradually.",
  },
  {
    slug: "niche-zero",
    name: "Niche Zero",
    tags: ["Numeric", "Espresso 10-20", "Data A"],
    setting_type: "numeric_decimal",
    lower_is_finer: true,
    min_setting: 0,
    max_setting: 50,
    espresso_range: [10, 20],
    data_confidence: "A",
    small_step: 1,
    medium_step: 2,
    large_step: 4,
    notes: "Use small number moves; lower is finer.",
  },
  {
    slug: "turin-df54",
    name: "Turin DF54",
    tags: ["Numeric", "Espresso 10-20", "Data C"],
    setting_type: "numeric_decimal",
    lower_is_finer: true,
    min_setting: 0,
    max_setting: 90,
    espresso_range: [10, 20],
    data_confidence: "C",
    small_step: 1,
    medium_step: 2,
    large_step: 4,
    notes: "Use numeric moves as relative guidance, then refine by shot time.",
  },
  {
    slug: "varia-vs3",
    name: "Varia VS3",
    tags: ["Numeric", "Espresso 3-5", "Data B"],
    setting_type: "numeric_decimal",
    lower_is_finer: true,
    min_setting: 0,
    max_setting: 12,
    espresso_range: [3, 5],
    data_confidence: "B",
    small_step: 0.1,
    medium_step: 0.3,
    large_step: 0.6,
    notes: "Use tenths for fine espresso adjustment.",
  },
  {
    slug: "varia-vs6",
    name: "Varia VS6",
    tags: ["Numeric", "Espresso 0.8-2.5", "Data C"],
    setting_type: "numeric_decimal",
    lower_is_finer: true,
    min_setting: 0,
    max_setting: 6,
    espresso_range: [0.8, 2.5],
    data_confidence: "C",
    small_step: 0.1,
    medium_step: 0.3,
    large_step: 0.6,
    notes: "Use tenths for small espresso moves.",
  },
]);


function normalizeProfileMachine(profile: EquipmentProfileMachine): Machine {
  const local = LOCAL_MACHINES[profile.slug];
  const profileImage = profileImageUri(profile);
  const localImage = local ? localImageUri(local.image) : null;
  const target = profile.brew_defaults?.target_total_shot_seconds;
  const visibleTarget = profile.brew_defaults?.target_visible_flow_seconds;
  const baselineSeconds = target && target.length >= 2 ? `${target[0]}-${target[1]}` : local?.baseline.seconds || "25-32";
  const specs = profile.specs || {};
  const subtitle = profile.subtitle || compactMachineSubtitle(profile);
  const description = describeMachine(profile);

  return {
    slug: profile.slug,
    name: profile.display_name || profile.name || profile.slug,
    subtitle,
    image: profileImage || localImage,
    image_url: profileImage || localImage || "",
    baseline_dose: local?.baseline.dose || 18,
    baseline_yield: local?.baseline.yield || 36,
    baseline_seconds: baselineSeconds,
    description,
    machine_type: machineTypeLabel(profile),
    boiler_type: specs.pump_type ? `${titleCase(specs.pump_type)} pump` : "",
    grinder_recommendation: specs.has_built_in_grinder ? "Built-in grinder" : "External grinder",
    beginner_friendly: Boolean(local?.name.toLowerCase().includes("gaggia") || local?.name.toLowerCase().includes("breville")),
    quick_tip: profile.grind_adjustment_notes || `Target: ${baselineSeconds}s.`,
    cleaning_notes: local?.cleaning?.[0]?.desc || "Purge and wipe the machine after each session.",
    first_use_guide: local?.guides?.[0]?.desc || "Warm up the machine, lock in the portafilter, and pull a test shot.",
    tags: profile.tags || [],
    target_total_shot_seconds: target,
    target_visible_flow_seconds: visibleTarget,
    portafilter_mm: specs.portafilter_mm ?? null,
    has_built_in_grinder: specs.has_built_in_grinder ?? null,
    has_preinfusion: specs.has_preinfusion ?? null,
  };
}


function describeMachine(profile: EquipmentProfileMachine): string {
  const name = profile.display_name || profile.name || "This machine";
  const specs = profile.specs || {};
  const target = profile.brew_defaults?.target_total_shot_seconds;
  const targetText = target && target.length >= 2 ? `${target[0]}-${target[1]}s` : "25-32s";

  if (specs.has_built_in_grinder) {
    return `${name} is an all-in-one home espresso machine with a built-in grinder and a profile target around ${targetText}.`;
  }
  if (specs.has_preinfusion) {
    return `${name} is a home espresso machine with pre-infusion support and a profile target around ${targetText}.`;
  }
  return `${name} is a home espresso machine tuned around a classic ${targetText} shot target.`;
}

function machineTypeLabel(profile: EquipmentProfileMachine): string {
  const specs = profile.specs || {};
  if (specs.has_built_in_grinder) return "All-in-one";
  if (specs.has_preinfusion) return "Pre-infusion";
  return "Home espresso";
}

function compactMachineSubtitle(profile: EquipmentProfileMachine): string {
  const specs = profile.specs || {};
  const parts = [];
  if (specs.portafilter_mm) parts.push(`${specs.portafilter_mm}mm`);
  if (specs.has_built_in_grinder) parts.push("Built-in grinder");
  if (specs.has_preinfusion) parts.push("Pre-infusion");
  return parts.join(" · ") || "Espresso machine";
}

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const LOCAL_PROFILE_IMAGES: Record<string, LocalMachine["image"]> = {
  "machine-breville-barista-express": require("../assets/images/machines/breville.jpg"),
  "machine-breville-bambino-bambino-plus": require("../assets/images/machines/images.jpeg"),
  "machine-gaggia-classic-pro": require("../assets/images/machines/gaggia.jpg"),
  "machine-rancilio-silvia": require("../assets/images/machines/rancilio.jpg"),
  "machine-delonghi-dedica": require("../assets/images/machines/images-2.jpeg"),
  "machine-lelit-anna": require("../assets/images/machines/Lelit-Anna-Feature.jpg"),
  "machine-la-marzocco-linea-micra": require("../assets/images/machines/WEB_LPMCBS02EU_S01_1800x1800.jpg"),
  "machine-breville-dual-boiler": require("../assets/images/machines/Breville-Oracle-Dual-Boiler-Feature.jpg"),
  "machine-profitec-go": require("../assets/images/machines/Profitec-Go-On-Bar-3.jpg"),
  "machine-profitec-pro-400": require("../assets/images/machines/pro-400-slider-webcopy.jpg"),
  "machine-profitec-pro-300": require("../assets/images/machines/Profitec_PRO300_Lifestyle_1_1024x1024.png.webp"),
  "machine-profitec-pro-500-pid": require("../assets/images/machines/Eureka-Mignon-Libra-Espresso-Grinder-Profitec-Pro-500-Machine-Clive-Coffee-02.jpg"),
  "machine-lelit-mara-x": require("../assets/images/machines/masch-lel-mars3-2-51156.jpg.webp"),
  "machine-lelit-bianca-v3": require("../assets/images/machines/DNA-Bianca.jpg.webp"),
  "machine-rocket-appartamento": require("../assets/images/machines/rocket-appartamento-overview.jpg"),
  "machine-rocket-r58-cinquantotto": require("../assets/images/machines/la_marzocco_linea_mini_r_vs_rocket_r58_tune.png"),
  "machine-ascaso-steel-uno-pid-duo-pid": require("../assets/images/machines/IMG_7770-1024x768.jpg"),
  "machine-lelit-anita-pl042temd": require("../assets/images/machines/lelit_anita_buy_online.jpg"),
  "machine-breville-barista-touch-impress-espresso-machine": require("../assets/images/machines/sea-product-breville-barista-touch-impress-espresso-machine-nsimpson-3370-f33afaef93bf49439a2d15ee416114bf.jpeg"),
  "machine-la-pavoni-new-casa-bar": require("../assets/images/machines/s-l1200.jpg"),
  "machine-lelit-elizabeth-pl92t": require("../assets/images/machines/V8mr4URJbKsiyj5xBDus9c-1200-80.jpg.webp"),
  "machine-lelit-victoria-pl91t": require("../assets/images/machines/Victoria-on-Counter-4.jpg"),
};

function profileImageUri(profile: EquipmentProfileMachine): string | null {
  if (profile.image_url) return profile.image_url;
  if (profile.image?.url) return profile.image.url;

  const candidates = [profile.image?.local_asset_key, profile.slug ? `machine-${profile.slug}` : null].filter(Boolean) as string[];
  for (const key of candidates) {
    const source = LOCAL_PROFILE_IMAGES[key];
    if (source) return localImageUri(source);
  }
  return null;
}

function localMachines(): Machine[] {
  return sortMachines(Object.values(LOCAL_MACHINES).map(normalizeLocalMachine));
}

function sortMachines(machines: Machine[]): Machine[] {
  return [...machines].sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeLocalMachine(machine: LocalMachine): Machine {
  const imageUri = localImageUri(machine.image);
  return {
    slug: machine.id,
    name: machine.name,
    subtitle: machine.subtitle,
    image: imageUri,
    image_url: imageUri || "",
    baseline_dose: machine.baseline.dose,
    baseline_yield: machine.baseline.yield,
    baseline_seconds: machine.baseline.seconds,
    description: localDescription(machine),
    machine_type: localMachineType(machine),
    boiler_type: "",
    grinder_recommendation: "Use a capable espresso grinder.",
    beginner_friendly: machine.name.toLowerCase().includes("gaggia") || machine.name.toLowerCase().includes("breville"),
    quick_tip: machine.roastTargets?.medium ? `Medium roast target: ${machine.roastTargets.medium}s.` : "Keep dose, grind, and prep consistent between tests.",
    cleaning_notes: machine.cleaning?.[0]?.desc || "Purge and wipe the machine after each session.",
    first_use_guide: machine.guides?.[0]?.desc || "Warm up the machine, lock in the portafilter, and pull a test shot.",
    tags: getLocalTags(machine),
    target_total_shot_seconds: typeof machine.baseline.seconds === "number" ? [machine.baseline.seconds - 2, machine.baseline.seconds + 2] : undefined,
    target_visible_flow_seconds: undefined,
    portafilter_mm: machine.name.toLowerCase().includes("breville") ? 54 : 58,
    has_built_in_grinder: machine.name.toLowerCase().includes("breville"),
    has_preinfusion: undefined,
  };
}

function localDescription(machine: LocalMachine): string {
  const name = machine.name;
  const seconds = machine.baseline.seconds;
  if (name.toLowerCase().includes("breville")) {
    return `${name} is an all-in-one starter machine with an integrated grinder and a practical ${seconds}s baseline.`;
  }
  if (name.toLowerCase().includes("silvia")) {
    return `${name} is a sturdy single-boiler espresso machine that rewards careful grind and temperature control.`;
  }
  if (name.toLowerCase().includes("gaggia")) {
    return `${name} is a classic compact espresso machine that works best with a capable external grinder.`;
  }
  return `${name} is a home espresso machine with a ${seconds}s baseline target.`;
}

function localMachineType(machine: LocalMachine): string {
  const name = machine.name.toLowerCase();
  if (name.includes("breville")) return "All-in-one";
  if (name.includes("silvia")) return "Single boiler";
  if (name.includes("gaggia")) return "Classic";
  return "Home espresso";
}

function getLocalTags(machine: LocalMachine): string[] {
  const name = machine.name.toLowerCase();
  if (name.includes("breville")) return ["Built-in grinder", "54mm"];
  if (name.includes("silvia")) return ["58mm", "External grinder"];
  if (name.includes("gaggia")) return ["58mm", "Classic"];
  return ["Espresso"];
}

function localImageUri(source: LocalMachine["image"]): string | null {
  const resolved = Image.resolveAssetSource(source);
  return resolved?.uri ?? null;
}
