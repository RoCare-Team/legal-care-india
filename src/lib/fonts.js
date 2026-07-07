import { Inter, Lora } from 'next/font/google';

/**
 * Application fonts.
 * - Inter: primary UI / body typeface (variable: --font-sans)
 * - Lora:  display / headings typeface (variable: --font-display)
 *
 * Both are self-hosted by next/font, so there are no external requests.
 */
export const fontSans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const fontDisplay = Lora({
  subsets: ['latin'],
  display: 'swap',
  weight: ['500', '600', '700'],
  variable: '--font-display',
});

/** Combined variable classes applied on <html>. */
export const fontVariables = `${fontSans.variable} ${fontDisplay.variable}`;
