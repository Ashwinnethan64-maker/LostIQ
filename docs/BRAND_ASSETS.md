# LostIQ — Official Brand Assets & Design System Guide

- **Brand Name:** **LostIQ**
- **Tagline:** **Intelligent Lost & Found**
- **Theme:** Dark-First Slate & Electric Indigo/Cyan Palette
- **Document Path:** `/docs/BRAND_ASSETS.md`

---

# 1. Official Asset Inventory

| Asset Name | Target Context | Dimensions | Format | File Path |
| :--- | :--- | :---: | :---: | :--- |
| **Primary Logo** | Header / Auth / Hero | $370 \times 145$ | PNG / WEBP | [`/public/brand/logo/lostiq-logo-primary.png`](/public/brand/logo/lostiq-logo-primary.png) |
| **Logo Mark** | Mobile Header / Compact Icons | $512 \times 512$ | PNG / WEBP | [`/public/brand/logo/lostiq-mark.webp`](/public/brand/logo/lostiq-mark.webp) |
| **Favicon (Multi-Size)** | Browser Tab | 16, 32, 48, 64, 128, 256 | ICO | [`/public/favicon.ico`](/public/favicon.ico) |
| **Favicon 16px** | Browser Tab (Compact) | $16 \times 16$ | PNG | [`/public/brand/favicon/favicon-16x16.png`](/public/brand/favicon/favicon-16x16.png) |
| **Favicon 32px** | Browser Tab (Standard) | $32 \times 32$ | PNG | [`/public/brand/favicon/favicon-32x32.png`](/public/brand/favicon/favicon-32x32.png) |
| **Favicon 48px** | Browser Shortcut | $48 \times 48$ | PNG | [`/public/brand/favicon/favicon-48x48.png`](/public/brand/favicon/favicon-48x48.png) |
| **Apple Touch Icon** | iOS Home Screen Bookmark | $180 \times 180$ | PNG | [`/public/brand/favicon/apple-touch-icon.png`](/public/brand/favicon/apple-touch-icon.png) |
| **PWA Icon (192)** | Android / PWA Launcher | $192 \times 192$ | PNG | [`/public/brand/favicon/icon-192x192.png`](/public/brand/favicon/icon-192x192.png) |
| **PWA Icon (512)** | Splash Screen / App Store | $512 \times 512$ | PNG | [`/public/brand/favicon/icon-512x512.png`](/public/brand/favicon/icon-512x512.png) |
| **Open Graph (Social)** | Twitter / Discord / LinkedIn | $1200 \times 630$ | PNG / WEBP | [`/public/brand/social/og-image.png`](/public/brand/social/og-image.png) |

---

# 2. Brand Color Tokens

```css
--color-primary: #0B5FFF;     /* Electric Indigo */
--color-secondary: #7C3AED;   /* Vivid Purple */
--color-accent: #22D3EE;      /* Cyan Glow */
--color-background: #090A0F;  /* Deep Midnight Charcoal */
--color-foreground: #F8FAFC;  /* Pure White */
```

---

# 3. Next.js Integration

- **Favicons & Metadata**: Configured via Next.js App Router metadata in `src/app/layout.tsx` and static route icons (`src/app/icon.png`, `src/app/favicon.ico`, `src/app/apple-icon.png`, `src/app/opengraph-image.png`).
- **Web App Manifest**: Configured dynamically in `src/app/manifest.ts`.
