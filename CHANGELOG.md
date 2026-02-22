# Changelog

All notable changes to BulkyURLs will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
