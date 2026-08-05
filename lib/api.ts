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
};

export async function fetchMachines(): Promise<Machine[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/machines/`);

    if (!response.ok) {
      throw new Error(`Failed to fetch machines: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.log("Using local machine fallback:", error);
    return localMachines();
  }
}

export async function fetchMachine(slug: string): Promise<Machine> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/machines/${slug}/`);

    if (!response.ok) {
      throw new Error(`Failed to fetch machine: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.log("Using local machine fallback:", error);
    const machine = LOCAL_MACHINES[slug];
    if (!machine) {
      throw new Error(`Machine not found: ${slug}`);
    }
    return normalizeLocalMachine(machine);
  }
}

function localMachines(): Machine[] {
  return Object.values(LOCAL_MACHINES).map(normalizeLocalMachine);
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
    description: machine.subtitle,
    machine_type: machine.subtitle,
    boiler_type: "",
    grinder_recommendation: "Use a capable espresso grinder.",
    beginner_friendly: machine.name.toLowerCase().includes("gaggia") || machine.name.toLowerCase().includes("breville"),
    quick_tip: machine.roastTargets?.medium ? `Medium roast target: ${machine.roastTargets.medium}s.` : "Keep dose, grind, and prep consistent between tests.",
    cleaning_notes: machine.cleaning?.[0]?.desc || "Purge and wipe the machine after each session.",
    first_use_guide: machine.guides?.[0]?.desc || "Warm up the machine, lock in the portafilter, and pull a test shot.",
  };
}

function localImageUri(source: LocalMachine["image"]): string | null {
  const resolved = Image.resolveAssetSource(source);
  return resolved?.uri ?? null;
}
