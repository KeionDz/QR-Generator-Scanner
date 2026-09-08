# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install         # both a pnpm-lock.yaml and a package-lock.json are committed;
                    # npm is what is actually installed on this machine
npm run dev         # Next.js dev server on http://localhost:3000
npm run build       # production build — the only type-check gate (tsconfig is noEmit)
npm start           # serve the production build
npm run lint        # currently BROKEN, see below
```

There is no test framework, no `tailwind.config`, and no `tsc` script, so **`npm run build` is the check that matters** — it is what surfaces type errors.

`npm run lint` fails before it lints anything: `eslint.config.mjs` uses the Next 16 flat-config imports (`eslint-config-next/core-web-vitals`) while `package.json` pins `eslint-config-next@^15.1.13`, which does not export those subpaths (`ERR_MODULE_NOT_FOUND`). Upgrading `eslint-config-next` to 16 to match `next` is the fix.

## Import convention — do not use `@/` aliases

`tsconfig.json` maps `@/*` → `./*` (repo root), but all source lives under `src/`. **`@/components/...` does not resolve.** Every file in this repo uses relative imports (`../components/ui/button`, `../../hooks/use-toast`). shadcn/ui components added via the CLI arrive with `@/` imports and must be rewritten to relative paths, or `paths` must be fixed to `./src/*` first. `components.json` likewise points at `app/globals.css`, not `src/app/globals.css`.

## Architecture

Next.js 16 App Router + React 19, Tailwind v4 (CSS-first: theme tokens are oklch CSS variables in `src/app/globals.css`, imported by the root layout), shadcn/ui ("new-york", Radix primitives under `src/components/ui/`). Entirely client-side — no API routes, no server actions, no backend. QR payloads are built in the browser and never leave it.

**Theming is per-page, not global.** `src/app/layout.tsx` only sets fonts, metadata, a `Suspense` boundary, and Vercel Analytics. Every page under `src/app/*/page.tsx` wraps its own tree in `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>` and renders its own `<Header /> / <Footer />`. A new page must do the same or it will render unthemed.

### Generator side (`/`)

`src/app/page.tsx` is a tabbed shell (`wifi | product | action | menu`) with two different component contracts:

- **Controlled**: `WifiQRGenerator` and `ProductQRGenerator` receive config, errors, `qrRef`, and `onDownload`/`onCopy`/`onGenerateSample` from `page.tsx`, which owns the state and validation effects.
- **Self-contained**: `ActionQRGenerator` and `MenuQRGenerator` own all of their own state and download logic and take no props.

Shared building blocks: `QRCTAFrame` (call-to-action banner config), `QRCustomizer` (colors + center logo), and `qr-download-util.ts` (`downloadQRCodeWithBranding` — renders via the `qrcode` package to a canvas, composites CTA frames and logo, then triggers a PNG download). On-screen previews use `QRCodeSVG` from `qrcode.react`; downloads go through canvas. Two download paths coexist: the util above, and an inline SVG→canvas serializer in `page.tsx`/`qr-customizer.tsx`.

### Scanner side (`/scanner`)

`src/app/scanner/page.tsx` owns the shared `canvasRef`, the QR-string parsers (`parseWifiString`, `parseProductString`, `parseQRCode`), and the result UI. Two interchangeable scanner components implement the same prop interface `{ isScanning, setIsScanning, onQRDetected, canvasRef }`:

- `DeviceCameraScanner` — `navigator.mediaDevices.getUserMedia({ facingMode: "environment" })`
- `NetworkCameraScanner` — an IP/HLS stream URL, played through `hls.js`, with reachability validation, auto-retry, and zoom

Both draw video frames to the canvas and decode with `jsqr`, dynamically imported (`(await import("jsqr")).default`) to keep it out of the initial bundle. Adding a scanner source means implementing that same interface and adding a mode to the page's `ScannerMode` union.

### QR payload formats (generator ⇄ scanner contract)

- Wi-Fi: `WIFI:T:<security>;S:<ssid>;P:<password>;H:<hidden>;;` with `\ " ; ,` backslash-escaped.
- Product: GS1-Digital-Link-style URL — `https://gs1.example.com/?gtin=…&product=…&serial=…&batch=…&expiry=…&info=…`.

The scanner's parsers must be kept in sync with the generators' `useMemo` payload builders. Note an existing divergence: `page.tsx` still contains its own stale `wifiString`/`productString` memos (`https://example.com/product?…&description=…`) that feed the copy-to-clipboard handler, while `ProductQRGenerator` renders and the scanner parses the `gs1.example.com`/`info=` shape. Fix the parent's builder rather than adding a second format to the parser.

## Known duplicates — pick the live copy

- `src/hooks/use-toast.ts` is the one imported everywhere; `src/components/ui/use-toast.ts` is an unused near-identical copy (same for `use-mobile`).
- `src/app/globals.css` is live (imported by the layout); `src/styles/globals.css` is an unused variant.
- `public/` is the served static directory; `src/public/` (icons, placeholders) is **not** served by Next and is currently unreferenced.

## The NU Davao tab

`NuDavaoQRGenerator` (self-contained, like Action and Menu) generates QR codes for links — forms, sites, portals — in National University Davao's brand.

Its design is carried over from `../nu-room-booking`, not invented here: the tokens in that project's `src/styles/theme.css` (navy `#262D65`, primary blue `#35408E`, gold `#FFD41C`, and the rule that gold is an accent that never carries text on a light ground) and the renderer in its `server/qr.ts`. `src/components/nu-qr-render.ts` is a browser port of that renderer — same quiet zone (4 modules), frame (2 modules, outside the quiet zone), logo ratio (0.24 wide, ~5% of area), and level-H error correction, with a canvas in place of pngjs.

Two things follow from that port and should not be casually undone:

- **Modules are navy on gold, not gold on navy.** Light-on-dark is a reversed code; the reference project measured it failing at 5 of 13 print sizes against jsQR, the decoder this app's own scanner uses. `gold-on-navy` is still selectable and is flagged in the UI.
- **Preview and download are the same canvas**, so what is approved on screen is what gets printed. Unlike the other tabs, this one does not use `QRCodeSVG` for preview.

The shield is `public/nu-shield.png`, copied from the reference project's `public/`.
