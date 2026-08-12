# DialedIn Mobile

React Native / Expo app for DialedIn. The app includes machine pages, grinder pages, guides, and DialChat AI Shot Analysis.

## Run Locally

Install dependencies once:

```bash
cd /Users/ahmadrayan/Desktop/DialedIn/dialedin-mobile
npm install
```

Run against a local backend on the iOS simulator:

```bash
EXPO_PUBLIC_AI_SHOT_API_URL=http://localhost:8000 \
EXPO_PUBLIC_DIALEDIN_API_URL=http://localhost:8000 \
npm run ios
```

Run against the personal AWS dev API:

```bash
EXPO_PUBLIC_AI_SHOT_API_URL=http://api-dev.dialedin.me \
EXPO_PUBLIC_DIALEDIN_API_URL=http://api-dev.dialedin.me \
npm run ios
```

A real phone must use a reachable LAN/cloud URL, not simulator-only `localhost`.

## Environment

Copy `.env.example` to `.env` for local defaults. Expo exposes only variables that start with `EXPO_PUBLIC_`.

- `EXPO_PUBLIC_AI_SHOT_API_URL`: DialChat, image recognition, upload URLs, and shot analysis
- `EXPO_PUBLIC_DIALEDIN_API_URL`: machine and grinder profile API

## DialChat Media Flow

Photos are resized/compressed on-device before they are sent to DialChat for equipment recognition. Shot videos use the backend media flow:

1. The app asks the backend for an upload URL.
2. The app uploads the selected video.
3. The app registers the uploaded media.
4. DialChat analyzes the returned media key.

Shot videos longer than 80 seconds are rejected on-device so users do not wait on huge uploads.

## Checks

```bash
npm run lint
npx tsc --noEmit
npx expo config --json >/tmp/dialedin-expo-config.json
```

## Release Notes

See `docs/mobile-release-readiness.md` before making TestFlight, App Store, or Play Store builds.

EAS profiles live in `eas.json`:

```bash
npx eas build --profile preview --platform ios
npx eas build --profile production --platform ios
```

Production should use HTTPS URLs such as `https://api.dialedin.me` after the production infrastructure checkpoint is complete.
