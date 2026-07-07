/**
 * JS mirror of the design tokens declared as CSS variables in globals.css.
 * Use these when a color is needed in JS (e.g. Framer Motion, charts, meta theme).
 * For styling, prefer Tailwind classes (bg-primary, text-ink, ...).
 */
export const COLORS = {
  primary: '#0f766e',
  primaryLight: '#14b8a6',
  primaryDark: '#0b5750',
  secondary: '#1e3a8a',
  secondaryLight: '#3b82f6',
  secondaryDark: '#172554',
  accent: '#f59e0b',
  surface: '#ffffff',
  muted: '#f1f5f9',
  ink: '#0f172a',
};

export const GRADIENTS = {
  brand: 'linear-gradient(135deg, #0f766e 0%, #1e3a8a 100%)',
  hero: 'linear-gradient(160deg, #f0fdfa 0%, #eff6ff 100%)',
};
