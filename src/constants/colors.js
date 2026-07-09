/**
 * JS mirror of the design tokens declared as CSS variables in globals.css.
 * Use these when a color is needed in JS (e.g. Framer Motion, charts, meta theme).
 * For styling, prefer Tailwind classes (bg-primary, text-ink, ...).
 */
export const COLORS = {
  primary: '#1E3A5F',
  primaryLight: '#34557F',
  primaryDark: '#142842',
  secondary: '#0F172A',
  secondaryLight: '#334155',
  secondaryDark: '#080C16',
  accent: '#D4AF37',
  surface: '#FFFFFF',
  muted: '#f1f5f9',
  ink: '#0F172A',
};

export const GRADIENTS = {
  brand: 'linear-gradient(135deg, #1E3A5F 0%, #0F172A 100%)',
  hero: 'linear-gradient(160deg, #f8fafc 0%, #eef2f7 100%)',
};
