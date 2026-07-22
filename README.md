# BulkyURLs

BulkyURLs is a Chrome extension (Manifest V3) for managing large numbers of URLs without leaving the browser. Its headline feature is a drag-select tool that lets you rubber-band over links on any page and instantly collect, open, or copy them in bulk.

---

## Features

### Drag-Select Links
Hold **Shift** + left-click-drag over any area of a page. A dotted selection box appears, and every link it touches is highlighted in red. The extension badge on the toolbar shows the live count of selected links. When you release the mouse, the selection is captured and the badge updates to the final count.

### Side Panel & Full Tab
Click the BulkyURLs toolbar icon to dock the panel beside the page — it stays open while you browse, and after a drag selection the selected URLs appear in the textarea automatically. Click **Open in tab** for a roomier full-tab view of the same UI (the button hides itself once you're already in a tab).

The UI is split into three tabs: **List** (the URL ledger, batch controls, saved lists), **Tabs** (copy links out of open tabs) and **Settings**.

Everything below the URL list is a **collapsible section**. Each one keeps a one-line summary in its header — *"5 at a time · 2s apart"*, *"3 lists"*, *"shift + left-drag"* — so a closed section still answers its own question, and which sections you leave open is remembered between visits.

#### List tab

URLs are treated as records rather than prose: the list is set in monospace, line-numbered, and never soft-wrapped, so line 47 stays line 47 while you audit a few hundred of them. Long URLs scroll horizontally instead of reflowing.

A live readout under the list reports what you actually have:

| Readout | What it means |
|---|---|
| **Lines** | Non-empty lines in the list |
| **Valid** | Lines recognised as URLs |
| **Dupes** | URLs that appear more than once |
| **Domains** | Distinct sites in the list (`www.` stripped, so `www.example.com` and `example.com` count once) |

Any line that isn't a URL has its **line number marked red** in the gutter, so junk is easy to find in a long paste. When a list spans more than one site, a thin **composition rail** under the text shows how it splits across domains, and the card header names the largest one with its share.

The primary button states the real consequence — **“Open 39 tabs”**, not “Open in tabs” — and both open buttons disable themselves when there is nothing to open. The count respects the search-query setting and the URL cap.

| Control | What it does |
|---|---|
| **Undo / Redo** | Steps back/forward through list changes (typing and button actions) |
| **Copy** | Copies the whole list to the clipboard |
| **Extract** | Drops everything that isn't a link, leaving only URLs |
| **Clear** | Empties the list |
| **Tools ▾ → Pull from open tabs** | Replaces the list with the URLs of every open tab |
| **Tools ▾ → Pull from page selection** | Re-fetches the current drag selection into the list |
| **Tools ▾ → Remove duplicates** | Removes duplicate lines, keeping first-seen order |
| **Tools ▾ → Import / Export CSV** | CSV round-trip (see CSV Format below) |
| **Open N tabs** | Opens the URLs as background tabs in the current window, batch by batch |
| **New window** | Opens the URLs in a brand-new window, batch by batch |

**Batch** controls how opening happens:

- **URLs per batch** (1–20) — how many tabs open at once.
- **Delay between batches** (0–100s) — pause between batches. Opening 50+ tabs at once can trip Chrome's rate limits and drop URLs; smaller batches with a delay open every link reliably.

Opening is delegated to the background service worker, so a batched/delayed run keeps opening even after the panel closes. Batch size and delay are persisted across sessions.

#### Tabs tab

Lists every open tab with its title and hostname. Chrome does not expose its native tab-strip context menu or multi-tab selection to extensions, so this panel is how single/multiple/all copying works.

| Control | What it does |
|---|---|
| **Copy** (per row) | Copies that one tab's link |
| **Copy selected** | Copies the links of the checked tabs |
| **Copy all** | Copies every open tab's link |
| **Send selected to list** | Appends the checked tabs to the URL list, skipping any already there |
| **Select all** / **Refresh** | Toggles every checkbox / re-reads the open tabs |

The list refreshes itself while visible as tabs are opened, closed and navigated.

#### Settings tab

| Option | What it does |
|---|---|
| **Open non-URL lines as searches** | Lines that aren't URLs open as Google searches instead of being dropped |
| **Shuffle the list** | Shuffles the list before opening |
| **Open bottom-to-top** | Opens the list in reverse order |
| **Give each batch its own window** | Every batch gets its own browser window |
| **Wait for each tab to load** | Each tab must finish loading before the next opens |
| **Remove opened URLs from the list** | Opened URLs are deleted from the list when you click Open |
| **Close each tab after N s** | Opened tabs close themselves after the chosen number of seconds |
| **Limit** | Open only the first N URLs (0 = no limit) |
| **Reset defaults** | Restores all opener settings |

The Settings tab also holds the **Drag-select** card (see below).

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

### Drag-select Settings
The **Drag-select** card on the Settings tab configures the selection feature:
- Change the activation trigger (mouse button + held key)
- Choose whether selected links open as new tabs or in a new window
- Change the selection box colour
- Toggle smart select (skip nav and boilerplate links inside the box)
- Turn drag-select off on specific sites (one per line)

### Design

The panel follows the **SEO Soul Brand & Style Guide v2.0**, applied on the principle that a side panel is a guest inside the browser. It leaves the chrome to Chrome: no wordmark and no version number, because Chrome's own side-panel header already names the extension, and the panel starts straight at the navigation. Surfaces borrow the browser's neutrals — a `#F2F2F2` canvas with white cards in light mode, Chrome's own `#202124`/`#292A2D` in dark — so nothing competes with the toolbar above it.

Soul Blue 600 (`#1F67A6`) is the only colour that isn't a neutral, and it carries exactly one meaning throughout — *active, selected, or the next thing to do*: the current tab, the focus halo, the primary button, one per view. Sky 400 (`#74C0E4`) is fill only, never text, and becomes the accent in dark mode where `#0B2941` on sky is the one pairing that clears contrast (7.4:1).

Type is Inter with the system UI stack behind it; monospace is reserved for data — URLs, line numbers, counts. Separation is 1px hairlines rather than shadows, which are kept for floating elements like the Tools menu. Focus is a 1px Blue 600 border plus a 3px Blue 200 halo. The interface follows the system light/dark preference, respects `prefers-reduced-motion`, ships visible keyboard focus and ARIA tab semantics, and every text/background pairing across all three tabs clears WCAG AA (4.5:1) in both schemes.

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
5. Click the BulkyURLs icon — the side panel opens with the selected URLs already in the textarea.
6. Use **Open in Tabs** (or **New Window**) to open them all, or **Copy** the list to use elsewhere.
7. Prefer a bigger view? Click **Open in tab** to open the same UI in a full tab.

---

## Project Structure

```
bulkyurls/
├── manifest.json              # MV3 manifest
├── sidepanel.html             # Main UI — Chrome's side panel, also opens as a full tab
├── csv.html                   # CSV import/export dialog
├── css/
│   └── popup.css              # Main UI + CSV dialog styles
├── js/
│   ├── background/
│   │   └── background.js      # Service worker: settings, messaging, tab management, opens the side panel on icon click
│   ├── content/
│   │   └── content-script.js  # Drag-select box, link detection, URL capture (styles applied inline)
│   ├── lib/
│   │   └── urls.js            # Shared URL utilities (extract, dedupe, normalize)
│   ├── csv.js                 # CSV import/export logic (File System Access API)
│   └── popup.js               # Main UI logic
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
