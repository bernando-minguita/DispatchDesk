# 🚚 DispatchDesk

A browser-based Single Page Application (SPA) for managing and tracking vehicle dispatch orders. Built with vanilla HTML/CSS/JS and sql.js — no server, no build process, no database installation required.

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?logo=leaflet&logoColor=white)

🚛 Fleet Dispatch · 🗺️ Route Mapping · 📊 Analytics Charts · 🖨️ Print & PDF Reports · 📒 Address Book · 🔧 Fleet Registry · 💾 Local SQLite Storage · 🔒 Password Lock

---

## 📋 Overview

Track, manage, and optimize fleet dispatch operations from a single HTML file. All data is stored locally in your browser using SQLite (via sql.js) and synchronized to IndexedDB for persistence.

---

## ⚠️ Note on API Keys

Built-in API keys are provided **for evaluation only** and are shared across all users of this repository. They may be **rate-limited or exhausted** at any time. For production use, add your own keys in **Settings → Map & Routing**.

The app degrades gracefully without keys: routing falls back to straight lines, reverse geocoding returns empty, and map tiles use a free fallback. Nothing will crash — you'll just lose the enhanced features.

---

## ✨ Features

### 📦 Order Management
- **Single & Bulk Entry** — Add orders one-by-one or via the grid-based multiple entry form
- **Full CRUD** — Create, read, update, and delete orders with automatic audit logging
- **Duplicate Detection** — Warns on duplicate ERP-style order numbers
- **Field Validation** — Required field checks and date logic (ETA must be ≥ dispatch date)
- **Fleet Validation** — Head and attachment numbers validated against fleet registry
- **Address Book Validation** — Driver badge and customer number validated against address book

### 📒 Address Book
- **Driver & Customer Registry** — Store and reuse driver and customer details
- **CSV Import/Export** — Bulk manage entries via CSV
- **Type Filtering** — Quick filter between drivers and customers
- **Order Form Integration** — Select entries directly from order forms

### 🚛 Fleet Management
- **Fleet Registry** — Track tractor heads, trailers, tippers, and rigid trucks using standardized three-letter prefixes
- **Supported Prefixes** — TRK- (tractor head), FBT- (flatbed trailer), CST- (curtain trailer), EXT- (extendable trailer), BLK- (bulker), DVN- (box trailer), DMP- (tipper), MDT- (medium truck)
- **CRUD Operations** — Add, edit, delete fleet units with branch assignment
- **CSV Import/Export** — Bulk manage fleet units via CSV
- **Order Integration** — Select fleet units directly from order forms
- **Validation** — Orders can only use registered fleet units

> Prefix conventions are documented in [`fleet_asset_prefixes.csv`](fleet_asset_prefixes.csv).

### 🗺️ Route Mapping
- **Leaflet Integration** — Visualize order routes on an interactive map
- **Multiple Tile Styles**:
  - 🌍 OSM Standard (with automatic fallbacks)
  - 🛰️ Stadia Alidade Satellite
  - 🗺️ Esri National Geographic
  - 🎨 CartoDB Voyager (requires CARTO API key)
  - 🗺️ MapTiles English (requires MapTiles API key)
  - 🏔️ MapTiler Topo-4 (requires MapTiler API key)
  - 🏙️ Jawg Streets (requires Jawg access token)
- **Geoapify Routing** — Truck-aware route calculation with vehicle profile, dimensions, traffic, and toll avoidance
- **Reverse Geocoding** — Auto-fill location names from coordinates via Geoapify
- **Map Style Selector** — Switch map styles directly from the map view

### 📊 Analytics & Reports
- **Status Distribution** — Doughnut chart with count/percentage labels
- **Daily Dispatch Trend** — Line chart of orders over time
- **Dispatch by Branch** — Horizontal bar chart
- **Customer Performance** — Top 10 customers by order volume

### 🖨️ Print & Export
- **Print/PDF Reports** — Filtered, paginated reports in portrait/landscape
- **Excel Export** — Export filtered orders to `.xlsx`
- **JSON/SQL Backup** — Full database export and restore

### ⚡ Productivity
- **Keyboard Shortcuts** — `Alt+N` (new order), `Alt+M` (monitor), `Alt+F` (search), `Esc` (close modal)
- **Column Customization** — Rename columns and toggle visibility in the main table
- **Monitor Columns** — Show/hide columns and click-to-sort in the Order Monitor
- **Bulk Operations** — Multi-row entry with confirmation
- **Auto-scroll Modals** — Modals open scrolled to top

### 🖥️ Monitoring
- **Tabbed Monitor** — In Progress / Completed / Cancelled views
- **Branch / Terminal Toggle** — Filter by branch or by reporting terminal
- **Real-time Status** — Latest tracking status per order via SQLite view

