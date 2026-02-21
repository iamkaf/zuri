# Building From Source

This guide is for people who want to build Zuri themselves.

If you have never done this before, that is fine. Follow the steps in order and copy/paste the commands.

## 1) Install required tools

You need:

- Node.js 20 or newer (this includes `npm`)
- Git

Check if they are installed:

```bash
node -v
npm -v
git --version
```

If one of these commands says "not found", install that tool first and come back.

## 2) Download Zuri source code

```bash
git clone https://github.com/iamkaf/zuri.git
cd zuri
```

## 3) Install project dependencies

```bash
npm install
```

This may take a few minutes the first time.

## 4) Run Zuri

```bash
npm start
```

Zuri should open after the app finishes starting.

## 5) Build an installable package

If you want install files (instead of just running from source), use:

```bash
npm run make
```

`npm run make` builds for your current operating system.

## Platform notes

### Linux

On Debian/Ubuntu, you may need packaging tools first:

```bash
sudo apt-get update
sudo apt-get install -y dpkg fakeroot rpm
```

After building, look in `out/make/` for `.deb` or `.rpm` files.

### Windows

After building, look in `out/make/` for the installer (`*.Setup.exe`).

### macOS

You can build locally on macOS, but official CI release artifacts are currently Linux + Windows only.

## Troubleshooting

- If `npm install` fails, run `npm cache verify` and retry.
- If the app does not start, delete `node_modules` and run `npm install` again.
- If packaging fails, delete `out/` and run `npm run make` again.

## Need help?

Open an issue: <https://github.com/iamkaf/zuri/issues>
