import localFont from 'next/font/local';

/**
 * Application fonts.
 * - Inter: primary UI / body typeface (variable: --font-sans)
 * - Lora:  display / headings typeface (variable: --font-display)
 *
 * The font files live in the repo (src/fonts — the Latin, variable-weight
 * files Google Fonts serves) rather than coming through next/font/google.
 * That one downloads them from Google at build time, and when Google answered
 * oddly the whole Vercel build failed on it ("An error occurred in
 * next/font … Cannot read properties of null"), with nothing wrong in the
 * code. A file in the repo cannot fail to download.
 *
 * Still self-hosted either way: visitors never request anything from Google.
 */
export const fontSans = localFont({
  src: '../fonts/inter-latin-var.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  variable: '--font-sans',
  fallback: ['system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
});

export const fontDisplay = localFont({
  src: '../fonts/lora-latin-var.woff2',
  weight: '400 700',
  style: 'normal',
  display: 'swap',
  variable: '--font-display',
  adjustFontFallback: 'Times New Roman',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

/** Combined variable classes applied on <html>. */
export const fontVariables = `${fontSans.variable} ${fontDisplay.variable}`;
