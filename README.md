# NexTab

A customizable, privacy-focused, cross-browser New Tab extension featuring interactive animated ASCII art, real-time search with DuckDuckGo autocomplete, drag-and-drop favourites, and native bookmarks integration.

---

## Overview

**NexTab** replaces the default browser new tab page with a lightweight, dark-themed productivity dashboard. Mesmerizing, handcrafted ASCII animals glide across an HTML5 canvas while providing instant access to web search, quick-access site shortcuts, and browser bookmarks—all presented in a clean glassmorphism interface.

NexTab is built with zero runtime dependencies for its canvas animation engine and is designed from the ground up to respect user privacy.

---

## Features

### 1. Seven Interactive ASCII Animal Animations
NexTab includes seven distinct ASCII animal animations drawn in real time on an HTML5 canvas:

| Animal | Movement & Behavior | Color Swatch |
|---|---|---|
| **Butterflies** | Blue Morphos on migration: fluttering, zig-zagging, and gliding with wings held flat. | Blue (`rgb(70, 150, 255)`) |
| **Koi** | Graceful carp swimming along lazy S-curves across varieties (Kohaku, Sanke, Showa, Ogon, Chagoi). **Interactive:** Click or tap the canvas to drop food flakes, prompting nearby fish to swim over and eat. | Orange-Red (`rgb(235, 95, 60)`) |
| **Jellyfish** | Bioluminescent magenta bells that pulse with light on each contraction, slowly dimming as they drift with frilly oral arms through ambient marine snow. | Magenta (`rgb(230, 80, 200)`) |
| **Dragonflies** | Emerald Hawkers that hover in place, dart abruptly, and cruise along. Features detailed eyes, a striped green thorax, a banded emerald body, and shimmering veined wings. | Emerald Green (`rgb(50, 215, 130)`) |
| **Frogs** | Spotted leopard frogs that sit, breathe, and blink, before leaping in high arcs and splashing upon landing. | Spring Green (`rgb(120, 205, 80)`) |
| **Cranes** | Red-crowned cranes in flight with broad white wings, splayed primary feathers, black secondaries, and realistic wrist-folding upstrokes and glides. | White / Red-crowned (`rgb(240, 240, 245)`) |
| **Crabs** | Sideways scuttling in quick bursts with stepping legs and sandy footprints. **Interactive:** Click or tap to startle them, sending them bolting away with claws raised. | Coral Orange (`rgb(240, 110, 60)`) |

#### Animation Engine Details:
- **Depth Simulation:** Smaller animals represent distant creatures; they move slower and fade into the background.
- **Wrap-around Re-entry:** Animals leaving the screen downstream re-enter smoothly upstream.
- **Canvas Interactivity:** Clicking or tapping the canvas startles nearby creatures or triggers feeding behavior.
- **Persistence:** Your selected animal is remembered across visits in `localStorage`.
- **Tweaks Panel:** A built-in configuration drawer lets you adjust movement physics, visual density, speed, and individual animal parameters, or export settings as JSON.

---

### 2. Fast Search with DuckDuckGo Autocomplete
The central search bar provides a responsive, multi-tiered search experience implemented in `ui.ts` and `websites.ts`:

- **Instant Local Suggestions (0ms):**
  - **Explicit URLs:** Detects protocol prefixes (`http://`, `https://`), `www.` prefixes, or common recognized TLDs (`.com`, `.org`, `.net`, `.io`, `.dev`, etc.) and offers direct navigation.
  - **Matching Bookmarks:** Searches locally cached bookmarks for prefix matches on domain or title (requires at least 2 characters, up to 2 results).
  - **Universal Website Directory:** Matches query prefixes against a local registry of popular online services and their aliases (e.g., `ins` for Instagram, `wh` for WhatsApp, `fb` for Facebook, up to 2 results).
  - **Dynamic Brand Inference:** For single-word inputs (3–30 characters, no spaces, non-stop-word) that do not match the registry, infers a direct `.com` navigation suggestion (`https://www.<word>.com/`).
  - **DuckDuckGo Top-Result Discovery:** If no local website match is found initially, evaluates the top DuckDuckGo search suggestion to infer a direct domain when applicable.
