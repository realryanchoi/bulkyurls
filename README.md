# BulkyURLs

BulkyURLs is a Chrome extension (Manifest V3) for managing large numbers of URLs without leaving the browser. Its headline feature is a drag-select tool that lets you rubber-band over links on any page and instantly collect, open, or copy them in bulk.

---

## Features

### Drag-Select Links
Hold **Shift** + left-click-drag over any area of a page. A dotted selection box appears, and every link it touches is highlighted in red. The extension badge on the toolbar shows the live count of selected links. When you release the mouse, the selection is captured and the badge updates to the final count.

### Popup, Side Panel & Full Tab
The same UI runs in three places:

- **Popup** — click the BulkyURLs toolbar icon. After a drag selection, the selected URLs appear in the textarea automatically.
- **Side panel** — click **Open Sidebar** in the popup. The panel docks beside the page and stays open while you browse.
- **Full tab** — click **Open in New Tab** for a roomier view.

The UI is split into two tabs: **URLs** (the list, batch settings, saved lists) and **Settings** (opening options).

#### URLs tab

A live **“N valid”** badge above the textarea shows how many URLs are currently detected.

| Control | What it does |
|---|---|
| **Undo / Redo** | Steps back/forward through textarea changes (typing and button actions) |
| **Copy** | Copies the textarea contents to the clipboard |
| **Extract URLs** | Strips non-URL text from the textarea, leaving only valid URLs |
| **Clear** | Empties the textarea |
| **Tools ▾ → URLs from Tabs** | Fills the textarea with the URLs of every open tab |
| **Tools ▾ → URLs from Selection** | Re-fetches the current drag selection into the textarea |
| **Tools ▾ → Remove Duplicates** | Removes duplicate lines from the textarea, keeping first-seen order |
| **Tools ▾ → Import / Export CSV** | CSV round-trip (see CSV Format below) |
| **Open in Tabs** | Opens the URLs as background tabs in the current window, batch by batch |
| **New Window** | Opens the URLs in a brand-new window, batch by batch |

**Batch Settings** control how opening happens:

- **URLs per batch** (1–20) — how many tabs open at once.
- **Delay (seconds)** (0–100) — pause between batches. Use a smaller batch size and a longer delay to avoid triggering browser security restrictions on large lists.

Opening is delegated to the background service worker, so a batched/delayed run keeps opening even after the popup closes. Batch size and delay are persisted across sessions.

#### Settings tab

| Option | What it does |
|---|---|
| **Convert non-URLs to search queries** | Lines that aren't URLs open as Google searches instead of being dropped |
| **Open URLs in random order** | Shuffles the list before opening |
| **Open URLs in reverse order** | Opens the list bottom-to-top |
| **Open each batch in a new window** | Every batch gets its own browser window |
| **Wait for tab to load before opening next URL** | Each tab must finish loading before the next opens |
| **Remove opened URLs from input** | Opened URLs are deleted from the textarea when you click Open |
| **Auto-close tabs after N s** | Opened tabs close themselves after the chosen number of seconds |
| **URL Limit** | Open only the first N URLs (0 = no limit) |
| **Reset Defaults** | Restores all opener settings |

### Saved Lists
Save the current textarea contents under a custom name and reload it any time — handy for recurring link sets (daily reading lists, QA test URLs, etc.). Lists are stored locally via `chrome.storage.local`; nothing leaves your machine.

- Click **+ New**, type a name, and click **Save** to store the current URLs.
- Click a list's name to load it into the textarea; each row shows its URL count.
- Click **×** on a row to delete that list.
- To update an existing list, save again under the same name.

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

- **Google Chrome** 114+ (Manifest V3, File System Access API, Side Panel API)
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
6. Use **Open in Tabs** (or **New Window**) to open them all, or **Copy** the list to use elsewhere.
7. Prefer a persistent view? Click **Open Sidebar** to dock the same UI in Chrome's side panel.

---

## Project Structure

```
bulkyurls/
├── manifest.json              # MV3 manifest
├── popup.html                 # Popup UI
├── sidepanel.html             # Same UI for Chrome's side panel / full tab
├── options.html               # Options page
├── csv.html                   # CSV import/export dialog
├── css/
│   ├── options.css            # Options page styles
│   └── popup.css              # Popup + CSV dialog styles
├── js/
│   ├── background/
│   │   └── background.js      # Service worker: settings, messaging, tab management
│   ├── content/
│   │   └── content-script.js  # Drag-select box, link detection, URL capture (styles applied inline)
│   ├── lib/
│   │   └── urls.js            # Shared URL utilities (extract, dedupe, normalize)
│   ├── csv.js                 # CSV import/export logic (File System Access API)
│   ├── options.js             # Options page logic
│   └── popup.js               # Popup UI logic
└── img/
    └── bulkyurls-icon-*.png   # Extension icons (16, 32, 48, 128)
```

---

## Known Limitations

- The `extractURLs()` regex only recognizes top-level domains of 2–4 characters for schemeless URLs (e.g. `example.online/` is missed unless prefixed with `http://`).
- Drag-select cannot capture links rendered inside cross-origin iframes.
- Saved lists live in `chrome.storage.local`, which has a ~10 MB quota — extremely large lists (hundreds of thousands of URLs) may fail to save.

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a full version history.

---

## Releasing

Pushing a `v*` tag (matching the `manifest.json` version) triggers the [release workflow](.github/workflows/release.yml), which builds the extension zip and creates a GitHub Release with notes from the changelog.

To cut a release: bump `manifest.json`'s `version`, add a dated entry to `CHANGELOG.md`, commit, then push a matching `vX.Y.Z` tag.

---

## License

This project is licensed under the [Mozilla Public License 2.0](LICENSE).

Third-party components (Linkclump, Benjamin Black) are included under the MIT License — see [LICENSE](LICENSE) for details.
