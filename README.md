# BulkyURLs

BulkyURLs is a Chrome extension (Manifest V3) for managing large numbers of URLs without leaving the browser. Its headline feature is a drag-select tool that lets you rubber-band over links on any page and instantly collect, open, or copy them in bulk.

---

## Features

### Drag-Select Links
Hold **Z** and left-click-drag over any area of a page. A dotted selection box appears, and every link it touches is highlighted in red. The extension badge on the toolbar shows the live count of selected links. When you release the mouse, the selection is captured and the badge updates to the final count.

### Popup Tools
Open the popup (click the BulkyURLs toolbar icon) after making a selection — the selected URLs appear in the textarea automatically.

| Button | What it does |
|---|---|
| **Selection Tool URLs** | Re-fetches the current drag selection into the textarea |
| **URLs from Text** | Strips non-URL text from the textarea, leaving only valid URLs |
| **URLs from Tabs** | Fills the textarea with the URLs of every open tab |
| **Open URLs in New Tabs** | Opens every URL currently in the textarea as a background tab |
| **Clear** | Empties the textarea |
| **Export CSV** | Downloads the current textarea URLs as a `bulkyurls-export.csv` file |
| **Import CSV** | Opens a file picker; parses any `.csv` file and loads the URLs it contains into the textarea |

### CSV Format

**Export** produces a single-column RFC 4180 CSV:
```
url
"https://example.com/page1"
"https://example.com/page2"
```

**Import** is flexible — it scans every field in every row for absolute URLs (`http://` or `https://`), so it works with single-column exports from BulkyURLs as well as multi-column CSVs from other tools (e.g., a spreadsheet with `url,title,category` columns). Non-URL rows such as headers are automatically skipped. Duplicate URLs are deduplicated.

### Options Page
Right-click the toolbar icon → **Options** (or open via `chrome://extensions`). From there you can:
- Add, edit, or delete activation actions (mouse button + key combination)
- Change the selection box color
- Set a delay between tab openings
- Auto-close tabs after a configurable timeout
- Block BulkyURLs on specific sites (blocklist)

---

## Installation (Developer / Unpacked)

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the root folder of this repository.
5. The BulkyURLs icon appears in your toolbar.

---

## Usage

1. Navigate to any content-rich page (news site, search results, etc.).
2. Hold **Z** and left-click-drag to draw a selection box over links.
3. The links highlight red; the toolbar badge shows the count.
4. Release the mouse — the selection is captured.
5. Click the BulkyURLs icon — the selected URLs appear in the popup textarea.
6. Use **Open URLs in New Tabs** to open them all, or **Copy** the text to use elsewhere.

---

## Bug Fixes (v0.0.4 → current)

The following critical and high-severity bugs were resolved to restore full functionality:

| Area | Fix |
|---|---|
| `background.js` | `chrome.storage.local.get()` is now properly `await`-ed before `JSON.parse` |
| `background.js` | Storage writes use `chrome.storage.local.set()` instead of direct property assignment |
| `background.js` | `"init"` message handler now returns `true` to keep the async response channel open |
| `background.js` | Added missing `openTab()` function (recursive, supports delay and auto-close) |
| `background.js` | Replaced 11 non-functional placeholder context menu items with 2 working ones |
| `background.js` | Badge cleared (not set to "0") when a new drag selection starts |
| `content-script.js` | Removed all `this.` prefixes — functions ran in module scope, not a class instance |
| `content-script.js` | `onMessage` listener moved to module scope — previously a new listener was registered on every drag |
| `content-script.js` | `open_tabs` array is now cleared at the start of each new mouseup pass |
| `content-script.js` | Fixed `stop_menu == false` (comparison) → `stop_menu = false` (assignment) |
| `content-script.js` | Badge and `latestURLs` reset when each new drag selection starts |
| `popup.js` | `selectorBtn.onclick` moved inside `DOMContentLoaded` to close over `userInput` |
| `popup.js` | Popup now auto-populates the textarea with selection URLs on open |
| `popup.js` | `selected: false` (deprecated MV3) replaced with `active: false` |
| `options.js` | `save_params()` was a bare object literal — now calls `chrome.runtime.sendMessage()` |
| `options.js` | `displayOptions()` restored (was entirely commented out → `ReferenceError`) |
| `options.js` | `delete_action()` restored (was entirely commented out → `ReferenceError`) |
| `options.js` | `load_action` Edit branch restored — form now populates correctly for existing actions |
| `options.js` | `save_action` action + options fields restored — saves complete setting data |
| `options.js` | `#guide1` null guard added |
| `options.js` | Colorpicker plugin removed; native `<select>` used directly for color selection |
| `options.html` | jQuery loaded locally (`js/lib/jquery.min.js`) — CDN not permitted in MV3 |
| `options.html` | `form_action`, `form_options`, `form_extra` moved inside the modal overlay |
| `options.html` | Added `#guide1` back-link for tour navigation |
| `manifest.json` | CSP keys `"default-src"`/`"frame-ancestors"` replaced with valid MV3 `"extension_pages"` key |

---

## Project Structure

```
bulkyurls/
├── manifest.json
├── popup.html
├── options.html
├── css/
│   ├── content-styles.css
│   ├── options.css
│   └── popup.css
├── js/
│   ├── background/
│   │   └── background.js   # Service worker: settings, messaging, tab management
│   ├── content/
│   │   └── content-script.js  # Drag-select box, link detection, URL capture
│   ├── lib/
│   │   └── jquery.min.js   # jQuery 3.7.1 (local copy, required by options page)
│   ├── options.js           # Options page logic
│   └── popup.js             # Popup UI logic
└── img/
    └── bulkyurls-icon-*.png
```