- **DuckDuckGo Autocomplete:** Queries DuckDuckGo's public autocomplete API (`https://duckduckgo.com/ac/?q=...&type=list`) with a 60ms debounce. Filters out suggestions that duplicate active website items and displays up to 6 search suggestions.
- **Keyboard & Mouse Navigation:**
  - Navigate suggestions with <kbd>↑</kbd> and <kbd>↓</kbd> arrow keys.
  - Press <kbd>Enter</kbd> to open a highlighted suggestion (navigates directly to the website/bookmark URL, or executes a search via Brave Search).
  - Pressing <kbd>Enter</kbd> with no suggestion selected submits the typed query to Brave Search (`https://search.brave.com/search?q=...`).
  - Press <kbd>Esc</kbd> to dismiss suggestions, blur the input, and exit focus mode.
  - Hovering highlights an item; clicking selects and navigates immediately.
- **Focus Mode:** Focusing the search input activates an uncluttered focus state for typing, closing suggestions when clicking outside.

---

### 3. Favourites & Speed-Dial
A customizable, client-side shortcuts grid:

- **Cross-Browser Compatibility:** Stored entirely in browser `localStorage`, ensuring identical functionality across Chromium, Firefox, and Safari.
- **Add Shortcuts:** Click `+ Add` to save any website with a custom label and URL.
- **Drag-and-Drop Reordering:** Easily rearrange favourite tiles using native HTML5 drag-and-drop.
- **Delete Shortcuts:** Click the `×` button on any tile to remove it.
- **Display Options:**
  - **Hide/Show Names:** Toggle text labels on or off to switch between detailed tiles and a minimalist icon-only layout.
  - **Visibility Toggle:** Click the eye icon button to expand or collapse the entire favourites container.
- **Safety & Hygiene:** Built-in local domain blocker blocks adult websites from being added, and duplicate domain checks prevent clutter.

---

### 4. Native Browser Bookmarks
Integrates directly with the browser's bookmark collection:

- **Bookmark Display:** Lists bookmarks with page titles, destination links, and site icons.
- **Manage Bookmarks:** Remove bookmarks directly from the new tab interface with a confirmation step.
- **Live Syncing:** Listens to bookmark events (`onCreated`, `onRemoved`, `onChanged`, `onMoved`) to automatically update without requiring manual page reloads.
- **Browser Differences:**
  - **Chromium & Firefox:** Supported natively using the WebExtension `bookmarks` API.
  - **Safari:** The WebExtension `bookmarks` API is unavailable in Safari. NexTab detects this at runtime via capability detection and gracefully skips mounting the bookmarks section, ensuring a clean and error-free display.

---

## Privacy Approach

NexTab is built with strict privacy standards verified directly against the extension manifests and source code:

- **No Browsing-History Permission:** NexTab never requests or uses the `history` permission in any browser manifest.
- **No `topSites` Permission:** NexTab does not request or access the `topSites` permission; site suggestions come exclusively from user-added favourites, explicit bookmarks (where supported), and local domain dictionaries.
- **Zero Analytics or Telemetry:** There are no analytics libraries, tracking pixels, telemetry beacons, external fonts, or third-party monitoring scripts.
- **Search Queries:** Autocomplete suggestions are fetched directly from DuckDuckGo (`https://duckduckgo.com/ac/`). Search queries are only sent to DuckDuckGo when typing in the search bar. Standard search submissions navigate directly to Brave Search (`https://search.brave.com/search?q=...`).
- **Direct Favicon Loading:**
  - Favicons are fetched directly from the target website's own origin (e.g., `https://<domain>/favicon.ico` and `https://www.<domain>/favicon.ico`).
  - No third-party favicon aggregators or CDNs (such as Google or DuckDuckGo favicon proxies) are ever used.
  - A 3-second network timeout prevents slow or unresponsive servers from delaying the UI.
  - If a favicon fails to load, NexTab dynamically generates a deterministic SVG monogram badge locally (`data:image/svg+xml`) without making any network requests.
  - Successfully resolved icons are cached in `localStorage` (`nextab_favicons`, up to 300 entries) for immediate 0ms rendering on return visits.
- **Content Security Policy (CSP):** The extension enforces `script-src 'self'; object-src 'self'; img-src 'self' https: data: blob:;`, ensuring only locally bundled scripts run.

---

## Supported Browser Targets & Testing Status

