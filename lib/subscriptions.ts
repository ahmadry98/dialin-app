import { Platform } from "react-native";
import Purchases from "react-native-purchases";

const ENTITLEMENT_ID = "pro";
const ANNUAL_PRODUCT_ID = "dialedin_pro_annual";
let configuredFor: string | null = null;

export type ProPurchaseOption = {
  priceString: string;
  purchase: () => Promise<boolean>;
};

function apiKey() {
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    default: undefined,
  });
}

export async function loadProPackage(userId: string): Promise<ProPurchaseOption> {
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
  if (annual) {
    return {
      priceString: annual.product.priceString,
      purchase: async () => {
        const result = await Purchases.purchasePackage(annual);
        return Boolean(result.customerInfo.entitlements.active[ENTITLEMENT_ID]);
      },
    };
  }

  const products = await Purchases.getProducts([ANNUAL_PRODUCT_ID]);
  const product = products.find((item) => item.identifier === ANNUAL_PRODUCT_ID);
  if (!product) throw new Error("The annual Pro plan is not available yet.");
  return {
    priceString: product.priceString,
    purchase: async () => {
      const result = await Purchases.purchaseStoreProduct(product);
      return Boolean(result.customerInfo.entitlements.active[ENTITLEMENT_ID]);
    },
  };
}

export async function purchasePro(item: ProPurchaseOption): Promise<boolean> {
  return item.purchase();
}

export async function restorePro(): Promise<boolean> {
  const customerInfo = await Purchases.restorePurchases();
  return Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]);
}
