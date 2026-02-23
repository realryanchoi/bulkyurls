# BulkyURLs

BulkyURLs is a Chrome extension (Manifest V3) for managing large numbers of URLs without leaving the browser. Its headline feature is a drag-select tool that lets you rubber-band over links on any page and instantly collect, open, or copy them in bulk.

---

## Features

### Drag-Select Links
Hold **Shift** + left-click-drag over any area of a page. A dotted selection box appears, and every link it touches is highlighted in red. The extension badge on the toolbar shows the live count of selected links. When you release the mouse, the selection is captured and the badge updates to the final count.

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

### Context Menu
Right-click on any page to access:
- **Open selected links with BulkyURLs** — opens links from text selection
- **Copy page links to BulkyURLs** — collects all links on the page

### Options Page
Right-click the toolbar icon → **Options** (or open via `chrome://extensions`). From there you can:
- Add, edit, or delete activation actions (mouse button + key combination)
- Change the selection box color
- Set a delay between tab openings
- Auto-close tabs after a configurable timeout
- Block BulkyURLs on specific sites (blocklist)

---

## Requirements

- **Google Chrome** 102+ (Manifest V3, File System Access API)
- Chromium-based browsers (Edge, Brave, etc.) should also work

---

## Installation (Developer / Unpacked)

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the root folder of this repository.
5. The BulkyURLs icon appears in your toolbar — pin it for easy access.

---

## Usage

1. Navigate to any content-rich page (news site, search results, etc.).
2. Hold **Shift** and left-click-drag to draw a selection box over links.
3. The links highlight red; the toolbar badge shows the count.
4. Release the mouse — the selection is captured.
5. Click the BulkyURLs icon — the selected URLs appear in the popup textarea.
6. Use **Open URLs in New Tabs** to open them all, or copy the text to use elsewhere.

---

## Project Structure

```
bulkyurls/
├── manifest.json              # MV3 manifest
├── popup.html                 # Popup UI
├── options.html               # Options page
├── csv.html                   # CSV import/export dialog
├── css/
│   ├── content-styles.css     # Content script styles (injected into pages)
│   ├── options.css            # Options page styles
│   └── popup.css              # Popup styles
├── js/
│   ├── background/
│   │   └── background.js      # Service worker: settings, messaging, tab management
│   ├── content/
│   │   └── content-script.js  # Drag-select box, link detection, URL capture
│   ├── lib/
│   │   └── jquery.min.js      # jQuery 3.7.1 (local copy, required by options page)
│   ├── csv.js                 # CSV import/export logic (File System Access API)
│   ├── options.js             # Options page logic
│   └── popup.js               # Popup UI logic
└── img/
    └── bulkyurls-icon-*.png   # Extension icons (16, 32, 48, 128)
```

---

## Known Limitations

- The drag-select box relies on `WebKitCSSMatrix` for CSS transform calculations — this is Chrome-specific and non-standard. Should migrate to the standard `DOMMatrix` API.
- jQuery 3.7.1 is loaded for the options page only; replacing it with vanilla JS would eliminate ~87 KB of overhead.
- The `extractURLs()` regex is duplicated between `popup.js` and `csv.js`. Should be extracted to a shared utility module.
- `Array.prototype.unique` is added globally in `background.js` — modifying native prototypes can conflict with other code. Should be replaced with a standalone utility function.
- The manifest `version` field and `CURRENT_VERSION` in `background.js` are maintained separately and can drift out of sync. Should be unified to a single source of truth.
- Mouse/key values in `options.js` use loose `==` comparisons on values that may be strings or integers, depending on how jQuery reads form fields. Should use `===` with explicit type coercion.

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a full version history.

---

## License

This project is licensed under the [Mozilla Public License 2.0](LICENSE).

Third-party components (Linkclump, Benjamin Black) are included under the MIT License — see [LICENSE](LICENSE) for details.
