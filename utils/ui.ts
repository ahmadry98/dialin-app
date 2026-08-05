import { Dimensions, PixelRatio } from "react-native";

const { width: W, height: H } = Dimensions.get("window");

/**
 * Scale based on iPhone 14-ish baseline width (390).
 * - s(): general sizes (padding, radius, font size)
 * - v(): vertical sizes (heights)
 */
const BASE_W = 390;
const BASE_H = 844;

export const screen = { W, H };

export const s = (size: number) => {
  const scaled = (W / BASE_W) * size;
  // round to pixel grid so it looks sharp
  return PixelRatio.roundToNearestPixel(scaled);
};

export const v = (size: number) => {
  const scaled = (H / BASE_H) * size;
  return PixelRatio.roundToNearestPixel(scaled);
};

/** Clamp helper so things don’t get crazy large/small */
export const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));