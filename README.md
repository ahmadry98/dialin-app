# ☕ DialedIn Mobile

### React Native Mobile App for the DialedIn Espresso Companion

DialedIn Mobile is the user-facing application for **DialedIn**, an AI-powered espresso companion designed to help home baristas understand their equipment, analyze espresso shots, and make better dialing decisions.

🌐 **Live Website:** https://www.dialedin.me/

---

## 📱 Overview

The mobile application brings together espresso equipment discovery, educational guides, and **DialChat**, an AI-assisted shot analysis experience.

Users can:

- Browse espresso machines and grinders
- View equipment-specific information
- Follow brewing and cleaning guides
- Interact with DialChat
- Upload photos for equipment recognition
- Upload shot videos for analysis
- Receive shot timing and dialing recommendations

---

## ✨ Features

### 🤖 DialChat — AI Shot Analysis

DialChat guides users through the espresso dialing process conversationally.

It collects information such as:

- Espresso machine
- Grinder
- Grind setting
- Dose
- Shot information
- Taste feedback
- Photos and videos

The collected context is sent to the DialedIn backend for analysis and recommendation generation.

---

### 🎥 Shot Video Analysis

Users can provide videos of their espresso shots.

The mobile app handles the media workflow by requesting an upload URL, uploading the media, registering it with the backend, and passing the resulting media reference into DialChat.

```text
Select Shot Video
       │
       ▼
Request Upload URL
       │
       ▼
Upload Media
       │
       ▼
Register Media
       │
       ▼
DialChat Analysis
       │
       ▼
Shot Timing + Recommendation
```

Videos longer than the supported duration are rejected on-device to avoid unnecessary uploads.

---

### 📸 Equipment Recognition

Photos can be resized and compressed on-device before being sent for equipment recognition.

This allows users to provide visual context without sending unnecessarily large image payloads.

---

### ⚙️ Machine & Grinder Profiles

The app provides dedicated browsing and profile experiences for espresso machines and grinders.

Equipment information is retrieved from the DialedIn backend and used throughout the application to provide equipment-specific context.

---

### 📖 Espresso Guides

DialedIn includes practical educational content covering areas such as:

- Brewing workflow
- Dialing fundamentals
- Taste refinement
- Machine cleaning and maintenance

The goal is to support both new espresso users and users actively dialing in their equipment.

---

## 🏗️ Mobile Architecture

```text
┌───────────────────────────────┐
│      React Native / Expo      │
│                               │
│   DialChat                    │
│   Equipment Browser           │
│   Guides                      │
│   Media Selection             │
└───────────────┬───────────────┘
                │
           HTTPS / REST
                │
                ▼
┌───────────────────────────────┐
│       DialedIn Backend        │
│          FastAPI              │
└───────────────┬───────────────┘
                │
       ┌────────┼─────────┐
       ▼        ▼         ▼
   Bedrock     S3      DynamoDB
```

The mobile application is kept separate from the backend and AI infrastructure, communicating with DialedIn services through APIs.

---

## 🛠️ Tech Stack

| Area | Technology |
|---|---|
| **Mobile** | React Native |
| **Framework** | Expo |
| **Language** | TypeScript |
| **Backend Communication** | REST APIs |
| **Media** | Image & video upload workflows |
| **Cloud Backend** | AWS |
| **AI Backend** | AWS Bedrock |
| **Storage** | Amazon S3 |
| **Profiles / Data** | DynamoDB |
| **Build & Distribution** | Expo EAS |

---

## 🔄 DialChat Media Flow

Shot media uses a dedicated upload flow rather than embedding large video payloads directly into chat requests.

```text
Mobile App
    │
    ├── Request upload URL
    │
    ▼
Presigned Upload
    │
    ▼
Amazon S3
    │
    ▼
Register Media
    │
    ▼
DialedIn Backend
    │
    ▼
DialChat / Shot Analysis
```

This keeps large media transfers separate from normal API requests.

---

## 🔐 Client-Side Observability

The application records scrubbed client-side events for areas such as:

- API failures
- Media upload failures
- Permission denial
- Oversized shot videos
- DialChat session persistence issues

Sensitive information such as image data, presigned URLs, media keys, video keys, and message contents is intentionally excluded from diagnostic logging.

---

## 🔗 DialedIn Ecosystem

DialedIn is split into separate components:

### Mobile Application
This repository — the React Native / Expo client.

### Backend & AI

[DialedIn-Fursa](https://github.com/ahmadry98/DialedIn-Fursa)

FastAPI backend, DialChat AI workflows, espresso tools, AWS infrastructure, media analysis, and deployment configuration.

### Website

https://www.dialedin.me/

Product website and information about DialedIn.

---

## 🚀 Local Development

### Requirements

- Node.js
- npm
- Expo tooling
- iOS Simulator, Android Emulator, or physical device

### Install

```bash
git clone https://github.com/ahmadry98/dialin-app.git
cd dialin-app

npm install
```

### Environment

Copy the example configuration:

```bash
cp .env.example .env
```

Expo client-side environment variables use the `EXPO_PUBLIC_` prefix.

Important configuration includes:

```text
EXPO_PUBLIC_AI_SHOT_API_URL
EXPO_PUBLIC_DIALEDIN_API_URL
EXPO_PUBLIC_OBSERVABILITY_LOGS
```

---

## ▶️ Run the App

Start Expo:

```bash
npx expo start
```

Or run directly on iOS:

```bash
npm run ios
```

A physical device must use a backend URL reachable from that device rather than simulator-only `localhost`.

---

## ✅ Development Checks

Before release:

```bash
npm run lint
npx tsc --noEmit
npx expo config --json
```

---

## 📦 Builds

Expo EAS is used for application builds.

Preview:

```bash
npx eas build --profile preview --platform ios
```

Production:

```bash
npx eas build --profile production --platform ios
```

Additional release-readiness documentation is available under:

```text
docs/mobile-release-readiness.md
```

---

## 🗺️ Project Status

DialedIn Mobile is under active development as part of the broader DialedIn platform.

Current work focuses on improving the mobile experience, shot analysis, equipment intelligence, reliability, and production readiness.

---

## 👨‍💻 Author

**Ahmad Rayan**

Computer Science graduate from Tel Aviv University.

Interested in software engineering, mobile development, backend systems, cloud infrastructure, and AI-powered applications.
