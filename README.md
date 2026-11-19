# ChopRoute

A clean, full-width **student front-end food and grocery delivery demo** (sample listings and simulated checkout only) featuring real OpenStreetMap address autocomplete, GPS reverse geocoding, live menu search and filtering, and a persistent delivery bag.

## Project Structure

```text
ChopRoute/
├── index.html              # Semantic page markup and bag drawer
├── css/
│   └── styles.css          # Design tokens, responsive layout, and components
├── js/
│   ├── data.js             # Menu catalog, currency formatting, and distance/ETA logic
│   ├── address.js          # OpenStreetMap autocomplete (Photon) & reverse geocoding (Nominatim)
│   ├── cart.js             # Persistent bag state, slide-over drawer, and demo order flow
│   └── main.js             # Menu rendering, filtering, search, and UI orchestration
├── assets/
│   ├── images/
│   │   └── hero-burger.png
│   └── svg/
│       └── choproute.svg
└── IMPLEMENTATION.md       # Detailed write-up of what was built, how, and why
```

## Running Locally

No build step or dependencies are required.

- **Quick preview:** Open `index.html` directly in your browser (address typing, search, filtering, and bag persistence all work).
- **Full preview (including browser GPS "Locate me"):** Serve over `localhost` so the browser exposes a secure context for the Geolocation API:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Attribution

Real address search and reverse geocoding use data from [OpenStreetMap](https://www.openstreetmap.org/copyright) via Komoot's [Photon](https://photon.komoot.io/) and [Nominatim](https://nominatim.openstreetmap.org/).

See [IMPLEMENTATION.md](IMPLEMENTATION.md) for a full explanation of what was implemented, how it works under the hood, and why each design decision was made.
