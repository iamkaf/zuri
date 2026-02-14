# Zuri

A task manager that lives in your system tray.

Click the tray icon, add some tasks, click away. That's it.

## Why another task app?

Most todo apps want to be your "second brain" or "productivity command center." Zuri is not that. It's just a simple markdown file with a nice UI on top.

Your tasks live in a `.md` file you control. Sync it with iCloud, Dropbox, Git, or nothing at all. Zuri just reads and writes the file.

## What it looks like

On macOS, Zuri uses the native "Liquid Glass" vibrancy effect - the window blurs whatever's behind it. On Windows 11, it uses Mica. The idea is that it should feel like it belongs on your system, not like a website pretending to be an app.

There are three themes: Apple (for Mac users who want that native feel), Windows (Fluent Design), and Open (a neutral option that works anywhere).

## Features

- **Tray-based**: Lives in your menu bar / system tray. One click to open, click away to close.
- **Markdown storage**: All tasks in one `.md` file. You can edit it directly if you want.
- **Drag to reorder**: Grab a task and move it.
- **Priorities and due dates**: Optional. Turn them on in settings if you need them.
- **Undo window**: On the Apple theme, completed tasks stick around for 1.5 seconds so you can undo an accidental click.

## Getting started

You'll need Node.js 18 or newer.

```bash
git clone https://github.com/iamkaf/zuri.git
cd zuri
npm install
npm start
```

On first launch, pick a markdown file to store your tasks. If you don't have one, Zuri will create it.

## The file format

Tasks are stored as plain markdown:

```markdown
# Tasks

## Inbox
- [ ] Buy groceries
  - priority: P1
  - due: 2024-01-15
- [x] Call mom

## Work
- [ ] Review PR
```

You can edit this file in any text editor. Zuri will reload when you save.

## Building

```bash
npm run package   # Creates an app bundle
npm run make      # Creates a distributable (.dmg, .exe, etc.)
```

## Configuration

Settings are stored in `~/.zuri/settings.json`. You can edit it directly or use the in-app settings panel.

## Tech

Built with Electron, React, and TypeScript. Uses @dnd-kit for drag and drop. The native blur effects come from Electron's vibrancy (macOS) and background material (Windows) APIs.

## License

MIT
