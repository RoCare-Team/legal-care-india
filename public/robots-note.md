# public/

Static assets served from the site root (`/`).

`robots.txt`, `sitemap.xml`, `manifest.webmanifest`, and the favicon are all
generated at build time by the App Router file convention (see `src/app/`),
so you do **not** need static copies here.

Drop production artwork here when ready:

- `og-image.png` — 1200×630 social share image (referenced by `src/lib/metadata.js`)
- `icon-192.png`, `icon-512.png` — PWA icons (referenced by `src/app/manifest.js`)
