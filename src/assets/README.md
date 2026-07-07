# src/assets

Local static assets that are **imported into components** (and therefore
processed/optimized by the bundler) — e.g. illustrations, inline SVGs, and
images used with `next/image`.

Use `public/` instead for files that must be served from the site root by URL
(favicons, `og-image.png`, downloadable files).

Suggested structure:

```
assets/
├── images/
├── illustrations/
└── icons/
```
