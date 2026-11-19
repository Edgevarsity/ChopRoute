# ChopRoute — Implementation Guide

This document explains **what** was changed and built in **ChopRoute** (a **student front-end delivery demo** with sample listings and simulated checkout only), **how** each part is implemented under the hood, and **why** those design and technical choices were made.

---

## 1. Guiding Philosophy

Before this update, ChopRoute had been pared back to a clean visual shell (48 lines of HTML, 3 hardcoded text cards, and 14 lines of JS), while still carrying ~716 KB of unused assets and styles left over from an earlier Glovo landing-page clone.

The goal of this pass was to turn ChopRoute into a **complete, genuinely interactive delivery experience** that stays **simple, warm, and restrained** — no frameworks, no build tooling, no unnecessary bloat, and every feature connected into one coherent user flow:

**Set real address → Browse & filter menu → Add to bag → Review & place demo order.**

---

## 2. Full Repository Cleanup

### What we did
- Removed `css/tokens.css`, which was unreferenced and pointed `@font-face` rules to external `glovoapp.com` font URLs.
- Removed 12 unused legacy SVGs (including `glovo-logo.svg`, store badges, and placeholder icons) and unused third-party brand images (`assets/images/partners/`, `download-app-phones.png`, and blob graphics), reclaiming ~716 KB of dead weight.
- Kept only the two assets that belong to ChopRoute: `assets/svg/choproute.svg` and `assets/images/hero-burger.png`.
- Cleaned `.gitignore` to remove legacy `Glovo.html` snapshot entries and added `README.md` plus this document.

### Why
A portfolio or student front-end repo should contain only assets it owns and uses. Removing unused third-party logos and dead stylesheets keeps the repository fast to clone, easy to inspect, and visually consistent.

---

## 3. Real OpenStreetMap Address Feature (`js/address.js`)

### What we implemented
- **Live address autocomplete** directly inside the hero section: as the user types a street, area, or city, ChopRoute fetches real matching addresses and renders a keyboard-accessible suggestion list.
- **"Locate me" reverse geocoding:** clicking the locate button requests the browser's GPS coordinates and converts them into a real human-readable street address.
- **Persistent, connected address state:** once an address is selected, it is saved in `localStorage` (`choproute_address_v1`), displayed in a compact pill in the sticky header, reflected inside the bag drawer, and used to calculate estimated delivery time and fee.

### How it works
1. **Why Photon + Nominatim (both OpenStreetMap)?**
   - OpenStreetMap's main **Nominatim** public endpoint explicitly prohibits live search-as-you-type autocomplete in its usage policy and throttles heavily.
   - **Photon** (`https://photon.komoot.io/api/`) is an open-source search engine built directly on OpenStreetMap data specifically designed for fast, CORS-enabled live autocomplete without requiring an API key.
   - ChopRoute queries **Photon** for live typing (with Nominatim search only as a graceful network fallback), and uses **Nominatim `/reverse`** (with Photon `/reverse` as a fallback) when converting GPS coordinates into an address.
2. **Request hygiene (debouncing + cancellation):**
   - Keystrokes are debounced by **300 ms** and ignored below **3 characters** to avoid noisy requests.
   - Each new request cancels any previous in-flight `fetch` via `AbortController`. This prevents a classic autocomplete race condition where a slower earlier response arrives after a faster newer one and overwrites the dropdown with stale results.
3. **Clean address formatting & XSS safety:**
   - Raw GeoJSON/Nominatim responses often repeat locality names (e.g., `"Lagos, Lagos, Nigeria"`). Helper functions deduplicate segments into a clean `primary` line (street/place), `secondary` line (district, city, state, country), full `label`, and compact `shortLabel` for the header pill.
   - Every external string from OpenStreetMap is inserted using `textContent` rather than `innerHTML`, preventing HTML/script injection from untrusted API text.
4. **Accessibility (WAI-ARIA Combobox pattern):**
   - The input uses `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, `aria-controls`, and `aria-activedescendant`.
   - Users can navigate suggestions with `ArrowDown` / `ArrowUp`, confirm with `Enter`, dismiss with `Escape`, or click outside to close.
   - Option clicks listen on `pointerdown` with `preventDefault()` so focus loss on the input never closes the dropdown before a tap or click registers.
5. **Geolocation safety:**
   - Before calling `navigator.geolocation`, the module checks both API availability and `window.isSecureContext` (browsers block GPS on plain `file://` or insecure HTTP), displaying a clear inline message instead of failing silently.

### Distance & Delivery Estimate (`js/data.js`)
- When OpenStreetMap returns numeric coordinates (`lat`, `lon`), `getDeliveryEstimate()` computes the great-circle distance in kilometers using the **Haversine formula** against five sample ChopRoute dispatch hubs.
- If the address is within 25 km of a hub, ChopRoute calculates a real distance-scaled ETA (e.g., `18–28 min`) and tiered delivery fee (`₦800`–`₦2,000`).
- If the user tests an address outside those hubs (anywhere else in the world), ChopRoute gracefully falls back to a standard partner-kitchen estimate (`25–35 min`, `₦1,200`) rather than locking the tester out.

---

## 4. Expanded Menu, Live Search & Filtering (`js/data.js`, `js/main.js`)

### What we implemented
- Moved menu listings out of hardcoded HTML into a structured `MENU_ITEMS` array in `js/data.js` with **9 curated items** across `Meals`, `Snacks`, and `Groceries` — each with price, prep time, vendor name, description, and optional highlight tag.
- Added a **live search bar** that works in combination with the **category filter pills**, a live **results count**, and an **empty state** with a one-click reset button.
- Added **inline bag controls** directly on every card: clicking `Add` transitions seamlessly into a `− qty +` stepper synchronized with the bag drawer.