| Browser Platform | Target Folder | Manifest Version | Bookmarks Support | Liquid Glass Effect | Current Testing Status |
|---|---|---|---|---|---|
| **Chromium-based**<br>(Google Chrome, Brave, Microsoft Edge, Opera, Vivaldi) | `dist/chrome/` | Manifest V3 | Yes (`bookmarks`) | Yes (SVG filter displacement) | **Build passed; runtime testing pending** — Generates complete build files; actual browser loading and runtime testing are still pending. |
| **Mozilla Firefox** | `dist/firefox/` | Manifest V3 | Yes (`bookmarks`) | Fallback to frosted glass | **Build passed; runtime testing pending** — Generates Gecko-compatible Manifest V3 (`nextab@extension.local`); actual browser loading and runtime testing are still pending. |
| **Apple Safari** | `dist/safari/` | Manifest V3 | No (omitted from manifest) | Fallback to frosted glass | **Build target only; NOT runtime-tested** — Manifest and code adapt to Safari limitations (omitting bookmarks), but packaging into an Xcode project has not been performed or verified. |

> [!NOTE]
> Safari requires web extensions to be wrapped inside an Xcode native application container (`xcrun safari-web-extension-converter`) and signed with an Apple Developer account. NexTab produces the compiled web extension assets in `dist/safari/`, but does not include pre-packaged Xcode project files or Apple-signed binaries.

---

## Technology Stack

- **Language:** TypeScript 5.6+
- **Bundler & Build Tool:** Vite 6.0+
- **Canvas Rendering Engine:** Custom HTML5 2D Canvas ASCII rasterizer and flocking simulation (zero external runtime dependencies)
- **UI Architecture:** Vanilla TypeScript, HTML5, Modern CSS (Glassmorphism, CSS Custom Properties, SVG displacement filters)
- **APIs & Protocols:**
  - WebExtension Manifest V3
  - DuckDuckGo OpenSearch Autocomplete API
  - WebExtension Bookmarks API (Chromium & Firefox)
  - Web Storage API (`localStorage`)
  - HTML5 Drag and Drop API

---

## Requirements

- **Node.js:** v18.0.0 or later (Node.js 20+ recommended)
- **npm:** v9.0.0 or later (or compatible package managers such as pnpm or yarn)

---

## Build Commands

All build scripts are defined in `package.json`:

```sh
# Install project dependencies
npm install

# Start local Vite development server for UI development
npm run dev

# Run TypeScript compiler checks without emitting files
npm run typecheck

# Build extension for Chromium-based browsers (Chrome, Brave, Edge, etc.)
npm run build:chrome

# Build extension for Mozilla Firefox
npm run build:firefox

# Build extension assets for Apple Safari
npm run build:safari

# Build all browser targets sequentially
npm run build
```

---

## Generated Build Locations

Running the build commands creates production-ready extension directories in the `dist/` folder:

- `dist/chrome/`: Output for Chromium browsers (contains `manifest.json` configured for Chrome, Brave, and Edge).
- `dist/firefox/`: Output for Firefox (contains `manifest.json` with Firefox Gecko settings).
- `dist/safari/`: Output for Safari (contains `manifest.json` without bookmarks permission).

---

## Loading the Extension for Testing

### Chromium-Based Browsers (Chrome, Brave, Edge, Opera, Vivaldi)

1. Build the Chromium distribution:
   ```sh
   npm run build:chrome
   ```
2. Open your browser and navigate to the extensions settings page:
   - **Chrome / Brave:** `chrome://extensions` or `brave://extensions`
   - **Microsoft Edge:** `edge://extensions`
3. Enable **Developer mode** using the toggle switch (typically in the top-right corner).
4. Click the **Load unpacked** button.
5. In the file picker, select the `dist/chrome` folder inside the NexTab directory.
6. Open a new tab to see NexTab running.

---

### Mozilla Firefox

1. Build the Firefox distribution:
   ```sh
   npm run build:firefox
   ```
2. Open Firefox and navigate to:
   ```text
   about:debugging#/runtime/this-firefox
   ```
3. Under the **Temporary Extensions** section, click **Load Temporary Add-on...**.
4. In the file picker, navigate to `dist/firefox/` and select `manifest.json`.
5. Open a new tab to verify the extension.

> [!NOTE]
> Firefox unloads temporary extensions when the browser is closed. For persistent installation, extensions must be signed via addons.mozilla.org (AMO) or loaded in Firefox Developer Edition / Nightly with signing requirements disabled.

