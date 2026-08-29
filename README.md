<div align="center">

# 🌟 Garcia — Next-Gen AI Dating & Social Networking Ecosystem

<p align="center">
  <strong>An intelligent, privacy-first dating and social discovery platform featuring AI-powered matchmaking, live radar discovery, real-time Agora speed-dating, and biometric liveness verification.</strong>
</p>

[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.9-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Agora RTC](https://img.shields.io/badge/Agora-RTC%20Audio%2FVideo-099DFD?style=for-the-badge&logo=agora&logoColor=white)](https://www.agora.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<br/>

<a href="#-key-features">Key Features</a> •
<a href="#-system-architecture">Architecture</a> •
<a href="#-tech-stack">Tech Stack</a> •
<a href="#-monorepo-structure">Project Structure</a> •
<a href="#-getting-started">Getting Started</a> •
<a href="#-admin-dashboard">Admin Panel</a> •
<a href="#-license">License</a>

---

</div>

## 📖 Overview

**Garcia** is an enterprise-grade dating and location-based social ecosystem built to redefine digital romance and community building. Unlike conventional swipe apps, Garcia combines **computer vision-based liveness verification**, **interactive MapLibre radar discovery**, **AI-assisted conversation coaching**, **audio/video speed dating**, and a dedicated **Next.js administrative moderation console**.

The repository is organized as a unified monorepo containing:
1. 📱 **Mobile Application**: Cross-platform React Native / Expo application targeting iOS and Android.
2. 💻 **Admin Dashboard**: Full-stack Next.js 16 app for real-time user moderation, photo approval queues, metrics, and fraud control.
3. 🗄️ **Database & Domain Layer**: High-performance PostgreSQL data model managed via Prisma ORM with strict referential integrity.

---

## ✨ Key Features

### 📱 Mobile Experience (`/mobile`)

| Feature | Description |
| :--- | :--- |
| 🤖 **AI Cupid & Conversation Coach** | Built-in smart wingman that audits user profiles (photo count, bio strength, interest coverage) and provides AI icebreakers tailored to matches. |
| 📍 **MapLibre Interactive Radar** | Live nearby user map with dynamic status pills (*"Coffee Time"*, *"Gym"*, *"Listening to Music"*), distance filtering, and real-time weather info. |
| 🎭 **Blind Date Mode** | Gamified matchmaking that emphasizes personality over looks. Profile photos remain blurred and unlock only after exchanging 10 meaningful messages. |
| ⚡ **Fast Express & Speed Dating** | Real-time audio/video mini-dates powered by **Agora RTC** with countdown timers and instant chemistry scoring. |
| 🛡️ **Biometric Liveness Verification** | Camera-based anti-catfishing check (`expo-face-detector`) requiring head rotation and smiling gesture confirmation before account activation. |
| 💬 **Real-Time Rich Chat** | Powered by **Socket.io** with voice message recording/playback (`expo-av`), photo sharing, typing indicators, read receipts, and profile drawer. |
| 📸 **24h Ephemeral Stories** | Instagram-style disappearing stories with instant visual viewer and visitor analytics. |
| 🎟️ **Local Community Events** | Browse, create, and RSVP to local activities, meetups, and social gatherings with GPS routing. |
| 💎 **Garcia Premium & Monetization** | In-app subscriptions and consumables managed through **RevenueCat** (Super Likes, Profile Boosts, "Who Liked Me", and "Profile Visitors"). |
| 🎯 **Daily Check-In & Streaks** | Gamified engagement system awarding streak badges and activity boosts. |

---

### 🛡️ Admin Moderation Console (`/admin`)

- 📊 **Executive Dashboard**: Real-time stats on total registrations, active matches, pending photo verifications, and user flags.
- 👁️ **Manual & Automated Photo Approval**: Comprehensive verification pipeline for reviewing uploaded photos against strict guidelines.
- 👥 **User Management & Moderation**: Instant account suspension, shadowbanning, strike management, and detailed user audit logs.
- 🚨 **Report Resolution Center**: Triage harassment, fake profile, and spam complaints with attached evidence and user history.
- 📈 **Analytics & Growth Metrics**: User conversion funnel, engagement metrics, and daily active user tracking.

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph Clients["Clients Layer"]
        iOS["iOS App (Expo/RN)"]
        Android["Android App (Expo/RN)"]
        AdminWeb["Admin Portal (Next.js 16)"]
    end

    subgraph API_Services["Backend & Third-Party Services"]
        API["Backend API & Sockets"]
        Agora["Agora RTC (Voice/Video)"]
        RevCat["RevenueCat (IAP)"]
        MapLibre["MapLibre Vector Tiles"]
        S3["Object Storage (Media/Photos)"]
    end

    subgraph Data_Layer["Data & Persistence Layer"]
        PG[(PostgreSQL 16)]
        Prisma["Prisma ORM Client"]
        MMKV["React Native MMKV / AsyncStore"]
    end

    iOS --> API
    Android --> API
    iOS --> Agora
    Android --> Agora
    iOS --> RevCat
    Android --> RevCat
    iOS --> MapLibre
    Android --> MapLibre
    iOS --> MMKV
    Android --> MMKV

    AdminWeb --> Prisma
    API --> Prisma
    Prisma --> PG
    API --> S3
```

---

## 🛠️ Tech Stack

### Mobile Client (`/mobile`)
- **Core Framework**: React Native (0.81.5), Expo (SDK ~54.0) with Expo Router v6
- **Language**: TypeScript 5.9
- **State Management**: Zustand 5.0, TanStack React Query 5.101
- **Real-Time Communication**: Socket.io Client 4.8, Agora RTC SDK 4.6
- **Maps & Geolocation**: `@maplibre/maplibre-react-native`, `expo-location`
- **Vision & Media**: `expo-camera`, `expo-face-detector`, `expo-image`, `expo-av`, `expo-video`
- **Animations & UI**: `react-native-reanimated` 4.1, `react-native-gesture-handler`, `expo-linear-gradient`, `expo-haptics`
- **Monetization**: `react-native-purchases` (RevenueCat)
- **Local Storage**: `react-native-mmkv`, `@react-native-async-storage/async-storage`

### Admin Console (`/admin`)
- **Framework**: Next.js 16.3 (App Router, Server Components, Server Actions)
- **UI & Styling**: React 19, Tailwind CSS v4, `@tailwindcss/postcss`, Lucide Icons
- **Database & ORM**: PostgreSQL, Prisma 7.9 with `@prisma/adapter-pg`
- **Security & Auth**: `jose` (JWT), `bcryptjs`, Secure HttpOnly Session Cookies
- **Validation**: Zod 4.4

---

## 📂 Monorepo Structure

```text
Garcia/
├── admin/                     # Next.js 16 Web Administration Dashboard
│   ├── src/
│   │   ├── app/               # App Router pages (Analytics, Approvals, Users, Moderation)
│   │   ├── components/        # UI components (Sidebar, PhotoGallery, Dialogs)
│   │   └── lib/               # Prisma client, JWT auth, middleware helpers
│   ├── prisma/                # Prisma schema & migrations for admin
│   ├── package.json
│   └── next.config.ts
│
├── mobile/                    # React Native (Expo SDK 54) Mobile Application
│   ├── app/                   # File-system router (Expo Router)
│   │   ├── (auth)/            # Login, Register, Welcome screens
│   │   ├── (onboarding)/      # Bio, Interests, Photo upload, Liveness check
│   │   ├── (tabs)/            # Discover, Nearby radar, Matches, Events, Profile
│   │   ├── chat/              # Socket.io real-time chat & media
│   │   ├── ai-cupid.tsx       # AI wingman & profile audit assistant
│   │   ├── blind-date.tsx     # Mystery text-first matchmaking
│   │   ├── fast-express.tsx   # Live video/audio speed dating (Agora)
│   │   └── premium.tsx        # In-app purchase & paywall screen
│   ├── api/                   # Axios API client with automatic token refresh
│   ├── components/            # UI components (ProfileDetailSheet, ApprovalGuard, etc.)
│   ├── constants/             # Colors, typography, spacing tokens
│   ├── store/                 # Zustand stores (Auth, Chat, Discover, Matches)
│   ├── schema.prisma          # Shared database schema definition
│   └── package.json
│
├── play_store/                # High-resolution screenshots & store assets
├── LICENSE                    # MIT License
└── README.md                  # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your development machine:
- [Node.js](https://nodejs.org/) (v20.x or higher)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- [PostgreSQL](https://www.postgresql.org/) (v15+)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- iOS Simulator (macOS / Xcode) or Android Studio (Android SDK & Emulator)

---

### 1. Database Setup

Create a PostgreSQL database and configure your connection string:

```bash
# Example: Create database in PostgreSQL CLI
psql -U postgres
CREATE DATABASE garcia_db;
```

---

### 2. Admin Panel Setup (`/admin`)

```bash
# Navigate to admin directory
cd admin

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env # (or create .env)
```

Populate your `admin/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/garcia_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
```

Run database migrations and start the development server:
```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Start Next.js dev server
npm run dev
```

Visit `http://localhost:3000` to access the Admin Console.

---

### 3. Mobile App Setup (`/mobile`)

```bash
# Navigate to mobile directory
cd ../mobile

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env # (or create .env)
```

Populate your `mobile/.env`:
```env
EXPO_PUBLIC_API_URL="http://192.168.1.XX:4000"
EXPO_PUBLIC_AGORA_APP_ID="your-agora-app-id"
EXPO_PUBLIC_REVENUECAT_APPLE_KEY="appl_your_key"
EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY="goog_your_key"
```

Start the Expo development server:
```bash
# Start development server
npx expo start

# Run on Android Emulator
npx expo run:android

# Run on iOS Simulator (macOS only)
npx expo run:ios
```

---

## 🔐 Security, Privacy & Integrity

1. **Anti-Catfish Face Liveness**: Uses on-device facial landmark detection requiring real-time head turns and smiles.
2. **Double-Opt-In Approvals**: New accounts undergo validation before becoming discoverable in public feeds.
3. **Ghost / Privacy Mode**: Users can toggle distance visibility, exact location pinpointing, and online activity status.
4. **Token Security**: Dual-token authentication system (short-lived JWT access tokens + rotating refresh tokens stored in encrypted storage).
5. **Zero Tolerance Content Moderation**: Integrated reporting workflows with rapid automated and human-led ban enforcement.

---

## 📸 Screenshots & Showcase

<div align="center">
  <img src="./play_store/5b89343e-3cf3-41ce-b03d-58938bf6fb1c.png" width="30%" alt="Garcia UI Preview 1" />
  &nbsp;&nbsp;
  <img src="./play_store/ChatGPT%20Image%2023%20Ağu%202026%2018_58_46.png" width="30%" alt="Garcia UI Preview 2" />
  &nbsp;&nbsp;
  <img src="./play_store/ChatGPT%20Image%2023%20Ağu%202026%2019_00_57.png" width="30%" alt="Garcia UI Preview 3" />
</div>

---

## 🗺️ Roadmap

- [x] Onboarding & Face Liveness Verification
- [x] Swiping Match Engine with Interest Matching % calculation
- [x] MapLibre Real-Time Nearby Radar with status tags
- [x] Socket.io Voice & Media Chat
- [x] Agora RTC Audio/Video Speed Dating
- [x] Blind Date 10-message blur-to-reveal mode
- [x] Next.js 16 Admin Moderation & Approval Dashboard
- [ ] Spotify Top Artists & Tracks direct in-app audio preview
- [ ] Advanced E2E Encryption for private direct messages
- [ ] Multi-language Internationalization (i18n)

---

## 🤝 Contributing

Contributions are what make the open-source community an inspiring place to learn, create, and collaborate.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for full details.

---

<div align="center">
  Developed with ❤️ by <strong>Ahmet Erdem Serçeoğlu</strong>
</div>