### Why
- With only 3 static items previously, selecting any single category left one lonely card with nothing to do. Expanding to 9 data-driven items makes browsing, searching, and filtering feel natural while staying concise.
- Keeping data in `js/data.js` separates content from layout so adding new dishes or connecting a future backend API requires changing only the data source.

---

## 5. Slide-Over Bag Drawer & Demo Checkout (`js/cart.js`)

### What we implemented
- A **Bag** button in the header with a live item-count badge that opens a slide-over drawer.
- Inside the drawer:
  - A **delivery address card** showing the chosen OpenStreetMap address (or a quick `"Set address"` shortcut that closes the drawer and focuses the hero address input).
  - Itemized bag rows with `−` / `+` quantity steppers, live subtotal, distance-informed delivery fee, and total.
  - Persistent bag state stored in `localStorage` (`choproute_bag_v1`), validated on load so stale/corrupt storage can never break the UI.
  - **"Place demo order" flow:** gently prompts for an address if none is set; once confirmed, generates a demo order reference (e.g. `#CR-4821`), displays the exact chosen OpenStreetMap drop-off address, and progresses through a 3-stage simulated delivery tracker (`Order received` → `Kitchen preparing` → `Rider on the way`).

### Why
Connecting the OpenStreetMap address directly to the bag totals and order confirmation turns the address input from a standalone widget into the backbone of the whole delivery journey.

---

## 6. Modular Vanilla JS Without Build Friction

### How it is structured
JavaScript is split into four small, single-responsibility files loaded in order with `defer`:

| File | Responsibility |
| :--- | :--- |
| `js/data.js` | Menu catalog, currency formatting (`₦`), dispatch hubs, Haversine ETA/fee logic |
| `js/address.js` | OpenStreetMap Photon/Nominatim client, combobox UI, geolocation, address storage |
| `js/cart.js` | Bag state, `localStorage` persistence, accessible drawer, simulated checkout |
| `js/main.js` | Menu rendering, category + search filtering, header sync, screen-reader announcements |

### Why ordered `defer` scripts instead of `<script type="module">`?
Many reviewers and students open static HTML projects by double-clicking `index.html` (`file://` URL). Browsers block ES module imports (`<script type="module">`) over `file://` due to strict CORS rules. Wrapping each file in an IIFE attached to a single `window.ChopRoute` namespace keeps code cleanly modular while working out of the box **both** via double-click (`file://`) and on any static web server (GitHub Pages, Netlify, Vercel, or `python3 -m http.server`).

---

## 7. Full-Bleed Visual Design, Layout & Accessibility (`css/styles.css`, `index.html`)

### What we improved
- **Full-bleed, edge-to-edge bands:** Instead of boxing the entire page inside a narrow centered container with dead side margins, every major section spans **100% of the viewport width** using `.band-inner` with fluid side padding (`clamp(1.25rem, 4.5vw, 4.75rem)`):
  1. **Seamless sticky plum header & hero band** with a wide pill-shaped OpenStreetMap address bar, glowing burger spotlight, and 4 interactive circular category medallions that filter and scroll straight to the menu.
  2. **Smooth full-width SVG wave dividers** transitioning naturally between alternating surfaces (deep plum → warm cream menu → soft blush community band → dark plum footer).
  3. **Fuller multi-column menu cards** with category-tinted top banners, custom SVG emblems, prep-time pills, clear pricing, and inline `Add to bag` / `− qty +` controls that expand smoothly across the viewport width.
  4. **3-column "How it works" band** featuring organic offset blob medallions and working CTAs (`Set your address`, `Browse the menu`, `Open your bag`).
  5. **4-column dark plum footer** spanning edge-to-edge with interactive category filters, quick actions, and OpenStreetMap attribution.
- **Typography:** Added `Plus Jakarta Sans` (with `display=swap` and `system-ui` fallback), standardized font weights (`400`–`800`), and applied `font-variant-numeric: tabular-nums` on prices, prep times, and counters so numbers never jitter when quantities change.
- **Preserved brand identity:** Retained ChopRoute's distinctive plum (`#421c42`), coral (`#ff9a80`), and warm cream (`#fff8f1`) palette so the site feels uniquely ChopRoute rather than a clone.
- **Layout stability & responsiveness:** Added explicit `width="452" height="405"` attributes on `hero-burger.png` to prevent Cumulative Layout Shift (CLS), and tuned breakpoints down to narrow mobile viewports (where the address pill wraps cleanly, the category grid becomes 2×2, and the locate button condenses to an icon).
- **Accessibility throughout:**
  - Skip-to-content link (`.skip-link`) for keyboard navigation.
  - Polite `aria-live` announcer (`#sr-announcer`) for address selection, filter updates, bag updates, and checkout feedback.
  - Focus management on the bag drawer (moves focus inside on open, closes on `Escape` or backdrop click, restores focus to the trigger button on close).
  - Minimum `44px` tap targets on primary interactive controls and `@media (prefers-reduced-motion: reduce)` support.
  - Open Graph meta tags for clean link previews when sharing the site, and proper OpenStreetMap attribution in both the address widget and footer.

---

## 8. Potential Future Extensions

If you ever take ChopRoute beyond a static front-end demo, the current modular structure makes these straightforward next steps:
- **Backend / API proxy:** Swap the browser fetch URLs in `js/address.js` for a tiny serverless proxy if you want caching, rate-limit control, or custom country biasing.
- **Real vendor menus:** Replace `MENU_ITEMS` in `js/data.js` with a JSON endpoint or headless CMS.
- **Interactive map pin:** Pair the `lat`/`lon` already returned by `js/address.js` with Leaflet + OpenStreetMap tiles so users can fine-tune their drop-off pin visually.
