# 📸 WildSnap: The Ultimate Wildlife Discovery App

Welcome to **WildSnap**, a real-world wildlife exploration game built as a Progressive Web App (PWA). WildSnap gamifies outdoor exploration by challenging players to go outside, photograph real animals, and build their Field Journal. Powered by cutting-edge AI and global mapping, WildSnap brings an MMORPG-like experience to wildlife conservation and discovery.

---

## 🌟 Core Features

### 🤖 AI-Powered Identification & Behavior Scoring
*   **Real-time Recognition:** Point your camera at an animal, snap a photo, and our AI (powered by the NIM Llama-3.1-70b Vision API) instantly identifies the species.
*   **Behavior Analysis:** The AI doesn't just identify the animal; it scores its behavior. Capturing an animal "Hunting" or "In Flight" grants massive XP multipliers compared to "Resting."
*   **Anti-Cheat System:** Advanced prompt engineering ensures the AI rejects pictures of screens, drawings, pets (dogs/cats), and zoo enclosures.

### 🗺️ Global WildMap & Territory Wars
*   **Live Tracking:** Every valid capture is pinned to a global map powered by Leaflet.
*   **Dynamic Territories:** The map automatically groups captures into geographic regions (via Nominatim Reverse Geocoding). The player with the most captures in a region claims ownership of that territory.
*   **Contested Zones:** Heavily contested territories flash red, encouraging rival players to initiate challenges.
*   **Heatmaps:** View global biodiversity hotspots to track where species are most active.

### 📖 Dynamic Species Encyclopedia & AI Lore
*   **NIM API Integration:** The encyclopedia dynamically fetches real-time structured data (IUCN status, Lifespan, Diet, Population) via serverless AI.
*   **Unlockable Lore:** Capturing a species multiple times unlocks poetic, Llama-generated "Archives" detailing the animal's history and significance.

### ⛈️ Environmental Context & Weather Bonuses
*   **Open-Meteo Integration:** The app pulls real-time weather data during a capture. Braving a thunderstorm or blizzard to photograph an animal grants a significant XP multiplier!

### 🏆 Deep Progression Systems
*   **Animal Mastery:** Master individual species to earn exclusive badges (Bronze, Silver, Gold, Platinum).
*   **Field Ranks:** Level up from "Novice Tracker" to "Global Legend."
*   **Streaks & Shields:** Play daily to build your streak multiplier. Earn "Streak Shields" to protect your progress if you miss a day.

### 🌍 Social: Clans, Bounties & Expeditions
*   **Research Clans:** Join one of three global factions (The Canopy Syndicate, Deep Blue Vanguard, or Crimson Horizon) and compete on clan-specific leaderboards.
*   **Server-Wide Expeditions:** Participate in global, community-driven goals (e.g., "Document 5,000 birds as a server this week") to unlock exclusive rewards.
*   **Daily Bounties:** Receive personalized daily targets to hunt specific animals in specific regions.
*   **Live Field Notes Feed:** A real-time scrolling feed of every discovery made by players around the world.

### 💚 Conservation Impact Tracking
*   **Endangered Species Focus:** Photographing animals marked as Vulnerable or Endangered grants bonus Conservation Points.
*   **Monthly AI Reports:** Generate personalized, AI-written monthly impact reports detailing your contribution to wildlife tracking.

---

## 🛠️ Technology Stack

WildSnap is a modern, mobile-first PWA built for performance and seamless cross-platform deployment.

### Frontend
*   **Framework:** React 18 + Vite
*   **Styling:** Vanilla CSS (Glassmorphism aesthetics, dynamic variables, modern keyframe animations)
*   **Icons:** Lucide-React
*   **Mapping:** Leaflet.js

### Backend & Database
*   **BaaS:** Supabase
*   **Database:** PostgreSQL (with Row Level Security enforcing player data privacy)
*   **Realtime:** Supabase Realtime subscriptions (powering the live social feed)
*   **Edge Functions:** Deno-based Supabase Edge Functions securely handle AI logic and hide sensitive API keys from the client.

### External APIs
*   **NIM API (Llama-3.1-70b):** Handles all visual identification, behavior assessment, structured JSON data retrieval, and dynamic lore generation.
*   **Open-Meteo:** For real-time, coordinate-based weather fetching.
*   **Nominatim (OpenStreetMap):** For reverse geocoding (converting coordinates into readable City/Region names for Territory Wars).

---

## 🚀 Architecture & Deployment

*   **PWA Ready:** Configured with `manifest.json` and service workers for offline caching and "Add to Home Screen" functionality.
*   **Android Build:** The project includes an `android` directory for generating a signed `.aab` (Android App Bundle) via Gradle and Capacitor, ready for the Google Play Store.

---

## 📸 Get Out There!
*The wild is waiting. Grab your camera, pick a clan, and start documenting the natural world.*