### 🔒 Data & Security
- **Local-First** — All data stays in your browser
- **IndexedDB Persistence** — Automatic backup to browser storage
- **Audit Trail** — Full history of create/update/delete/import/export actions
- **Password Lock** — SHA-256 hashed password with configurable auto-lock timeout
- **No External Accounts** — No login, no cloud sync, no tracking

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| **Styling** | Tailwind CSS (vendored Play CDN) + custom CSS |
| **Database** | SQLite via [sql.js](https://github.com/sql-js/sql.js) |
| **Persistence** | IndexedDB (automatic sync) |
| **Maps** | Leaflet + Geoapify |
| **Charts** | Chart.js v4 |
| **Export** | ExcelJS |

---

## 🗂️ Project Structure

```
DispatchDesk/
├── index.html                 # Entire application: UI, styles, and app logic (single file)
├── README.md
├── LICENSE
├── .gitignore
├── fleet_asset_prefixes.csv   # Asset category → three-letter prefix conventions
├── js/                        # ES modules
│   ├── db-access.js             # Loaded by index.html; imports db.js
│   ├── db.js                    # Imported by db-access.js (schema, migrations, sample data)
│   ├── validation.js            # Loaded by index.html
│   ├── utils.js                 # Loaded by index.html
│   └── toast.js                 # Loaded by index.html
└── vendor/                    # Vendored libraries (no CDN required)
    ├── tailwind/                # Tailwind CSS Play CDN
    ├── fontawesome/             # Font Awesome icons
    ├── exceljs/                 # ExcelJS (Excel export)
    ├── chartjs/                 # Chart.js (analytics)
    ├── sqljs/                   # sql.js (SQLite in the browser)
    └── leaflet/                 # Leaflet (maps)
```

The application logic lives in a single inline `<script>` block at the end of `index.html`. The four modules it loads (`db-access.js`, `validation.js`, `utils.js`, `toast.js`) attach their public functions to `window` at load time so the inline script can call them. `db-access.js` additionally imports `db.js`, which exports the SQLite schema, migration helpers, and sample data.

> **Note**: Do not change the `<script>` order in `index.html` or convert the modules to non-modules. The inline script assumes the modules have loaded before `DOMContentLoaded` fires.

---

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome 100+, Firefox 100+, Edge 100+)
- No server or build process required
- Safari is untested

### Installation

1. Clone or download this repository:
```bash
git clone https://github.com/bernando-minguita/DispatchDesk.git
```

2. Open `index.html` in your browser. Any of these work:

```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

Or simply **double-click `index.html`** in your file manager.

That's it. The app initializes with sample data on first load. To remove sample data, use **Settings → Data → Remove Sample Data**.

---

## 📖 Usage

### Adding Orders
- **Single Order**: Click **Add New Order** (or press `Alt+N`) and choose **Single Order**
- **Multiple Orders**: Click **Add New Order** (or press `Alt+N`) and choose **Multiple Orders (Grid)**
- Fill in required fields (marked with `*`). The app validates dates and required fields before saving.
- Use the **Fleet** button next to Head/Attachment fields to select from registered fleet units.

### Managing Fleet
- Click **Fleet** in the header to open the fleet management modal
- Add tractor heads, trailers, tippers, and rigid trucks using the prefixes documented in [`fleet_asset_prefixes.csv`](fleet_asset_prefixes.csv):
  - **Tractor heads** — `TRK-*` (prime mover / pulling unit)
  - **Trailers** — `FBT-*` (flatbed), `CST-*` (curtain), `EXT-*` (extendable), `BLK-*` (bulker), `DVN-*` (box)
  - **Tippers** — `DMP-*` (hydraulic dump trailer)
  - **Medium trucks** — `MDT-*` (rigid truck / straight box)
- Import/export fleet data via CSV
- Fleet units are validated when creating or updating orders

### Tracking Orders
- Expand any order row to see tracking history
- Click the **+** button to add tracking updates with location, status, and remarks
- Use the **Track** button to visualize the route on the map

### Monitoring
- Click **Monitor** to see orders grouped by status
- Use the Branch / Reporting Terminal toggle and dropdown to narrow results

### Analytics
- Click **Charts** to view status distribution, trends, and performance metrics
- Charts respect the chart date range (initialized from the active month); branch filters apply to the main table and monitor only

### Printing/Exporting
- Click **Print Report** to generate a filtered, paginated report (portrait/landscape)
- Use the **Data** dialog for **Export JSON** / **Export Excel** of the filtered view
- Use **Settings → Data → Database Manager → Export Backup (.sqlite)** for full database backups
- JSON import (Data dialog) merges by order number: existing orders are updated, new orders are added, with an optional vehicle-profile override

---

## 🚛 Fleet Asset Prefix Reference

Asset categories and their standardized three-letter prefixes are documented in [`fleet_asset_prefixes.csv`](fleet_asset_prefixes.csv):

| Asset Category | Prefix | Description |
|---|---|---|
| Tractor Head | `TRK` | Motorized pulling unit / prime mover for hauling trailers |
| Box Trailer | `DVN` | Dry van / fully enclosed cargo trailer |
| Curtain Trailer | `CST` | Curtainside trailer for flexible side-loading |
| Flatbed Trailer | `FBT` | Standard open flatbed for oversized or side-loaded freight |
| Extendable Trailer | `EXT` | Telescopic or lowboy trailer for extra-long / heavy hauls |
| Tipper | `DMP` | Dump trailer with hydraulic lifting for bulk unloading |
| Bulker | `BLK` | Dry bulk silo tanker for powders, grains, or cement |
| Medium Truck | `MDT` | Medium-duty rigid truck / straight box truck (non-articulated) |

---

## ⚙️ Configuration

Access settings via the **Settings** button:

- **Branch** — Set your active branch
- **Active Month** — Filter orders by month
- **Time Format** — Toggle between 12h and 24h time display
- **CARTO API Key** — Optional key for CartoDB Voyager map tiles
- **Geoapify API Key** — Required for reverse geocoding and routing
- **Routing Mode** — Choose drive, light_truck, medium_truck, truck, heavy_truck, truck_dangerous_goods, or long_truck
- **Vehicle Profile** — Preset profiles: Light Truck (Dyna), Medium Truck (Rigid 6x4), Heavy Truck Partial, Heavy Truck Full, Extra Heavy, or Custom
- **Traffic** — Approximated or Free Flow
- **Avoid Tolls** — Yes or No
- **Vehicle Dimensions** — Weight (tons), Height (m), Width (m), Length (m)
- **Password Lock** — Enable app lock with SHA-256 hashing and auto-lock timeout (1–30 minutes)

Settings are saved to `localStorage` and persist across sessions.

---

## 🗺️ Map Styles

| Style | Description | Key Required |
|-------|-------------|--------------|
| 🌍 OSM Standard | Standard OSM tile server with automatic fallbacks | No |
| 🛰️ Stadia Alidade Satellite | Satellite imagery | No |
| 🗺️ Esri National Geographic | National Geographic world map | No |
| 🎨 CartoDB Voyager | Clean vector-style tiles | Yes — CARTO API Key |
| 🗺️ MapTiles English | MapTiles English OSM layer | Yes — MapTiles API Key |
| 🏔️ MapTiler Topo-4 | MapTiler topographic vector tiles | Yes — MapTiler API Key |
| 🏙️ Jawg Streets | Jawg Streets vector-style tiles | Yes — Jawg Access Token |

> **Reminder**: Defaults are shared and may be exhausted. Add your own keys in **Settings → Map & Routing**.

---

## 🌍 Branches

DispatchDesk ships with these branches pre-configured:

**Dammam · Riyadh · Jeddah · Makkah · Madinah · Rabigh · Yanbu · Taif**

You can add, rename, or delete branches at any time via **Settings → Branches**. Branches are used to scope orders, fleet units, address book entries, and reporting terminals.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + N` | Open new order modal |
| `Alt + M` | Open monitor modal |
| `Alt + F` | Focus search input |
| `Ctrl + Click` header | Rename that column |
| `Esc` | Close topmost modal |

*Shortcuts are suppressed when typing in text fields.*

---

## 🗂️ Data Storage

| Layer | Purpose |
|-------|---------|
| **SQLite (sql.js)** | In-memory database with full SQL support |
| **IndexedDB** | Persistent backup of the SQLite binary |
| **localStorage** | Settings, map preferences |

> **Note**: Data is stored locally in your browser. Clearing browser data will reset the app. Use **Settings → Data → Database Manager → Export Backup (.sqlite)** to preserve your data.

The repository's `.gitignore` excludes `*.sqlite`, `*.db`, and `*.sqlite3` files so that local backups are never committed by accident.

---

## 🔒 Privacy

- No data is sent to external servers (except tile/geocoding requests to CARTO, Geoapify, MapTiles, MapTiler, Jawg, and OSM/Esri/Stadia)
- No accounts, no login, no telemetry
- All order data, tracking history, and audit logs remain in your browser
- Sample data is fictional and randomized

---

## 🧪 Testing

No automated tests are included. The app is manually tested on:
- Chrome (latest)
- Firefox (latest)
- Edge (latest)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Test thoroughly in multiple browsers
5. Submit a pull request

**Important for contributors**: Do not commit `.sqlite`, `.db`, or `.sqlite3` files. They contain personal data. The `.gitignore` already excludes them.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

You are free to use this project for personal or commercial purposes.

---

## 🙋 Support

For issues, questions, or feature requests, please [open an issue](https://github.com/bernando-minguita/DispatchDesk/issues) on GitHub.

---

*Built with ❤️ for fleet operations teams*