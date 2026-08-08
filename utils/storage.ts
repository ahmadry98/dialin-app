import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFERRED_MACHINE = "preferredMachineId";
const KEY_PREFERRED_GRINDER_ID = "preferredGrinderId";
const KEY_PREFERRED_GRINDER_NAME = "preferredGrinderName";
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

export async function setPreferredGrinder(grinderId: string, grinderName: string) {
  await AsyncStorage.multiSet([
    [KEY_PREFERRED_GRINDER_ID, grinderId],
    [KEY_PREFERRED_GRINDER_NAME, grinderName],
  ]);
}

export async function getPreferredGrinder(): Promise<{ id: string; name: string } | null> {
  const [[, id], [, name]] = await AsyncStorage.multiGet([KEY_PREFERRED_GRINDER_ID, KEY_PREFERRED_GRINDER_NAME]);
  if (!id || !name) return null;
  return { id, name };
}

export async function clearPreferredGrinder() {
  await AsyncStorage.multiRemove([KEY_PREFERRED_GRINDER_ID, KEY_PREFERRED_GRINDER_NAME]);
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