---

### Apple Safari Notes

Safari does not support loading loose WebExtension folders via a direct "Load unpacked" button. To install a WebExtension in Safari:
1. The extension bundle in `dist/safari` must be converted into an Xcode project using Apple's command-line tool:
   ```sh
   xcrun safari-web-extension-converter dist/safari
   ```
2. The generated project must be built in Xcode and signed with an active Apple Developer certificate.
3. The developer must enable unsigned extensions in Safari's Develop menu for local testing.

Because this native packaging pipeline has not been executed or verified for this repository, **Safari support is currently considered an untested build target.**

---

## Project Structure

```text
NexTab/
├── manifests/                      # Browser-specific Manifest V3 templates
│   ├── manifest.chromium.json     # Chrome / Edge / Brave manifest (with bookmarks)
│   ├── manifest.firefox.json      # Firefox manifest (with Gecko ID & bookmarks)
│   └── manifest.safari.json       # Safari manifest (no bookmarks permission)
├── public/                         # Static icons and assets
├── src/                            # Core animation engine and adapters
│   ├── adapters/                  # Cross-browser capability bridges
│   │   ├── bookmarks.ts           # Unified Promise/callback bookmarks bridge
│   │   ├── browser.ts             # Global WebExtension namespace resolver
│   │   ├── capabilities.ts        # Runtime feature detection (bookmarks, liquid glass)
│   │   └── favicon.ts             # Direct-origin favicon loader & SVG fallback
│   ├── animals/                   # ASCII animal animation modules
│   │   ├── butterflies.ts         # Blue Morpho migration
│   │   ├── crabs.ts               # Sideways scuttling crabs
│   │   ├── cranes.ts              # Red-crowned flying cranes
│   │   ├── dragonflies.ts         # Emerald Hawkers
│   │   ├── frogs.ts               # Spotted leopard frogs
│   │   ├── jellyfish.ts           # Bioluminescent pulsing jellyfish
│   │   ├── koi.ts                 # Swimming koi with feeding interaction
│   │   ├── shapes.ts              # Geometric and ASCII drawing primitives
│   │   └── index.ts               # Animal registry and exports
│   ├── engine.ts                  # Canvas animation loop and lifecycle
│   ├── flock.ts                   # Simulation physics, depth, and steering
│   ├── ink.ts                     # Colors, palettes, and alpha tinting
│   ├── math.ts                    # Vector math and easing utilities
│   └── renderer.ts                # ASCII character rasterizer and pen engine
├── bookmarks.ts                    # Bookmarks UI component
├── demo.ts                         # Application entrypoint & component orchestration
├── favourites.ts                   # Drag-and-drop favourites grid component
├── index.html                      # New tab page HTML template
├── liquid.ts                       # Liquid glass effect initialization
├── manifest.json                   # Root/development manifest
├── package.json                    # Scripts and devDependencies
├── page.css                        # Global styling and glassmorphism theme
├── panel.ts                        # Real-time tweaks control drawer
├── tsconfig.json                   # TypeScript compiler configuration
├── ui.ts                           # Search composer & DuckDuckGo autocomplete
├── vite.config.ts                  # Multi-target Vite build configuration
└── websites.ts                     # Static directory for instant website matching
```

---

## Known Limitations

1. **Runtime Testing Pending:** While production builds generate cleanly for all browser targets, actual browser loading and runtime testing are pending for Chromium and Firefox. Safari support remains completely untested at runtime and requires Xcode packaging.
2. **Liquid Glass Rendering:** SVG displacement filtering inside CSS `backdrop-filter` is implemented for Chromium engines. Firefox and other engines fall back to standard frosted glass blur.
3. **Temporary Extension Persistence in Firefox:** Loading via `about:debugging` is temporary and resets whenever Firefox is restarted.
4. **Bookmarks Permission:** On Chromium and Firefox, accessing browser bookmarks requires the `"bookmarks"` permission. If the user declines or the browser does not support the API (such as Safari), the bookmarks panel gracefully remains unmounted.
5. **Search Submission Destination:** Search suggestions are fetched from DuckDuckGo's autocomplete API, while search submissions navigate to Brave Search (`https://search.brave.com/search?q=...`) by default.

---

## License

This project is licensed under the [MIT License](LICENSE).
