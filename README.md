# 🎵 Melodi — Music Player App

A full-featured React Native music streaming app built with **Expo** using the **JioSaavn API**.
Built as part of the Lokal React Native Intern assignment.

---

## 📱 Screenshots & Features

| Screen | Features |
|--------|---------|
| **Home** | Trending & Bollywood songs, tabbed browsing, search with debounce & pagination, pull-to-refresh, Recently Played section |
| **Player** | Full artwork display, seek bar, shuffle, repeat (off/queue/track), download, favorites, queue view |
| **Mini Player** | Persistent bar with real-time progress bar, play/pause/skip, synced with full player |
| **Favorites** | Heart any song, persisted across sessions via AsyncStorage |
| **Queue** | View current queue, remove songs, now-playing banner, download from queue |
| **Settings** | Shuffle toggle, repeat mode selector |
| **Artist Detail** | Tap any artist to see their songs, play all |
| **Album Detail** | Tap any album to see its songs, play all |

---

## 🏗 Architecture
```
src/
├── api/
│   └── saavn.ts               # All JioSaavn API calls, image/audio URL helpers
├── store/
│   └── playerStore.ts         # Zustand global state (queue, playback, favorites)
├── hooks/
│   ├── useAudioPlayer.ts      # expo-av sound engine, token-based race condition fix
│   └── audioInstance.ts       # Shared global sound instance
├── navigation/
│   └── AppNavigator.tsx       # Stack + custom Tab navigator with MiniPlayer
├── screens/
│   ├── HomeScreen.tsx         # Home with tabs, search, recently played
│   ├── PlayerScreen.tsx       # Full player with seek, controls, download
│   ├── FavoritesScreen.tsx    # Favorited songs
│   ├── PlaylistsScreen.tsx    # Queue management with download
│   └── SettingsScreen.tsx     # App settings
├── components/
│   ├── SongCard.tsx           # Reusable song row with favorite + queue buttons
│   └── MiniPlayer.tsx         # Persistent mini player with live progress bar
├── utils/
│   ├── theme.ts               # Colors, typography, spacing constants
│   └── format.ts              # Duration formatter, HTML entity decoder
└── types/
    └── index.ts               # Shared TypeScript types
```

---

## ⚙️ State Management

**Zustand** is used for all global state. A single `usePlayerStore` holds:

- `queue` — current list of songs
- `currentIndex` — active song index
- `isPlaying`, `currentPosition`, `duration`, `isLoading`
- `shuffleMode`, `repeatMode` — off / queue / track
- `favorites`, `recentlyPlayed`, `downloadedSongs` — all persisted via AsyncStorage

The `useAudioPlayer` hook drives `expo-av` and writes position/duration back into the store. MiniPlayer and PlayerScreen are always perfectly in sync because they both read from the same Zustand store.

---

## 🎧 Audio Engine

The audio engine uses a **load token pattern** to prevent race conditions:

- Every song load attempt gets a unique `loadToken`
- Before loading, the previous sound is fully stopped and unloaded
- After each `await`, the token is checked — if a newer song was tapped, the old load is discarded
- This guarantees **only one song ever plays at a time**, no matter how fast you tap
```
User taps song A → loadToken = 1, destroy old sound
User taps song B → loadToken = 2, abort song A load
Song B loads → token still 2 ✅ → play
```

---
 
## 🔁 Shuffle & Repeat

- **Shuffle ON** → plays songs in a pre-shuffled random order using `shuffledIndices` array
- **Repeat Off** → stops after last song
- **Repeat Queue** → loops back to song 1 after last song
- **Repeat Track** → replays current song forever, resets seek bar on finish

---

## 📡 API Integration

All data comes from the **JioSaavn API** (no API key required):

| Endpoint | Used for |
|----------|---------|
| `/api/search/songs?query=trending` | Home Suggested tab |
| `/api/search/songs?query=bollywood hits 2024` | Home Songs tab |
| `/api/search/artists?query=arijit singh` | Home Artists tab |
| `/api/search/albums?query=best hindi albums` | Home Albums tab |
| `/api/search/songs?query=...&page=N` | Paginated infinite scroll |
| `/api/artists/{id}/songs` | Artist detail songs |

---

## ⚖️ Trade-offs

| Decision | Reason |
|----------|--------|
| `expo-av` over `react-native-track-player` | RNTP has Gradle build issues with Expo SDK 55; expo-av is stable and supports background playback |
| `AsyncStorage` over MMKV | No native module needed; sufficient for favorites/queue persistence |
| Single Zustand store | Simpler than Redux for this scope; avoids boilerplate |
| Legacy `expo-file-system` API | New v2 API has bugs in Expo Go; legacy is stable for downloads |
| Load token pattern | Prevents multiple songs playing simultaneously without using locks |

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- Expo Go app on your Android/iOS device

### Steps
```bash
# 1. Clone the repo
git clone https://github.com/Nick-ui911/MusicPlayer.git
cd MusicPlayer

# 2. Install dependencies
npm install

# 3. Start the dev server
npx expo start

# 4. Scan the QR code with Expo Go app on your phone
#    Make sure phone and PC are on the same WiFi
#    OR use tunnel mode:
npx expo start --tunnel
```

### Build APK
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build APK
eas build --platform android --profile preview
```

---

## 📦 Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| React Native (Expo) | ~55 | Core framework |
| TypeScript | ~5.9 | Type safety |
| @react-navigation/stack | ^7 | Screen navigation |
| @react-navigation/bottom-tabs | ^7 | Tab navigation |
| Zustand | ^5 | State management |
| expo-av | ^16 | Audio playback & background audio |
| AsyncStorage | ^2.2 | Persistent storage |
| @react-native-community/slider | ^5 | Seek bar |
| @expo/vector-icons | ^15 | Ionicons |
| expo-file-system | ^55 | Song downloads |

---

## ✨ Features Implemented

### Core (Assignment Requirements)
- ✅ Home screen with song list, search, pagination
- ✅ Full player with seek bar, background playback
- ✅ Mini Player — persistent and synced with full player
- ✅ Queue — add, remove songs, persisted locally
- ✅ Shuffle and repeat modes
- ✅ Song download for offline listening

### Bonus / Extra
- ✅ **Recently Played** — horizontal scroll section on Home
- ✅ **Artist detail modal** — tap artist to see & play their songs
- ✅ **Album detail modal** — tap album to see & play songs
- ✅ **Real-time progress bar** on MiniPlayer
- ✅ **Seek bar fix** — no jumping while dragging
- ✅ **HTML entity decode** — no more `&quot;` in song names
- ✅ **Debounced search** — API called after 400ms pause
- ✅ **Infinite scroll pagination** — all 4 tabs load more on scroll
- ✅ **Per-tab search** — Songs/Artists/Albums each search their own endpoint
- ✅ **Race condition fix** — only one song plays at a time
- ✅ **Favorites** — heart button on every song card, persisted
- ✅ **Download** — available in Player screen and Queue screen
- ✅ **Dark theme** — full dark UI with orange (#FF6B35) accent
- ✅ **Pull-to-refresh** on Home screen
- ✅ **Active song highlight** — current song glows orange in all lists