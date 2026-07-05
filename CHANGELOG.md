# Changelog

All notable changes to BulkyURLs will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

### Fixed
- `release.yml` now includes `sidepanel.html` in the extension zip (it was missing, which broke the side panel in packaged builds)

## [0.4.0] - 2026-07-04

### Added
- **Side panel** — the full BulkyURLs UI now runs in Chrome's side panel (`sidePanel` API). Open it with the **Open Sidebar** button in the popup; it stays open while you browse
- **Open in New Tab** button — run the UI in a full browser tab
- **Tabbed popup** — the popup is reorganized into **URLs** and **Settings** tabs with a card-based layout
- **Batch opening** — configurable *URLs per batch* (1–20) and *delay between batches* (0–100s) with sliders and steppers; opening runs in the background service worker so it continues after the popup closes
- **Undo / Redo** for the URL textarea (programmatic changes and typing)
- **Copy** button — copy the list to the clipboard
- **Tools menu** — URLs from Tabs / from Selection, Remove Duplicates, and CSV import/export moved into a dropdown
- **Settings tab** with new opening options:
  - Convert non-URLs to search queries (non-URL lines open as Google searches)
  - Open URLs in random order / reverse order
  - Open each batch in a new window
  - Wait for tab to load before opening the next URL
  - Remove opened URLs from input
  - Auto-close tabs after a configurable number of seconds
  - URL limit (open only the first N URLs; 0 = no limit)
  - Reset Defaults
- **Saved Lists redesign** — lists render as rows with URL counts, one-click load, and inline delete; “+ New” reveals the save form
- Live **“N valid”** count badge on the URL textarea

### Changed
- The pre-0.4 popup delay setting is migrated to the new opener settings on first run
- All opener settings persist in `chrome.storage.local` under `opener_settings`
- **Options page removed** — the drag-select settings moved into a new **Link Selection** card on the popup/side panel Settings tab: activation trigger (mouse button + key), open as tabs vs. new window, selection box color, smart select, and the site blocklist. Stored settings are reused as-is, so existing configurations carry over
- The multi-action editor and the niche per-action options (link word filter, per-link delay, auto-close time, duplicate blocking, reverse order, open-at-end, unfocus window) no longer have a UI; previously saved values continue to apply to the drag-select action

### Repo / Tooling
- Added `.github/workflows/release.yml` — pushing a `v*` tag matching `manifest.json`'s version builds the extension zip, creates a GitHub Release with notes pulled from this changelog, and uploads/publishes to the Chrome Web Store if environment variables and secrets are configured

## [0.3.0] - 2026-07-04

### Added
- **Saved Lists** — save the popup textarea under a custom name and reload it any time (stored locally in `chrome.storage.local`)
- **Open in New Window** button — open all URLs in a fresh window instead of the current one
- **Delay control** — configurable pause (seconds) between each tab opening; persisted across sessions
- **Remove Duplicates** button — dedupe textarea lines while preserving order
- Live URL counter above the popup textarea
- `js/lib/urls.js` — shared URL utilities (`extractURLs`, `textToLines`, `dedupeLines`, `normalizeURL`) used by both popup and CSV dialog

### Fixed
- **Extension no longer alters the appearance of web pages** ([#4](https://github.com/realryanchoi/bulkyurls/issues/4)) — `css/content-styles.css` was injected into every page with bare element selectors (`LABEL`, `INPUT`, `IMG`, `FIELDSET`, …) that restyled host-page elements such as GitHub's fork/watch buttons. The file has been removed; the drag-select overlay was already styled entirely inline.

### Changed
- Popup "Open" actions are delegated to the background service worker, so delayed batches keep opening even after the popup closes
- Removed unused jQuery 3.7.1 (~87 KB) — nothing referenced it since the options page moved to vanilla JS
- Deduplicated the `extractURLs()` regex previously copy-pasted between `popup.js` and `csv.js`

## [0.2.0] - 2025-02-22

### Added
- CSV import/export functionality via File System Access API
- Export popup URLs as single-column RFC 4180 CSV
- Import URLs from any CSV (scans all fields, deduplicates)
- `csv.html` and `js/csv.js` for export/import dialogs

### Fixed
- `scrollLeft` case-sensitivity bug in scroll offset calculation (`content-script.js`)
- Removed debug `console.log()` statements from `options.js`
- `tour1()` no longer references missing `#page1` / `#test_area` elements

### Changed
- Removed unused `bookmarks` and `nativeMessaging` permissions from manifest
- Bumped manifest version from 0.1.0 to 0.2.0

### Improved
- Restructured LICENSE file — separated MPL 2.0 project license from third-party MIT notices
- Expanded .gitignore (OS files, extension build artifacts, editor swap files)
- Updated README with complete project structure, browser requirements, and known limitations

## [0.1.0] - 2025-01-01

### Fixed
- `chrome.storage.local.get()` properly awaited before `JSON.parse` in background.js
- Storage writes use `chrome.storage.local.set()` instead of direct property assignment
- `"init"` message handler returns `true` to keep async response channel open
- Added missing `openTab()` function (recursive, supports delay and auto-close)
- Replaced 11 non-functional placeholder context menu items with 2 working ones
- Badge cleared (not set to "0") when a new drag selection starts
- Removed all `this.` prefixes in content script (module scope, not class instance)
- `onMessage` listener moved to module scope (was re-registered on every drag)
- `open_tabs` array cleared at the start of each new mouseup pass
- Fixed `stop_menu == false` (comparison) to `stop_menu = false` (assignment)
- Badge and `latestURLs` reset when each new drag selection starts
- `selectorBtn.onclick` moved inside `DOMContentLoaded` to close over `userInput`
- Popup auto-populates textarea with selection URLs on open
- `selected: false` (deprecated MV3) replaced with `active: false`
- `save_params()` now calls `chrome.runtime.sendMessage()`
- `displayOptions()` restored (was entirely commented out)
- `delete_action()` restored (was entirely commented out)
- `load_action` edit branch restored for existing actions
- `save_action` action + options fields restored
- `#guide1` null guard added
- Colorpicker plugin removed; native `<select>` used for color selection
- jQuery loaded locally (CDN not permitted in MV3)
- `form_action`, `form_options`, `form_extra` moved inside the modal overlay
- Added `#guide1` back-link for tour navigation
- CSP keys replaced with valid MV3 `"extension_pages"` key

## [0.0.4] - 2024-01-01

Initial fork / revival of Linkclump as a Chrome Manifest V3 extension.
