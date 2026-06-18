# VoidFit AI — Fitness OS

A gamified AI-powered fitness app built with React, TypeScript, and Vite. Turn your workouts into an RPG — earn XP, level up, complete daily missions, track nutrition, and compete with friends.

## ✨ Features

- **AI Coach** — Powered by Gemini, OpenAI, or Anthropic. Generates daily missions, analyses meals via camera, and reacts to your progress in real time.
- **Gamification** — XP, levels, skill trees, ranks, badges, daily/weekly quests, and a punishment system for missed commitments.
- **Step Tracker** — Accelerometer-based step counting with GPS distance tracking.
- **Territory Map** — Claim zones on a real map as you explore your area.
- **Multiplayer** — Guilds, leaderboards, and PvP challenges.
- **Nutrition Logging** — Log meals manually or via AI vision analysis.
- **Recovery Tracking** — Sleep, soreness, and HRV logging.
- **Body Anatomy** — Visual muscle-group tracking and fatigue heatmap.
- **Offline-first** — All data stored locally in IndexedDB (Dexie). Optional Firebase cloud sync.
- **Themes** — Multiple visual themes (Dragon, Cyber, Mystic, and more).

## 🛠 Tech Stack

| Layer | Library |
|---|---|
| UI | React 19 + TypeScript |
| Bundler | Vite 6 |
| Styling | Tailwind CSS v4 |
| State | Zustand 5 |
| Local DB | Dexie 4 (IndexedDB) |
| Cloud | Firebase 11 (optional) |
| AI | Google Gemini / OpenAI / Anthropic |
| Animations | Framer Motion |
| Charts | Recharts |
| Map | Leaflet |
| Validation | Zod |
| Error tracking | Sentry |

## 🚀 Quick Start

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
# Google OAuth Client ID (required for Google Sign-In)
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id

# Firebase (optional — app works fully offline without this)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> **Google Client ID** — Create one at [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client IDs → Web application.

### 3. Run

```bash
npm run dev        # Dev server at http://localhost:3000
npm run build      # Production build → dist/
npm run preview    # Preview the production build
npm run test       # Run test suite
```

## 🔑 AI API Key

On first launch the onboarding wizard will ask for your AI API key. The app supports:

- **Gemini** (default) — [Get a key](https://aistudio.google.com/app/apikey) (free tier available)
- **OpenAI** — [Get a key](https://platform.openai.com/api-keys)
- **Anthropic** — [Get a key](https://console.anthropic.com/)

Keys are stored locally on your device using secure encrypted storage and are never sent to any server other than the selected AI provider.

## 🔒 Privacy

- All fitness data is stored locally in your browser's IndexedDB.
- Firebase sync is fully optional and off by default.
- Your AI API key never leaves your device (requests go directly from your browser to the AI provider).

## 📁 Project Structure

```
├── App.tsx                  # App entry point
├── components/              # UI components
│   ├── Dashboard/           # Dashboard widgets
│   ├── diagnostics/         # Error boundaries
│   ├── multiplayer/         # Guilds, leaderboard, PvP
│   ├── Onboarding/          # Onboarding steps
│   └── ...
├── services/                # AI service layer (Gemini calls)
├── src/
│   ├── app/                 # App shell, router, theme
│   ├── db/                  # Dexie database schema & hooks
│   ├── hooks/               # Custom React hooks
│   ├── services/            # Business logic services
│   │   └── ai/              # Multi-provider AI abstraction
│   ├── store/               # Zustand state stores
│   └── types/               # Shared TypeScript types
├── tests/                   # Unit tests (Vitest)
├── types.ts                 # Global types
└── constants.ts             # App-wide constants
```

## 🧪 Tests

```bash
npm run test
```

Tests cover AI provider abstraction, DB CRUD, fitness utilities, and the user store.

## 📄 License

MIT
