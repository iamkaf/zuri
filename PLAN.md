# Zuri — v1 implementation plan

Goal: Minimal tray-first todo app, backed by a user-chosen Markdown file, with priorities/effort/due-date notifications, two pages (Task List + Settings), multiple sections as tabs, live reload on external file changes, and 6 selectable themes.

## Constraints / decisions (locked)

- Markdown format: `- [ ] title` + indented metadata lines `  - key: value`
- Priority scale: `P0`..`P3`
- Effort scale: `XS | S | M | L | XL`
- Notifications: due-date only; default notify at **start of day** on the due date; configurable notify time (HH:MM)
- Multiple sections in a single Markdown file; sections become **tabs**
- App updates when underlying Markdown changes externally
- Setup preselects theme based on platform + system dark mode
- Settings are stored in the **home directory** (app-global), not next to / keyed by the markdown file
- Out of scope: AI, backups, collaboration

## Data model

### Markdown

- File consists of headings + task lists.
- Sections are derived from headings:
  - `## <name>` defines a section; tasks under that heading belong to that section until the next section heading.
  - If tasks exist before the first `##`, they go into a default section (e.g. `Inbox`).

### Task

- `id`: derived (v1) from stable hash of section + raw title + line index; we can upgrade later.
- `done`: boolean
- `title`: string
- `priority?`: `P0|P1|P2|P3`
- `effort?`: `XS|S|M|L|XL`
- `due?`: `YYYY-MM-DD`
- `extra`: unknown key-values preserved on write

### Settings (stored in home)

Location:
- `~/.zuri/settings.json` (create `~/.zuri/` if missing)

Keys:
- `markdownPath: string | null`
- `features: { priority: boolean; effort: boolean; notifications: boolean }`
- `theme: 'open-light'|'open-dark'|'windows-light'|'windows-dark'|'apple-light'|'apple-dark'`
- `notificationTime: string` (HH:MM, default `00:00`)
- `ui: { showCompleted: boolean }` (optional)

## Architecture

- Main process owns:
  - file system access (read/write markdown)
  - file watcher
  - notification scheduler
  - settings read/write
  - system theme detection for initial default
- Renderer owns:
  - UI state and rendering
  - interacts with main via IPC (preload `contextBridge` API)

## Milestones

### M0 — Foundation
- Add preload API (`contextBridge`) with typed IPC endpoints.
- Implement settings module (load/save) to `~/.zuri/settings.json`.
- Implement theme default selection (platform + `nativeTheme.shouldUseDarkColors`).

### M1 — Markdown parsing & writing
- Implement parser:
  - input: markdown string
  - output: `{ sections: Section[] }`
  - preserve unknown metadata keys
- Implement writer:
  - input model → markdown string
  - stable formatting rules (minimally intrusive)

### M2 — Task List UI (tabs)
- Implement two-page shell (Task List / Settings).
- Tabs for sections.
- CRUD minimal:
  - add task to current tab
  - toggle done
  - edit title + metadata (priority/effort/due)

### M3 — File selection + live updates
- Settings: pick markdown file with open dialog.
- Watch file for changes including atomic-save patterns (watch directory + debounce + re-read).
- On external change:
  - re-parse and refresh UI.
  - conflict policy: v1 is immediate-write; if change detected mid-edit, prompt to reload.

### M4 — Notifications
- Compute fire time from `due + notificationTime`.
- Schedule notifications while app is running.
- Recompute schedule on:
  - app start
  - settings change
  - markdown change
- Deliver via Electron `new Notification()`.

### M5 — Packaging polish
- Ensure `assets/` included and tray icon works cross-platform.
- (Optional) app autostart toggle later.

## Implementation notes

- Prefer immediate writes after each user action to reduce conflicts.
- When writing markdown, preserve section order and task order.
- Keep renderer Node integration off; do all IO in main.
