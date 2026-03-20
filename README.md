# WarWatch OSINT — Live War Conflict Intelligence Tool

A fully open-source, browser-based OSINT (Open Source Intelligence) tool that displays live war and armed conflict data on an interactive world map alongside a real-time news feed — no back-end required.

![WarWatch OSINT](https://img.shields.io/badge/status-live-brightgreen) ![license](https://img.shields.io/badge/license-MIT-blue) ![no-api-key](https://img.shields.io/badge/API%20key-not%20required-green)

---

## Features

| Feature | Details |
|---|---|
| 🗺️ **Interactive conflict map** | Dark CartoDB basemap with pulsing colour-coded markers (Leaflet.js + OpenStreetMap) |
| 🔴 **26+ active conflicts** | Curated open-source dataset covering every major theatre (Europe, Middle East, Africa, Asia, Americas) |
| 🚀 **Real-time Iran conflict tracking** | Live missile alerts, nuclear status updates from IAEA, proxy activity monitoring |
| 📰 **Live news feed** | Real-time RSS feeds from BBC World, Reuters, Al Jazeera — filtered for war/conflict keywords |
| 🔎 **Filters** | Search by name/country/faction; filter by region and intensity level |
| 📊 **Stats bar** | Per-region conflict counts, total event estimates, UTC clock |
| 📋 **Detail panels** | Full intelligence card per conflict: parties, casualties, displaced, timeline, sources |
| ⚡ **Breaking news ticker** | Scrolling headline bar auto-populated from live feeds |
| 🌑 **Dark tactical UI** | Military-grade aesthetic with green-on-black theme, pulsing markers, animated loading screen |
| 🔄 **Auto-refresh** | News feeds refresh every 5 minutes; Iran real-time data every 15 minutes |

---

## Data Sources (all free / open-source)

| Source | Usage |
|---|---|
| [ACLED](https://acleddata.com) | Conflict data methodology & event counting |
| [Wikipedia](https://wikipedia.org) | Conflict descriptions, parties, casualty figures |
| [UCDP](https://ucdp.uu.se) | Uppsala Conflict Data Program |
| [BBC World RSS](https://feeds.bbci.co.uk/news/world/rss.xml) | Live news |
| [Reuters World RSS](https://feeds.reuters.com/Reuters/worldNews) | Live news |
| [Al Jazeera RSS](https://www.aljazeera.com/xml/rss/all.xml) | Live news |
| [Times of Israel Alerts](https://www.timesofisrael.com/alerts/feed/) | Real-time missile/rocket alerts |
| [Jerusalem Post Alerts](https://www.jpost.com/Rss/RssFeedsAlerts.aspx) | Real-time missile/rocket alerts |
| [IAEA Press](https://www.iaea.org/newscenter/pressreleases/rss) | Nuclear status updates |
| [AllOrigins](https://api.allorigins.win) | CORS proxy for RSS fetching (free tier) |
| [CartoDB Dark Matter](https://carto.com/basemaps/) | Dark map tiles |
| [OpenStreetMap](https://openstreetmap.org) | Base map data |

**No API keys required.** All data is pulled from freely available public sources.

> **New:** Iran conflict data now includes real-time missile alerts and nuclear status updates. See [IRAN_REALTIME_README.md](IRAN_REALTIME_README.md) for details.

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/Tranquil666/OSINT_TOOL.git
cd OSINT_TOOL

# Open directly in your browser — no build step needed
open index.html
# or serve locally for best results:
python3 -m http.server 8080
# then visit http://localhost:8080
```

> **Note:** Opening `index.html` directly via `file://` works for the map and static data. The live news feed (RSS via AllOrigins proxy) requires an internet connection.

---

## Project Structure

```
OSINT_TOOL/
├── index.html                  # Single-page app shell
├── css/
│   └── style.css               # Dark military theme + animations
├── js/
│   ├── config.js               # API endpoints, map settings, news URLs, Iran feeds
│   ├── conflicts.js            # Curated conflict dataset + filter/sort helpers
│   ├── iran_realtime.js        # Real-time Iran data: alerts, nuclear status, events
│   ├── map.js                  # Leaflet map init, pulsing markers, popups, clusters
│   ├── news.js                 # RSS fetch, parse, keyword filter, render, ticker
│   └── app.js                  # App bootstrap, event wiring, stats, clock
├── README.md
└── IRAN_REALTIME_README.md     # Documentation for Iran real-time feature
```

---

## Intensity Scale

| Level | Colour | Description |
|---|---|---|
| **Critical** | 🔴 Red | Active full-scale war with mass casualties |
| **High** | 🟠 Orange | Intense armed conflict / civil war |
| **Medium** | 🟡 Amber | Ongoing insurgency / significant clashes |
| **Low** | 🟡 Yellow | Low-intensity conflict / sporadic violence |
| **Tension** | 🔵 Blue | Military tensions, no active fighting |

---

## Tech Stack

- **Leaflet.js** (map) + **MarkerCluster** — open-source, no key
- **CartoDB Dark Matter** — free tile layer
- **Vanilla JS (ES2020+)** — no framework, no build step
- **DOMParser** — RSS XML parsing in-browser
- **AllOrigins** — free CORS proxy for RSS feeds
- **Font Awesome 6** — icons
- **Google Fonts** — Rajdhani, Share Tech Mono, Roboto

---

## Disclaimer

All conflict data is sourced from publicly available open-source intelligence (OSINT). Casualty and displacement figures are estimates from referenced open sources. This tool is for informational and research purposes only.
