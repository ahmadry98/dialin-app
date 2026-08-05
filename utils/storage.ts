import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFERRED_MACHINE = "preferredMachineId";
const roastKey = (machineId: string) => `roast:${machineId}`;

export async function setPreferredMachineId(machineId: string) {
  await AsyncStorage.setItem(KEY_PREFERRED_MACHINE, machineId);
}

export async function getPreferredMachineId(): Promise<string | null> {
  return AsyncStorage.getItem(KEY_PREFERRED_MACHINE);
}

export async function clearPreferredMachineId() {
  await AsyncStorage.removeItem(KEY_PREFERRED_MACHINE);
}

export type Roast = "light" | "medium" | "dark";

export async function setLastRoast(machineId: string, roast: Roast) {
  await AsyncStorage.setItem(roastKey(machineId), roast);
}

export async function getLastRoast(machineId: string): Promise<Roast | null> {
  const r = await AsyncStorage.getItem(roastKey(machineId));
  if (r === "light" || r === "medium" || r === "dark") return r;
  return null;
}
