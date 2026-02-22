# Building From Source

This guide is for macOS users who want to build Zuri locally.

## 1) Install required tools on your Mac

You need Node.js 20+ and Git.

Check what you already have:

```bash
node -v
npm -v
git --version
```

If any command says "not found", install that tool first and come back.

## 2) Download Zuri source code

```bash
git clone https://github.com/iamkaf/zuri.git
cd zuri
```

## 3) Install dependencies

```bash
npm install
```

This can take a few minutes.

## 4) Build Zuri

```bash
npm run make
```

After it finishes, check `out/make/` for build artifacts.

## If something fails

- If `npm install` fails, run `npm cache verify` and try again.
- If build fails, delete `out/` and run `npm run make` again.
- If dependency state looks broken, delete `node_modules` and run `npm install`.

## Other platforms (quick note)

- Linux users may need extra packaging tools before `npm run make`.
- Windows users get installer artifacts in `out/make/` (for example `*.Setup.exe`).

## Need help?

Open an issue: <https://github.com/iamkaf/zuri/issues>
