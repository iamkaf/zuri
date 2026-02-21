# Building From Source

This guide covers running and building Zuri from source on Linux, Windows, and macOS.

## Prerequisites

- Node.js 20+
- npm 10+
- Git

## Clone and install

```bash
git clone https://github.com/iamkaf/zuri.git
cd zuri
npm install
```

## Run in development

```bash
npm start
```

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
```

## Build distributables

```bash
npm run package
npm run make
```

`npm run make` builds for your current OS.

## Platform notes

### Linux

You may need packaging dependencies before `npm run make`:

- Debian/Ubuntu:

```bash
sudo apt-get update
sudo apt-get install -y dpkg fakeroot rpm
```

### Windows

`npm run make` produces a Squirrel installer (`*.Setup.exe`) and related update artifacts.

### macOS

You can build locally on macOS, but official CI release artifacts are currently Linux + Windows only.

## Troubleshooting

- If Electron native modules fail, run `npm rebuild`.
- If packaging fails, remove `out/` and retry `npm run make`.
