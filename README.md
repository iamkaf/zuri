# Zuri

[![Release](https://img.shields.io/github/v/release/iamkaf/zuri?display_name=tag)](https://github.com/iamkaf/zuri/releases)
[![Build and Release](https://github.com/iamkaf/zuri/actions/workflows/release.yml/badge.svg)](https://github.com/iamkaf/zuri/actions/workflows/release.yml)
[![License](https://img.shields.io/github/license/iamkaf/zuri)](LICENSE)

A small task app that lives in your system tray.

Open it, add a task, close it, move on.

## Why this exists

Most task apps try to be a whole productivity system. Zuri does not.

Zuri reads and writes one markdown file that you control. That is the core idea.

## Features

- Tray app behavior: click to open, click away to hide
- Markdown-backed tasks in a single `.md` file
- Drag and drop reorder
- Optional priority, effort, and due date fields
- Recurring tasks (`daily`, `weekdays`, `weekly`, `monthly`, `every N days`)
- Global shortcut support
- Local desktop notifications for due tasks
- Theme families: Apple, Windows, Open

## Install (Linux)

```bash
curl -fsSL https://zuri.kaf.sh/install.sh | bash
```

You can pin a version:

```bash
curl -fsSL https://zuri.kaf.sh/install.sh | ZURI_VERSION=v0.1.0 bash
```

## Install (Windows)

Run in PowerShell:

```powershell
& ([scriptblock]::Create((irm https://zuri.kaf.sh/install.ps1)))
```

Pin a version:

```powershell
& ([scriptblock]::Create((irm https://zuri.kaf.sh/install.ps1))) -Version v0.1.0
```

## Development setup

You need Node.js 20+.

```bash
git clone https://github.com/iamkaf/zuri.git
cd zuri
npm install
npm start
```

On first launch, choose a markdown file. If it does not exist yet, Zuri creates it.

## Task file format

```markdown
# Tasks

## Inbox

- [ ] Buy groceries
  - priority: P1
  - due: 2026-03-01
- [x] Call mom

## Work

- [ ] Review PR

## Habits

- [ ] Take vitamins
  - recur: daily
- [ ] Weekly review
  - recur: weekly
  - due: 2026-02-24
```

You can edit this file in any text editor. Zuri will reload after save.

## Build locally

```bash
npm run package
npm run make
```

`npm run make` builds distributables for the current OS.

- Linux: `.deb`, `.rpm`
- Windows: Squirrel installer package
- macOS: local build on a Mac (community/self-build), not an official CI release artifact yet

For full source-build instructions, see `docs/BUILDING_FROM_SOURCE.md`.

## Releases

Official GitHub release artifacts are built by CI for Linux and Windows when a `v*` tag is pushed.

To tag and push from `package.json` version:

```bash
npm run release:tag
```

## Config

Settings file location:

- `~/.zuri/settings.json`

## Stack

Electron, React, TypeScript, and `@dnd-kit`.

## License

MIT
