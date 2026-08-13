import { requireOptionalNativeModule } from "expo-modules-core";

type AudioExtractorModule = {
  extractM4A(sourceUri: string): Promise<string>;
};

const nativeModule = requireOptionalNativeModule<AudioExtractorModule>("DialedInAudioExtractor");

export function supportsAudioExtraction(): boolean {
  return nativeModule !== null;
}

export async function extractShotAudio(sourceUri: string): Promise<string | null> {
  if (!nativeModule) return null;
  return nativeModule.extractM4A(sourceUri);
}
