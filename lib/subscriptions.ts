import { Platform } from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases";

const ENTITLEMENT_ID = "pro";
let configuredFor: string | null = null;

function apiKey() {
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    default: undefined,
  });
}

export async function loadProPackage(userId: string): Promise<PurchasesPackage> {
  const key = apiKey();
  if (!key) throw new Error("Subscriptions are not configured in this build.");
  if (!configuredFor) {
    Purchases.configure({ apiKey: key, appUserID: userId });
    configuredFor = userId;
  } else if (configuredFor !== userId) {
    await Purchases.logIn(userId);
    configuredFor = userId;
  }
  const offerings = await Purchases.getOfferings();
  const annual = offerings.current?.annual || offerings.current?.availablePackages.find((item) => item.packageType === "ANNUAL");
  if (!annual) throw new Error("The annual Pro plan is not available yet.");
  return annual;
}

export async function purchasePro(item: PurchasesPackage): Promise<boolean> {
  const result = await Purchases.purchasePackage(item);
  return Boolean(result.customerInfo.entitlements.active[ENTITLEMENT_ID]);
}

export async function restorePro(): Promise<boolean> {
  const customerInfo = await Purchases.restorePurchases();
  return Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]);
}

