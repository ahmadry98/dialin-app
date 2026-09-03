import { authFetch } from "./auth";
import { AI_SHOT_API_BASE_URL } from "./aiShotApi";

export type AccountStatus = {
  user_id: string;
  email: string | null;
  tier: "free" | "pro";
  usage: {
    period: string;
    used: number;
    limit: number;
    remaining: number;
  };
};

export async function fetchAccountStatus(): Promise<AccountStatus> {
  const response = await authFetch(`${AI_SHOT_API_BASE_URL}/me`);
  if (!response.ok) throw new Error("Could not load your DialedIn account.");
  return response.json();
}
export async function deleteAccountData(): Promise<void> {
  const response = await authFetch(`${AI_SHOT_API_BASE_URL}/me`, { method: "DELETE" });
  if (!response.ok) throw new Error("Your account data could not be deleted. Please try again.");
}


