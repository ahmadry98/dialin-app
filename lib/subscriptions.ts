import { Platform } from "react-native";
import Purchases from "react-native-purchases";

import { captureException, captureEvent } from "./observability";

const ENTITLEMENT_ID = "pro";
const ANNUAL_PRODUCT_ID = "dialedin_pro_annual";
let configuredFor: string | null = null;

export type ProPurchaseOption = {
  priceString: string;
  purchase: () => Promise<boolean>;
};

export type SubscriptionLoadCode = "S1" | "S2" | "S3";

export class SubscriptionLoadError extends Error {
  constructor(
    message: string,
    readonly code: SubscriptionLoadCode,
  ) {
    super(message);
    this.name = "SubscriptionLoadError";
  }
}

type PurchasesFailure = {
  code?: string | number;
  message?: string;
  underlyingErrorMessage?: string;
  userInfo?: {
    readableErrorCode?: string;
  };
};

function purchasesFailure(error: unknown): PurchasesFailure {
  return typeof error === "object" && error !== null ? (error as PurchasesFailure) : {};
}

function capturePurchasesException(error: unknown, action: string) {
  const failure = purchasesFailure(error);
  captureException(error, {
    feature: "subscriptions",
    action,
    extra: {
      purchases_code: failure.code,
      readable_code: failure.userInfo?.readableErrorCode,
      underlying_error: failure.underlyingErrorMessage,
    },
  });
}

function apiKey() {
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    default: undefined,
  });
}

async function ensurePurchasesConfigured(userId: string): Promise<void> {
  const key = apiKey();
  if (!key) throw new SubscriptionLoadError("Subscriptions are not configured in this build.", "S1");

  try {
    if (!configuredFor) {
      Purchases.configure({ apiKey: key, appUserID: userId });
      configuredFor = userId;
    } else if (configuredFor !== userId) {
      await Purchases.logIn(userId);
      configuredFor = userId;
    }
  } catch (error) {
    capturePurchasesException(error, "configure");
    throw new SubscriptionLoadError("The subscription service could not be started.", "S2");
  }
}

export async function loadProPackage(userId: string): Promise<ProPurchaseOption> {
  await ensurePurchasesConfigured(userId);

  let offerings: Awaited<ReturnType<typeof Purchases.getOfferings>> | null = null;
  let offeringsError: unknown = null;
  try {
    offerings = await Purchases.getOfferings();
  } catch (error) {
    offeringsError = error;
    capturePurchasesException(error, "get_offerings");
  }

  const annual = offerings?.current?.annual || offerings?.current?.availablePackages.find((item) => item.packageType === "ANNUAL");
  if (annual) {
    captureEvent("subscriptions.product_loaded", { source: "offering", product_id: annual.product.identifier });
    return {
      priceString: annual.product.priceString,
      purchase: async () => {
        const result = await Purchases.purchasePackage(annual);
        return Boolean(result.customerInfo.entitlements.active[ENTITLEMENT_ID]);
      },
    };
  }

  let products;
  try {
    products = await Purchases.getProducts([ANNUAL_PRODUCT_ID]);
  } catch (error) {
    capturePurchasesException(error, "get_products");
    const failure = purchasesFailure(error);
    const errorCode = String(failure.code ?? "");
    if (offeringsError && ["2", "5", "23", "32"].includes(errorCode)) {
      throw new SubscriptionLoadError("Apple has not returned the Pro subscription for this storefront.", "S3");
    }
    throw new SubscriptionLoadError("The subscription service could not be reached.", "S2");
  }

  const product = products.find((item) => item.identifier === ANNUAL_PRODUCT_ID);
  if (!product) {
    const storefront = await Purchases.getStorefront().catch(() => null);
    captureEvent("subscriptions.product_unavailable", {
      product_id: ANNUAL_PRODUCT_ID,
      storefront: storefront?.countryCode,
      offering_count: offerings ? Object.keys(offerings.all).length : 0,
      offerings_error_code: purchasesFailure(offeringsError).code,
    });
    throw new SubscriptionLoadError("Apple has not returned the Pro subscription for this storefront.", "S3");
  }

  captureEvent("subscriptions.product_loaded", { source: "direct", product_id: product.identifier });
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

export async function restorePro(userId: string): Promise<boolean> {
  await ensurePurchasesConfigured(userId);
  const customerInfo = await Purchases.restorePurchases();
  return Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]);
}
